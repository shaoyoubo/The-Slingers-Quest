
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { cameraNear } from 'three/webgpu';

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

const container = document.getElementById( 'container' );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
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


const worldOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
let cameraDistance = 0.14;

let playerOnFloor = false;
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

	if ( document.pointerLockElement !== null ) throwStone();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

	if ( document.pointerLockElement === document.body ) {

		
		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;

	}

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}
let stoneIdx = 0;
function throwStone() {

	const stone = stones[ stoneIdx ];
	camera.getWorldDirection( playerDirection );

	stone.collider.center.copy( playerCollider.end ).addScaledVector( playerDirection, playerCollider.radius * 1.5 );

	// throw the ball with more force if we hold the button longer, and if we move forward

	const impulse = 15 + 30 * ( 1 - Math.exp( ( mouseTime - performance.now() ) * 0.001 ) );

	stone.velocity.copy( playerDirection ).multiplyScalar( impulse );
	stone.velocity.addScaledVector( playerVelocity, 2 );

	stoneIdx = ( stoneIdx + 1 ) % stones.length;

}

function playerCollisions() {

	const result = worldOctree.capsuleIntersect( playerCollider );

	playerOnFloor = false;

	if ( result ) {

		playerOnFloor = result.normal.y > 0;

		if ( ! playerOnFloor ) {

			playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

		}

		if ( result.depth >= 1e-10 ) {

			playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

		}

	}

}


const loader = new GLTFLoader().setPath( './' );

loader.load( './collision-world.glb', ( gltf ) => {

	scene.add( gltf.scene );

	worldOctree.fromGraphNode( gltf.scene );

	gltf.scene.traverse( child => {

		if ( child.isMesh ) {

			child.castShadow = true;
			child.receiveShadow = true;

			if ( child.material.map ) {

				child.material.map.anisotropy = 4;

			}

		}

	} );

	const helper = new OctreeHelper( worldOctree );
	helper.visible = false;
	scene.add( helper );

	const gui = new GUI( { width: 200 } );
	gui.add( { debug: false }, 'debug' )
		.onChange( function ( value ) {

			helper.visible = value;

		} );

} );

let playerModel = null;	

const stones = [];
loader.load('./stone.glb', (gltf2) => {
    const stoneModel = gltf2.scene;
	for ( let i = 0; i < NUM_SPHERES; i ++ ) {

		const stone = stoneModel.clone();
		stone.scale.set( 0.4, 0.4, 0.4 );
		stone.castShadow = true;
		stone.receiveShadow = true;
		scene.add( stone );
		stones.push( {
			mesh: stone,
			collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
			velocity: new THREE.Vector3()
		} );

	}
});
// 加载模型和动画
loader.load('./Adventurer.glb', (gltf) => {
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
        if (playerVelocity.length() > 0) {  // 玩家正在移动
            let direction = getForwardVector().dot(playerVelocity);  // 计算朝向

            // 根据方向决定播放哪个动画
            if (direction > 0.5) {
                // 前进
                if (currentAction !== forwardWalk) {
                    if (currentAction) currentAction.stop();
                    currentAction = mixer.clipAction(forwardWalk);
                    currentAction.play();
                }
            } else if (direction < -0.5) {
                // 后退
                if (currentAction !== backwardWalk) {
                    if (currentAction) currentAction.stop();
                    currentAction = mixer.clipAction(backwardWalk);
                    currentAction.play();
                }
            } else {
                let sideDirection = getSideVector().dot(playerVelocity);
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
    }

    // 动画更新
    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        mixer.update(delta);
	    const direction = getForwardVector();
        const angle = Math.atan2(direction.x, direction.z);
        model.rotation.y = angle;  // 旋转模型使它面朝前方
        playWalkAnimation();  // 根据方向播放动画

        renderer.render(scene, camera);
    }

    animate();
});


function updatePlayer( deltaTime ) {

	let damping = Math.exp( - 4 * deltaTime ) - 1;

	if ( ! playerOnFloor ) {

		playerVelocity.y -= GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.1;

	}
	getForwardVector();
	playerVelocity.addScaledVector( playerVelocity, damping );

	const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
	playerCollider.translate( deltaPosition );

	playerCollisions();

	let playerPosition = playerCollider.end.clone();
	playerPosition.y -= 0.35;
	// 同步 Adventurer 模型的位移
	if (playerModel) {
		playerModel.position.copy(playerPosition);
	}
	camera.position.copy( playerCollider.end.clone().sub((playerDirection.clone()).multiplyScalar(cameraDistance)).clone() );
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

	const center = vector1.addVectors( playerCollider.start, playerCollider.end ).multiplyScalar( 0.5 );

	const stone_center = stone.collider.center;

	const r = playerCollider.radius + stone.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for ( const point of [ playerCollider.start, playerCollider.end, center ] ) {

		const d2 = point.distanceToSquared( stone_center );

		if ( d2 < r2 ) {

			const normal = vector1.subVectors( point, stone_center ).normalize();
			const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( playerVelocity ) );
			const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( stone.velocity ) );

			playerVelocity.add( v2 ).sub( v1 );
			stone.velocity.add( v1 ).sub( v2 );

			const d = ( r - Math.sqrt( d2 ) ) / 2;
			stone_center.addScaledVector( normal, - d );

		}

	}

}

function StonesCollisions() {

	for ( let i = 0, length = stones.length; i < length; i ++ ) {

		const s1 = stones[ i ];

		for ( let j = i + 1; j < length; j ++ ) {

			const s2 = stones[ j ];

			const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if ( d2 < r2 ) {

				const normal = vector1.subVectors( s1.collider.center, s2.collider.center ).normalize();
				const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( s1.velocity ) );
				const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( s2.velocity ) );

				s1.velocity.add( v2 ).sub( v1 );
				s2.velocity.add( v1 ).sub( v2 );

				const d = ( r - Math.sqrt( d2 ) ) / 2;

				s1.collider.center.addScaledVector( normal, d );
				s2.collider.center.addScaledVector( normal, - d );

			}

		}

	}

}

function updateStones( deltaTime ) {

	stones.forEach( stone => {

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
	
	StonesCollisions();

	for ( const stone of stones ) {

		stone.mesh.position.copy( stone.collider.center );

	}

}

function getForwardVector() {

	camera.getWorldDirection( playerDirection );
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;

}
/*
function getSideVector() {

	camera.getWorldDirection( playerDirection );
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross( camera.up );

	return playerDirection;

}*/

function controls( deltaTime ) {

	// gives a bit of air control
	const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );

	if ( keyStates[ 'KeyW' ] ) {

		playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );

	}

	if ( keyStates[ 'KeyS' ] ) {

		playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );

	}

	if ( keyStates[ 'KeyA' ] ) {

		//playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );

	}

	if ( keyStates[ 'KeyD' ] ) {

		//playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );

	}

	if ( playerOnFloor ) {

		if ( keyStates[ 'Space' ] ) {

			playerVelocity.y = 15;

		}

	}

}

function teleportPlayerIfOob() {

	if ( camera.position.y <= - 25 ) {

		playerCollider.start.set( 0, 0.35, 0 );
		playerCollider.end.set( 0, 1, 0 );
		playerCollider.radius = 0.35;
		camera.position.copy( playerCollider.end );
		camera.rotation.set( 0, 0, 0 );

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

	renderer.render( scene, camera );

	stats.update();

}