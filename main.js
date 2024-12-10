import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { cameraNear, Return, select } from 'three/webgpu';
import {scene,renderer,clock,sharedState} from './game/init.js';
import {player,loadPlayerModel} from './game/player.js';
import { stoneThrower } from './game/loadClasses.js';
import { loadWorldModel } from './game/loadWorld.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import {energyManager,initializeViewToggle} from './game/ui.js';
import { inputManager } from './game/InputManager.js';
import { animate,ReturntoMainMenu, RetryGame } from './game/control.js';
import { loadAssets } from './game/loadAssets.js';
import { loadClasses } from './game/loadClasses.js';
document.addEventListener("DOMContentLoaded", () => {
    // 读取难度值
    const difficulty = localStorage.getItem("gameDifficulty") || "easy";
  
    // 根据难度调整游戏逻辑
    if (difficulty === "easy") {
      console.log("Easy mode selected: Slimes spawn slower, more stones.");
      sharedState.generationInterval = 1500;
        sharedState.EnemySpeed = 0.007;
        sharedState.difficulty = 50;
      // 设置简单模式参数
    } else if (difficulty === "medium") {
      console.log("Medium mode selected: Default settings.");
      sharedState.difficulty = 70;
      // 设置普通模式参数
    } else if (difficulty === "hard") {
      console.log("Hard mode selected: Slimes spawn faster, fewer stones.");
        sharedState.generationInterval = 700;
        sharedState.EnemySpeed = 0.015;
        sharedState.difficulty = 100;
      // 设置困难模式参数
    }
  
    // 开始游戏
    main();
  });
async function main(){
    console.log("main");
    await loadClasses();
    console.log("loadClasses done");
    // const checkInitialization = setInterval(() => {
    //     if (sharedState.initEnemiesGenerator) {
    //         console.log("EnemyGenerator initialized.");
    //         clearInterval(checkInitialization); // 停止检查
    //         enemiesGenerator.updateScene(scene); // 调用更新场景方法
    //     } else {
    //         console.warn("EnemyGenerator not initialized yet.");
    //     }
    // }, 100); // 每100毫秒检查一次
    
    
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
    

    
    initializeViewToggle();
    ReturntoMainMenu();
    RetryGame();
    sharedState.starttime = performance.now();
    function gameLoop() {
        animate(renderer, scene, player, stats, sharedState.cameraDistance);
    }
    renderer.setAnimationLoop( gameLoop );
    
    
    
}
//main();

window.onload = () => {
    energyManager.init('energy-bar', 'stone-count','hits-count');
    // 模拟能量恢复的循环
    setInterval(() => {
        energyManager.recoverEnergy();
    }, 100); // 每 100ms 恢复能量
    const scoreDisplay = document.getElementById('score-display');
    setInterval(() => {
        scoreDisplay.textContent = `Score: ${sharedState.score}`;
    }, 100); // 每 100ms 更新一次分数显示
};

