const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

let corsOptions = {
  origin: ['http://localhost:5173'],
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.json('welcome to DEVIEW server');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
