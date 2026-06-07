const pool = require('../db');

let supportTableReadyPromise = null;

function ensureSupportTable() {
  if (!supportTableReadyPromise) {
    supportTableReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS Support_Tickets (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('gop-y', 'bao-loi') NOT NULL DEFAULT 'gop-y',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status ENUM('pending', 'agreed', 'rejected') NOT NULL DEFAULT 'pending',
        reviewer_id INT NULL,
        source_page VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        CONSTRAINT fk_support_user
          FOREIGN KEY (user_id) REFERENCES Users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_support_reviewer
          FOREIGN KEY (reviewer_id) REFERENCES Users(id)
          ON DELETE SET NULL,
        INDEX idx_support_status_created (status, created_at),
        INDEX idx_support_user_created (user_id, created_at)
      )
    `);
  }

  return supportTableReadyPromise;
}

async function createSupportTicket({ userId, type, title, content, sourcePage }) {
  await ensureSupportTable();

  const [result] = await pool.query(
    `INSERT INTO Support_Tickets (user_id, type, title, content, source_page)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, content, sourcePage || null]
  );

  return result.insertId;
}

async function listSupportTickets({ search, status, type, limit, offset }) {
  await ensureSupportTable();

  const whereClauses = [];
  const params = [];

  if (search) {
    const keyword = `%${search}%`;
    whereClauses.push('(s.title LIKE ? OR s.content LIKE ? OR u.email LIKE ? OR u.name LIKE ?)');
    params.push(keyword, keyword, keyword, keyword);
  }

  if (status) {
    whereClauses.push('s.status = ?');
    params.push(status);
  }

  if (type) {
    whereClauses.push('s.type = ?');
    params.push(type);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Support_Tickets s
     INNER JOIN Users u ON u.id = s.user_id
     ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      s.id,
      s.user_id AS userId,
      s.type,
      s.title,
      s.content,
      s.status,
      s.source_page AS sourcePage,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      s.reviewed_at AS reviewedAt,
      u.name AS userName,
      u.email AS userEmail,
      reviewer.name AS reviewerName,
      reviewer.email AS reviewerEmail
    FROM Support_Tickets s
    INNER JOIN Users u ON u.id = s.user_id
    LEFT JOIN Users reviewer ON reviewer.id = s.reviewer_id
    ${whereSql}
    ORDER BY
      CASE s.status
        WHEN 'pending' THEN 0
        WHEN 'agreed' THEN 1
        ELSE 2
      END,
      s.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      content: row.content,
      status: row.status,
      sourcePage: row.sourcePage || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      reviewedAt: row.reviewedAt,
      userName: row.userName,
      userEmail: row.userEmail,
      reviewerName: row.reviewerName || null,
      reviewerEmail: row.reviewerEmail || null,
    })),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getSupportTicketById(ticketId) {
  await ensureSupportTable();

  const [rows] = await pool.query(
    `SELECT
      s.id,
      s.user_id AS userId,
      s.type,
      s.title,
      s.content,
      s.status,
      s.source_page AS sourcePage,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      s.reviewed_at AS reviewedAt,
      u.name AS userName,
      u.email AS userEmail,
      reviewer.name AS reviewerName,
      reviewer.email AS reviewerEmail
    FROM Support_Tickets s
    INNER JOIN Users u ON u.id = s.user_id
    LEFT JOIN Users reviewer ON reviewer.id = s.reviewer_id
    WHERE s.id = ?
    LIMIT 1`,
    [ticketId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    content: row.content,
    status: row.status,
    sourcePage: row.sourcePage || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
    userName: row.userName,
    userEmail: row.userEmail,
    reviewerName: row.reviewerName || null,
    reviewerEmail: row.reviewerEmail || null,
  };
}

async function updateSupportTicketStatus({ ticketId, status, reviewerId }) {
  await ensureSupportTable();

  const [result] = await pool.query(
    `UPDATE Support_Tickets
     SET status = ?,
         reviewer_id = ?,
         reviewed_at = CASE WHEN ? = 'pending' THEN NULL ELSE CURRENT_TIMESTAMP END
     WHERE id = ?`,
    [status, reviewerId, status, ticketId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  ensureSupportTable,
  createSupportTicket,
  listSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
};
