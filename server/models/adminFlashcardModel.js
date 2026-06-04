const pool = require('../db');

function mapAdminFlashcardRow(row) {
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

async function listAdminFlashcardsByTopic({ topicId, search }) {
  const whereClauses = ['f.topic_id = ?', 'COALESCE(t.is_custom, 0) = 0'];
  const params = [topicId];

  if (search) {
    const keyword = `%${search}%`;
    whereClauses.push('(f.word LIKE ? OR f.meaning LIKE ? OR COALESCE(f.word_type, \'\') LIKE ?)');
    params.push(keyword, keyword, keyword);
  }

  const [rows] = await pool.query(
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
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY f.word ASC, f.id ASC`,
    params
  );

  return rows.map(mapAdminFlashcardRow);
}

async function getAdminFlashcardById(flashcardId) {
  const [rows] = await pool.query(
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
    WHERE f.id = ?
      AND COALESCE(t.is_custom, 0) = 0
    LIMIT 1`,
    [flashcardId]
  );

  return rows[0] ? mapAdminFlashcardRow(rows[0]) : null;
}

async function getAdminFlashcardByTopicAndWord(topicId, word) {
  const [rows] = await pool.query(
    `SELECT f.id, f.topic_id AS topicId, f.word
     FROM Flashcards f
     INNER JOIN Topics t ON t.id = f.topic_id
     WHERE f.topic_id = ?
       AND LOWER(f.word) = LOWER(?)
       AND COALESCE(t.is_custom, 0) = 0
     LIMIT 1`,
    [topicId, word]
  );

  return rows[0] || null;
}

async function createAdminFlashcard({ topicId, word, transcription, meaning, wordType, example, exampleVi, language }) {
  const [result] = await pool.query(
    `INSERT INTO Flashcards (topic_id, word, transcription, meaning, word_type, example, example_vi, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [topicId, word, transcription, meaning, wordType, example, exampleVi, language]
  );

  return getAdminFlashcardById(result.insertId);
}

async function updateAdminFlashcard(flashcardId, { word, transcription, meaning, wordType, example, exampleVi, language }) {
  const [result] = await pool.query(
    `UPDATE Flashcards
     SET word = ?, transcription = ?, meaning = ?, word_type = ?, example = ?, example_vi = ?, language = ?
     WHERE id = ?`,
    [word, transcription, meaning, wordType, example, exampleVi, language, flashcardId]
  );

  return result.affectedRows > 0;
}

async function deleteAdminFlashcard(flashcardId) {
  const [result] = await pool.query(
    `DELETE f
     FROM Flashcards f
     INNER JOIN Topics t ON t.id = f.topic_id
     WHERE f.id = ?
       AND COALESCE(t.is_custom, 0) = 0`,
    [flashcardId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  listAdminFlashcardsByTopic,
  getAdminFlashcardById,
  getAdminFlashcardByTopicAndWord,
  createAdminFlashcard,
  updateAdminFlashcard,
  deleteAdminFlashcard,
};
