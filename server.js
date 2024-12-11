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
  score: Number
});

const Score = mongoose.model('Score', scoreSchema);

app.use(bodyParser.json());
app.use(cors()); // 使用cors中间件

// 上传分数的路由
app.post('/uploadScore', async (req, res) => {
  const { username, score } = req.body;

  const newScore = new Score({ username, score });
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