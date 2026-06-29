const express = require('express');
const router = express.Router();
const { parseJob } = require('../controllers/parserController');

router.post('/parse', parseJob);

module.exports = router;