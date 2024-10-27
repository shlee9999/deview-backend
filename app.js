require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const setupMiddlewares = require('./middleware');
const setupRoutes = require('./routes');
const { port } = require('./config/server');

const app = express();

// 데이터베이스 연결
connectDB(process.env.MONGODB_URI);

// 미들웨어 설정
setupMiddlewares(app);

// 라우트 설정
setupRoutes(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
