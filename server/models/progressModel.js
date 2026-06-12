const pool = require('../db');

async function getProgressByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT user_id AS userId, current_xp, level, current_streak, last_study_date FROM User_Progress WHERE user_id = ?',
    [userId]
  );

  return rows[0] || null;
}

async function updateStreak(userId, streak, studyDate) {
  await pool.query(
    'UPDATE User_Progress SET current_streak = ?, last_study_date = ? WHERE user_id = ?', 
    [streak, studyDate, userId]
  );
}

async function updateXPAndLevel(userId, xpToAdd) {
  const [rows] = await pool.query('SELECT current_xp, level FROM User_Progress WHERE user_id = ?', [userId]);
  if (!rows[0]) return null;
  
  const newXP = rows[0].current_xp + xpToAdd;
  const newLevel = Math.floor(newXP / 1000) + 1;
  const levelUp = newLevel > rows[0].level;
  
  await pool.query('UPDATE User_Progress SET current_xp = ?, level = ? WHERE user_id = ?', [newXP, newLevel, userId]);
  
  return { newXP, newLevel, levelUp };
}

async function getLeaderboard(limit = 10) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, p.current_xp AS score, p.level, p.current_streak, p.updated_at
     FROM User_Progress p
     JOIN Users u ON p.user_id = u.id
     ORDER BY p.current_xp DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  getProgressByUserId,
  updateStreak,
  updateXPAndLevel,
  getLeaderboard,
};
