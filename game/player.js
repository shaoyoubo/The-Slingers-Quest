import * as THREE from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

class Player {
    constructor(worldOctree) {
        this.worldOctree = worldOctree;

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
    /**
     * 检测玩家与世界的碰撞并处理结果
     */
    checkCollisionsWithWorld() {
        const result = this.worldOctree.capsuleIntersect(this.collider);

        this.onFloor = false; // 重置地面状态

        if (result) {
            this.onFloor = result.normal.y > 0; // 如果碰撞法线的 y 分量大于 0，则认为玩家在地面上

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

export default Player;

export const player = new Player();
