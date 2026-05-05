async function getProgressByUserId(userId) {
  // TODO: Replace with a real database query.
  return {
    userId,
    current_xp: 0,
    level: 1,
    current_streak: 0,
  };
}

module.exports = {
  getProgressByUserId,
};
