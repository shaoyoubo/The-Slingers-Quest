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
import StoneThrower from './game/stone.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import {energyManager} from './game/ui.js';


const worldOctree = new Octree();
loadWorldModel(scene, worldOctree);
player.updateWorldOctree(worldOctree);
const stoneThrower = new StoneThrower(scene, player);


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

loadPlayerModel();


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
	if (sharedState.playerModel) {
		sharedState.playerModel.position.copy(playerPosition);
	}
	player.camera.position.copy( player.collider.end.clone().sub((player.direction.clone()).multiplyScalar(cameraDistance)).clone() );
	//camera.lookAt(playerCollider.end);
}



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
		if ( performance.now() - stone.time > 5000 ) {
			stone.collider.center.set( 0, - 100, 0 );
			stone.velocity.set( 0, 0, 0 );
		}
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

		player.velocity.add( player.getSideVector().multiplyScalar( - speedDelta ) );

	}

	if ( keyStates[ 'KeyD' ] ) {

		player.velocity.add( player.getSideVector().multiplyScalar( speedDelta ) );

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

window.onload = () => {
    energyManager.init('energy-bar', 'stone-count');

    // 模拟能量恢复的循环
    setInterval(() => {
        energyManager.recoverEnergy();
    }, 100); // 每 100ms 恢复能量
};