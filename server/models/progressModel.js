const { ensureSupabaseEnabled, unwrapList, unwrapSingle, resolveProfileId } = require('../lib/supabaseData');

async function getProgressByUserId(userId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const row = unwrapSingle(await admin
    .from('user_progress')
    .select('user_id, current_xp, level, current_streak, last_study_date')
    .eq('user_id', profileId)
    .limit(1)
    .maybeSingle());

  return row
    ? {
      userId: row.user_id,
      current_xp: row.current_xp,
      level: row.level,
      current_streak: row.current_streak,
      last_study_date: row.last_study_date,
    }
    : null;
}

async function updateStreak(userId, streak, studyDate) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  unwrapList(await admin
    .from('user_progress')
    .update({
      current_streak: streak,
      last_study_date: studyDate,
    })
    .eq('user_id', profileId)
    .select('id'));
}

async function updateXPAndLevel(userId, xpToAdd) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const row = unwrapSingle(await admin
    .from('user_progress')
    .select('current_xp, level')
    .eq('user_id', profileId)
    .limit(1)
    .maybeSingle());

  if (!row) return null;

  const newXP = row.current_xp + xpToAdd;
  const newLevel = Math.floor(newXP / 1000) + 1;
  const levelUp = newLevel > row.level;

  unwrapList(await admin
    .from('user_progress')
    .update({
      current_xp: newXP,
      level: newLevel,
    })
    .eq('user_id', profileId)
    .select('id'));

  return { newXP, newLevel, levelUp };
}

async function getLeaderboard(limit = 10) {
  const admin = ensureSupabaseEnabled();
  const progressRows = unwrapList(await admin
    .from('user_progress')
    .select('user_id, current_xp, level, current_streak, updated_at')
    .order('current_xp', { ascending: false })
    .limit(limit));

  const profiles = progressRows.length
    ? unwrapList(await admin.from('profiles').select('id, name, legacy_user_id').in('id', progressRows.map((row) => row.user_id)))
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return progressRows.map((row) => ({
    id: profileMap.get(row.user_id)?.legacy_user_id || row.user_id,
    name: profileMap.get(row.user_id)?.name || 'User',
    score: row.current_xp,
    level: row.level,
    current_streak: row.current_streak,
    updated_at: row.updated_at,
  }));
}

module.exports = {
  getProgressByUserId,
  updateStreak,
  updateXPAndLevel,
  getLeaderboard,
};
