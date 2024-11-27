import * as THREE from 'three';
import {clock, sharedState } from './init.js'; // 时钟和共享状态
import { inputManager } from './InputManager.js'; // 键盘输入管理器
import { stoneThrower } from './loadClasses.js'; // 投石功能
import { enemiesGenerator } from './loadClasses.js'; // 生成僵尸
import {energyManager,initializeViewToggle} from './ui.js';
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;
const Enemy_Speed = 0.01;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();
let isPaused = false;

export function controls(deltaTime, player) {
    
    const speedDelta = deltaTime * (player.onFloor ? 25 : 8);

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

    if (player.onFloor && inputManager.keyStates['Space']) {
        player.velocity.y = 10;
    }
}

export function updatePlayer(deltaTime, player, cameraDistance) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    
    if (!player.onFloor) {
        player.velocity.y -= GRAVITY * deltaTime;
        damping *= 0.1;
    }

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

    player.camera.position.copy(
        player.collider.end.clone().sub(player.direction.clone().multiplyScalar(cameraDistance))
    );
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
            isPaused = true; // Set the game over flag
            // Collision detected, show the death popup
            return true; // Return true to indicate collision
        }
    }
    return false; // Return false if no collision
}
function showGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    popup.classList.remove('hidden'); // 显示弹窗
}

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
function checkPlayerEnemyCollisions(player) {
    for (const enemy of enemiesGenerator.enemies) {
        if (playerEnemyCollision(enemy,player)) {
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

export function animate(renderer, scene, player, stats, cameraDistance) {
    if (isPaused) {
        return;
    }
    const now = performance.now();

    const deltaTime = Math.min(0.03, clock.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        if (now - lastEnemyGenerationTime > sharedState.generationInterval) {
            enemiesGenerator.generateEnemy();
            lastEnemyGenerationTime = now;
        }
        controls(deltaTime, player);
        updatePlayer(deltaTime, player, cameraDistance);
        updateStones(deltaTime, player);
        updateEnemies(deltaTime, player);
        teleportPlayerIfOob(player);
        enemyAndStoneCollisions();
        checkPlayerEnemyCollisions(player);
    }

    renderer.render(scene, player.camera);
    stats.update();
}
export function pauseGame() {
    isPaused = true;
}
export function resumeGame() {
    isPaused = false;
}
export {ReturntoMainMenu, isPaused};