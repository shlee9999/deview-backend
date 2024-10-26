const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    id: { type: String, unique: true },
    password: { type: String },
    group: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true } // createdAt, updatedAt 필드 자동 추가
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
