import { useMemo } from 'react';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useCustomCourses } from '../../hooks/useCustomCourses';
import { useAuth } from '../../contexts/useAuth';
import {
    getDashboardUserKey,
    readDashboardProgress,
    syncDashboardProgressWithServer
} from '../../utils/dashboardProgress';
import { syncXpWithServer } from '../../utils/xpSystem';
import { useEffect, useState } from 'react';
import axiosClient from '../../utils/axiosClient';

export default function Stats() {
    const { user } = useAuth();
    const { remembered } = useCourseProgress();
    const { customCourses } = useCustomCourses();
    const [leaderboard, setLeaderboard] = useState([]);

    const userKey = useMemo(() => getDashboardUserKey(user), [user]);
    const dashboardProgress = useMemo(() => readDashboardProgress(userKey), [userKey]);

    useEffect(() => {
        syncDashboardProgressWithServer(userKey);
        syncXpWithServer();
        
        axiosClient.get('/progress/leaderboard?limit=5')
            .then(res => {
                if (res) {
                    setLeaderboard(res || []);
                }
            })
            .catch(console.error);
    }, [userKey]);

    // ── Compute real stats ──────────────────────────────────────────────────
    const { grandTotal, grandDone, courseStats } = useMemo(() => {
        let total = 0;
        let done = 0;
        const stats = [];

        // Count from remembered keys for built-in courses
        const rememberedCount = Object.keys(remembered).filter((k) => remembered[k]).length;
        total += rememberedCount;
        done += rememberedCount;

        let customTotal = 0;
        let customDone = 0;
        customCourses.forEach((topic) => {
            customTotal += topic.words.length;
            topic.words.forEach((word) => {
                if (remembered[word.id]) customDone += 1;
            });
        });
        if (customCourses.length > 0) {
            total = Math.max(total, customTotal + rememberedCount);
            done = Math.max(done, customDone + rememberedCount - customTotal);
            stats.push({ name: 'Tài liệu cá nhân', total: customTotal, done: customDone, lang: 'custom' });
        }

        return { grandTotal: Math.max(total, 1), grandDone: done, courseStats: stats };
    }, [remembered, customCourses]);

    const pct = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;

    // ── Personal stats pills ────────────────────────────────────────────────
    const personalStats = [
        {
            label: 'Streak',
            value: `${dashboardProgress.streak} ngày`,
            icon: '🔥',
            tone: 'orange',
        },
        {
            label: 'Tổng EXP',
            value: dashboardProgress.totalXp.toLocaleString('vi-VN'),
            icon: '⚡',
            tone: 'blue',
        },
        {
            label: 'Đã thuộc',
            value: `${grandDone}/${grandTotal} từ`,
            icon: '📚',
            tone: 'green',
        },
        {
            label: 'Tiến độ',
            value: `${pct}%`,
            icon: '📈',
            tone: 'purple',
        },
    ];

    // ── Course progress cards ───────────────────────────────────────────────
    const toneMap = { en: 'blue', ko: 'green', custom: 'orange' };

    return (
        <main className="dash-main stats-page stats2-page" id="page-stats">
            <section className="stats2-hero reveal" data-reveal-order="0">
                <div className="stats2-hero-copy">
                    <div className="stats2-kicker">Thống kê</div>
                    <h1>Tổng quan tiến trình học tập</h1>
                    <p>Theo dõi chi tiết số từ đã thuộc, EXP tích lũy và tiến trình từng khóa học.</p>
                </div>
            </section>

            {/* ── Personal stats pills ── */}
            <div className="stats2-pills reveal" data-reveal-order="1">
                {personalStats.map((stat) => (
                    <div key={stat.label} className={`stats2-pill stats2-pill-${stat.tone}`}>
                        <span className="stats2-pill-icon">{stat.icon}</span>
                        <div className="stats2-pill-copy">
                            <span className="stats2-pill-label">{stat.label}</span>
                            <strong className="stats2-pill-value">{stat.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Overall progress bar ── */}
            <section className="stats2-board stats2-board-overview reveal" data-reveal-order="2">
                <header className="stats2-board-header">
                    <div className="stats2-board-copy">
                        <h2>Tiến độ tổng thể</h2>
                        <p>{grandDone} / {grandTotal} từ vựng đã thuộc</p>
                    </div>
                    <span className="stats2-pct-badge">{pct}%</span>
                </header>
                <div className="stats2-overall-bar">
                    <div className="stats2-overall-fill" style={{ width: `${pct}%` }}></div>
                </div>
            </section>

            {/* ── Per-course progress ── */}
            <div className="stats2-grid">
                {courseStats.map((course) => {
                    const coursePct = course.total > 0 ? Math.round((course.done / course.total) * 100) : 0;
                    const tone = toneMap[course.lang] || 'blue';
                    return (
                        <section key={course.name} className={`stats2-board stats2-board-${tone} reveal`}>
                            <header className="stats2-board-header">
                                <div className="stats2-board-copy">
                                    <h2>{course.name}</h2>
                                    <p>{course.done} / {course.total} từ · {coursePct}%</p>
                                </div>
                            </header>

                            <div className="stats2-course-bar-wrap">
                                <div className="stats2-course-bar">
                                    <div className="stats2-course-fill" style={{ width: `${coursePct}%` }}></div>
                                </div>
                            </div>

                            <div className="stats2-history">
                                <article className="stats2-history-item">
                                    <div className="stats2-leader-main">
                                        <div className="stats2-leader-copy">
                                            <strong>Từ đã thuộc</strong>
                                            <small>{course.done} từ</small>
                                        </div>
                                    </div>
                                    <div className="stats2-history-values">
                                        <span>{course.total - course.done} từ còn lại</span>
                                    </div>
                                </article>
                            </div>
                        </section>
                    );
                })}

                {/* ── Daily tasks summary ── */}
                <section className="stats2-board stats2-board-streak reveal">
                    <header className="stats2-board-header">
                        <div className="stats2-board-copy">
                            <h2>Hoạt động hôm nay</h2>
                            <p>EXP đã nhận hôm nay và trạng thái task</p>
                        </div>
                    </header>
                    <div className="stats2-history">
                        <article className="stats2-history-item">
                            <div className="stats2-leader-main">
                                <div className="stats2-leader-copy">
                                    <strong>EXP hôm nay</strong>
                                    <small>{dashboardProgress.dailyXp} EXP</small>
                                </div>
                            </div>
                            <div className="stats2-history-values">
                                <span>{dashboardProgress.tasks.filter(t => t.isDone).length}/{dashboardProgress.tasks.length} task</span>
                            </div>
                        </article>
                        <article className="stats2-history-item">
                            <div className="stats2-leader-main">
                                <div className="stats2-leader-copy">
                                    <strong>Từ mới hôm nay</strong>
                                    <small>{dashboardProgress.learnedWordIdsToday.length} từ</small>
                                </div>
                            </div>
                            <div className="stats2-history-values">
                                <span>Mục tiêu: 10 từ/ngày</span>
                            </div>
                        </article>
                    </div>
                </section>

                {/* ── Leaderboard ── */}
                <section className="stats2-board stats2-board-streak reveal">
                    <header className="stats2-board-header">
                        <div className="stats2-board-copy">
                            <h2>Bảng Xếp Hạng</h2>
                            <p>Top người chơi có điểm XP cao nhất</p>
                        </div>
                    </header>
                    <div className="stats2-history">
                        {leaderboard.length === 0 ? (
                            <div style={{ padding: '1rem', color: 'var(--text-light)' }}>Chưa có dữ liệu.</div>
                        ) : leaderboard.map((entry, index) => (
                            <article key={entry.id} className="stats2-history-item">
                                <div className="stats2-leader-main">
                                    <div className="stats2-leader-rank" style={{ 
                                        width: '32px', height: '32px', borderRadius: '50%', 
                                        background: index === 0 ? 'var(--orange-light)' : index === 1 ? 'var(--blue-light)' : index === 2 ? 'var(--green-light)' : 'var(--bg-card-hover)',
                                        color: index === 0 ? 'var(--orange)' : index === 1 ? 'var(--blue)' : index === 2 ? 'var(--green)' : 'var(--text-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem'
                                    }}>
                                        #{index + 1}
                                    </div>
                                    <div className="stats2-leader-copy">
                                        <strong>{entry.name || 'Người dùng ẩn danh'}</strong>
                                        <small>Level {entry.level}</small>
                                    </div>
                                </div>
                                <div className="stats2-history-values">
                                    <span style={{ fontWeight: 'bold', color: 'var(--blue)' }}>{entry.score} XP</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
