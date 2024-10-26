require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');

//Middlewares
const corsMiddleware = require('./middleware/corsMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const port = 5000;

connectDB(process.env.MONGODB_URI);

app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json('welcome to DEVIEW server');
});

app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
