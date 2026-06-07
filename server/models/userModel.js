const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');

const DEFAULT_ADMIN_EMAIL = 'admin@pkastudy.local';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_NAME = 'Admin';
const DEFAULT_ADMIN_LOGIN_ALIAS = 'admin';

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

async function getUserByLoginIdentifier(identifier) {
  const normalized = typeof identifier === 'string' ? identifier.trim() : '';
  if (!normalized) return null;

  if (normalized.toLowerCase() === DEFAULT_ADMIN_LOGIN_ALIAS) {
    return getUserByEmail(DEFAULT_ADMIN_EMAIL);
  }

  return getUserByEmail(normalized);
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

async function ensureDefaultAdminUser() {
  const existingUser = await getUserByEmail(DEFAULT_ADMIN_EMAIL);

  if (existingUser) {
    await createProgressRecordForUser(existingUser.id);
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const [result] = await pool.query(
    `INSERT INTO Users (email, password_hash, name, role, status)
     VALUES (?, ?, ?, 'admin', 'active')`,
    [DEFAULT_ADMIN_EMAIL, passwordHash, DEFAULT_ADMIN_NAME]
  );

  await createProgressRecordForUser(result.insertId);

  return {
    id: result.insertId,
    email: DEFAULT_ADMIN_EMAIL,
    name: DEFAULT_ADMIN_NAME,
    role: 'admin',
    status: 'active',
  };
}

module.exports = {
  getUserByEmail,
  getUserByLoginIdentifier,
  createUser,
  createUserFromGoogle,
  getUserAuthById,
  createProgressRecordForUser,
  ensureDefaultAdminUser,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_LOGIN_ALIAS,
};
