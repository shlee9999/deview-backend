const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { username, id, password, group } = req.body;

  try {
    const newUser = new User({ username, id, password, group });
    await newUser.save();
    res.status(201).json({ message: '사용자 등록 성공' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
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
    const { id, password } = req.body;
    const user = await User.findOne({ id });

    if (!user) {
      return res
        .status(401)
        .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '30s',
      }
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: '7d',
      }
    );

    // 리프레시 토큰을 사용자 문서에 저장
    user.setRefreshToken(refreshToken);
    await user.save();

    const userInfo = {
      id: user.id,
      username: user.username,
      group: user.group,
    };

    // 리프레시 토큰을 HTTP-only 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 쿠키 전송 (배포 환경)
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(200).json({ message: '로그인 성공', accessToken, userInfo });
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded._id, refreshToken });

    if (!user) {
      return res
        .status(403)
        .json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }

    const newAccessToken = jwt.sign(
      { _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res
      .status(403)
      .json({ message: '리프레시 토큰 갱신 실패', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // 데이터베이스에서 리프레시 토큰 제거
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.clearRefreshToken();
        await user.save();
      }
    }

    // 클라이언트의 리프레시 토큰 쿠키 삭제
    res.clearCookie('refreshToken');

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: '로그아웃 실패', error: error.message });
  }
};
