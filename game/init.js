import * as THREE from 'three';

const scene = new THREE.Scene();

// Change the background to a bluish tone
scene.background = new THREE.Color( 0x3a4f6b ); // Bluish tone for a colder atmosphere
scene.fog = new THREE.Fog( 0x3a4f6b, 0, 50 ); // Adjusted fog with a bluish hue for consistency

// Adjust the hemisphere light for a cooler tone
const fillLight1 = new THREE.HemisphereLight( 0x8da7b2, 0x223344, 1 ); // Bluish, cooler tones
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

// Adjust the directional light to have a colder, bluish tone
const directionalLight = new THREE.DirectionalLight( 0x99c2cc, 1.8 ); // Bluish light color
directionalLight.position.set( - 5, 25, - 5 ); // Slightly repositioned for better coverage
directionalLight.intensity = 0.7; // Intensity remains the same for balanced lighting
directionalLight.castShadow = true;

// Adjust shadow properties for balance
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = - 30;

// Increase shadow map size for sharper shadows
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// Slightly soften the shadow radius for a more natural, but still eerie effect
directionalLight.shadow.radius = 6;

// Increase the shadow bias slightly to prevent artifacts
directionalLight.shadow.bias = - 0.00005;

scene.add( directionalLight );




const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const clock = new THREE.Clock();

let sharedState = {
    playerModel: null,
    cameraDistance : -0.06,
    gltfCharactorDict: {},
    gltfEnvironmentDict: {},
    EnemySpeed:0.01,
    generationInterval: 1000,
    totalhits: 0,
    starttime: 0,
    difficulty: 0,
    difficultyText: "Medium",
    characterText: "Knight",
    score: 0,
    lastthrow: 0,
    lastshake: 0,
    shake: 0.05,
    loadplace: './Characters/Adventurer1.glb',
    playerspeed: 25,
    stonecapacity: 5,
    stonerecovery: 1,
    lastchangeview: 0,
    currenthp: 5,
    maxhp: 5,
    invincibletime : 0,
};

export { scene, renderer, clock, sharedState };



