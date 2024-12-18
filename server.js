const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

// 连接到MongoDB数据库
mongoose.connect('mongodb://127.0.0.1:27017/scoreDB', { useNewUrlParser: true, useUnifiedTopology: true });

const scoreSchema = new mongoose.Schema({
  username: String,
  score: Number,
  difficulty: String, // 添加难度字段
  character: String, // 添加角色字段
  totalHits: Number // 添加总命中数字段
});

const Score = mongoose.model('Score', scoreSchema);

app.use(bodyParser.json());
app.use(cors()); // 使用cors中间件

// 上传分数的路由
app.post('/uploadScore', async (req, res) => {
  const { username, score, difficulty, character, totalHits } = req.body;

  const newScore = new Score({ username, score, difficulty, character, totalHits });
  try {
    await newScore.save();
    res.status(200).send('Score uploaded successfully');
  } catch (err) {
    res.status(500).send('Error saving score');
  }
});

// 获取所有分数的路由
app.get('/scores', async (req, res) => {
  try {
    const scores = await Score.find({});
    res.status(200).json(scores);
  } catch (err) {
    res.status(500).send('Error fetching scores');
  }
});

// 清除所有分数的路由
app.post('/clearScores', async (req, res) => {
  const { password } = req.body;
  const PASSWORD = 'sybxwxzhenlihaiya'; // 预定义的密码

  if (password !== PASSWORD) {
    return res.status(403).send('Incorrect password. Scores not cleared.');
  }
  try {
    await Score.deleteMany({});
    res.status(200).send('All scores cleared successfully');
  } catch (err) {
    res.status(500).send('Error clearing scores');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});