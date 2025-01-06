# The Slinger's Quest: Rise of the Slimes

The basic idea and structure of our code came from the examples provided by [three.js](https://threejs.org/examples/?q=game#games_fps). After extensive modifications (first splitting the base file into an organized structure to improve readability and long-term maintainability, and then adding numerous models and functions), the original code now looks very different. The current outline can be viewed in `control.js`, `stone.js`, and `player.js`.

We also received significant help from Zhou Liangguang's group while implementing `loadAssets.js`. Their contributions helped us address the asynchronous issues of loading assets, and we sincerely thank them for their assistance.

The background image of our game was generated with ChatGPT, and the music was created using [Udio](https://www.udio.com/). We are still using the world map from three.js, while other meshes (including characters, stones, and slimes) were downloaded from [poly.pizza](https://poly.pizza/). The slime dying sound was downloaded from [YouTube](https://www.youtube.com/watch?v=at6p1YTUN74).

We also received assistance from Xu Guowei, who took this course last year, in uploading our game online. You can currently view it at [https://acg-project.github.io/](https://acg-project.github.io/). 




## Steps to Set Up the Game Locally

If you want to set up the environment to run the game on your local machine, you can follow the steps below.

### Step 1: Clone the Repository
Clone the repository from GitHub using the following command:
```bash
git clone git@github.com:shaoyoubo/The-Slingers-Quest.git
```

### Step 2: Install Dependencies
Navigate to the project folder and install the necessary dependencies by running:
```bash
npm install
```

### Step 3: Run the Game
Run the game locally by executing the following command:
```bash
npm vite
```
The game will be available at [http://localhost:5173/](http://localhost:5173/).

---

### Running the Game with a Database

To run the game with the database, follow these additional steps:

### Step 4: Start the Server
1. Make sure you have **MongoDB** installed on your machine.  
2. Start the Express server by running:
   ```bash
   node server.js
   ```

3. Use **ngrok** to expose the local server to the internet. Install ngrok if you don't have it already, and then run:
   ```bash
   ngrok http 3000
   ```

4. Copy the generated ngrok URL and replace the constant variable `SERVER_URL` in the following files:
   - `index.html`
   - `control.js`

5. After making the changes, rerun the game:
   ```bash
   npm vite
   ```
   The game with database functionality will be available at [http://localhost:5173/](http://localhost:5173/).

---

## Notes
- Make sure all dependencies are installed and your MongoDB server is running for the database functionality to work properly.
- If you encounter issues with ports, you can configure the port in your Vite or Express server settings.

Enjoy the adventure!😊