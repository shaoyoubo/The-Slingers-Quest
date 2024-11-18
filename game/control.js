import {renderer} from './init.js';
import {player} from './player.js';

const keyStates = {};

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

		
		player.camera.rotation.y -= event.movementX / 500;
		player.camera.rotation.x -= event.movementY / 500;

	}

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	player.camera.aspect = window.innerWidth / window.innerHeight;
	player.camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}