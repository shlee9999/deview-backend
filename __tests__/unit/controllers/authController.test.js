const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app'); // Express 앱 파일 경로
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Controller', () => {
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        id: 'testid',
        password: 'testpassword',
        group: 'testgroup',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('사용자 등록 성공');
    });

    it('should return 409 if user already exists', async () => {
      await User.create({
        username: 'testuser',
        id: 'testid',
        password: 'testpassword',
        group: 'testgroup',
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        id: 'testid',
        password: 'testpassword',
        group: 'testgroup',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe(
        '해당 ID는 이미 존재합니다. 다른 ID를 입력해주세요.'
      );
    });
  });

  describe('POST /login', () => {
    it('should login successfully', async () => {
      const user = new User({
        username: 'testuser',
        id: 'testid',
        password: await bcrypt.hash('testpassword', 10),
        group: 'testgroup',
      });
      await user.save();

      const res = await request(app).post('/api/auth/login').send({
        id: 'testid',
        password: 'testpassword',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('로그인 성공');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('userInfo');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        id: 'wrongid',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe(
        '아이디 또는 비밀번호가 일치하지 않습니다.'
      );
    });
  });

  describe('GET /user', () => {
    it('should return user information', async () => {
      const user = new User({
        username: 'testuser',
        id: 'testid',
        password: 'testpassword',
        group: 'testgroup',
      });
      await user.save();

      const token = jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET
      );

      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('id', 'testid');
      expect(res.body).toHaveProperty('group', 'testgroup');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('refreshToken');
    });
  });

  // 나머지 컨트롤러 함수들에 대한 테스트도 유사한 방식으로 작성할 수 있습니다.
});
