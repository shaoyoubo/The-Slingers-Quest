import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';


import { GUI } from 'three/addons/libs/lil-gui.module.min.js';const loader = new GLTFLoader().setPath('../Assets/');

export function loadWorldModel(scene, worldOctree) {
    const textureLoader = new THREE.TextureLoader();

    // 加载纹理
    const colorMap = textureLoader.load('../Assets/textures/Rock051_4K-PNG_Color.png');
    const normalMap = textureLoader.load('../Assets/textures/Rock051_4K-PNG_NormalGL.png');
    const roughnessMap = textureLoader.load('../Assets/textures/Rock051_4K-PNG_Roughness.png');
    colorMap.repeat.set(0.001, 0.001);
    normalMap.repeat.set(0.001, 0.001);
    roughnessMap.repeat.set(0.001, 0.001);
    loader.load('./Environment/collision-world.glb', (gltf) => {
        // 将加载的模型添加到场景中
        scene.add(gltf.scene);

        // 将模型场景中的节点添加到 Octree
        worldOctree.fromGraphNode(gltf.scene);

        // 遍历模型的所有子对象，设置阴影
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // 创建基础材质并应用纹理
                const material = new THREE.MeshStandardMaterial({
                    map: colorMap, // 颜色贴图
                    //normalMap: normalMap, // 法线贴图
                    //roughnessMap: roughnessMap, // 粗糙度贴图
                });

                // 为网格应用材质
                child.material = material;

                // 增加纹理的各向异性
                if (child.material.map) {
                    child.material.map.anisotropy = 4;
                }
            }
        });

        // 创建OctreeHelper，帮助可视化Octree
    });
}
