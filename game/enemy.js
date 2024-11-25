import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { sharedState } from './init';

const NUM_ZOMBIES = 20;
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
            zombie.scale.set(1, 1, 1);
            zombie.castShadow = true;
            zombie.receiveShadow = true;
            this.zombies.push({
                mesh: zombie,
                collider: new Capsule(new THREE.Vector3(0, -100, 0), new THREE.Vector3(0, -99.35, 0), 0.35),
                velocity: new THREE.Vector3(),
                onFloor: false,
            });
        }
    }
    generateZombie(){
        // console.log("generateZombie");
        // console.log(this.zombieIdx);
        const zombie = this.zombies[this.zombieIdx];
        zombie.collider.start.set(0, 0.35, 0);
        zombie.collider.end.set(0, 1, 0);
        zombie.velocity.set(0, 0, 0);
        this.zombieIdx = (this.zombieIdx + 1) % this.zombies.length;
    }
}
// export const zombiesGenerator = new ZombiesGenerator();
export { ZombiesGenerator };