const cors = require('cors');

const corsOptions = {
  origin: [process.env.CLIENT_URL, process.env.CLIENT_PRODUCTION_URL],
  credentials: true,
};

module.exports = cors(corsOptions);
