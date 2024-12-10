import * as THREE from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene, renderer, clock ,sharedState} from './init.js';
import { enemiesGenerator } from './loadClasses.js';
import {isPaused} from './control.js';

class Player {
    constructor() {
        this.worldOctree = null;

        // 定义玩家的碰撞体、速度、方向等属性
        this.collider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.onFloor = false; // 玩家是否在地面上
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.rotation.order = 'YXZ';
    }
    updateWorldOctree(worldOctree) {
        this.worldOctree = worldOctree;
    }
    updateOnFloor(onFloor) {
        this.onFloor = onFloor;
    }
    /**
     * 检测玩家与世界的碰撞并处理结果
     */
    checkCollisionsWithWorld() {
        const result = this.worldOctree.capsuleIntersect(this.collider);

        const before = this.onFloor; // 保存之前的地面状态
        this.onFloor = false; // 重置地面状态

        if (result) {

            this.onFloor = result.normal.y > 0; // 如果碰撞法线的 y 分量大于 0，则认为玩家在地面上
            if(this.onFloor && !before)
            {
                sharedState.lastthrow = performance.now();
                sharedState.shake = 0.05;
                console.log("drop!");
            }
            // 如果玩家不在地面上，修正玩家速度
            if (!this.onFloor) {
                this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
            }

            // 如果有深度重叠，调整碰撞体位置
            if (result.depth >= 1e-10) {
                this.collider.translate(result.normal.multiplyScalar(result.depth));
            }
        }
    }

    reset(position) {
        this.collider.start.set(position.x, position.y, position.z);
        this.collider.end.set(position.x, position.y + 0.65, position.z);
        this.velocity.set(0, 0, 0);
        this.onFloor = false;
    }

    getForwardVector() {

        this.camera.getWorldDirection( this.direction );
        this.direction.y = 0;
        this.direction.normalize();
    
        return this.direction;
    
    }

    getSideVector() {

        this.camera.getWorldDirection( this.direction );
        this.direction.y = 0;
        this.direction.normalize();
        this.direction.cross( this.camera.up );
    
        return this.direction;
    
    }
}

export const player = new Player();

const loader = new GLTFLoader().setPath( '../Assets/' );

export function loadPlayerModel() {
    loader.load('./Characters/Adventurer.glb', (gltf) => {
        const model = gltf.scene;
        sharedState.playerModel = model;
        model.scale.set(0.2, 0.2, 0.2);
        scene.add(model);

        // 获取所有动画
        const animations = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);

        // 你需要找到四个方向的 walk 动画
        const forwardWalk = animations.find(anim => anim.name === 'CharacterArmature|Run');
        const backwardWalk = animations.find(anim => anim.name === 'CharacterArmature|Run_Back');

        // 创建动作并播放
        let currentAction = null;
        function playWalkAnimation() {
            // 根据 velocity 判断播放哪个动画
            if (player.velocity.length() > 0.5) {  // 玩家正在移动
                let direction = player.getForwardVector().dot(player.velocity);  // 计算朝向

                // 根据方向决定播放哪个动画
                if (direction > 0.1) {
                    // 前进
                    if (currentAction !== forwardWalk) {
                        //if (currentAction) currentAction.stop();
                        currentAction = mixer.clipAction(forwardWalk);
                        currentAction.timeScale = 4;
                        currentAction.play();
                    }
                } else if (direction < -0.1) {
                    // 后退
                    if (currentAction !== backwardWalk) {
                        //if (currentAction) currentAction.stop();
                        currentAction = mixer.clipAction(backwardWalk);
                        currentAction.timeScale = 4;
                        currentAction.play();
                    }
                } else {

                if (currentAction)
                    currentAction.stop();
                }
            }
            else
            {
                if (currentAction)
                currentAction.stop();
            }
        }

        // 动画更新
        function animate() {
            requestAnimationFrame(animate);
            if (isPaused) return;
            const delta = clock.getDelta();
            mixer.update(delta);
            const direction = player.getForwardVector();
            const angle = Math.atan2(direction.x, direction.z);
            model.rotation.y = angle;  // 旋转模型使它面朝前方
            playWalkAnimation();  // 根据方向播放动画



            renderer.render(scene, player.camera);
        }

        animate();
    });



}
