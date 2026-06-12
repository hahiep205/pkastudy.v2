const pool = require('../db');

async function getDueReviewsByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
      r.id AS reviewId,
      r.user_id AS userId,
      r.flashcard_id AS flashcardId,
      r.interval_days AS \`interval\`,
      r.ef,
      r.repetition,
      r.next_review_date AS nextReviewDate,
      r.last_reviewed_at AS lastReviewedAt,
      r.created_at AS reviewCreatedAt,
      r.updated_at AS reviewUpdatedAt,
      f.id AS flashcardDbId,
      COALESCE(f.external_id, CAST(f.id AS CHAR)) AS id,
      f.topic_id AS topicId,
      f.word,
      f.transcription,
      f.meaning AS mean,
      f.word_type AS wordtype,
      f.example,
      f.example_vi AS example_vi,
      f.language,
      f.created_at AS flashcardCreatedAt,
      f.updated_at AS flashcardUpdatedAt
    FROM SRS_Reviews r
    JOIN Flashcards f ON f.id = r.flashcard_id
    WHERE r.user_id = ?
      AND r.next_review_date <= CURDATE()
    ORDER BY r.next_review_date ASC, r.id ASC`,
    [userId]
  );

  return rows;
}

async function getReviewQueueByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
      r.id AS reviewId,
      r.user_id AS userId,
      r.flashcard_id AS flashcardId,
      r.interval_days AS \`interval\`,
      r.ef,
      r.repetition,
      r.next_review_date AS nextReviewDate,
      r.last_reviewed_at AS lastReviewedAt,
      r.created_at AS reviewCreatedAt,
      r.updated_at AS reviewUpdatedAt,
      f.id AS flashcardDbId,
      COALESCE(f.external_id, CAST(f.id AS CHAR)) AS id,
      f.topic_id AS topicId,
      f.word,
      f.transcription,
      f.meaning AS mean,
      f.word_type AS wordtype,
      f.example,
      f.example_vi AS example_vi,
      f.language,
      f.created_at AS flashcardCreatedAt,
      f.updated_at AS flashcardUpdatedAt
    FROM SRS_Reviews r
    JOIN Flashcards f ON f.id = r.flashcard_id
    WHERE r.user_id = ?
    ORDER BY r.next_review_date ASC, r.id ASC`,
    [userId]
  );

  return rows;
}

async function getFlashcardsByIds(flashcardIds, db = pool) {
  if (!flashcardIds.length) return [];

  const [rows] = await db.query(
    `SELECT
      f.id,
      f.topic_id AS topicId,
      COALESCE(f.external_id, CAST(f.id AS CHAR)) AS publicId,
      f.word,
      f.transcription,
      f.meaning AS mean,
      f.word_type AS wordtype,
      f.example,
      f.example_vi AS example_vi,
      f.language
    FROM Flashcards f
    WHERE f.id IN (?)`,
    [flashcardIds]
  );

  return rows;
}

async function getReviewsByUserIdAndFlashcardIds(userId, flashcardIds, db = pool) {
  if (!flashcardIds.length) return [];

  const [rows] = await db.query(
    `SELECT
      r.id AS reviewId,
      r.flashcard_id AS flashcardId,
      r.interval_days AS \`interval\`,
      r.ef,
      r.repetition,
      r.next_review_date AS nextReviewDate,
      r.last_reviewed_at AS lastReviewedAt
    FROM SRS_Reviews r
    WHERE r.user_id = ?
      AND r.flashcard_id IN (?)`,
    [userId, flashcardIds]
  );

  return rows;
}

async function getReviewsByUserIdAndFlashcardIdsForUpdate(userId, flashcardIds, db = pool) {
  if (!flashcardIds.length) return [];

  const [rows] = await db.query(
    `SELECT
      r.id AS reviewId,
      r.flashcard_id AS flashcardId,
      r.interval_days AS \`interval\`,
      r.ef,
      r.repetition,
      r.next_review_date AS nextReviewDate,
      r.last_reviewed_at AS lastReviewedAt
    FROM SRS_Reviews r
    WHERE r.user_id = ?
      AND r.flashcard_id IN (?)
    FOR UPDATE`,
    [userId, flashcardIds]
  );

  return rows;
}

async function upsertReviews(reviewRows, db = pool) {
  if (!reviewRows.length) return;

  const values = reviewRows.map((row) => [
    row.userId,
    row.flashcardId,
    row.interval,
    row.ef,
    row.repetition,
    row.nextReviewDate,
    row.lastReviewedAt,
  ]);

  await db.query(
    `INSERT INTO SRS_Reviews (
      user_id,
      flashcard_id,
      interval_days,
      ef,
      repetition,
      next_review_date,
      last_reviewed_at
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      interval_days = VALUES(interval_days),
      ef = VALUES(ef),
      repetition = VALUES(repetition),
      next_review_date = VALUES(next_review_date),
      last_reviewed_at = VALUES(last_reviewed_at)`,
    [values]
  );
}

module.exports = {
  getDueReviewsByUserId,
  getReviewQueueByUserId,
  getFlashcardsByIds,
  getReviewsByUserIdAndFlashcardIds,
  getReviewsByUserIdAndFlashcardIdsForUpdate,
  upsertReviews,
};
