const cors = require('cors');

const corsOptions = {
  origin: ['https://localhost:5173'],
  credentials: true,
};

module.exports = cors(corsOptions);
