const { userSocketMap } = require('../config/socket');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.user = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken') // 민감한 정보 제외
      .lean(); // 성능 최적화

    if (!user) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    const userInfo = {
      userId: user.userId,
      username: user.username,
      group: user.group,
      role: user.role,
    };
    res.status(200).json(userInfo);
  } catch (error) {
    res.status(500).json({
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

exports.register = async (req, res) => {
  const { username, userId, password, group } = req.body;

  try {
    const newUser = new User({ username, userId, password, group });
    await newUser.save();
    res.status(201).json({ message: '사용자 등록 성공' }); // 201 Created
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        // 409 Conflict
        message: '해당 ID는 이미 존재합니다. 다른 ID를 입력해주세요.',
        error: error.message,
      });
    }
    return res
      .status(500)
      .json({ message: '사용자 등록 실패', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { userId, password, socketId } = req.body;
    const user = await User.findOne({ userId });

    if (!user) {
      return res
        .status(401)
        .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' }); // 401 Unauthorized
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' }); // 401 Unauthorized
    }

    const accessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    user.setRefreshToken(refreshToken);
    await user.save();

    const userInfo = {
      userId: user.userId,
      username: user.username,
      group: user.group,
      role: user.role,
    };

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 유저 ID와 소켓 ID 매핑
    if (userSocketMap.has(user.id)) {
      userSocketMap.get(user.id).push(socketId);
    } else {
      userSocketMap.set(user.id, [socketId]);
    }

    res.status(200).json({ message: '로그인 성공', accessToken, userInfo }); // 200 OK
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};

exports.autoLogin = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // 쿠키에서 리프레시 토큰 가져오기

    if (!refreshToken) {
      return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
    }

    // 리프레시 토큰 검증
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: '유효하지 않은 리프레시 토큰입니다.' });
        }

        // 유저 정보 가져오기
        const user = await User.findById(decoded._id)
          .select('-password -refreshToken')
          .lean();
        if (!user) {
          return res
            .status(404)
            .json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 새로운 액세스 토큰 발급
        const accessToken = jwt.sign(
          { _id: user._id, role: user.role },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' }
        );
        // 소켓 ID와 유저 ID 매핑
        const socketId = req.body.socketId;
        if (userSocketMap.has(user._id.toString())) {
          userSocketMap.get(user._id.toString()).push(socketId);
        } else {
          userSocketMap.set(user._id.toString(), [socketId]);
        }

        console.log(
          `유저 ${user._id}가 자동 로그인되었습니다. Socket ID: ${socketId}`
        );

        const userInfo = {
          userId: user.userId,
          username: user.username,
          group: user.group,
          role: user.role,
        };

        // 응답으로 유저 정보와 새로운 액세스 토큰 반환
        res.status(200).json({
          accessToken,
          userInfo,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      message: '자동 로그인 실패',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: '리프레시 토큰이 없습니다.' }); // 401 Unauthorized
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded._id, refreshToken });

    if (!user) {
      return res
        .status(403)
        .json({ message: '유효하지 않은 리프레시 토큰입니다.' }); // 403 Forbidden
    }

    const newAccessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken: newAccessToken }); // 200 OK
  } catch (error) {
    res
      .status(403)
      .json({ message: '리프레시 토큰 갱신 실패', error: error.message }); // 403 Forbidden
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.clearRefreshToken();
        await user.save();

        // 유저의 소켓 ID 목록에서 해당 소켓 ID 제거
        const userId = user._id.toString(); // 유저 ID 가져오기
        if (userSocketMap.has(userId)) {
          // 해당 유저의 모든 소켓 ID 제거
          userSocketMap.delete(userId);
          console.log(`유저 ${userId}의 모든 소켓이 로그아웃되었습니다.`);
        }
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(204).json(); // 204 No Content
  } catch (error) {
    res.status(500).json({ message: '로그아웃 실패', error: error.message });
  }
};

exports.checkPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.status(200).json({ message: '비밀번호가 일치합니다.' });
  } catch (error) {
    res.status(500).json({
      message: '비밀번호 확인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, username, group } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    if (password) {
      user.password = password;
    }

    if (username) {
      user.username = username;
    }

    if (group) {
      user.group = group;
    }

    await user.save();

    res
      .status(200)
      .json({ message: '사용자 정보가 성공적으로 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({
      message: '사용자 정보 업데이트 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

exports.createAdminAccount = async () => {
  try {
    // 기존 관리자 계정 확인
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      // 관리자 계정 생성
      const newAdmin = new User({
        username: '관리자',
        userId: 'admin', // 고유한 userId 설정
        password: 'admin123', // 초기 비밀번호, 나중에 변경 권장
        group: '관리자',
        role: 'admin',
      });

      await newAdmin.save();
      console.log('관리자 계정이 성공적으로 생성되었습니다.');
      console.log('보안을 위해 로그인 후 비밀번호를 변경해주세요.');
    } else {
      console.log('관리자 계정이 이미 존재합니다.');
    }
  } catch (error) {
    console.error('관리자 계정 생성 중 오류 발생:', error);
  }
};
