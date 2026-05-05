const { fetchUserProgress } = require('../services/progressService');

async function getProgress(req, res, next) {
  try {
    const progress = await fetchUserProgress(req.userId);
    res.json({ data: progress });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProgress,
};
