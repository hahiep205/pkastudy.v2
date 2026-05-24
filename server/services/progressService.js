const { getProgressByUserId, updateStreak, updateXPAndLevel, getLeaderboard } = require('../models/progressModel');

async function fetchUserProgress(userId) {
  return getProgressByUserId(userId);
}

async function checkAndUpdateStreak(userId) {
  const process = await getProgressByUserId(userId);
  if(!process) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastStudyDate = process.last_study_date ? new Date(process.last_study_date) : null;
  if (lastStudyDate) lastStudyDate.setHours(0, 0, 0, 0);

  let newStreak = process.current_streak;

  if (!lastStudyDate) {
    newStreak = 1;
  } else if (lastStudyDate.getTime() === yesterday.getTime()) {
    newStreak++;
  } else if (lastStudyDate.getTime() < yesterday.getTime()) {
    newStreak = 1;
  } else if (lastStudyDate.getTime() === today.getTime()) {
    // already studied today, streak doesn't change
  }

  // YYYY-MM-DD format for MySQL
  const studyDateStr = new Date().toISOString().slice(0, 10);
  
  if (!lastStudyDate || lastStudyDate.getTime() !== today.getTime()) {
    await updateStreak(userId, newStreak, studyDateStr);
  }
  
  return { streak: newStreak, isUpdated: !lastStudyDate || lastStudyDate.getTime() !== today.getTime() };
}

async function addXpService(userId, xpToAdd) {
  // Update streak when user does an action that awards XP
  await checkAndUpdateStreak(userId);
  return updateXPAndLevel(userId, xpToAdd);
}

async function fetchLeaderboard(limit = 10) {
  return getLeaderboard(limit);
}

module.exports = {
  fetchUserProgress,
  checkAndUpdateStreak,
  addXpService,
  fetchLeaderboard,
};
