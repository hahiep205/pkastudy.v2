const pool = require('../db');
const { ensureVocabActivityTable } = require('./vocabActivityModel');

function formatDateKey(value) {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortLabel(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

async function getAdminOverviewSummary() {
  await ensureVocabActivityTable();

  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM Users) AS totalUsers,
      (SELECT COUNT(*) FROM User_Progress WHERE last_study_date = CURDATE()) AS activeUsersToday,
      (SELECT COUNT(*) FROM Courses) AS totalCourses,
      (SELECT COUNT(*) FROM Flashcards) AS totalFlashcards,
      (SELECT COUNT(*) FROM Toeic_Tests) AS totalToeicTests,
      (SELECT COUNT(*) FROM Toeic_Questions) AS totalToeicQuestions,
      (SELECT COUNT(*) FROM Toeic_Test_Records) AS totalToeicAttempts,
      (SELECT COUNT(*) FROM SRS_Reviews) AS totalSrsReviews,
      (SELECT COUNT(*) FROM Vocab_Activity_Logs) AS totalVocabModeCompletions`
  );

  const row = rows[0] || {};

  return {
    totalUsers: Number(row.totalUsers || 0),
    activeUsersToday: Number(row.activeUsersToday || 0),
    totalCourses: Number(row.totalCourses || 0),
    totalFlashcards: Number(row.totalFlashcards || 0),
    totalToeicTests: Number(row.totalToeicTests || 0),
    totalToeicQuestions: Number(row.totalToeicQuestions || 0),
    totalToeicAttempts: Number(row.totalToeicAttempts || 0),
    totalSrsReviews: Number(row.totalSrsReviews || 0),
    totalVocabModeCompletions: Number(row.totalVocabModeCompletions || 0),
  };
}

async function getAdminRegistrationSeries(days) {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  const [rows] = await pool.query(
    `SELECT
      DATE(created_at) AS registrationDate,
      COUNT(*) AS registrations
    FROM Users
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY registrationDate ASC`,
    [safeDays - 1]
  );

  const countsByDate = new Map(
    rows.map((row) => [formatDateKey(row.registrationDate), Number(row.registrations || 0)])
  );

  const points = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (safeDays - 1));

  for (let index = 0; index < safeDays; index += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const date = formatDateKey(current);

    points.push({
      date,
      label: formatShortLabel(current),
      count: countsByDate.get(date) || 0,
    });
  }

  const totalRegistrations = points.reduce((sum, point) => sum + point.count, 0);

  return {
    days: safeDays,
    points,
    totalRegistrations,
    range: {
      startDate: points[0]?.date || null,
      endDate: points[points.length - 1]?.date || null,
    },
  };
}

module.exports = {
  getAdminOverviewSummary,
  getAdminRegistrationSeries,
};
