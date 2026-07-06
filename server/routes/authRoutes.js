const express = require('express');
const {
  register,
  login,
  googleLogin,
  sendVerificationCode,
  exchangeSession,
  getCurrentSession,
  startGoogleLogin,
  completeGoogleLogin,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/send-verification', sendVerificationCode);
router.post('/register', register);
router.post('/login', login);
router.get('/google/start', startGoogleLogin);
router.post('/google/complete', completeGoogleLogin);
router.post('/session', exchangeSession);
router.get('/session', authMiddleware, getCurrentSession);
router.post('/google', googleLogin);

module.exports = router;
