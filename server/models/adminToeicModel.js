const pool = require('../db');
let explanationColumnExistsPromise = null;

async function hasToeicQuestionExplanationColumn() {
  if (!explanationColumnExistsPromise) {
    explanationColumnExistsPromise = pool.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'Toeic_Questions'
         AND COLUMN_NAME = 'explanation'
       LIMIT 1`,
    ).then(([rows]) => rows.length > 0)
      .catch(() => false);
  }

  return explanationColumnExistsPromise;
}

async function getQuestionSelectExplanationSql() {
  return (await hasToeicQuestionExplanationColumn())
    ? 'q.explanation AS explanation,'
    : 'NULL AS explanation,';
}

async function getQuestionInsertConfig() {
  const hasExplanation = await hasToeicQuestionExplanationColumn();

  if (hasExplanation) {
    return {
      columns: 'test_id, group_id, question_number, part, question_text, options, correct_answer, explanation, audio_url, image_url',
      placeholders: '?, ?, ?, ?, ?, ?, ?, ?, ?, ?',
      buildParams: ({ testId, groupId, questionNumber, part, questionText, options, correctAnswer, explanation, audioUrl, imageUrl }) => (
        [testId, groupId, questionNumber, part, questionText, JSON.stringify(options), correctAnswer, explanation, audioUrl, imageUrl]
      ),
    };
  }

  return {
    columns: 'test_id, group_id, question_number, part, question_text, options, correct_answer, audio_url, image_url',
    placeholders: '?, ?, ?, ?, ?, ?, ?, ?, ?',
    buildParams: ({ testId, groupId, questionNumber, part, questionText, options, correctAnswer, audioUrl, imageUrl }) => (
      [testId, groupId, questionNumber, part, questionText, JSON.stringify(options), correctAnswer, audioUrl, imageUrl]
    ),
  };
}

async function getQuestionUpdateConfig() {
  const hasExplanation = await hasToeicQuestionExplanationColumn();

  if (hasExplanation) {
    return {
      setSql: 'group_id = ?, question_number = ?, part = ?, question_text = ?, options = ?, correct_answer = ?, explanation = ?, audio_url = ?, image_url = ?',
      buildParams: ({ groupId, questionNumber, part, questionText, options, correctAnswer, explanation, audioUrl, imageUrl, questionId }) => (
        [groupId, questionNumber, part, questionText, JSON.stringify(options), correctAnswer, explanation, audioUrl, imageUrl, questionId]
      ),
    };
  }

  return {
    setSql: 'group_id = ?, question_number = ?, part = ?, question_text = ?, options = ?, correct_answer = ?, audio_url = ?, image_url = ?',
    buildParams: ({ groupId, questionNumber, part, questionText, options, correctAnswer, audioUrl, imageUrl, questionId }) => (
      [groupId, questionNumber, part, questionText, JSON.stringify(options), correctAnswer, audioUrl, imageUrl, questionId]
    ),
  };
}

function mapToeicTestRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || null,
    createdAt: row.createdAt,
    questionCount: Number(row.questionCount || 0),
    groupCount: Number(row.groupCount || 0),
    partsUsed: Number(row.partsUsed || 0),
  };
}

function mapToeicGroupRow(row) {
  return {
    id: row.id,
    testId: row.testId,
    part: Number(row.part),
    audioUrl: row.audioUrl || null,
    imageUrl: row.imageUrl || null,
    passageText: row.passageText || null,
    questionCount: Number(row.questionCount || 0),
  };
}

function mapToeicQuestionRow(row) {
  let options = row.options;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch {
      options = {};
    }
  }

  return {
    id: row.id,
    testId: row.testId,
    groupId: row.groupId || null,
    questionNumber: Number(row.questionNumber),
    part: Number(row.part),
    questionText: row.questionText || null,
    options: options || {},
    correctAnswer: row.correctAnswer,
    explanation: row.explanation || null,
    audioUrl: row.audioUrl || null,
    imageUrl: row.imageUrl || null,
  };
}

async function listAdminToeicTests({ limit, offset, search }) {
  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push('(t.title LIKE ? OR t.description LIKE ?)');
    const keyword = `%${search}%`;
    params.push(keyword, keyword);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Toeic_Tests t
     ${whereSql}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.title,
      t.description,
      t.created_at AS createdAt,
      COUNT(DISTINCT q.id) AS questionCount,
      COUNT(DISTINCT g.id) AS groupCount,
      COUNT(DISTINCT q.part) AS partsUsed
    FROM Toeic_Tests t
    LEFT JOIN Toeic_Questions q ON q.test_id = t.id
    LEFT JOIN Toeic_Question_Groups g ON g.test_id = t.id
    ${whereSql}
    GROUP BY t.id
    ORDER BY t.id ASC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    items: rows.map(mapToeicTestRow),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getAdminToeicTestById(testId) {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.title,
      t.description,
      t.created_at AS createdAt,
      COUNT(DISTINCT q.id) AS questionCount,
      COUNT(DISTINCT g.id) AS groupCount,
      COUNT(DISTINCT q.part) AS partsUsed
    FROM Toeic_Tests t
    LEFT JOIN Toeic_Questions q ON q.test_id = t.id
    LEFT JOIN Toeic_Question_Groups g ON g.test_id = t.id
    WHERE t.id = ?
    GROUP BY t.id
    LIMIT 1`,
    [testId],
  );

  return rows[0] ? mapToeicTestRow(rows[0]) : null;
}

async function createAdminToeicTest({ title, description }) {
  const [result] = await pool.query(
    'INSERT INTO Toeic_Tests (title, description) VALUES (?, ?)',
    [title, description],
  );

  return getAdminToeicTestById(result.insertId);
}

async function updateAdminToeicTest(testId, { title, description }) {
  await pool.query(
    'UPDATE Toeic_Tests SET title = ?, description = ? WHERE id = ?',
    [title, description, testId],
  );
}

async function deleteAdminToeicTest(testId) {
  const [result] = await pool.query(
    'DELETE FROM Toeic_Tests WHERE id = ?',
    [testId],
  );

  return result.affectedRows > 0;
}

async function listAdminToeicGroupsByTestId(testId) {
  const [rows] = await pool.query(
    `SELECT
      g.id,
      g.test_id AS testId,
      g.part,
      g.audio_url AS audioUrl,
      g.image_url AS imageUrl,
      g.passage_text AS passageText,
      COUNT(q.id) AS questionCount
    FROM Toeic_Question_Groups g
    LEFT JOIN Toeic_Questions q ON q.group_id = g.id
    WHERE g.test_id = ?
    GROUP BY g.id
    ORDER BY g.part ASC, g.id ASC`,
    [testId],
  );

  return rows.map(mapToeicGroupRow);
}

async function getAdminToeicGroupById(groupId) {
  const [rows] = await pool.query(
    `SELECT
      g.id,
      g.test_id AS testId,
      g.part,
      g.audio_url AS audioUrl,
      g.image_url AS imageUrl,
      g.passage_text AS passageText,
      COUNT(q.id) AS questionCount
    FROM Toeic_Question_Groups g
    LEFT JOIN Toeic_Questions q ON q.group_id = g.id
    WHERE g.id = ?
    GROUP BY g.id
    LIMIT 1`,
    [groupId],
  );

  return rows[0] ? mapToeicGroupRow(rows[0]) : null;
}

async function createAdminToeicGroup({ testId, part, audioUrl, imageUrl, passageText }) {
  const [result] = await pool.query(
    `INSERT INTO Toeic_Question_Groups (test_id, part, audio_url, image_url, passage_text)
     VALUES (?, ?, ?, ?, ?)`,
    [testId, part, audioUrl, imageUrl, passageText],
  );

  return getAdminToeicGroupById(result.insertId);
}

async function updateAdminToeicGroup(groupId, { part, audioUrl, imageUrl, passageText }) {
  await pool.query(
    `UPDATE Toeic_Question_Groups
     SET part = ?, audio_url = ?, image_url = ?, passage_text = ?
     WHERE id = ?`,
    [part, audioUrl, imageUrl, passageText, groupId],
  );
}

async function deleteAdminToeicGroup(groupId) {
  const [result] = await pool.query(
    'DELETE FROM Toeic_Question_Groups WHERE id = ?',
    [groupId],
  );

  return result.affectedRows > 0;
}

async function listAdminToeicQuestionsByTestId({ testId, limit, offset, search, part, groupId }) {
  const explanationSql = await getQuestionSelectExplanationSql();
  const whereClauses = ['q.test_id = ?'];
  const params = [testId];

  if (search) {
    whereClauses.push('(q.question_text LIKE ? OR t.title LIKE ?)');
    const keyword = `%${search}%`;
    params.push(keyword, keyword);
  }

  if (part) {
    whereClauses.push('q.part = ?');
    params.push(part);
  }

  if (groupId === null) {
    // no-op
  } else if (groupId === 'ungrouped') {
    whereClauses.push('q.group_id IS NULL');
  } else if (groupId) {
    whereClauses.push('q.group_id = ?');
    params.push(groupId);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Toeic_Questions q
     JOIN Toeic_Tests t ON t.id = q.test_id
     ${whereSql}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT
      q.id,
      q.test_id AS testId,
      q.group_id AS groupId,
      q.question_number AS questionNumber,
      q.part,
      q.question_text AS questionText,
      q.options,
      q.correct_answer AS correctAnswer,
      ${explanationSql}
      q.audio_url AS audioUrl,
      q.image_url AS imageUrl
    FROM Toeic_Questions q
    JOIN Toeic_Tests t ON t.id = q.test_id
    ${whereSql}
    ORDER BY q.question_number ASC, q.id ASC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    items: rows.map(mapToeicQuestionRow),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getAdminToeicQuestionById(questionId) {
  const explanationSql = await getQuestionSelectExplanationSql();
  const [rows] = await pool.query(
    `SELECT
      id,
      test_id AS testId,
      group_id AS groupId,
      question_number AS questionNumber,
      part,
      question_text AS questionText,
      options,
      correct_answer AS correctAnswer,
      ${explanationSql.replaceAll('q.', '')}
      audio_url AS audioUrl,
      image_url AS imageUrl
    FROM Toeic_Questions
    WHERE id = ?
    LIMIT 1`,
    [questionId],
  );

  return rows[0] ? mapToeicQuestionRow(rows[0]) : null;
}

async function createAdminToeicQuestion({
  testId,
  groupId,
  questionNumber,
  part,
  questionText,
  options,
  correctAnswer,
  explanation,
  audioUrl,
  imageUrl,
}) {
  const insertConfig = await getQuestionInsertConfig();
  const [result] = await pool.query(
    `INSERT INTO Toeic_Questions (${insertConfig.columns})
     VALUES (${insertConfig.placeholders})`,
    insertConfig.buildParams({ testId, groupId, questionNumber, part, questionText, options, correctAnswer, explanation, audioUrl, imageUrl }),
  );

  return getAdminToeicQuestionById(result.insertId);
}

async function updateAdminToeicQuestion(
  questionId,
  { groupId, questionNumber, part, questionText, options, correctAnswer, explanation, audioUrl, imageUrl },
) {
  const updateConfig = await getQuestionUpdateConfig();
  await pool.query(
    `UPDATE Toeic_Questions
     SET ${updateConfig.setSql}
     WHERE id = ?`,
    updateConfig.buildParams({ groupId, questionNumber, part, questionText, options, correctAnswer, explanation, audioUrl, imageUrl, questionId }),
  );
}

async function deleteAdminToeicQuestion(questionId) {
  const [result] = await pool.query(
    'DELETE FROM Toeic_Questions WHERE id = ?',
    [questionId],
  );

  return result.affectedRows > 0;
}

async function getMaxToeicQuestionNumber(testId) {
  const [rows] = await pool.query(
    'SELECT COALESCE(MAX(question_number), 0) AS maxQuestionNumber FROM Toeic_Questions WHERE test_id = ?',
    [testId],
  );

  return Number(rows[0]?.maxQuestionNumber || 0);
}

module.exports = {
  getQuestionInsertConfig,
  listAdminToeicTests,
  getAdminToeicTestById,
  createAdminToeicTest,
  updateAdminToeicTest,
  deleteAdminToeicTest,
  listAdminToeicGroupsByTestId,
  getAdminToeicGroupById,
  createAdminToeicGroup,
  updateAdminToeicGroup,
  deleteAdminToeicGroup,
  listAdminToeicQuestionsByTestId,
  getAdminToeicQuestionById,
  createAdminToeicQuestion,
  updateAdminToeicQuestion,
  deleteAdminToeicQuestion,
  getMaxToeicQuestionNumber,
};
