import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { cameraNear, select } from 'three/webgpu';
import {scene,renderer,clock,sharedState} from './game/init.js';
import {player,loadPlayerModel} from './game/player.js';
import { loadWorldModel } from './game/loadWorld.js';
import { stoneThrower } from './game/stone.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import {energyManager,initializeViewToggle} from './game/ui.js';
import { inputManager } from './game/InputManager.js';
import { animate } from './game/control.js';
import { zombiesGenerator } from './game/enemy.js';


const worldOctree = new Octree();
loadWorldModel(scene, worldOctree);
player.updateWorldOctree(worldOctree);
player.updateOnFloor(false);
stoneThrower.updateScene(scene);
stoneThrower.updatePlayer(player);
const checkInitialization = setInterval(() => {
    if (sharedState.initZombiesGenerator) {
        console.log("ZombieGenerator initialized.");
        clearInterval(checkInitialization); // 停止检查
        zombiesGenerator.updateScene(scene); // 调用更新场景方法
    } else {
        console.warn("ZombieGenerator not initialized yet.");
    }
}, 100); // 每100毫秒检查一次


const container = document.getElementById( 'container' );
inputManager.init(player, stoneThrower, container, renderer);
container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;


const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );


// let cameraDistance = 0.14;

let mouseTime = 0;

loadPlayerModel();

initializeViewToggle();

function gameLoop() {
	
    animate(renderer, scene, player, stats, sharedState.cameraDistance);
}
renderer.setAnimationLoop( gameLoop );


window.onload = () => {
    energyManager.init('energy-bar', 'stone-count');
    // 模拟能量恢复的循环
    setInterval(() => {
        energyManager.recoverEnergy();
    }, 100); // 每 100ms 恢复能量
};


