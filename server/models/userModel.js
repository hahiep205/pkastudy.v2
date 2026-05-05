const bcrypt = require('bcryptjs');
const pool = require('../db');

async function getUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, email, password_hash AS passwordHash, name FROM Users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function createUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO Users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );
  return {
    id: result.insertId,
    email,
    name,
  };
}

async function createProgressRecordForUser(userId) {
  await pool.query(
    'INSERT INTO User_Progress (user_id, current_xp, level, current_streak, last_study_date) SELECT ?, 0, 1, 0, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM User_Progress WHERE user_id = ?)',
    [userId, userId]
  );
}

module.exports = {
  getUserByEmail,
  createUser,
  createProgressRecordForUser,
};
