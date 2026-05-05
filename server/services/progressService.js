const { getProgressByUserId } = require('../models/progressModel');

async function fetchUserProgress(userId) {
  return getProgressByUserId(userId);
}

module.exports = {
  fetchUserProgress,
};
