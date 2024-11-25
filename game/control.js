import * as THREE from 'three';
import {clock, sharedState } from './init.js'; // 时钟和共享状态
import { inputManager } from './InputManager.js'; // 键盘输入管理器
import { stoneThrower } from './loadClasses.js'; // 投石功能
import { zombiesGenerator } from './loadClasses.js'; // 生成僵尸
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

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
        player.velocity.y = 15;
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

export function teleportPlayerIfOob(player) {
    if (player.camera.position.y <= -25) {
        player.collider.start.set(0, 0.35, 0);
        player.collider.end.set(0, 1, 0);
        player.collider.radius = 0.35;
        player.camera.position.copy(player.collider.end);
        player.camera.rotation.set(0, 0, 0);
    }
}

function updateZombies(deltaTime, player) {
    for (const zombie of zombiesGenerator.zombies) {
        // console.log(zombiesGenerator.zombieIdx);
        // console.log(zombie.collider.start);
        zombie.collider.start.addScaledVector(zombie.velocity, deltaTime);
        zombie.collider.end.addScaledVector(zombie.velocity, deltaTime);

        const result = player.worldOctree.capsuleIntersect(zombie.collider);

        if (result) {
            zombie.velocity.addScaledVector(result.normal, -result.normal.dot(zombie.velocity) * 1.5);
            zombie.collider.start.add(result.normal.multiplyScalar(result.depth));
            zombie.collider.end.add(result.normal.multiplyScalar(result.depth));
        } else {
            if (zombie.collider.start.y > -25) {
                zombie.velocity.y -= GRAVITY * deltaTime;
            }
        }

        const damping = Math.exp(-1.5 * deltaTime) - 1;
        zombie.velocity.addScaledVector(zombie.velocity, damping);
    }

    for (const zombie of zombiesGenerator.zombies) {
        zombie.mesh.position.copy(zombie.collider.start);
        // console.log(zombie.mesh.position);
    }
}


let lastZombieGenerationTime = 0;
const generationInterval = 1000;

export function animate(renderer, scene, player, stats, cameraDistance) {
    const now = performance.now();
    // console.log(now);
    // if (!sharedState.initZombiesGenerator) {
    //     console.warn("ZombieGenerator not initialized yet.");
    //     return; // 或者在下一帧重新调用 animate
    // }    
    const deltaTime = Math.min(0.03, clock.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        if (now - lastZombieGenerationTime > generationInterval) {
            zombiesGenerator.generateZombie();
            lastZombieGenerationTime = now;
        }
        controls(deltaTime, player);
        updatePlayer(deltaTime, player, cameraDistance);
        updateStones(deltaTime, player);
        updateZombies(deltaTime, player);
        teleportPlayerIfOob(player);
    }

    renderer.render(scene, player.camera);
    stats.update();
}
