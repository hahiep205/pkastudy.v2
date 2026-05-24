const pool = require('../db');

async function getTests() {
  const [rows] = await pool.query('SELECT * FROM Toeic_Tests ORDER BY id ASC');
  return rows;
}

async function getTestById(testId) {
  const [rows] = await pool.query('SELECT * FROM Toeic_Tests WHERE id = ?', [testId]);
  return rows[0] || null;
}

async function getQuestionsByTestId(testId) {
  const [rows] = await pool.query('SELECT * FROM Toeic_Questions WHERE test_id = ? ORDER BY question_number ASC', [testId]);
  return rows;
}

async function getTestGroupsByTestId(testId) {
  const [rows] = await pool.query('SELECT * FROM Toeic_Question_Groups WHERE test_id = ?', [testId]);
  return rows;
}

async function insertTestRecord(userId, testId, readingScore, listeningScore, totalScore) {
  const [result] = await pool.query(
    'INSERT INTO Toeic_Test_Records (user_id, test_id, reading_score, listening_score, total_score) VALUES (?, ?, ?, ?, ?)',
    [userId, testId, readingScore, listeningScore, totalScore]
  );
  return result.insertId;
}

module.exports = {
  getTests,
  getTestById,
  getTestGroupsByTestId,
  getQuestionsByTestId,
  insertTestRecord,
};
