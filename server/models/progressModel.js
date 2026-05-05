const pool = require('../db');

async function getProgressByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT user_id AS userId, current_xp, level, current_streak FROM User_Progress WHERE user_id = ?',
    [userId]
  );

  return rows[0] || null;
}

module.exports = {
  getProgressByUserId,
};
