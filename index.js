const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const port = process.env.PORT ?? 4030;

app.use(cors());

app.use(express.static(path.join(process.cwd(), "public"), {
  extensions: ['html', 'htm']
}));

app.listen(port, () => console.log('Frontend server is running'));
