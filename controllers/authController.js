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

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

exports.register = async (req, res) => {
  const { username, id, password, group } = req.body;

  try {
    const newUser = new User({ username, id, password, group });
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
    const { id, password } = req.body;
    const user = await User.findOne({ id });

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
      { _id: user._id },
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
      id: user.id,
      username: user.username,
      group: user.group,
    };

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      //! secure: process.env.NODE_ENV === 'production',
      //! sameSite: 'strict',
      sameSite: 'none',
      domain: 'http://localhost:5173',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: '로그인 성공', accessToken, userInfo }); // 200 OK
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
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
      { _id: user._id },
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
      }
    }

    res.clearCookie('refreshToken');

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
