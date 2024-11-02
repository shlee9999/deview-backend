const socketIO = require('socket.io');

const userSocketMap = new Map();
const configureSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: [process.env.CLIENT_URL, process.env.CLIENT_PRODUCTION_URL],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

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
      // 모든 유저에 대해 해당 소켓이 있으면 제거
      for (const [userId, sockets] of userSocketMap.entries()) {
        const updatedSockets = sockets.filter((id) => id !== socket.id);

        if (updatedSockets.length > 0) {
          userSocketMap.set(userId, updatedSockets);
        } else {
          userSocketMap.delete(userId);
        }

        console.log(
          `유저 ${userId}의 소켓 ${socket.id}이 연결 해제되었습니다.`
        );
      }
    });
  });

  return io;
};

module.exports = { configureSocket, userSocketMap };
