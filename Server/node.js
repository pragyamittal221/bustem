const express = require('express');
const app = express();
const path = require('path');

const PORT = 1096;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Simulated Cryptojacking Website running at http://localhost:${PORT}`);
});