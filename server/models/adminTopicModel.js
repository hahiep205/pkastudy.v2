const pool = require('../db');

function mapAdminTopicRow(row) {
  return {
    id: row.id,
    courseId: row.courseId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    sortOrder: Number(row.sortOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    vocabularyCount: Number(row.vocabularyCount || 0),
  };
}

async function listAdminTopicsByCourse({ courseId, limit, offset, search }) {
  const whereClauses = ['t.course_id = ?', 'COALESCE(t.is_custom, 0) = 0'];
  const whereParams = [courseId];

  if (search) {
    whereClauses.push('(t.title LIKE ? OR t.slug LIKE ?)');
    const keyword = `%${search}%`;
    whereParams.push(keyword, keyword);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Topics t
     ${whereSql}`,
    whereParams
  );

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.course_id AS courseId,
      t.slug,
      t.title,
      t.description,
      t.sort_order AS sortOrder,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      COUNT(f.id) AS vocabularyCount
    FROM Topics t
    LEFT JOIN Flashcards f ON f.topic_id = t.id
    ${whereSql}
    GROUP BY
      t.id,
      t.course_id,
      t.slug,
      t.title,
      t.description,
      t.sort_order,
      t.created_at,
      t.updated_at
    ORDER BY t.sort_order ASC, t.id ASC
    LIMIT ? OFFSET ?`,
    [...whereParams, limit, offset]
  );

  return {
    items: rows.map(mapAdminTopicRow),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getAdminTopicById(topicId) {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.course_id AS courseId,
      t.slug,
      t.title,
      t.description,
      t.sort_order AS sortOrder,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      COUNT(f.id) AS vocabularyCount
    FROM Topics t
    LEFT JOIN Flashcards f ON f.topic_id = t.id
    WHERE t.id = ?
      AND COALESCE(t.is_custom, 0) = 0
    GROUP BY
      t.id,
      t.course_id,
      t.slug,
      t.title,
      t.description,
      t.sort_order,
      t.created_at,
      t.updated_at
    LIMIT 1`,
    [topicId]
  );

  return rows[0] ? mapAdminTopicRow(rows[0]) : null;
}

async function getAdminTopicBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT id, course_id AS courseId, slug
     FROM Topics
     WHERE slug = ?
       AND COALESCE(is_custom, 0) = 0
     LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

async function countAdminTopicsByCourse(courseId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Topics
     WHERE course_id = ?
       AND COALESCE(is_custom, 0) = 0`,
    [courseId]
  );

  return Number(rows[0]?.total || 0);
}

async function createAdminTopic({ courseId, slug, title, description, sortOrder }) {
  const [result] = await pool.query(
    `INSERT INTO Topics (course_id, slug, title, description, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [courseId, slug, title, description, sortOrder]
  );

  return getAdminTopicById(result.insertId);
}

async function updateAdminTopic(topicId, { slug, title, description, sortOrder }) {
  const [result] = await pool.query(
    `UPDATE Topics
     SET slug = ?, title = ?, description = ?, sort_order = ?
     WHERE id = ?
       AND COALESCE(is_custom, 0) = 0`,
    [slug, title, description, sortOrder, topicId]
  );

  return result.affectedRows > 0;
}

async function deleteAdminTopic(topicId) {
  const [result] = await pool.query(
    `DELETE FROM Topics
     WHERE id = ?
       AND COALESCE(is_custom, 0) = 0`,
    [topicId]
  );

  return result.affectedRows > 0;
}

async function reorderAdminTopics(courseId, items) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const topicIds = items.map((item) => item.id);
    const [rows] = await connection.query(
      `SELECT id
       FROM Topics
       WHERE course_id = ?
         AND COALESCE(is_custom, 0) = 0
         AND id IN (?)`,
      [courseId, topicIds]
    );

    if (rows.length !== items.length) {
      throw Object.assign(new Error('One or more topics were not found in this course'), { status: 404 });
    }

    for (const item of items) {
      await connection.query(
        `UPDATE Topics
         SET sort_order = ?
         WHERE id = ?
           AND course_id = ?
           AND COALESCE(is_custom, 0) = 0`,
        [item.sortOrder, item.id, courseId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.course_id AS courseId,
      t.slug,
      t.title,
      t.description,
      t.sort_order AS sortOrder,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      COUNT(f.id) AS vocabularyCount
    FROM Topics t
    LEFT JOIN Flashcards f ON f.topic_id = t.id
    WHERE t.course_id = ?
      AND COALESCE(t.is_custom, 0) = 0
    GROUP BY
      t.id,
      t.course_id,
      t.slug,
      t.title,
      t.description,
      t.sort_order,
      t.created_at,
      t.updated_at
    ORDER BY t.sort_order ASC, t.id ASC`,
    [courseId]
  );

  return rows.map(mapAdminTopicRow);
}

module.exports = {
  listAdminTopicsByCourse,
  getAdminTopicById,
  getAdminTopicBySlug,
  countAdminTopicsByCourse,
  createAdminTopic,
  updateAdminTopic,
  deleteAdminTopic,
  reorderAdminTopics,
};
