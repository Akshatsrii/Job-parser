const express = require('express');
const cors = require('cors');
const parserRoutes = require('./routes/parserRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', parserRoutes);

module.exports = app;