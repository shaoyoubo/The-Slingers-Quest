import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';


import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const loader = new GLTFLoader().setPath( '../Assets/' );
export function loadWorldModel(scene, worldOctree) {

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
                if (child.material.map) {
                    child.material.map.anisotropy = 4;
                }
            }
        });

        // 创建OctreeHelper，帮助可视化Octree
        const helper = new OctreeHelper(worldOctree);
        helper.visible = false;
        scene.add(helper);
        const gui = new GUI( { width: 200 } );
        gui.add( { debug: false }, 'debug' )
            .onChange( function ( value ) {
    
                helper.visible = value;
    
            } );
    });
}
