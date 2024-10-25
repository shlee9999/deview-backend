require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 5000;

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB 연결 성공'))
  .catch((err) => console.error('MongoDB 연결 실패:', err));

const userSchema = new mongoose.Schema({
  username: String,
  id: String,
  password: String,
  group: String,
});

const User = mongoose.model('User', userSchema);

let corsOptions = {
  origin: ['http://localhost:5173'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json('welcome to DEVIEW server');
});

app.post('/register', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: '사용자 등록 성공' });
  } catch (error) {
    res.status(400).json({ message: '사용자 등록 실패', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
