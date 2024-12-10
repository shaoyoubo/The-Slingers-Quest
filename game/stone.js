import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { energyManager } from './ui';
import { sharedState } from './init';

// 假设这些常量是由主文件传入
const NUM_SPHERES = 100;  // 生成的石头数量
const SPHERE_RADIUS = 0.2;  // 石头的半径
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

class StoneThrower {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.stones = [];
        this.stoneIdx = 0;
        this.loader = new GLTFLoader().setPath('../Assets/');
        this.time=-1;
    }
    updateScene(scene) {
        this.scene = scene;
        this.loadStones();
    }
    updatePlayer(player) {
        this.player = player;
    }
    // 加载石头模型
    loadStones() {
        console.log(sharedState.gltfEnvironmentDict['stone']);
        const stoneModel = sharedState.gltfEnvironmentDict['stone'].scene;
        for (let i = 0; i < NUM_SPHERES; i++) {
            const stone = stoneModel.clone();
            stone.scale.set(0.4, 0.4, 0.4);
            stone.castShadow = true;
            stone.receiveShadow = true;
            this.scene.add(stone);
            this.stones.push({
                mesh: stone,
                collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
                velocity: new THREE.Vector3(),
            });
        }
    }

    // 投掷石头
    throwStone(mouseTime) {
        if (energyManager.currentEnergy >= energyManager.energyCostPerThrow) {
            energyManager.currentEnergy -= energyManager.energyCostPerThrow;
            energyManager.updateEnergyBar();
        const stone = this.stones[this.stoneIdx];
        sharedState.totalhits++;
        // 计算投掷方向
        this.player.camera.getWorldDirection(this.player.direction);

        stone.collider.center.copy(this.player.collider.end).addScaledVector(this.player.direction, this.player.collider.radius * 1.5);

        // 投掷力度，按住按钮时间越长，投掷力度越大
        const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

        // 设置石头的速度
        stone.velocity.copy(this.player.direction).multiplyScalar(impulse);
        stone.velocity.addScaledVector(this.player.velocity, 2);
        stone.time = performance.now();

        // 更新石头索引
        this.stoneIdx = (this.stoneIdx + 1) % this.stones.length;
        sharedState.lastthrow = performance.now();
        sharedState.lastshake = performance.now();
        }
    }

    stonesCollisions() {
        for (let i = 0, length = this.stones.length; i < length; i++) {
            const s1 = this.stones[i];

            for (let j = i + 1; j < length; j++) {
                const s2 = this.stones[j];

                const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
                const r = s1.collider.radius + s2.collider.radius;
                const r2 = r * r;

                if (d2 < r2) {
                    const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
                    const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
                    const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

                    s1.velocity.add(v2).sub(v1);
                    s2.velocity.add(v1).sub(v2);

                    const d = (r - Math.sqrt(d2)) / 2;

                    s1.collider.center.addScaledVector(normal, d);
                    s2.collider.center.addScaledVector(normal, -d);
                }
            }
        }
    }
}
// export const stoneThrower = new StoneThrower();
export { StoneThrower };