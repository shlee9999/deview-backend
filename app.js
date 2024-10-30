require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/database');
const setupMiddlewares = require('./middleware');
const setupRoutes = require('./routes');
const { port } = require('./config/server');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://localhost:5173'], // 두 프로토콜 모두 허용
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 데이터베이스 연결
connectDB(process.env.MONGODB_URI);

// 미들웨어 설정
setupMiddlewares(app);

// 라우트 설정
setupRoutes(app);

// 웹소켓 연결 이벤트 처리
io.on('connection', (socket) => {
  console.log('클라이언트가 연결되었습니다.');

  // 클라이언트로부터 메시지 수신
  socket.on('message', (data) => {
    console.log('클라이언트로부터 메시지를 받았습니다:', data);
    // 받은 메시지 처리 로직 작성
    // ...
    // 클라이언트에게 응답 메시지 전송
    socket.emit('message', { text: '서버에서 응답 메시지를 보냅니다.' });
  });

  // 연결 종료 이벤트 처리
  socket.on('disconnect', () => {
    console.log('클라이언트와의 연결이 종료되었습니다.');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
