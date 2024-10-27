const express = require('express');
const cookieParser = require('cookie-parser');
const corsMiddleware = require('./corsMiddleware');

module.exports = (app) => {
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
};
