const socketIO = require('socket.io');

let adminSocketIds = []; // 관리자 소켓 ID를 저장할 전역 변수
const userSocketMap = new Map();

const configureSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: [process.env.CLIENT_URL, process.env.CLIENT_PRODUCTION_URL],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('클라이언트가 연결되었습니다.');

    // 관리자 연결 처리
    socket.on('adminConnect', () => {
      adminSocketIds.push(socket.id);
      console.log('관리자가 연결되었습니다. 소켓 ID:', adminSocketIds);
      socket.emit('adminConnected', { success: true });
    });

    socket.on('message', (data) => {
      console.log('클라이언트로부터 메시지를 받았습니다:', data);

      // 관리자에게 메시지 전달 예시
      adminSocketIds.forEach((adminSocketId) =>
        io.to(adminSocketId).emit('adminMessage', data)
      );

      socket.emit('message', { text: '서버에서 응답 메시지를 보냅니다.' });
    });

    socket.on('disconnect', () => {
      if (adminSocketIds.includes(socket.id)) {
        console.log('관리자 연결이 해제되었습니다.');
        adminSocketIds = adminSocketIds.filter((id) => id !== socket.id);
      }

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

// 관리자 소켓 ID를 가져오는 함수
const getAdminSocketIds = () => adminSocketIds;

module.exports = { configureSocket, userSocketMap, getAdminSocketIds };
