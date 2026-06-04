const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');

async function getUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      password_hash AS passwordHash,
      name,
      role,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM Users
    WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function createUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO Users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
    [email, passwordHash, name, 'user', 'active']
  );
  return {
    id: result.insertId,
    email,
    name,
    role: 'user',
    status: 'active',
  };
}

async function createUserFromGoogle({ email, name }) {
  const randomPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  const [result] = await pool.query(
    'INSERT INTO Users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
    [email, passwordHash, name, 'user', 'active']
  );
  return {
    id: result.insertId,
    email,
    name,
    role: 'user',
    status: 'active',
  };
}

async function getUserAuthById(userId) {
  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      name,
      role,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM Users
    WHERE id = ?
    LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
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
  createUserFromGoogle,
  getUserAuthById,
  createProgressRecordForUser,
};
