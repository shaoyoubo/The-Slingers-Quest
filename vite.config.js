import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // 主页面入口
        game: 'game.html',  // 游戏页面入口
      },
    },
  },
});

