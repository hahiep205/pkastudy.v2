const pool = require('../db');

/**
 * Get all "remembered" flashcard IDs for a user.
 * Returns an object like { 12: true, 34: true } (only remembered ones).
 */
async function getWordProgressByUser(userId) {
  const [rows] = await pool.query(
    'SELECT flashcard_id FROM User_Word_Progress WHERE user_id = ? AND is_remembered = 1',
    [userId]
  );
  const result = {};
  rows.forEach(row => { result[row.flashcard_id] = true; });
  return result;
}

/**
 * Batch upsert: receive array of { flashcard_id, is_remembered }
 * Efficiently update multiple words at once.
 */
async function batchUpdateWordProgress(userId, updates) {
  if (!updates || updates.length === 0) return;

  // Build bulk INSERT ... ON DUPLICATE KEY UPDATE
  const values = updates.map(u => [userId, u.flashcard_id, u.is_remembered ? 1 : 0]);
  await pool.query(
    `INSERT INTO User_Word_Progress (user_id, flashcard_id, is_remembered)
     VALUES ?
     ON DUPLICATE KEY UPDATE is_remembered = VALUES(is_remembered), updated_at = NOW()`,
    [values]
  );
}

/**
 * Toggle a single word's remembered state.
 */
async function toggleWordProgress(userId, flashcardId, isRemembered) {
  await pool.query(
    `INSERT INTO User_Word_Progress (user_id, flashcard_id, is_remembered)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_remembered = ?, updated_at = NOW()`,
    [userId, flashcardId, isRemembered ? 1 : 0, isRemembered ? 1 : 0]
  );
}

module.exports = {
  getWordProgressByUser,
  batchUpdateWordProgress,
  toggleWordProgress,
};
