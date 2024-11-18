class EnergyManager {
    constructor(maxEnergy, energyRecoveryRate, energyCostPerThrow) {
        this.maxEnergy = maxEnergy; // 能量最大值
        this.currentEnergy = maxEnergy; // 初始当前能量
        this.energyRecoveryRate = energyRecoveryRate; // 每帧恢复的能量值
        this.energyCostPerThrow = energyCostPerThrow; // 每次投掷消耗的能量

        this.energyBar = null;
        this.stoneCountElement = null;
    }

    // 初始化，绑定 DOM 元素
    init(energyBarId, stoneCountId) {
        this.energyBar = document.getElementById(energyBarId);
        this.stoneCountElement = document.getElementById(stoneCountId);

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
export const energyManager = new EnergyManager(100, 1, 20);
