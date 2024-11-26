import {scene,renderer,clock,sharedState} from './init.js';
import { loadAssets } from "./loadAssets";
import {player,loadPlayerModel} from './player.js';
import { loadWorldModel } from './loadWorld.js';
import { StoneThrower } from './stone.js';
import { Octree } from 'three/addons/math/Octree.js';
import { EnemiesGenerator } from './enemy.js';
const stoneThrower = new StoneThrower();
const enemiesGenerator = new EnemiesGenerator();
async function loadClasses(){
    await loadAssets(sharedState.gltfCharactorDict, sharedState.gltfEnvironmentDict);
    const worldOctree = new Octree();
    loadWorldModel(scene, worldOctree);
    player.updateWorldOctree(worldOctree);
    player.updateOnFloor(false);
    stoneThrower.updateScene(scene);
    stoneThrower.updatePlayer(player);
    loadPlayerModel();
    enemiesGenerator.updateScene(scene);
    console.log("enemiesGenerator updated");
}
export { loadClasses, stoneThrower, enemiesGenerator};