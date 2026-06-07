const pool = require('../db');

let vocabActivityTableReadyPromise = null;

const ALLOWED_VOCAB_ACTIVITY_MODES = new Set([
  'flashcard',
  'quiz',
  'listen',
  'typing',
  'match',
  'flappy-bird',
]);

function ensureVocabActivityTable() {
  if (!vocabActivityTableReadyPromise) {
    vocabActivityTableReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS Vocab_Activity_Logs (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        mode VARCHAR(32) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_vocab_activity_user
          FOREIGN KEY (user_id) REFERENCES Users(id)
          ON DELETE CASCADE,
        INDEX idx_vocab_activity_user_created (user_id, created_at),
        INDEX idx_vocab_activity_mode_created (mode, created_at)
      )
    `);
  }

  return vocabActivityTableReadyPromise;
}

function normalizeVocabActivityMode(mode) {
  const normalized = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return ALLOWED_VOCAB_ACTIVITY_MODES.has(normalized) ? normalized : '';
}

async function createVocabActivityLog(userId, mode) {
  await ensureVocabActivityTable();

  const normalizedMode = normalizeVocabActivityMode(mode);
  if (!normalizedMode) {
    return null;
  }

  const [result] = await pool.query(
    `INSERT INTO Vocab_Activity_Logs (user_id, mode)
     VALUES (?, ?)`,
    [userId, normalizedMode]
  );

  return {
    id: result.insertId,
    userId,
    mode: normalizedMode,
  };
}

module.exports = {
  ensureVocabActivityTable,
  normalizeVocabActivityMode,
  createVocabActivityLog,
  ALLOWED_VOCAB_ACTIVITY_MODES,
};
