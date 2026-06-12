const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');
const { ensureVocabActivityTable } = require('./vocabActivityModel');

const DEFAULT_ADMIN_EMAIL = 'admin@pkastudy.local';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_NAME = 'Admin';
const DEFAULT_ADMIN_LOGIN_ALIAS = 'admin';
const DEFAULT_DEMO_EMAIL = 'user@pkastudy.local';
const DEFAULT_DEMO_PASSWORD = 'user';
const DEFAULT_DEMO_NAME = 'User Test';
const DEFAULT_DEMO_LOGIN_ALIAS = 'user';
const CUSTOM_TOPICS_COURSE_SLUG = '__custom_user_topics__';

async function getUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      password_hash AS passwordHash,
      name,
      role,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM Users
    WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function getUserByLoginIdentifier(identifier) {
  const normalized = typeof identifier === 'string' ? identifier.trim() : '';
  if (!normalized) return null;

  if (normalized.toLowerCase() === DEFAULT_ADMIN_LOGIN_ALIAS) {
    return getUserByEmail(DEFAULT_ADMIN_EMAIL);
  }

  if (normalized.toLowerCase() === DEFAULT_DEMO_LOGIN_ALIAS) {
    return getUserByEmail(DEFAULT_DEMO_EMAIL);
  }

  return getUserByEmail(normalized);
}

async function createUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO Users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
    [email, passwordHash, name, 'user', 'active']
  );
  return {
    id: result.insertId,
    email,
    name,
    role: 'user',
    status: 'active',
  };
}

async function createUserFromGoogle({ email, name }) {
  const randomPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  const [result] = await pool.query(
    'INSERT INTO Users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
    [email, passwordHash, name, 'user', 'active']
  );
  return {
    id: result.insertId,
    email,
    name,
    role: 'user',
    status: 'active',
  };
}

async function getUserAuthById(userId) {
  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      name,
      role,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM Users
    WHERE id = ?
    LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function createProgressRecordForUser(userId) {
  await pool.query(
    'INSERT INTO User_Progress (user_id, current_xp, level, current_streak, last_study_date) SELECT ?, 0, 1, 0, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM User_Progress WHERE user_id = ?)',
    [userId, userId]
  );
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureCustomTopicsAnchorCourse(connection) {
  const [existingRows] = await connection.query(
    `SELECT id
     FROM Courses
     WHERE slug = ?
     LIMIT 1`,
    [CUSTOM_TOPICS_COURSE_SLUG]
  );

  if (existingRows[0]?.id) {
    return existingRows[0].id;
  }

  const [sortRows] = await connection.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1000 AS nextSortOrder
     FROM Courses`
  );

  const nextSortOrder = Number(sortRows[0]?.nextSortOrder || 1000);
  const [insertResult] = await connection.query(
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

async function seedDemoUserData(userId) {
  await ensureVocabActivityTable();

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const hasWordProgressTable = await tableExists(connection, 'User_Word_Progress');
    const hasTopicsUserId = await columnExists(connection, 'Topics', 'user_id');
    const hasTopicsIsCustom = await columnExists(connection, 'Topics', 'is_custom');

    await connection.query(
      `UPDATE User_Progress
       SET current_xp = ?, level = ?, current_streak = ?, last_study_date = CURDATE()
       WHERE user_id = ?`,
      [1280, 8, 6, userId]
    );

    await connection.query('DELETE FROM Toeic_Test_Records WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM SRS_Reviews WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM Vocab_Activity_Logs WHERE user_id = ?', [userId]);

    if (hasWordProgressTable) {
      await connection.query('DELETE FROM User_Word_Progress WHERE user_id = ?', [userId]);
    }

    if (hasTopicsUserId && hasTopicsIsCustom) {
      await connection.query(
        'DELETE FROM Topics WHERE user_id = ? AND is_custom = 1',
        [userId]
      );
    }

    let customTopicFlashcards = [];
    if (hasTopicsUserId && hasTopicsIsCustom) {
      const customCourseId = await ensureCustomTopicsAnchorCourse(connection);
      const [topicResult] = await connection.query(
        `INSERT INTO Topics (course_id, title, description, user_id, is_custom, sort_order)
         VALUES (?, ?, ?, ?, 1, 0)`,
        [
          customCourseId,
          'QA Demo Personal Pack',
          'Bộ từ mẫu để test nhanh các chức năng tài liệu cá nhân, AI, import/export và game.',
          userId,
        ]
      );

      const customWords = [
        ['deadline', "/'dedlaɪn/", 'thời hạn', 'noun', 'The deadline is this Friday.', 'Hạn chót là thứ Sáu tuần này.'],
        ['reschedule', "/ˌriːˈʃedjuːl/", 'dời lịch', 'verb', 'We need to reschedule the meeting.', 'Chúng ta cần dời lịch cuộc họp.'],
        ['inventory', "/ˈɪnvəntri/", 'hàng tồn kho', 'noun', 'The inventory count was accurate.', 'Bản kiểm kê hàng tồn kho rất chính xác.'],
        ['confirm', "/kənˈfɜːrm/", 'xác nhận', 'verb', 'Please confirm your attendance.', 'Vui lòng xác nhận việc tham dự của bạn.'],
        ['proposal', "/prəˈpoʊzəl/", 'đề xuất', 'noun', 'Her proposal impressed the client.', 'Đề xuất của cô ấy gây ấn tượng với khách hàng.'],
        ['efficient', "/ɪˈfɪʃənt/", 'hiệu quả', 'adjective', 'This workflow is more efficient.', 'Quy trình làm việc này hiệu quả hơn.'],
      ];

      for (const [word, transcription, meaning, wordType, example, exampleVi] of customWords) {
        const [flashcardResult] = await connection.query(
          `INSERT INTO Flashcards (topic_id, word, transcription, meaning, word_type, example, example_vi, language)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'en')`,
          [topicResult.insertId, word, transcription, meaning, wordType, example, exampleVi]
        );
        customTopicFlashcards.push(flashcardResult.insertId);
      }
    }

    const [builtInFlashcards] = await connection.query(
      `SELECT f.id
       FROM Flashcards f
       JOIN Topics t ON t.id = f.topic_id
       JOIN Courses c ON c.id = t.course_id
       WHERE c.slug <> ?
       ORDER BY c.sort_order ASC, t.sort_order ASC, f.id ASC
       LIMIT 24`,
      [CUSTOM_TOPICS_COURSE_SLUG]
    );

    const flashcardIds = builtInFlashcards.map((row) => row.id);
    const srsPool = flashcardIds.length > 0 ? flashcardIds : customTopicFlashcards;
    const rememberedPool = flashcardIds.slice(0, 12).concat(customTopicFlashcards.slice(0, 3));

    if (hasWordProgressTable && rememberedPool.length > 0) {
      const rememberedValues = rememberedPool.map((flashcardId) => [userId, flashcardId, 1]);
      await connection.query(
        `INSERT INTO User_Word_Progress (user_id, flashcard_id, is_remembered)
         VALUES ?
         ON DUPLICATE KEY UPDATE is_remembered = VALUES(is_remembered), updated_at = NOW()`,
        [rememberedValues]
      );
    }

    if (srsPool.length > 0) {
      const dueReviewValues = srsPool.slice(0, 8).map((flashcardId, index) => [
        userId,
        flashcardId,
        Math.max(1, index + 1),
        index < 3 ? 1.9 : 2.35,
        index < 4 ? 1 : 2 + (index % 3),
        `DATE_SUB(CURDATE(), INTERVAL ${index % 3} DAY)`,
        `DATE_SUB(NOW(), INTERVAL ${index + 1} DAY)`,
        index % 2,
      ]);

      const futureReviewValues = srsPool.slice(8, 12).map((flashcardId, index) => [
        userId,
        flashcardId,
        4 + index,
        2.5,
        3 + index,
        `DATE_ADD(CURDATE(), INTERVAL ${index + 1} DAY)`,
        `DATE_SUB(NOW(), INTERVAL ${index + 2} DAY)`,
        0,
      ]);

      const allReviewValues = dueReviewValues.concat(futureReviewValues);
      if (allReviewValues.length > 0) {
        const finalSql = `
          INSERT INTO SRS_Reviews (
            user_id,
            flashcard_id,
            interval_days,
            ef,
            repetition,
            next_review_date,
            last_reviewed_at,
            fail_count
          ) VALUES ${allReviewValues
            .map(([, , , , , nextReviewExpr, lastReviewedExpr]) => {
              const nextSql = nextReviewExpr.startsWith('DATE_') ? nextReviewExpr : '?';
              const lastSql = lastReviewedExpr.startsWith('DATE_') ? lastReviewedExpr : '?';
              return `(?, ?, ?, ?, ?, ${nextSql}, ${lastSql}, ?)`;
            })
            .join(', ')}
        `;

        const finalParams = [];
        allReviewValues.forEach(([seedUserId, flashcardId, intervalDays, ef, repetition, nextReviewExpr, lastReviewedExpr, failCount]) => {
          finalParams.push(seedUserId, flashcardId, intervalDays, ef, repetition);
          if (!nextReviewExpr.startsWith('DATE_')) finalParams.push(nextReviewExpr);
          if (!lastReviewedExpr.startsWith('DATE_')) finalParams.push(lastReviewedExpr);
          finalParams.push(failCount);
        });

        await connection.query(finalSql, finalParams);
      }
    }

    const [toeicTests] = await connection.query(
      `SELECT id
       FROM Toeic_Tests
       ORDER BY id ASC
       LIMIT 3`
    );

    if (toeicTests.length > 0) {
      const historySql = toeicTests
        .map((testRow, index) => `(
          ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ${14 - (index * 5)} DAY)
        )`)
        .join(', ');

      const historyParams = [];
      toeicTests.forEach((testRow, index) => {
        const listening = 280 + index * 35;
        const reading = 260 + index * 40;
        historyParams.push(userId, testRow.id, reading, listening, reading + listening);
      });

      await connection.query(
        `INSERT INTO Toeic_Test_Records (
          user_id,
          test_id,
          reading_score,
          listening_score,
          total_score,
          created_at
        ) VALUES ${historySql}`,
        historyParams
      );
    }

    const vocabLogs = [
      ['flashcard', 'DATE_SUB(NOW(), INTERVAL 5 DAY)'],
      ['quiz', 'DATE_SUB(NOW(), INTERVAL 4 DAY)'],
      ['listen', 'DATE_SUB(NOW(), INTERVAL 3 DAY)'],
      ['typing', 'DATE_SUB(NOW(), INTERVAL 2 DAY)'],
      ['match', 'DATE_SUB(NOW(), INTERVAL 1 DAY)'],
      ['flappy-bird', 'NOW()'],
      ['flashcard', 'NOW()'],
      ['quiz', 'NOW()'],
    ];

    await connection.query(
      `INSERT INTO Vocab_Activity_Logs (user_id, mode, created_at)
       VALUES ${vocabLogs.map(([, createdAt]) => `(?, ?, ${createdAt})`).join(', ')}`,
      vocabLogs.flatMap(([mode]) => [userId, mode])
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function ensureDefaultAdminUser() {
  const existingUser = await getUserByEmail(DEFAULT_ADMIN_EMAIL);

  if (existingUser) {
    await createProgressRecordForUser(existingUser.id);
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const [result] = await pool.query(
    `INSERT INTO Users (email, password_hash, name, role, status)
     VALUES (?, ?, ?, 'admin', 'active')`,
    [DEFAULT_ADMIN_EMAIL, passwordHash, DEFAULT_ADMIN_NAME]
  );

  await createProgressRecordForUser(result.insertId);

  return {
    id: result.insertId,
    email: DEFAULT_ADMIN_EMAIL,
    name: DEFAULT_ADMIN_NAME,
    role: 'admin',
    status: 'active',
  };
}

async function ensureDefaultDemoUser() {
  const existingUser = await getUserByEmail(DEFAULT_DEMO_EMAIL);
  const passwordHash = await bcrypt.hash(DEFAULT_DEMO_PASSWORD, 10);

  if (existingUser) {
    await pool.query(
      `UPDATE Users
       SET password_hash = ?, name = ?, role = 'user', status = 'active'
       WHERE id = ?`,
      [passwordHash, DEFAULT_DEMO_NAME, existingUser.id]
    );
    await createProgressRecordForUser(existingUser.id);
    await seedDemoUserData(existingUser.id);
    return {
      ...existingUser,
      name: DEFAULT_DEMO_NAME,
      role: 'user',
      status: 'active',
    };
  }

  const [result] = await pool.query(
    `INSERT INTO Users (email, password_hash, name, role, status)
     VALUES (?, ?, ?, 'user', 'active')`,
    [DEFAULT_DEMO_EMAIL, passwordHash, DEFAULT_DEMO_NAME]
  );

  await createProgressRecordForUser(result.insertId);
  await seedDemoUserData(result.insertId);

  return {
    id: result.insertId,
    email: DEFAULT_DEMO_EMAIL,
    name: DEFAULT_DEMO_NAME,
    role: 'user',
    status: 'active',
  };
}

module.exports = {
  getUserByEmail,
  getUserByLoginIdentifier,
  createUser,
  createUserFromGoogle,
  getUserAuthById,
  createProgressRecordForUser,
  ensureDefaultAdminUser,
  ensureDefaultDemoUser,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_LOGIN_ALIAS,
  DEFAULT_DEMO_EMAIL,
  DEFAULT_DEMO_PASSWORD,
  DEFAULT_DEMO_LOGIN_ALIAS,
};
