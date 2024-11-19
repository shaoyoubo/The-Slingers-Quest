import * as THREE from 'three';
import {clock, sharedState } from './init.js'; // 时钟和共享状态
import { inputManager } from './InputManager.js'; // 键盘输入管理器
import { stoneThrower } from './stone.js'; // 投石功能
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

export function controls(deltaTime, player) {
    if (!player || typeof player.onFloor === "undefined") {
        console.error("Player is not properly initialized.");
        return;
    }
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
    if (!player||typeof player.onFloor === "undefined") {
        console.error("Player is not properly initialized in the updatePlayer.");
        return;
    }
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
            stone.velocity.y -= GRAVITY * deltaTime;
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

export function animate(renderer, scene, player, stats, cameraDistance) {
    if (!player||typeof player.onFloor === "undefined") {
        console.error("Player is not properly initialized in the animate.");
        return;
    }
    const deltaTime = Math.min(0.03, clock.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
        controls(deltaTime, player);
        updatePlayer(deltaTime, player, cameraDistance);
        updateStones(deltaTime, player);
        teleportPlayerIfOob(player);
    }

    renderer.render(scene, player.camera);
    stats.update();
}
