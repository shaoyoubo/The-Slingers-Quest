import * as THREE from 'three';
import {clock, sharedState } from './init.js'; // 时钟和共享状态
import { inputManager } from './InputManager.js'; // 键盘输入管理器
import { stoneThrower } from './loadClasses.js'; // 投石功能
import { enemiesGenerator } from './loadClasses.js'; // 生成僵尸
import {energyManagerPromise,initializeViewToggle, healthManagerPromise} from './ui.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;
const Enemy_Speed = 0.01;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();
let isPaused = false;
const SERVER_URL = 'https://ff9f-2402-f000-3-6801-7035-2d10-37f-2bf0.ngrok-free.app';
let energyManager;
let healthManager;

energyManagerPromise.then(manager => {
    energyManager = manager;
});
healthManagerPromise.then(manager2 => {
    healthManager = manager2;
});


export function controls(deltaTime, player) {
    
    const speedDelta = deltaTime * (player.onFloor ? sharedState.playerspeed : 5);

    if (inputManager.keyStates['KeyW']) {
        player.velocity.add(player.getForwardVector().multiplyScalar(speedDelta));
    }

    if (inputManager.keyStates['KeyS']) {
        player.velocity.add(player.getForwardVector().multiplyScalar(-speedDelta));
    }

    if (inputManager.keyStates['KeyA']) {
        player.velocity.add(player.getSideVector().multiplyScalar(-speedDelta));
    }

    if (inputManager.keyStates['KeyD']) {
        player.velocity.add(player.getSideVector().multiplyScalar(speedDelta));
    }

    if (inputManager.keyStates['KeyR']) {
        if(performance.now()-sharedState.lastchangeview > 300)
        {
            if(sharedState.cameraDistance > 0)
                sharedState.cameraDistance = -0.06;
            else
                sharedState.cameraDistance = 0.25;
            sharedState.lastchangeview = performance.now();
        }
    }

    if (player.onFloor && inputManager.keyStates['Space']) {
        player.velocity.y = 8;
    }
}

export function updateImmediate(player) {
    player.camera.position.copy(
        player.collider.end.clone().sub(player.direction.clone().multiplyScalar(sharedState.cameraDistance)));
    }

export function updatePlayer(deltaTime, player, cameraDistance) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    
    if (!player.onFloor) {
        player.velocity.y -= GRAVITY * deltaTime;
        damping *= 0.1;
    }
    const PreviousPosition = player.collider.end.clone();
    player.getForwardVector();
    player.velocity.addScaledVector(player.velocity, damping);

    const deltaPosition = player.velocity.clone().multiplyScalar(deltaTime);
    player.collider.translate(deltaPosition);

    player.checkCollisionsWithWorld();

    let playerPosition = player.collider.end.clone();
    playerPosition.y -= 0.35;

    if (sharedState.playerModel) {
        sharedState.playerModel.position.copy(playerPosition);
    }
    const dis = player.collider.end.distanceTo(player.camera.position);
    if(Math.abs(dis-Math.abs(cameraDistance))>0.05)
        updateImmediate(player);
    if(performance.now() - sharedState.lastthrow > 500 || performance.now()-sharedState.starttime < 1000)
    {
    player.camera.position.copy(
        player.collider.end.clone().sub(player.direction.clone().multiplyScalar(cameraDistance))
    );}
    else
    {
        const move = player.collider.end.clone().sub(PreviousPosition);
        player.camera.position.addScaledVector(move,1);
    }
}

export function ShakeCamera(player) {
    if(performance.now() - sharedState.lastthrow > 500)
        return;
    if(performance.now() - sharedState.lastshake < 4)
        return;
    const camera = player.camera;
    const cameraPosition = camera.position;
    const cameraShake = new THREE.Vector3(
        (Math.random()-0.5)*sharedState.shake,
        (Math.random()-0.5)*sharedState.shake,
        (Math.random()-0.5)*sharedState.shake,
    );
    cameraPosition.add(cameraShake);
    camera.position.copy(cameraPosition);
    sharedState.lastshake = performance.now();
    sharedState.shake *= 0.9;
}

export function updateStones(deltaTime, player) {
    stoneThrower.stones.forEach((stone) => {
        if (performance.now() - stone.time > 5000) {
            stone.collider.center.set(0, -100, 0);
            stone.velocity.set(0, 0, 0);
        }

        stone.collider.center.addScaledVector(stone.velocity, deltaTime);

        const result = player.worldOctree.sphereIntersect(stone.collider);
        if (result) {
            stone.velocity.addScaledVector(result.normal, -result.normal.dot(stone.velocity) * 1.5);
            stone.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
            if (stone.collider.center.y > -25) {
                stone.velocity.y -= GRAVITY * deltaTime;
            }
        }

        const damping = Math.exp(-1.5 * deltaTime) - 1;
        stone.velocity.addScaledVector(stone.velocity, damping);

        playerStoneCollision(stone, player);
    });

    stoneThrower.stonesCollisions();

    for (const stone of stoneThrower.stones) {
        stone.mesh.position.copy(stone.collider.center);
    }
}
function SlimeDeath(position) {
    const audio = new Audio('../Assets/UI/SlimeDeath.mp3'); // Path to your sound file
    audio.play(); // Play the sound
}
function enemyAndStoneCollisions() {
    for (const stone of stoneThrower.stones) {
        if(stone.collider.center.y < -25) 
            continue;
        for (const enemy of enemiesGenerator.enemies) {
            if(enemy.collider.center.y < -25)
                continue;
            const distanceSquared = stone.collider.center.distanceToSquared(enemy.collider.center);
            const collisionRadius = stone.collider.radius + enemy.collider.radius;
            const collisionRadiusSquared = collisionRadius * collisionRadius;
            if (distanceSquared < collisionRadiusSquared) {
                stone.collider.center.set(0, -100, 0);
                stone.velocity.set(0, 0, 0);
                enemy.collider.center.set(10, -100, 0);
                enemy.velocity.set(0, 0, 0);
                energyManager.currentEnergy = Math.min(energyManager.currentEnergy + 20, energyManager.maxEnergy);
                energyManager.updateEnergyBar();
                energyManager.hits ++;
                SlimeDeath(enemy.collider.center);
                break;
            }
        }
    }
}

function playerStoneCollision(stone, player) {
    const center = vector1.addVectors(player.collider.start, player.collider.end).multiplyScalar(0.5);
    const stone_center = stone.collider.center;
    const r = player.collider.radius + stone.collider.radius;
    const r2 = r * r;

    for (const point of [player.collider.start, player.collider.end, center]) {
        const d2 = point.distanceToSquared(stone_center);

        if (d2 < r2) {
            const normal = vector1.subVectors(point, stone_center).normalize();
            const v1 = vector2.copy(normal).multiplyScalar(normal.dot(player.velocity));
            const v2 = vector3.copy(normal).multiplyScalar(normal.dot(stone.velocity));

            player.velocity.add(v2).sub(v1);
            stone.velocity.add(v1).sub(v2);

            const d = (r - Math.sqrt(d2)) / 2;
            stone_center.addScaledVector(normal, -d);
        }
    }
}

function playerEnemyCollision(enemy, player) {
    if(performance.now()-sharedState.invincibletime < 2000)
        return false;
    if (enemy.collider.center.y < -25) 
        return false;
    if (player.collider.end.y < -25) 
        return false;
    // Calculate the center of the player's capsule
    const center = vector1.addVectors(player.collider.start, player.collider.end).multiplyScalar(0.5);
    const slimeCenter = enemy.collider.center;
    const collisionRadius = player.collider.radius + enemy.collider.radius; // Combined radius
    const collisionRadiusSquared = collisionRadius * collisionRadius; // Squared combined radius

    // Check collision at key points of the capsule: start, end, and center
    for (const point of [player.collider.start, player.collider.end, center]) {
        const distanceSquared = point.distanceToSquared(slimeCenter);

        if (distanceSquared < collisionRadiusSquared) {
            //isPaused = true; // Set the game over flag
            // Collision detected, show the death popup
            if(healthManager.takeDamage(30) == false)
            {
                isPaused = true;
                return true;
            }
                 // Return true to indicate collision
            else
            {
                sharedState.invincibletime = performance.now();
                enemy.collider.center.set(10, -100, 0);
                enemy.velocity.set(0, 0, 0);
                return false;
            }
        }
    }
    return false; // Return false if no collision
}

let isUploading = false; // 标志变量，用于跟踪上传状态

function uploadScore() {
    if (isUploading) {
        return; // 如果已经在上传过程中，则直接返回
    }

    const username = document.getElementById('username').value;
    const score = sharedState.score; // 假设 sharedState.score 是当前分数

    if (username) {
        if (username.length > 10) {
            alert('用户名不能超过10个字符。');
            return;
        }
        const scoreData = {
            username,
            score,
            difficulty: sharedState.difficultyText, // 添加难度信息
            character: sharedState.characterText, // 添加角色信息
            totalHits: sharedState.totalhits // 添加总命中数
        };

        isUploading = true; // 设置标志变量，表示开始上传

        fetch(`${SERVER_URL}/uploadScore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            energyManager.hits = 0;
            for (const enemy of enemiesGenerator.enemies) {
                enemy.collider.center.set(10, -100, 0);
                enemy.velocity.set(0, 0, 0);
            }
            for (const stone of stoneThrower.stones) {
                stone.collider.center.set(0, -100, 0);
                stone.velocity.set(0, 0, 0);
            }
            window.location.href = "../index.html";
            sharedState.score = 0;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to upload score.');
        })
        .finally(() => {
            isUploading = false; // 重置标志变量
        });
    } else {
        alert('Please enter your name.');
    }
}
  
  function showGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    document.getElementById('score').innerText = sharedState.score;
    popup.classList.remove('hidden'); // 显示弹窗
  
    const uploadButton = document.getElementById('upload-score');
  
    // 先移除可能存在的旧的事件监听器
    uploadButton.removeEventListener('click', uploadScore);
  
    // 添加新的事件监听器
    uploadButton.addEventListener('click', uploadScore);
  }
  

// function loadScores() {
//   const scores = JSON.parse(localStorage.getItem('scores')) || [];
//   const rankingList = document.getElementById('ranking-list');
//   rankingList.innerHTML = '';
//   scores.sort((a, b) => b.score - a.score).forEach(score => {
//     const listItem = document.createElement('li');
//     listItem.textContent = `${score.username}: ${score.score}`;
//     rankingList.appendChild(listItem);
//   });
// }

// // 在页面加载时调用 loadScores 函数
// window.onload = loadScores;

function ReturntoMainMenu() {
    const toggleViewButton = document.getElementById('ReturnMenu');
    toggleViewButton.addEventListener('click', () => {
        energyManager.hits = 0;
        for (const enemy of enemiesGenerator.enemies) {
            enemy.collider.center.set(10, -100, 0);
            enemy.velocity.set(0, 0, 0);
        }
        for (const stone of stoneThrower.stones) {
            stone.collider.center.set(0, -100, 0);
            stone.velocity.set(0, 0, 0);
        }
        window.location.href = "../index.html";
    });
}

function RetryGame() {
    const toggleViewButton = document.getElementById('retry-game');
    toggleViewButton.addEventListener('click', () => {
        energyManager.hits = 0;
        for (const enemy of enemiesGenerator.enemies) {
            enemy.collider.center.set(10, -100, 0);
            enemy.velocity.set(0, 0, 0);
        }
        for (const stone of stoneThrower.stones) {
            stone.collider.center.set(0, -100, 0);
            stone.velocity.set(0, 0, 0);
        }
        window.location.href = "../game.html";
    });
  }

function checkPlayerEnemyCollisions(player) {
    for (const enemy of enemiesGenerator.enemies) {
        if (playerEnemyCollision(enemy,player)) {
            sharedState.isPaused = true;
            showGameOverPopup();
            break;
        }
    }
}

export function teleportPlayerIfOob(player) {
    if (player.camera.position.y <= -25) {
        player.collider.start.set(0, 0.35, 0);
        player.collider.end.set(0, 1, 0);
        player.collider.radius = 0.35;
        player.camera.position.copy(player.collider.end);
        player.camera.rotation.set(0, 0, 0);
    }
}


function updateEnemies(deltaTime, player) {
    for (const enemy of enemiesGenerator.enemies) {
        // console.log(enemiesGenerator.enemyIdx);
        // console.log(enemy.collider.start);
        if (Math.random() < 0.001) { // 1% 的概率跳跃
            enemy.velocity.y += 10; // 设置跳跃的速度
        }

        enemy.collider.center.addScaledVector(enemy.velocity, deltaTime);

        const result = player.worldOctree.sphereIntersect(enemy.collider);

        if (result) {
            enemy.velocity.addScaledVector(result.normal, -result.normal.dot(enemy.velocity) * 1.5);
            enemy.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
            if (enemy.collider.center.y > -25) {
                enemy.velocity.y -= GRAVITY * deltaTime;
            }
        }

        const damping = Math.exp(-1.5 * deltaTime) - 1;
        enemy.velocity.addScaledVector(enemy.velocity, damping);
        const directionToPlayer = new THREE.Vector3().subVectors(player.collider.start, enemy.collider.center);
        directionToPlayer.y = 0;
        directionToPlayer.normalize();
        enemy.velocity.add(directionToPlayer.multiplyScalar(sharedState.EnemySpeed));
        enemy.mesh.position.copy(enemy.collider.center);
        enemy.mesh.rotation.y = Math.atan2(directionToPlayer.x, directionToPlayer.z)+Math.PI*0.75;        
        
    }

    enemiesGenerator.EnemiesCollision();
}


let lastEnemyGenerationTime = 0;
let lastSpeedIncreaseTime = performance.now(); // 记录上一次增加速度的时间


export function animate(renderer, scene, player, cameraDistance) {
    if (isPaused) {
        return;
    }
    const now = performance.now();

    sharedState.score = Math.floor(sharedState.difficulty *Math.max( (3*energyManager.hits-sharedState.totalhits),0.3*(energyManager.hits-sharedState.totalhits))
    +50*(Math.pow((now-sharedState.starttime)/1000+64,2/3)-16));
    
    // 每过10秒增加敌人速度
    if (now - lastSpeedIncreaseTime > 10000) {
        sharedState.EnemySpeed *= 1.1; // 增加10%
        lastSpeedIncreaseTime = now; // 更新上一次增加速度的时间
        console.log(`Enemy speed increased to: ${sharedState.EnemySpeed}`);
    }

    const deltaTime = Math.min(0.03, clock.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        if (now - lastEnemyGenerationTime > sharedState.generationInterval) {
            enemiesGenerator.generateEnemy(player.collider.end.x,player.collider.end.z);
            lastEnemyGenerationTime = now;
        }
        controls(deltaTime, player);
        updatePlayer(deltaTime, player, cameraDistance);
        updateStones(deltaTime, player);
        updateEnemies(deltaTime, player);
        teleportPlayerIfOob(player);
        enemyAndStoneCollisions();
        checkPlayerEnemyCollisions(player);
        ShakeCamera(player);
    }

    renderer.render(scene, player.camera);
    // stats.update();
    //console.log(player.collider.end);
}
export function pauseGame() {
    isPaused = true;
}
export function resumeGame() {
    isPaused = false;
}
export {ReturntoMainMenu, RetryGame, isPaused};