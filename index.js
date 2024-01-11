const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT ?? 4030;

app.use(express.static(path.join(process.cwd(), "public"), {
  extensions: ['html', 'htm']
}));

app.listen(port, () => console.log('Frontend server is running'));
