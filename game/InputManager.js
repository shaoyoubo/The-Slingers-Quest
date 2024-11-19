export class InputManager {
    constructor(player, stoneThrower, container, renderer) {
        this.player = player; // 玩家对象
        this.stoneThrower = stoneThrower; // 投掷石头逻辑对象
        this.container = container; // 容器元素
        this.renderer = renderer; // 渲染器
        this.keyStates = {}; // 存储按键状态
        this.mouseTime = 0; // 记录鼠标点击时间
    }

    // 初始化事件监听器
    init(player, stoneThrower, container, renderer) {

        this.player = player;
        this.stoneThrower = stoneThrower;
        this.container = container;
        this.renderer = renderer;

        // 键盘事件
        document.addEventListener('keydown', (event) => {
            this.keyStates[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keyStates[event.code] = false;
        });

        // 鼠标点击事件
        this.container.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
            this.mouseTime = performance.now();
        });

        document.addEventListener('mouseup', () => {
            if (document.pointerLockElement !== null) {
                this.stoneThrower.throwStone(this.mouseTime);
            }
        });

        // 鼠标移动事件
        document.body.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                this.handleMouseMove(event);
            }
        });

        // 窗口大小调整事件
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // 处理鼠标移动
    handleMouseMove(event) {
        const camera = this.player.camera;

        // 限制视角上下移动范围
        const newRotationX = camera.rotation.x - event.movementY / 500;
        if (newRotationX < Math.PI / 3 && newRotationX > -Math.PI / 3) {
            camera.rotation.x = newRotationX;
        }

        // 更新视角左右移动
        camera.rotation.y -= event.movementX / 500;
    }

    // 处理窗口大小调整
    onWindowResize() {
        const camera = this.player.camera;

        // 更新摄像机的宽高比和投影矩阵
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // 更新渲染器大小
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
export const inputManager = new InputManager();
