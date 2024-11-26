import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { sharedState } from './init';
const SLIME_RADIUS = 0.25;

const NUM_ZOMBIES = 20;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();
class EnemiesGenerator{
    constructor(){
        this.enemies = [];
        this.enemyIdx = 0;
        this.loader = new GLTFLoader().setPath('../Assets/');
    }
    updateScene(scene) {
        this.loadEnemies();
        this.scene = scene;
        for (let i = 0; i < NUM_ZOMBIES; i++) {
            this.scene.add(this.enemies[i].mesh);
            console.log("enemy added", i, this.enemies[i].mesh);
        }
    }
    loadEnemies() {
        
        const enemyModel = sharedState.gltfCharactorDict['Slime'].scene;
        for (let i = 0; i < NUM_ZOMBIES; i++) {
            const enemy = enemyModel.clone();
            enemy.scale.set(3, 3, 3);
            enemy.castShadow = true;
            enemy.receiveShadow = true;
            this.enemies.push({
                mesh: enemy,
                collider: new THREE.Sphere(new THREE.Vector3(10, -100, 0), SLIME_RADIUS),
                velocity: new THREE.Vector3(),
                onFloor: false,
            });
        }
    }
    generateEnemy(){
        // console.log("generateEnemy");
        // console.log(this.enemyIdx);
        const enemy = this.enemies[this.enemyIdx];
        enemy.collider.center.set(0, 5, 0);
        enemy.velocity.set(0, 0, 0);
        this.enemyIdx = (this.enemyIdx + 1) % this.enemies.length;
    }
    EnemiesCollision(){
        for (let i = 0, length = this.enemies.length; i < length; i++) {
            const s1 = this.enemies[i];

            for (let j = i + 1; j < length; j++) {
                const s2 = this.enemies[j];

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
// export const enemiesGenerator = new EnemiesGenerator();
export { EnemiesGenerator };