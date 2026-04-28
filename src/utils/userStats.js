const STATS_STORAGE_KEY = 'pka_user_stats_v1';
const REMEMBERED_STORAGE_KEY = 'pka_remembered';
const MAX_HISTORY_DAYS = 90;

function pad(value) {
    return String(value).padStart(2, '0');
}

function getTodayKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getWeekdayLabel(dateKey) {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' });
}

function getStorageMap() {
    try {
        return JSON.parse(localStorage.getItem(STATS_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveStorageMap(data) {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data));
}

function getRememberedCount() {
    try {
        const remembered = JSON.parse(localStorage.getItem(REMEMBERED_STORAGE_KEY)) || {};
        return Object.keys(remembered).filter((key) => remembered[key]).length;
    } catch {
        return 0;
    }
}

function createEmptyStats() {
    return {
        days: {},
        updatedAt: null,
    };
}

function normalizeStats(stats) {
    const safe = stats && typeof stats === 'object' ? stats : {};
    return {
        days: safe.days && typeof safe.days === 'object' ? safe.days : {},
        updatedAt: typeof safe.updatedAt === 'string' ? safe.updatedAt : null,
    };
}

function pruneDays(days) {
    const sortedKeys = Object.keys(days).sort();
    if (sortedKeys.length <= MAX_HISTORY_DAYS) return days;

    const keepKeys = new Set(sortedKeys.slice(-MAX_HISTORY_DAYS));
    return Object.fromEntries(Object.entries(days).filter(([key]) => keepKeys.has(key)));
}

function getDaysArray(stats) {
    return Object.values(stats.days)
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date));
}

function getDayStats(stats, dateKey) {
    return stats.days[dateKey] || {
        date: dateKey,
        dailyXp: 0,
        learnedWords: 0,
        rememberedTotal: 0,
        totalXp: 0,
        streak: 0,
        tasksCompleted: 0,
        taskTarget: 0,
        updatedAt: null,
    };
}

export function recordUserStatsSnapshot(userKey = 'guest', progress, options = {}) {
    if (!progress) return null;

    const map = getStorageMap();
    const currentStats = normalizeStats(map[userKey] || createEmptyStats());
    const dateKey = typeof progress.currentDate === 'string' ? progress.currentDate : getTodayKey();
    const existingDay = getDayStats(currentStats, dateKey);
    const rememberedTotal = Number.isFinite(options.rememberedTotal) ? options.rememberedTotal : getRememberedCount();
    const tasksCompleted = Array.isArray(progress.tasks) ? progress.tasks.filter((task) => task.isDone).length : 0;
    const taskTarget = Array.isArray(progress.tasks) ? progress.tasks.length : 0;

    const nextDay = {
        ...existingDay,
        date: dateKey,
        dailyXp: Number.isFinite(progress.dailyXp) ? progress.dailyXp : existingDay.dailyXp,
        learnedWords: Array.isArray(progress.learnedWordEventIdsToday)
            ? progress.learnedWordEventIdsToday.length
            : (Array.isArray(progress.learnedWordIdsToday) ? progress.learnedWordIdsToday.length : existingDay.learnedWords),
        rememberedTotal,
        totalXp: Number.isFinite(progress.totalXp) ? progress.totalXp : existingDay.totalXp,
        streak: Number.isFinite(progress.streak) ? progress.streak : existingDay.streak,
        tasksCompleted,
        taskTarget,
        updatedAt: new Date().toISOString(),
    };

    const nextStats = {
        ...currentStats,
        days: pruneDays({
            ...currentStats.days,
            [dateKey]: nextDay,
        }),
        updatedAt: nextDay.updatedAt,
    };

    map[userKey] = nextStats;
    saveStorageMap(map);
    return nextStats;
}

export function readUserStats(userKey = 'guest') {
    const map = getStorageMap();
    const stats = normalizeStats(map[userKey] || createEmptyStats());

    map[userKey] = stats;
    saveStorageMap(map);
    return stats;
}

export function buildActivityChartData(userKey = 'guest', period = 'week') {
    const stats = readUserStats(userKey);
    const today = new Date();

    if (period === 'month') {
        const buckets = [];

        for (let offset = 3; offset >= 0; offset -= 1) {
            const end = new Date(today);
            end.setDate(today.getDate() - offset * 7);

            const start = new Date(end);
            start.setDate(end.getDate() - 6);

            buckets.push({ start, end });
        }

        const labels = buckets.map((bucket) => {
            const startLabel = bucket.start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const endLabel = bucket.end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            return `${startLabel}-${endLabel}`;
        });

        const xp = [];
        const words = [];

        buckets.forEach((bucket) => {
            let bucketXp = 0;
            let bucketWords = 0;

            getDaysArray(stats).forEach((day) => {
                const dayDate = new Date(`${day.date}T00:00:00`);
                if (dayDate >= bucket.start && dayDate <= bucket.end) {
                    bucketXp += day.dailyXp || 0;
                    bucketWords += day.learnedWords || 0;
                }
            });

            xp.push(bucketXp);
            words.push(bucketWords);
        });

        const totalXp = xp.reduce((sum, value) => sum + value, 0);
        const totalWords = words.reduce((sum, value) => sum + value, 0);

        return {
            labels,
            xp,
            words,
            totalXp,
            totalWords,
            peakXp: Math.max(...xp, 0),
            peakWords: Math.max(...words, 0),
            activeBuckets: labels.filter((_, index) => xp[index] > 0 || words[index] > 0).length,
        };
    }

    const labels = [];
    const xp = [];
    const words = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const dateKey = getTodayKey(date);
        const day = getDayStats(stats, dateKey);

        labels.push(getWeekdayLabel(dateKey));
        xp.push(day.dailyXp || 0);
        words.push(day.learnedWords || 0);
    }

    const totalXp = xp.reduce((sum, value) => sum + value, 0);
    const totalWords = words.reduce((sum, value) => sum + value, 0);

    return {
        labels,
        xp,
        words,
        totalXp,
        totalWords,
        peakXp: Math.max(...xp, 0),
        peakWords: Math.max(...words, 0),
        activeBuckets: labels.filter((_, index) => xp[index] > 0 || words[index] > 0).length,
    };
}

export function getStatsSummary(userKey = 'guest') {
    const stats = readUserStats(userKey);
    const days = getDaysArray(stats);
    const today = getTodayKey();
    const todayStats = getDayStats(stats, today);
    const recentSeven = days.slice(-7);
    const activeSeven = recentSeven.filter((day) => (day.dailyXp || 0) > 0 || (day.tasksCompleted || 0) > 0);

    const completionRate = recentSeven.length
        ? Math.round(
            (recentSeven.reduce((sum, day) => sum + (day.taskTarget ? day.tasksCompleted / day.taskTarget : 0), 0) / recentSeven.length) * 100,
        )
        : 0;

    return {
        currentStreak: todayStats.streak || 0,
        bestStreak: days.reduce((max, day) => Math.max(max, day.streak || 0), 0),
        totalXp: todayStats.totalXp || 0,
        todayXp: todayStats.dailyXp || 0,
        todayLearnedWords: todayStats.learnedWords || 0,
        rememberedTotal: todayStats.rememberedTotal || getRememberedCount(),
        tasksCompletedToday: todayStats.tasksCompleted || 0,
        taskTargetToday: todayStats.taskTarget || 0,
        activeDays7: activeSeven.length,
        averageXp7: activeSeven.length
            ? Math.round(activeSeven.reduce((sum, day) => sum + (day.dailyXp || 0), 0) / activeSeven.length)
            : 0,
        completionRate7: completionRate,
        recentDays: recentSeven.reverse(),
    };
}
