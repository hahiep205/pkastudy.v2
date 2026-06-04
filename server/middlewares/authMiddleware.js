require('dotenv').config();
const jwt = require('jsonwebtoken');
const { getUserAuthById } = require('../models/userModel');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    const user = await getUserAuthById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.userStatus = user.status;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  authMiddleware,
};
