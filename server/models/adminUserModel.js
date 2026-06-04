const pool = require('../db');
const ROOT_ADMIN_ID = 1;

async function ensureRootAdminUser() {
  await pool.query(
    `UPDATE Users
     SET role = 'admin', status = 'active'
     WHERE id = ?`,
    [ROOT_ADMIN_ID]
  );
}

async function listAdminUsers({ limit, offset, search, role, status }) {
  await ensureRootAdminUser();

  const whereClauses = [];
  const whereParams = [];

  if (search) {
    whereClauses.push('(u.email LIKE ? OR u.name LIKE ?)');
    const keyword = `%${search}%`;
    whereParams.push(keyword, keyword);
  }

  if (role) {
    whereClauses.push('u.role = ?');
    whereParams.push(role);
  }

  if (status) {
    whereClauses.push('u.status = ?');
    whereParams.push(status);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Users u
     ${whereSql}`,
    whereParams
  );

  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.status,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      p.current_xp AS currentXp,
      p.level,
      p.current_streak AS currentStreak,
      p.last_study_date AS lastStudyDate
    FROM Users u
    LEFT JOIN User_Progress p ON p.user_id = u.id
    ${whereSql}
    ORDER BY u.id ASC, u.created_at ASC
    LIMIT ? OFFSET ?`,
    [...whereParams, limit, offset]
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      currentXp: Number(row.currentXp || 0),
      level: Number(row.level || 1),
      currentStreak: Number(row.currentStreak || 0),
      lastStudyDate: row.lastStudyDate || null,
    })),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getAdminUserById(userId) {
  await ensureRootAdminUser();

  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.status,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      p.current_xp AS currentXp,
      p.level,
      p.current_streak AS currentStreak,
      p.last_study_date AS lastStudyDate
    FROM Users u
    LEFT JOIN User_Progress p ON p.user_id = u.id
    WHERE u.id = ?
    LIMIT 1`,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    currentXp: Number(row.currentXp || 0),
    level: Number(row.level || 1),
    currentStreak: Number(row.currentStreak || 0),
    lastStudyDate: row.lastStudyDate || null,
  };
}

async function updateAdminUserRole(userId, role) {
  const [result] = await pool.query(
    'UPDATE Users SET role = ? WHERE id = ?',
    [role, userId]
  );

  return result.affectedRows > 0;
}

async function updateAdminUserStatus(userId, status) {
  const [result] = await pool.query(
    'UPDATE Users SET status = ? WHERE id = ?',
    [status, userId]
  );

  return result.affectedRows > 0;
}

async function countAdmins({ status } = {}) {
  const params = [];
  let statusSql = '';

  if (status) {
    statusSql = 'AND status = ?';
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Users
     WHERE role = 'admin'
     ${statusSql}`,
    params
  );

  return Number(rows[0]?.total || 0);
}

module.exports = {
  ROOT_ADMIN_ID,
  ensureRootAdminUser,
  listAdminUsers,
  getAdminUserById,
  updateAdminUserRole,
  updateAdminUserStatus,
  countAdmins,
};
