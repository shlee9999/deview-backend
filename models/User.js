const mongoose = require('mongoose');
const moment = require('moment-timezone');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    userId: { type: String, unique: true },
    password: { type: String },
    group: { type: String },
    refreshToken: { type: String },
    createdAt: {
      type: Date,
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
    updatedAt: {
      type: Date,
      get: (date) =>
        moment(date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// refreshToken을 설정
userSchema.methods.setRefreshToken = function (token) {
  this.refreshToken = token;
};

// refreshToken을 제거 (로그아웃 시 사용)
userSchema.methods.clearRefreshToken = function () {
  this.refreshToken = null;
};

module.exports = mongoose.model('User', userSchema);
