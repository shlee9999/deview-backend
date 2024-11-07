// process.env.TZ = 'Asia/Seoul';
require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./config/database');
const setupMiddlewares = require('./middleware');
const setupRoutes = require('./routes');
const { port } = require('./config/server');
const { configureSocket } = require('./config/socket'); // Socket 설정 파일 불러오기

const app = express();
const server = http.createServer(app);

// 데이터베이스 연결
connectDB(process.env.MONGODB_URI);

// 미들웨어 설정
setupMiddlewares(app);

// 라우트 설정
setupRoutes(app);

// Socket.IO 설정 추가
const io = configureSocket(server); // 서버에 Socket.IO 설정 적용

// io 객체를 전역적으로 사용할 수 있도록 설정
app.set('io', io);

// 서버 실행
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
