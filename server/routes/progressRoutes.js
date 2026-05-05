const express = require('express');
const { getProgress } = require('../controllers/progressController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getProgress);

module.exports = router;
