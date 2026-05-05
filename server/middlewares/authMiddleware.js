function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  // TODO: Replace with JWT validation and actual user lookup
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.userId = 'placeholder-user-id';
  next();
}

module.exports = {
  authMiddleware,
};
