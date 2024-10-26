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
      res.status(400).json({
        message: '해당 ID는 이미 존재합니다. 다른 ID를 입력해주세요.',
        error: error.message,
      });
    }
    res.status(500).json({ message: '사용자 등록 실패', error: error.message });
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

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET); //! expire 되지 않는 임시 토큰
    // const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    //   expiresIn: '24h',
    // });

    const userInfo = {
      id: user.id,
      username: user.username,
      group: user.group,
    };

    res.status(200).json({ message: '로그인 성공', token, userInfo });
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};
