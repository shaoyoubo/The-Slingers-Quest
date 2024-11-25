import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { sharedState } from './init';
const SLIME_RADIUS = 0.25;

const NUM_ZOMBIES = 20;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();
class ZombiesGenerator{
    constructor(){
        this.zombies = [];
        this.zombieIdx = 0;
        this.loader = new GLTFLoader().setPath('../Assets/');
    }
    updateScene(scene) {
        this.loadZombies();
        this.scene = scene;
        for (let i = 0; i < NUM_ZOMBIES; i++) {
            this.scene.add(this.zombies[i].mesh);
            console.log("zombie added", i, this.zombies[i].mesh);
        }
    }
    loadZombies() {
        
        const zombieModel = sharedState.gltfCharactorDict['Slime'].scene;
        for (let i = 0; i < NUM_ZOMBIES; i++) {
            const zombie = zombieModel.clone();
            zombie.scale.set(3, 3, 3);
            zombie.castShadow = true;
            zombie.receiveShadow = true;
            this.zombies.push({
                mesh: zombie,
                collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SLIME_RADIUS),
                velocity: new THREE.Vector3(),
                onFloor: false,
            });
        }
    }
    generateZombie(){
        // console.log("generateZombie");
        // console.log(this.zombieIdx);
        const zombie = this.zombies[this.zombieIdx];
        zombie.collider.center.set(0, 5, 0);
        zombie.velocity.set(0, 0, 0);
        this.zombieIdx = (this.zombieIdx + 1) % this.zombies.length;
    }
    ZombiesCollision(){
        for (let i = 0, length = this.zombies.length; i < length; i++) {
            const s1 = this.zombies[i];

            for (let j = i + 1; j < length; j++) {
                const s2 = this.zombies[j];

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
// export const zombiesGenerator = new ZombiesGenerator();
export { ZombiesGenerator };