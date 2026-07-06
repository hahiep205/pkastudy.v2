const { ensureSupabaseEnabled, unwrapList } = require('../lib/supabaseData');
const { CUSTOM_TOPICS_COURSE_SLUG } = require('./customCoursesModel');

function formatDateKey(value) {
  return String(value).slice(0, 10);
}

function formatShortLabel(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

async function getAdminOverviewSummary() {
  const admin = ensureSupabaseEnabled();
  const [
    profiles,
    userProgress,
    courses,
    topics,
    flashcards,
    toeicTests,
    toeicQuestions,
    toeicAttempts,
    srsReviews,
    vocabActivityLogs,
  ] = await Promise.all([
    admin.from('profiles').select('id'),
    admin.from('user_progress').select('user_id, last_study_date'),
    admin.from('courses').select('id, slug'),
    admin.from('topics').select('id, course_id, owner_user_id'),
    admin.from('flashcards').select('id, topic_id'),
    admin.from('toeic_tests').select('id'),
    admin.from('toeic_questions').select('id'),
    admin.from('toeic_test_records').select('id, user_id, created_at'),
    admin.from('srs_reviews').select('id, user_id, last_reviewed_at, created_at'),
    admin.from('vocab_activity_logs').select('id, user_id, created_at'),
  ]);

  const profileRows = unwrapList(profiles);
  const progressRows = unwrapList(userProgress);
  const courseRows = unwrapList(courses);
  const topicRows = unwrapList(topics);
  const flashcardRows = unwrapList(flashcards);
  const toeicAttemptRows = unwrapList(toeicAttempts);
  const srsReviewRows = unwrapList(srsReviews);
  const vocabRows = unwrapList(vocabActivityLogs);

  const today = new Date().toISOString().slice(0, 10);
  const activeUsers = new Set();
  progressRows.forEach((row) => {
    if (row.last_study_date === today) activeUsers.add(row.user_id);
  });
  toeicAttemptRows.forEach((row) => {
    if (formatDateKey(row.created_at) === today) activeUsers.add(row.user_id);
  });
  srsReviewRows.forEach((row) => {
    if (formatDateKey(row.last_reviewed_at || row.created_at) === today) activeUsers.add(row.user_id);
  });
  vocabRows.forEach((row) => {
    if (formatDateKey(row.created_at) === today) activeUsers.add(row.user_id);
  });

  const publicCourseIds = new Set(courseRows.filter((row) => row.slug !== CUSTOM_TOPICS_COURSE_SLUG).map((row) => row.id));
  const publicTopicIds = new Set(topicRows.filter((row) => publicCourseIds.has(row.course_id) && !row.owner_user_id).map((row) => row.id));

  return {
    totalUsers: profileRows.length,
    activeUsersToday: activeUsers.size,
    totalCourses: publicCourseIds.size,
    totalFlashcards: flashcardRows.filter((row) => publicTopicIds.has(row.topic_id)).length,
    totalToeicTests: unwrapList(toeicTests).length,
    totalToeicQuestions: unwrapList(toeicQuestions).length,
    totalToeicAttempts: toeicAttemptRows.length,
    totalSrsReviews: srsReviewRows.length,
    totalVocabModeCompletions: vocabRows.length,
  };
}

async function getAdminRegistrationSeries(days) {
  const admin = ensureSupabaseEnabled();
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (safeDays - 1));

  const rows = unwrapList(await admin
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString()));

  const countsByDate = new Map();
  rows.forEach((row) => {
    const key = formatDateKey(row.created_at);
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
  });

  const points = [];
  for (let index = 0; index < safeDays; index += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const date = formatDateKey(current.toISOString());
    points.push({
      date,
      label: formatShortLabel(current),
      count: countsByDate.get(date) || 0,
    });
  }

  return {
    days: safeDays,
    points,
    totalRegistrations: points.reduce((sum, point) => sum + point.count, 0),
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
