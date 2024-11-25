import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

async function loadAssets(gltfCharactorDict, gltfEnvironmentDict) {

    const gltfLoader = new GLTFLoader().setPath( '../Assets/' );

    function gltfPromise(path) {
        return new Promise((resolve, reject) => {
            gltfLoader.load(
                path,
                (gltf) => {
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }


    const environmentPaths = [
        'collision-world',
        'stone',
    ];

    const characterPaths = [
        'Adventurer',
        'Slime',
    ];

    const itemPaths = [
        
    ];


    const promises = [];

    

    characterPaths.forEach((path) => {
        promises.push(
            gltfPromise(`/Characters/${path}.glb`).then((gltf) => {
                gltfCharactorDict[path] = gltf;
                console.log('Loaded GLTF model:', path, gltf);
            })
        );
    });

    environmentPaths.forEach((path) => {
        promises.push(
            gltfPromise(`/Environment/${path}.glb`).then((gltf) => {
                gltfEnvironmentDict[path] = gltf;
                console.log('Loaded GLTF model:', path, gltf);
            })
        );
    });

    // itemPaths.forEach((path) => {
    //     promises.push(
    //         gltfPromise(`assets/models/items/${path}/scene.gltf`).then((gltf) => {
    //             gltfItemDict[path] = gltf;
    //             console.log('Loaded GLTF model:', path, gltf);
    //         })
    //     );
    // });


    // const texturePaths=[
        
    // ];


    // const textureLoader = new THREE.TextureLoader();
    

    // function texturePromise(path){
    //     return new Promise((resolve, reject) => {
    //         textureLoader.load(
    //             path,
    //             (texture) => {
    //                 resolve(texture);
    //             },
    //             undefined,
    //             (error) => {
    //                 reject(error);
    //             }
    //         );
    //     });
    // }

    // texturePaths.forEach((path) => {
    //     promises.push(
    //         texturePromise(`assets/textures/${path}.png`).then((texture) => {
    //             textureDict[path] = texture;
    //             console.log('Loaded texture:', path);
    //         })
    //     );
    // });




    await Promise.all(promises);

    // sort gltf dict by key
    gltfCharactorDict = Object.keys(gltfCharactorDict).sort().reduce(
        (obj, key) => {
            obj[key] = gltfCharactorDict[key];
            return obj;
        },
        {}
    );
    gltfEnvironmentDict = Object.keys(gltfEnvironmentDict).sort().reduce(
        (obj, key) => {
            obj[key] = gltfEnvironmentDict[key];
            return obj;
        },
        {}
    );

   

}

export { loadAssets };