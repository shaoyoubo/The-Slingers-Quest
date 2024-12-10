import { sharedState } from "./init";
import {updateImmediate} from './control.js';
import {player} from './player.js';
class EnergyManager {
    constructor(maxEnergy, energyRecoveryRate, energyCostPerThrow) {
        this.maxEnergy = maxEnergy; // 能量最大值
        this.currentEnergy = maxEnergy; // 初始当前能量
        this.energyRecoveryRate = energyRecoveryRate; // 每帧恢复的能量值
        this.energyCostPerThrow = energyCostPerThrow; // 每次投掷消耗的能量

        this.energyBar = null;
        this.hits = 0;
        this.stoneCountElement = null;
    }

    // 初始化，绑定 DOM 元素
    init(energyBarId, stoneCountId, hitsId) {
        this.energyBar = document.getElementById(energyBarId);
        this.stoneCountElement = document.getElementById(stoneCountId);
        this.hitsElement = document.getElementById(hitsId);

        if (!this.energyBar || !this.stoneCountElement) {
            console.error("EnergyManager: Failed to find required DOM elements.");
            return;
        }

        // 初始更新
        this.updateEnergyBar();
    }

    // 更新能量条和石头计数
    updateEnergyBar() {
        const energyPercentage = (this.currentEnergy / this.maxEnergy) * 100;

        // 设置能量条宽度
        this.energyBar.style.width = `${energyPercentage}%`;

        // 设置颜色（渐变效果）
        if (energyPercentage > 50) {
            this.energyBar.style.backgroundColor = "green";
        } else if (energyPercentage > 20) {
            this.energyBar.style.backgroundColor = "yellow";
        } else {
            this.energyBar.style.backgroundColor = "red";
        }

        this.updateStoneCount();
        this.hitsElement.textContent = this.hits;
    }

    updateStoneCount() {
        const availableStones = Math.floor(this.currentEnergy / this.energyCostPerThrow);
        this.stoneCountElement.textContent = availableStones; // 更新数字
    }

    // 恢复能量
    recoverEnergy() {
        if (this.currentEnergy < this.maxEnergy) {
            this.currentEnergy = Math.min(this.currentEnergy + this.energyRecoveryRate, this.maxEnergy);
            this.updateEnergyBar();
        }
    }
}
export const energyManager = new EnergyManager(20*sharedState.stonecapacity, sharedState.stonerecovery, 20);

function initializeViewToggle() {
    const toggleViewButton = document.getElementById('toggle-view');

    toggleViewButton.addEventListener('click', () => {
        const currentView = toggleViewButton.getAttribute('data-view'); // 获取当前视角值

        if (currentView === 'third') {
            sharedState.cameraDistance = -0.05;
            toggleViewButton.setAttribute('data-view', 'first'); // 更新视角状态
            toggleViewButton.textContent = 'First Person View';
        } else {
            sharedState.cameraDistance = 0.14;
            toggleViewButton.setAttribute('data-view', 'third'); // 更新视角状态
            toggleViewButton.textContent = 'Third Person View';
        }
        updateImmediate(player);
    });
}

export {initializeViewToggle};