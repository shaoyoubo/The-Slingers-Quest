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
    updateMaxEnergy(maxEnergy){
        this.maxEnergy = maxEnergy;
        this.currentEnergy = maxEnergy;
        this.updateEnergyBar();
    }
    updateEnergyRecoveryRate(energyRecoveryRate){
        this.energyRecoveryRate = energyRecoveryRate;
    }
    // 更新能量条和石头计数
    updateEnergyBar() {
        const energyPercentage = (this.currentEnergy / this.maxEnergy) * 100;

        // 设置能量条宽度
        this.energyBar.style.width = `${energyPercentage}%`;
        this.energyBar.style.backgroundColor="#00008B";

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
export const energyManagerPromise = new Promise((resolve) => {
    const energyManager = new EnergyManager(20 * sharedState.stonecapacity, sharedState.stonerecovery, 20);
    energyManager.init('energy-bar', 'stone-count', 'hits-count');
    resolve(energyManager);
});
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
class HealthManager {
    constructor(maxHealth, healthRecoveryRate) {
        this.maxHealth = maxHealth; // 最大生命值
        this.currentHealth = maxHealth; // 初始当前生命值
        this.healthRecoveryRate = healthRecoveryRate; // 每帧恢复的生命值

        this.healthBar = null;
        this.healthCountElement = null;
    }
    init(healthBarId) {
        this.healthBar = document.getElementById(healthBarId);
        //this.healthCountElement = document.getElementById(healthCountId);

        if (!this.healthBar) {
            console.error("HealthManager: Failed to find required DOM elements.");
            return;
        }
        this.updateHealthBar();
    }
    updateMaxHealth(maxHealth) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.updateHealthBar();
    }
    updateHealthRecoveryRate(healthRecoveryRate) {
        this.healthRecoveryRate = healthRecoveryRate;
    }
    updateHealthBar() {
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;

        // 设置血条宽度
        this.healthBar.style.width = `${healthPercentage}%`;

        // 设置颜色（渐变效果）
        if (healthPercentage > 50) {
            this.healthBar.style.backgroundColor = "green";
        } else if (healthPercentage > 20) {
            this.healthBar.style.backgroundColor = "yellow";
        } else {
            this.healthBar.style.backgroundColor = "red";
        }

        this.updateHealthCount();
    }
    updateHealthCount() {
        //this.healthCountElement.textContent = `${this.currentHealth} / ${this.maxHealth}`; // 更新数字
    }
    recoverHealth() {
        if (this.currentHealth < this.maxHealth) {
            this.currentHealth = Math.min(this.currentHealth + this.healthRecoveryRate, this.maxHealth);
            this.updateHealthBar();
        }
    }
    takeDamage(damage) {
        if(this.currentHealth <= damage) 
        {
            this.currentHealth = 0;
            this.updateHealthBar();
            return false;
        }
        this.currentHealth = this.currentHealth - damage;
        this.updateHealthBar();
        return true;
    }
}

// 创建一个血条管理器的 Promise
export const healthManagerPromise = new Promise((resolve) => {
    const healthManager = new HealthManager(sharedState.maxhp*30, 1);
    healthManager.init('health-bar', 'health-count');
    resolve(healthManager);
});

export {initializeViewToggle};