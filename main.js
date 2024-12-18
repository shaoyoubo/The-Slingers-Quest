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
import {energyManagerPromise,initializeViewToggle, healthManagerPromise} from './game/ui.js';
import { inputManager } from './game/InputManager.js';
import { animate,ReturntoMainMenu, RetryGame,isPaused } from './game/control.js';
import { loadAssets } from './game/loadAssets.js';
import { loadClasses } from './game/loadClasses.js';
document.addEventListener("DOMContentLoaded", () => {
    // 读取难度值
    const difficulty = localStorage.getItem("gameDifficulty") || "easy";
// 创建环境光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // 默认强度为0.2
scene.add(ambientLight);

// 根据难度调整游戏逻辑
if (difficulty === "easy") {
  console.log("Easy mode selected: Slimes spawn slower, more stones.");
  sharedState.generationInterval = 1000;
  sharedState.EnemySpeed = 0.007;
  sharedState.difficulty = 50;
  sharedState.difficultyText = "Easy";
  ambientLight.intensity = 0.5; // 增强环境光照强度
  ambientLight.color.set(0xffe4b5); // 设置温暖的颜色（浅橙色）
  sharedState.currenthp = 5;
  sharedState.maxhp = 5;
} else if (difficulty === "medium") {
  console.log("Medium mode selected: Default settings.");
  sharedState.difficulty = 70;
  sharedState.difficultyText = "Medium";
  sharedState.generationInterval = 700;
  ambientLight.intensity = 0.3; // 中等环境光照强度
  ambientLight.color.set(0xffffff); // 设置中性的颜色（白色）
  sharedState.currenthp = 4;
  sharedState.maxhp = 4;
} else if (difficulty === "hard") {
  console.log("Hard mode selected: Slimes spawn faster, fewer stones.");
  sharedState.generationInterval = 500;
  sharedState.EnemySpeed = 0.015;
  sharedState.difficulty = 100;
  sharedState.difficultyText = "Hard";
  ambientLight.intensity = 0.2; // 减弱环境光照强度
  ambientLight.color.set(0xadd8e6); // 设置冷色调（浅蓝色）
  sharedState.currenthp = 3;
  sharedState.maxhp = 3;
}

    const character = localStorage.getItem("gameCharacter") || "adventurer";
    if (character === "adventurer") {
      sharedState.loadplace = './Characters/Adventurer1.glb';
      sharedState.playerspeed = 12;
      sharedState.stonecapacity = 5;
      sharedState.stonerecovery = 1;
    }
    else if(character === "ranger") {
      sharedState.loadplace = './Characters/Adventurer2.glb';
      sharedState.playerspeed = 20;
      sharedState.stonecapacity = 3;
      sharedState.stonerecovery = 0.8;
      sharedState.characterText = "Ranger";
      // fill in the rest of the character stats
    }
    else {
      sharedState.loadplace = './Characters/Adventurer3.glb';
      sharedState.playerspeed = 8;
      sharedState.stonecapacity = 7;
      sharedState.stonerecovery = 1.5;
      sharedState.characterText = "Warrior";
      // fill in the rest of the character stats
    }

    // 开始游戏
    main();
  });

async function initializeEnergyManager() {
    const energyManager = await energyManagerPromise;
    const healthManager = await healthManagerPromise;
    energyManager.updateMaxEnergy(20 * sharedState.stonecapacity);
    energyManager.updateEnergyRecoveryRate(sharedState.stonerecovery);
    healthManager.updateMaxHealth(sharedState.maxhp*30);
    healthManager.updateHealthRecoveryRate(1);
}
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
    
    // const stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // container.appendChild( stats.domElement );
    
    const NUM_SPHERES = 100;
    const SPHERE_RADIUS = 0.2;
    
    
    const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
    const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );
    
    
    // let cameraDistance = 0.14;
    
    let mouseTime = 0;
    

    
    initializeViewToggle();
    ReturntoMainMenu();
    RetryGame();
    initializeEnergyManager();
    function gameLoop() {
        animate(renderer, scene, player, sharedState.cameraDistance);
    }
    sharedState.starttime = performance.now();

    renderer.setAnimationLoop( gameLoop );
    
    
    
}
//main();

window.onload = async () => {
  const energyManager = await energyManagerPromise;
  const healthManager = await healthManagerPromise;
  // 模拟能量恢复的循环
  setInterval(() => {
    if(!isPaused)
        energyManager.recoverEnergy();
  }, 100); // 每 100ms 恢复能量

  setInterval(() => {
    if(!isPaused)
      healthManager.recoverHealth();
}, 1000); // 每 100ms 恢复能量
  const scoreDisplay = document.getElementById('score-display');
  setInterval(() => {
      scoreDisplay.textContent = `Score: ${sharedState.score}`;
  }, 100); // 每 100ms 更新一次分数显示
};
