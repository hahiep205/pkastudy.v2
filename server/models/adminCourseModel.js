const pool = require('../db');
const { CUSTOM_TOPICS_COURSE_SLUG } = require('./customCoursesModel');

async function listAdminCourses({ limit, offset, search }) {
  const whereClauses = ['c.slug <> ?'];
  const whereParams = [CUSTOM_TOPICS_COURSE_SLUG];

  if (search) {
    whereClauses.push('(c.title LIKE ? OR c.slug LIKE ?)');
    const keyword = `%${search}%`;
    whereParams.push(keyword, keyword);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Courses c
     ${whereSql}`,
    whereParams
  );

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.slug,
      c.title,
      c.description,
      c.thumbnail_url AS thumbnailUrl,
      c.language,
      c.sort_order AS sortOrder,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt,
      COUNT(DISTINCT t.id) AS topicCount,
      COUNT(f.id) AS vocabularyCount
    FROM Courses c
    LEFT JOIN Topics t ON t.course_id = c.id
    LEFT JOIN Flashcards f ON f.topic_id = t.id
    ${whereSql}
    GROUP BY
      c.id,
      c.slug,
      c.title,
      c.description,
      c.thumbnail_url,
      c.language,
      c.sort_order,
      c.created_at,
      c.updated_at
    ORDER BY c.sort_order ASC, c.id ASC
    LIMIT ? OFFSET ?`,
    [...whereParams, limit, offset]
  );

  return {
    items: rows.map(mapAdminCourseRow),
    total: Number(countRows[0]?.total || 0),
  };
}

function mapAdminCourseRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl || null,
    language: row.language,
    sortOrder: Number(row.sortOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    topicCount: Number(row.topicCount || 0),
    vocabularyCount: Number(row.vocabularyCount || 0),
  };
}

async function getAdminCourseById(courseId) {
  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.slug,
      c.title,
      c.description,
      c.thumbnail_url AS thumbnailUrl,
      c.language,
      c.sort_order AS sortOrder,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt,
      COUNT(DISTINCT t.id) AS topicCount,
      COUNT(f.id) AS vocabularyCount
    FROM Courses c
    LEFT JOIN Topics t ON t.course_id = c.id
    LEFT JOIN Flashcards f ON f.topic_id = t.id
    WHERE c.id = ?
    GROUP BY
      c.id,
      c.slug,
      c.title,
      c.description,
      c.thumbnail_url,
      c.language,
      c.sort_order,
      c.created_at,
      c.updated_at
    LIMIT 1`,
    [courseId]
  );

  return rows[0] ? mapAdminCourseRow(rows[0]) : null;
}

function mapAdminCourseExportTopicRow(row) {
  return {
    id: row.id,
    courseId: row.courseId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    sortOrder: Number(row.sortOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAdminCourseExportFlashcardRow(row) {
  return {
    id: row.id,
    topicId: row.topicId,
    word: row.word,
    transcription: row.transcription,
    meaning: row.meaning,
    wordType: row.wordType,
    example: row.example,
    exampleVi: row.exampleVi,
    language: row.language || 'en',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getAdminCourseExportById(courseId) {
  const course = await getAdminCourseById(courseId);
  if (!course) return null;

  const [topicRows] = await pool.query(
    `SELECT
      t.id,
      t.course_id AS courseId,
      t.slug,
      t.title,
      t.description,
      t.sort_order AS sortOrder,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt
    FROM Topics t
    WHERE t.course_id = ?
      AND COALESCE(t.is_custom, 0) = 0
    ORDER BY t.sort_order ASC, t.id ASC`,
    [courseId]
  );

  const [flashcardRows] = await pool.query(
    `SELECT
      f.id,
      f.topic_id AS topicId,
      f.word,
      f.transcription,
      f.meaning,
      f.word_type AS wordType,
      f.example,
      f.example_vi AS exampleVi,
      f.language,
      f.created_at AS createdAt,
      f.updated_at AS updatedAt
    FROM Flashcards f
    INNER JOIN Topics t ON t.id = f.topic_id
    WHERE t.course_id = ?
      AND COALESCE(t.is_custom, 0) = 0
    ORDER BY t.sort_order ASC, t.id ASC, f.word ASC, f.id ASC`,
    [courseId]
  );

  return {
    ...course,
    topics: topicRows.map(mapAdminCourseExportTopicRow),
    flashcards: flashcardRows.map(mapAdminCourseExportFlashcardRow),
  };
}

async function getAdminCourseBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT id, slug
     FROM Courses
     WHERE slug = ?
     LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

async function createAdminCourse({ slug, title, description, thumbnailUrl, language, sortOrder }) {
  const [result] = await pool.query(
    `INSERT INTO Courses (slug, title, description, thumbnail_url, language, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [slug, title, description, thumbnailUrl, language, sortOrder]
  );

  return getAdminCourseById(result.insertId);
}

async function updateAdminCourse(courseId, { slug, title, description, thumbnailUrl, language, sortOrder }) {
  const [result] = await pool.query(
    `UPDATE Courses
     SET slug = ?, title = ?, description = ?, thumbnail_url = ?, language = ?, sort_order = ?
     WHERE id = ?`,
    [slug, title, description, thumbnailUrl, language, sortOrder, courseId]
  );

  return result.affectedRows > 0;
}

async function deleteAdminCourse(courseId) {
  const [result] = await pool.query(
    'DELETE FROM Courses WHERE id = ?',
    [courseId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  listAdminCourses,
  getAdminCourseById,
  getAdminCourseExportById,
  getAdminCourseBySlug,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
};
