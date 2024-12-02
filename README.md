# The Slinger's Quest: Rise of the Slimes

The basic idea and structure of our code came from the examples provided by [three.js](https://threejs.org/examples/?q=game#games_fps). After extensive modifications (first splitting the base file into an organized structure to improve readability and long-term maintainability, and then adding numerous models and functions), the original code now looks very different. The current outline can be viewed in `control.js`, `stone.js`, and `player.js`.

We also received significant help from Zhou Liangguang's group while implementing `loadAssets.js`. Their contributions helped us address the asynchronous issues of loading assets, and we sincerely thank them for their assistance.

The background image of our game was generated with ChatGPT, and the music was created using [Udio](https://www.udio.com/). We are still using the world map from three.js, while other meshes (including characters, stones, and slimes) were downloaded from [poly.pizza](https://poly.pizza/). The slime dying sound was downloaded from [YouTube](https://www.youtube.com/watch?v=at6p1YTUN74).

We also received assistance from Xu Guowei, who took this course last year, in uploading our game online. You can currently view it at [https://acg-project.github.io/](https://acg-project.github.io/). 

Running our demo locally is very easy. You only need to install three.js and run:

```bash
npx vite
```

in this folder.
