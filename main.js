import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { cameraNear, select } from 'three/webgpu';
import {scene,renderer} from './game/init.js';
import {player} from './game/player.js';
import { loadWorldModel } from './game/loadWorld.js';
import StoneThrower from './game/stone.js';

const clock = new THREE.Clock();

const worldOctree = new Octree();
loadWorldModel(scene, worldOctree);
player.updateWorldOctree(worldOctree);
const stoneThrower = new StoneThrower(scene, player);


// const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
// camera.rotation.order = 'YXZ';


const container = document.getElementById( 'container' );

renderer.setAnimationLoop( animate );
container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const GRAVITY = 30;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );

let sphereIdx = 0;


let cameraDistance = 0.14;

let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener( 'keydown', ( event ) => {

	keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

	keyStates[ event.code ] = false;

} );

container.addEventListener( 'mousedown', () => {

	document.body.requestPointerLock();

	mouseTime = performance.now();

} );

document.addEventListener( 'mouseup', () => {

	if ( document.pointerLockElement !== null ) stoneThrower.throwStone(mouseTime);

} );

document.body.addEventListener( 'mousemove', ( event ) => {

	if ( document.pointerLockElement === document.body ) {

		
		if(player.camera.rotation.x- event.movementY / 500 < Math.PI/3 && player.camera.rotation.x- event.movementY / 500 > -Math.PI/3)
			player.camera.rotation.y -= event.movementX / 500;
			if(player.camera.rotation.x- event.movementY / 500 < Math.PI/3 && player.camera.rotation.x- event.movementY / 500 > -Math.PI/3)
			player.camera.rotation.x -= event.movementY / 500;
	}

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	player.camera.aspect = window.innerWidth / window.innerHeight;
	player.camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}



const loader = new GLTFLoader().setPath( './Assets/' );

let playerModel = null;	


// 加载模型和动画
loader.load('./Characters/Adventurer.glb', (gltf) => {
	const model = gltf.scene;
	playerModel = model;
	model.scale.set(0.2, 0.2, 0.2);
	scene.add(model);

    // 获取所有动画
    const animations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);

    // 你需要找到四个方向的 walk 动画
    const forwardWalk = animations.find(anim => anim.name === 'CharacterArmature|Run');
    const backwardWalk = animations.find(anim => anim.name === 'CharacterArmature|Run_Back');
    const leftWalk = animations.find(anim => anim.name === 'CharacterArmature|Run_Left');
    const rightWalk = animations.find(anim => anim.name === 'CharacterArmature|Run_Right');

    // 创建动作并播放
    let currentAction = null;
    function playWalkAnimation() {
        // 根据 velocity 判断播放哪个动画
        if (player.velocity.length() > 0.5) {  // 玩家正在移动
            let direction = player.getForwardVector().dot(player.velocity);  // 计算朝向

            // 根据方向决定播放哪个动画
            if (direction > 0.5) {
                // 前进
                if (currentAction !== forwardWalk) {
                    //if (currentAction) currentAction.stop();
                    currentAction = mixer.clipAction(forwardWalk);
					currentAction.timeScale = 4;
                    currentAction.play();
                }
            } else if (direction < -0.5) {
                // 后退
                if (currentAction !== backwardWalk) {
                    //if (currentAction) currentAction.stop();
                    currentAction = mixer.clipAction(backwardWalk);
					currentAction.timeScale = 4;
                    currentAction.play();
                }
            } else {
                let sideDirection = player.getSideVector().dot(player.velocity);
                if (sideDirection > 0.5) {
                    // 右移
                    if (currentAction !== rightWalk) {
                        if (currentAction) currentAction.stop();
                        currentAction = mixer.clipAction(rightWalk);
                        currentAction.play();
                    }
                } else if (sideDirection < -0.5) {
                    // 左移
                    if (currentAction !== leftWalk) {
                        if (currentAction) currentAction.stop();
                        currentAction = mixer.clipAction(leftWalk);
                        currentAction.play();
                    }
                }
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


function updatePlayer( deltaTime ) {

	let damping = Math.exp( - 4 * deltaTime ) - 1;

	if ( ! player.onFloor ) {

		player.velocity.y -= GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.1;

	}
	player.getForwardVector();
	player.velocity.addScaledVector( player.velocity, damping );

	const deltaPosition = player.velocity.clone().multiplyScalar( deltaTime );
	player.collider.translate( deltaPosition );

	player.checkCollisionsWithWorld();

	let playerPosition = player.collider.end.clone();
	playerPosition.y -= 0.35;
	// 同步 Adventurer 模型的位移
	if (playerModel) {
		playerModel.position.copy(playerPosition);
	}
	player.camera.position.copy( player.collider.end.clone().sub((player.direction.clone()).multiplyScalar(cameraDistance)).clone() );
	//camera.lookAt(playerCollider.end);
}

// // 加载模型和动画
// loader.load('./Adventurer.glb', (gltf) => {
//     const model = gltf.scene;
// 	playerModel = model;
// 	model.scale.set(0.2, 0.2, 0.2);
//     scene.add(model);
	
//     // 获取所有动画
//     const animations = gltf.animations;
//     const mixer = new THREE.AnimationMixer(model);
// 	animations.forEach((animation, index) => {
// 		console.log(`动画 ${index + 1}: ${animation.name}`);
// 	});
//     // 获取 walk 动画
//     const walkAnimation = animations.find(anim => anim.name === 'CharacterArmature|Run');

//     // 创建动作并播放
//     const walkAction = mixer.clipAction(walkAnimation);
//     walkAction.play();

//     // 动画更新
//     function animate() {
//         requestAnimationFrame(animate);

//         const delta = clock.getDelta();
//         mixer.update(delta);

//         // 旋转模型，使它朝向移动方向
//         if (playerVelocity.length() > 0) {
//             // 获取移动方向
//             const direction = getForwardVector();

//             // 计算人物模型的朝向，确保它面朝移动的方向
//             const angle = Math.atan2(direction.x, direction.z);
//             model.rotation.y = angle;  // 旋转模型使它面朝前方
//         }

//         renderer.render(scene, camera);
//     }

//     animate();
// });

// loader.load( './Adventurer.glb', ( gltf ) => {
// 	const model = gltf.scene;
//     model.scale.set(0.2, 0.2, 0.2);
// 	playerModel = model;
//     // 获取动画数据
//     const animations = gltf.animations;

//     // 输出所有动画的名称
//     animations.forEach((animation, index) => {
//         console.log(`动画 ${index + 1}: ${animation.name}`);
//     });
//     // 将模型添加到场景中
//     scene.add(model);

//     // 创建一个 AnimationMixer 来控制动画
//     const mixer = new THREE.AnimationMixer(model);

//     // 找到名为 'walk' 的动画并播放
//     const walkAnimation = animations.find(anim => anim.name === 'CharacterArmature|Walk');
//     if (walkAnimation) {
//         mixer.clipAction(walkAnimation).play();
//     } else {
//         console.log('没有找到名为 "walk" 的动画');
//     }

//     // 创建时钟来控制动画更新
//     const clock = new THREE.Clock();

//     // 动画更新循环
//     function animate() {
//         requestAnimationFrame(animate);

//         // 更新动画混合器
//         const delta = clock.getDelta();
//         mixer.update(delta); // 更新动画进度

//         // 渲染场景
//         renderer.render(scene, camera);
//     }

//     // 启动动画
//     animate();
// });




const toggleViewButton = document.getElementById('toggle-view');
toggleViewButton.addEventListener('click', () => {
  const currentView = toggleViewButton.getAttribute('data-view'); // 获取当前的视角值

  if (currentView === 'third') {
	cameraDistance = 0.14;
    toggleViewButton.setAttribute('data-view', 'first'); // 更新视角状态
    toggleViewButton.textContent = 'First Person View';
  } else {
	cameraDistance = 0.7;
    toggleViewButton.setAttribute('data-view', 'third'); // 更新视角状态
    toggleViewButton.textContent = 'Third Person View';
  }
});

function playerStoneCollision( stone ) {

	const center = vector1.addVectors( player.collider.start, player.collider.end ).multiplyScalar( 0.5 );

	const stone_center = stone.collider.center;

	const r = player.collider.radius + stone.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for ( const point of [ player.collider.start, player.collider.end, center ] ) {

		const d2 = point.distanceToSquared( stone_center );

		if ( d2 < r2 ) {

			const normal = vector1.subVectors( point, stone_center ).normalize();
			const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( player.velocity ) );
			const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( stone.velocity ) );

			player.velocity.add( v2 ).sub( v1 );
			stone.velocity.add( v1 ).sub( v2 );

			const d = ( r - Math.sqrt( d2 ) ) / 2;
			stone_center.addScaledVector( normal, - d );

		}

	}

}



function updateStones( deltaTime ) {

	stoneThrower.stones.forEach( stone => {

		stone.collider.center.addScaledVector( stone.velocity, deltaTime );

		const result = worldOctree.sphereIntersect( stone.collider );

		if ( result ) {

			stone.velocity.addScaledVector( result.normal, - result.normal.dot( stone.velocity ) * 1.5 );
			stone.collider.center.add( result.normal.multiplyScalar( result.depth ) );

		} else {

			stone.velocity.y -= GRAVITY * deltaTime;

		}

		const damping = Math.exp( - 1.5 * deltaTime ) - 1;
		stone.velocity.addScaledVector( stone.velocity, damping );

		playerStoneCollision( stone );
		
	} );
	
	stoneThrower.stonesCollisions();

	for ( const stone of stoneThrower.stones ) {

		stone.mesh.position.copy( stone.collider.center );

	}

}


function controls( deltaTime ) {

	// gives a bit of air control
	const speedDelta = deltaTime * ( player.onFloor ? 25 : 8 );

	if ( keyStates[ 'KeyW' ] ) {

		player.velocity.add( player.getForwardVector().multiplyScalar( speedDelta ) );

	}

	if ( keyStates[ 'KeyS' ] ) {

		player.velocity.add( player.getForwardVector().multiplyScalar( - speedDelta ) );

	}

	if ( keyStates[ 'KeyA' ] ) {

		//playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );

	}

	if ( keyStates[ 'KeyD' ] ) {

		//playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );

	}

	if ( player.onFloor ) {

		if ( keyStates[ 'Space' ] ) {

			player.velocity.y = 15;

		}

	}

}

function teleportPlayerIfOob() {

	if ( player.camera.position.y <= - 25 ) {

		player.collider.start.set( 0, 0.35, 0 );
		player.collider.end.set( 0, 1, 0 );
		player.collider.radius = 0.35;
		player.camera.position.copy( player.collider.end );
		player.camera.rotation.set( 0, 0, 0 );

	}

}


function animate() {

	const deltaTime = Math.min( 0.03, clock.getDelta() ) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

		controls( deltaTime );

		updatePlayer( deltaTime );

		updateStones( deltaTime );

		teleportPlayerIfOob();

	}

	renderer.render( scene, player.camera );

	stats.update();

}