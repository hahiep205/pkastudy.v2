const pool = require('../db');
const CUSTOM_TOPICS_COURSE_SLUG = '__custom_user_topics__';

async function ensureCustomTopicsCourseId() {
  const [existingRows] = await pool.query(
    `SELECT id
     FROM Courses
     WHERE slug = ?
     LIMIT 1`,
    [CUSTOM_TOPICS_COURSE_SLUG]
  );

  if (existingRows[0]?.id) {
    return existingRows[0].id;
  }

  const [sortRows] = await pool.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1000 AS nextSortOrder
     FROM Courses`
  );

  const nextSortOrder = Number(sortRows[0]?.nextSortOrder || 1000);
  const [insertResult] = await pool.query(
    `INSERT INTO Courses (slug, title, description, language, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [
      CUSTOM_TOPICS_COURSE_SLUG,
      'Custom Topics Anchor',
      'System course used internally for user-owned custom topics.',
      'en',
      nextSortOrder,
    ]
  );

  return insertResult.insertId;
}

// ── Custom Topics ──────────────────────────────────────────────────────────

async function getCustomTopicsByUser(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.title, t.description, t.created_at,
            COUNT(f.id) AS word_count
     FROM Topics t
     LEFT JOIN Flashcards f ON f.topic_id = t.id
     WHERE t.user_id = ? AND t.is_custom = 1
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getCustomTopicWithWords(userId, topicId) {
  const [topics] = await pool.query(
    'SELECT * FROM Topics WHERE id = ? AND user_id = ? AND is_custom = 1',
    [topicId, userId]
  );
  if (!topics[0]) return null;

  const [words] = await pool.query(
    `SELECT id, word, transcription, meaning AS mean, word_type AS wordtype,
            example, example_vi, language
     FROM Flashcards WHERE topic_id = ? ORDER BY id ASC`,
    [topicId]
  );
  return { ...topics[0], words };
}

async function createCustomTopic(userId, { title, description, lang }) {
  const customCourseId = await ensureCustomTopicsCourseId();
  const [result] = await pool.query(
    `INSERT INTO Topics (course_id, title, description, user_id, is_custom, sort_order)
     VALUES (?, ?, ?, ?, 1, 0)`,
    [customCourseId, title, description || null, userId]
  );
  return { id: result.insertId, title, description, words: [] };
}

async function updateCustomTopic(userId, topicId, { title, description }) {
  const [result] = await pool.query(
    `UPDATE Topics SET title = ?, description = ?
     WHERE id = ? AND user_id = ? AND is_custom = 1`,
    [title, description || null, topicId, userId]
  );
  return result.affectedRows > 0;
}

async function deleteCustomTopic(userId, topicId) {
  const [result] = await pool.query(
    'DELETE FROM Topics WHERE id = ? AND user_id = ? AND is_custom = 1',
    [topicId, userId]
  );
  return result.affectedRows > 0;
}

// ── Custom Words (Flashcards in custom topics) ─────────────────────────────

async function addWordToCustomTopic(userId, topicId, wordData) {
  // Verify topic belongs to user
  const [topics] = await pool.query(
    'SELECT id FROM Topics WHERE id = ? AND user_id = ? AND is_custom = 1',
    [topicId, userId]
  );
  if (!topics[0]) return null;

  const { word, mean, transcription, wordtype, example, example_vi, language } = wordData;
  const [result] = await pool.query(
    `INSERT INTO Flashcards (topic_id, word, transcription, meaning, word_type, example, example_vi, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [topicId, word, transcription || null, mean, wordtype || null, example || null, example_vi || null, language || 'en']
  );
  return { id: result.insertId, word, mean, transcription, wordtype, example, example_vi, language };
}

async function updateWordInCustomTopic(userId, topicId, wordId, wordData) {
  // Verify topic belongs to user
  const [topics] = await pool.query(
    'SELECT id FROM Topics WHERE id = ? AND user_id = ? AND is_custom = 1',
    [topicId, userId]
  );
  if (!topics[0]) return false;

  const { word, mean, transcription, wordtype, example, example_vi } = wordData;
  const [result] = await pool.query(
    `UPDATE Flashcards SET word = ?, transcription = ?, meaning = ?, word_type = ?, example = ?, example_vi = ?
     WHERE id = ? AND topic_id = ?`,
    [word, transcription || null, mean, wordtype || null, example || null, example_vi || null, wordId, topicId]
  );
  return result.affectedRows > 0;
}

async function deleteWordFromCustomTopic(userId, topicId, wordId) {
  const [topics] = await pool.query(
    'SELECT id FROM Topics WHERE id = ? AND user_id = ? AND is_custom = 1',
    [topicId, userId]
  );
  if (!topics[0]) return false;

  const [result] = await pool.query(
    'DELETE FROM Flashcards WHERE id = ? AND topic_id = ?',
    [wordId, topicId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  CUSTOM_TOPICS_COURSE_SLUG,
  getCustomTopicsByUser,
  getCustomTopicWithWords,
  createCustomTopic,
  updateCustomTopic,
  deleteCustomTopic,
  addWordToCustomTopic,
  updateWordInCustomTopic,
  deleteWordFromCustomTopic,
};
