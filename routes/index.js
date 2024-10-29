const authRoutes = require('./authRoutes');
const postRoutes = require('./postRoutes');
const commentRoutes = require('./commentRoutes');
const userRoutes = require('./userRoutes');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.json('welcome to DEVIEW server');
  });

  app.use('/auth', authRoutes);
  app.use('/post', postRoutes);
  app.use('/comment', commentRoutes);
  app.use('/user', userRoutes);
};
