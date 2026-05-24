import { recordUserStatsSnapshot } from './userStats';
import { xpStreakDaily } from './xpSystem';
import axiosClient from './axiosClient';

const STORAGE_KEY = 'pka_dashboard_progress_v1';
const UPDATE_EVENT = 'pka-dashboard-progress-updated';
const USER_STORAGE_KEY = 'user';

const TASK_TEMPLATES = [
    {
        id: 'daily-checkin',
        title: 'Điểm danh hằng ngày',
        desc: 'Điểm danh để mở đầu ngày mới · +10 EXP',
        btnText: 'Làm ngay',
        page: null,
        exp: 10,
    },
    {
        id: 'learn-ten-words',
        title: 'Học thuộc 10 từ mới',
        desc: 'Đánh dấu đã thuộc đủ 10 từ trong ngày · +20 EXP',
        btnText: 'Làm ngay',
        page: 'courses',
        exp: 20,
        autoComplete: true,
    },
    {
        id: 'game-session',
        title: 'Hoàn thành 5 lần chơi Flashcard',
        desc: '0/5 lần chơi Flashcard hôm nay · +25 EXP',
        btnText: 'Làm ngay',
        page: 'courses',
        exp: 25,
        targetCount: 5,
        currentCount: 0,
        autoComplete: true,
    },
];

function pad(value) {
    return String(value).padStart(2, '0');
}

export function getTodayKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDashboardUserKey(user) {
    if (!user || user.name === 'Guest User') return 'guest';
    return `user:${String(user.name).trim().toLowerCase()}`;
}

function createDailyTasks() {
    return TASK_TEMPLATES.map((task) => ({
        ...task,
        currentCount: Number.isFinite(task.currentCount) ? task.currentCount : 0,
        targetCount: Number.isFinite(task.targetCount) ? task.targetCount : 0,
        isDone: false,
        completedAt: null,
    }));
}

function getStorageMap() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveStorageMap(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createDefaultProgress() {
    return {
        streak: 0,
        totalXp: 0,
        dailyXp: 0,
        currentDate: getTodayKey(),
        lastStreakDate: null,
        learnedWordIdsToday: [],
        learnedWordEventIdsToday: [],
        tasks: createDailyTasks(),
    };
}

function normalizeProgress(progress) {
    const safe = progress && typeof progress === 'object' ? progress : {};

    return {
        streak: Number.isFinite(safe.streak) ? safe.streak : 0,
        totalXp: Number.isFinite(safe.totalXp) ? safe.totalXp : 0,
        dailyXp: Number.isFinite(safe.dailyXp) ? safe.dailyXp : 0,
        currentDate: typeof safe.currentDate === 'string' ? safe.currentDate : getTodayKey(),
        lastStreakDate: typeof safe.lastStreakDate === 'string' ? safe.lastStreakDate : null,
        learnedWordIdsToday: Array.isArray(safe.learnedWordIdsToday) ? safe.learnedWordIdsToday : [],
        learnedWordEventIdsToday: Array.isArray(safe.learnedWordEventIdsToday) ? safe.learnedWordEventIdsToday : [],
        tasks: Array.isArray(safe.tasks) && safe.tasks.length
            ? TASK_TEMPLATES.map((template) => {
                const existing = safe.tasks.find((task) => task.id === template.id);
                return {
                    ...template,
                    currentCount: Number.isFinite(existing?.currentCount)
                        ? existing.currentCount
                        : (Number.isFinite(template.currentCount) ? template.currentCount : 0),
                    targetCount: Number.isFinite(existing?.targetCount)
                        ? existing.targetCount
                        : (Number.isFinite(template.targetCount) ? template.targetCount : 0),
                    isDone: Boolean(existing?.isDone),
                    completedAt: existing?.completedAt ?? null,
                };
            })
            : createDailyTasks(),
    };
}

export function ensureTodayProgress(progress) {
    const normalized = normalizeProgress(progress);
    const today = getTodayKey();

    if (normalized.currentDate === today) return normalized;

    return {
        ...normalized,
        currentDate: today,
        dailyXp: 0,
        learnedWordIdsToday: [],
        learnedWordEventIdsToday: [],
        tasks: createDailyTasks(),
    };
}

function applyDashboardTaskCompletion(current, taskId) {
    const today = getTodayKey();
    let expGained = 0;
    let streakGained = false;

    const tasks = current.tasks.map((task) => {
        if (task.id !== taskId || task.isDone) return task;
        expGained = task.exp;
        return {
            ...task,
            isDone: true,
            completedAt: new Date().toISOString(),
        };
    });

    if (!expGained) {
        return {
            nextProgress: current,
            expGained: 0,
            streakGained: false,
        };
    }

    let streak = current.streak;
    let lastStreakDate = current.lastStreakDate;

    if (lastStreakDate !== today) {
        streak += 1;
        lastStreakDate = today;
        streakGained = true;
        xpStreakDaily(); // +20 XP streak bonus
    }

    return {
        nextProgress: {
            ...current,
            tasks,
            streak,
            lastStreakDate,
            dailyXp: current.dailyXp + expGained,
            totalXp: current.totalXp + expGained,
        },
        expGained,
        streakGained,
    };
}

export function readDashboardProgress(userKey = 'guest') {
    const map = getStorageMap();
    const progress = ensureTodayProgress(map[userKey] || createDefaultProgress());

    map[userKey] = progress;
    saveStorageMap(map);
    recordUserStatsSnapshot(userKey, progress);
    return progress;
}

export async function syncDashboardProgressWithServer(userKey = 'guest') {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || (!user.token && !user.id)) return;
    try {
        const res = await axiosClient.get('/progress');
        if (res) {
            const serverData = res;
            const map = getStorageMap();
            let progress = ensureTodayProgress(map[userKey] || createDefaultProgress());
            
            let updated = false;
            if (serverData.current_xp > progress.totalXp) {
                progress.totalXp = serverData.current_xp;
                updated = true;
            }
            if (serverData.current_streak > progress.streak) {
                progress.streak = serverData.current_streak;
                updated = true;
            }
            
            if (updated) {
                map[userKey] = progress;
                saveStorageMap(map);
                recordUserStatsSnapshot(userKey, progress);
                window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { userKey, progress } }));
            }
        }
    } catch (e) {
        console.error("Failed to sync dashboard progress:", e);
    }
}

export function writeDashboardProgress(userKey = 'guest', progress) {
    const map = getStorageMap();
    const nextProgress = ensureTodayProgress(progress);
    map[userKey] = nextProgress;
    saveStorageMap(map);
    recordUserStatsSnapshot(userKey, nextProgress);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { userKey, progress: nextProgress } }));
    return nextProgress;
}

export function completeDashboardTask(userKey = 'guest', taskId) {
    const current = readDashboardProgress(userKey);
    const { nextProgress: preparedProgress, expGained, streakGained } = applyDashboardTaskCompletion(current, taskId);

    if (!expGained) {
        return {
            progress: current,
            expGained: 0,
            streakGained: false,
        };
    }

    const nextProgress = writeDashboardProgress(userKey, preparedProgress);

    return {
        progress: nextProgress,
        expGained,
        streakGained,
    };
}

function getCurrentStoredUser() {
    try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        return storedUser ? JSON.parse(storedUser) : { name: 'Guest User' };
    } catch {
        return { name: 'Guest User' };
    }
}

function getCurrentDashboardUserKey() {
    return getDashboardUserKey(getCurrentStoredUser());
}

function finalizeTaskProgress(userKey, nextProgress) {
    const savedProgress = writeDashboardProgress(userKey, nextProgress);

    return {
        progress: savedProgress,
        learnedWordsCount: savedProgress.learnedWordIdsToday.length,
    };
}

export function recordFlashcardSessionProgress() {
    const userKey = getCurrentDashboardUserKey();
    const current = readDashboardProgress(userKey);
    const flashcardTask = current.tasks.find((task) => task.id === 'game-session');

    if (!flashcardTask) {
        return {
            ...finalizeTaskProgress(userKey, current),
            expGained: 0,
            streakGained: false,
        };
    }

    const targetCount = Number.isFinite(flashcardTask.targetCount) && flashcardTask.targetCount > 0
        ? flashcardTask.targetCount
        : 5;

    let nextProgress = {
        ...current,
        tasks: current.tasks.map((task) => {
            if (task.id !== 'game-session') return task;
            const nextCount = Math.min((task.currentCount || 0) + 1, targetCount);
            return {
                ...task,
                currentCount: nextCount,
                targetCount,
            };
        }),
    };

    let expGained = 0;
    let streakGained = false;
    const updatedTask = nextProgress.tasks.find((task) => task.id === 'game-session');

    if (updatedTask && !updatedTask.isDone && updatedTask.currentCount >= targetCount) {
        const completed = applyDashboardTaskCompletion(nextProgress, 'game-session');
        nextProgress = completed.nextProgress;
        expGained = completed.expGained;
        streakGained = completed.streakGained;
    }

    return {
        ...finalizeTaskProgress(userKey, nextProgress),
        expGained,
        streakGained,
    };
}

export function syncRememberedWordProgress(previousRemembered = {}, nextRemembered = {}) {
    const userKey = getCurrentDashboardUserKey();
    const current = readDashboardProgress(userKey);

    const previousIds = new Set(Object.keys(previousRemembered).filter((id) => previousRemembered[id]));
    const nextIds = new Set(Object.keys(nextRemembered).filter((id) => nextRemembered[id]));
    const learnedToday = new Set(current.learnedWordIdsToday);
    const learnedEventsToday = new Set(current.learnedWordEventIdsToday);

    nextIds.forEach((id) => {
        if (!previousIds.has(id)) {
            learnedToday.add(id);
            learnedEventsToday.add(id);
        }
    });

    previousIds.forEach((id) => {
        if (!nextIds.has(id)) learnedToday.delete(id);
    });

    let nextProgress = {
        ...current,
        learnedWordIdsToday: Array.from(learnedToday),
        learnedWordEventIdsToday: Array.from(learnedEventsToday),
    };

    const learnTask = nextProgress.tasks.find((task) => task.id === 'learn-ten-words');
    let expGained = 0;
    let streakGained = false;

    if (learnTask && !learnTask.isDone && learnedToday.size >= 10) {
        const completed = applyDashboardTaskCompletion(nextProgress, 'learn-ten-words');
        nextProgress = completed.nextProgress;
        expGained = completed.expGained;
        streakGained = completed.streakGained;
    }

    return {
        ...finalizeTaskProgress(userKey, nextProgress),
        expGained,
        streakGained,
    };
}

export function subscribeDashboardProgress(callback) {
    const handleUpdate = (event) => callback(event.detail);
    const handleStorage = () => callback(null);

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener(UPDATE_EVENT, handleUpdate);
        window.removeEventListener('storage', handleStorage);
    };
}
