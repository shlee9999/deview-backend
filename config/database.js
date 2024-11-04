const { createAdminAccount } = require('../controllers/authController');
const mongoose = require('mongoose');

const connectDB = async (MONGODB_URI) => {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('MongoDB 연결 성공');
    await createAdminAccount();
  } catch (err) {
    console.error('MongoDB 연결 실패:', err);
  }
};

module.exports = connectDB;
