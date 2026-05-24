const express = require('express');
const { getTests, getTest, submitTestAnswers, getPracticeModes } = require('../controllers/toeicController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/tests', getTests);
router.get('/practice-modes', getPracticeModes);
router.get('/tests/:test_id', getTest);
router.post('/submit', authMiddleware, submitTestAnswers);

module.exports = router;
