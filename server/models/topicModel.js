const pool = require('../db');

async function getTopicBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.slug,
      t.course_id AS courseId,
      t.title,
      t.description,
      t.sort_order AS sortOrder,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt
    FROM Topics t
    WHERE t.slug = ?
    LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

async function getFlashcardsByTopicId(topicId) {
  const [rows] = await pool.query(
    `SELECT
      f.id AS flashcardId,
      COALESCE(f.external_id, CAST(f.id AS CHAR)) AS id,
      f.word,
      f.transcription,
      f.meaning AS mean,
      f.word_type AS wordtype,
      f.example,
      f.example_vi AS example_vi,
      f.language
    FROM Flashcards f
    WHERE f.topic_id = ?
    ORDER BY f.id ASC`,
    [topicId]
  );

  return rows;
}

module.exports = {
  getTopicBySlug,
  getFlashcardsByTopicId,
};
