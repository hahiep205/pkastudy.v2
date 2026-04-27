import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesData } from '../../data/coursesData';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useCustomCourses } from '../../hooks/useCustomCourses';
import { useAuth } from '../../contexts/useAuth';
import {
    completeDashboardTask,
    getDashboardUserKey,
    readDashboardProgress,
    subscribeDashboardProgress,
} from '../../utils/dashboardProgress';
import { buildActivityChartData } from '../../utils/userStats';

export default function Overview() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { remembered } = useCourseProgress();
    const { customCourses } = useCustomCourses();
    const canvasRef = useRef(null);
    const allCourses = Object.values(coursesData);
    const userKey = useMemo(() => getDashboardUserKey(user), [user]);

    const [dashboardProgress, setDashboardProgress] = useState(() => readDashboardProgress(userKey));
    const [stats, setStats] = useState({ streak: 0, words: 0, xp: 0 });
    const [chartPeriod, setChartPeriod] = useState('week');

    useEffect(() => {
        setDashboardProgress(readDashboardProgress(userKey));

        return subscribeDashboardProgress((payload) => {
            if (payload && payload.userKey && payload.userKey !== userKey) return;
            setDashboardProgress(readDashboardProgress(userKey));
        });
    }, [userKey]);

    const { grandTotal, grandDone } = useMemo(() => {
        let total = 0;
        let done = 0;

        allCourses.forEach((course) => {
            course.topics.forEach((topic) => {
                total += topic.words.length;
                topic.words.forEach((word) => {
                    if (remembered[word.id]) done += 1;
                });
            });
        });

        customCourses.forEach((topic) => {
            total += topic.words.length;
            topic.words.forEach((word) => {
                if (remembered[word.id]) done += 1;
            });
        });

        return { grandTotal: total, grandDone: done };
    }, [remembered, customCourses, allCourses]);

    const tasks = dashboardProgress.tasks;
    const tasksView = tasks.map((task) => {
        if (task.id === 'learn-ten-words') {
            return {
                ...task,
                desc: `Đã thuộc ${dashboardProgress.learnedWordIdsToday.length}/10 từ mới hôm nay · +20 EXP`,
            };
        }

        if (task.id === 'game-session') {
            const currentCount = Number.isFinite(task.currentCount) ? task.currentCount : 0;
            const targetCount = Number.isFinite(task.targetCount) && task.targetCount > 0 ? task.targetCount : 5;
            return {
                ...task,
                desc: `${currentCount}/${targetCount} lần chơi Flashcard hôm nay · +25 EXP`,
            };
        }

        return task;
    });

    const completedTasks = tasksView.filter((task) => task.isDone).length;
    const todayTaskPct = tasksView.length ? Math.round((completedTasks / tasksView.length) * 100) : 0;

    const targetStats = useMemo(() => ({
        streak: dashboardProgress.streak,
        words: grandDone,
        xp: dashboardProgress.totalXp,
    }), [dashboardProgress.streak, dashboardProgress.totalXp, grandDone]);

    const activeChartData = useMemo(
        () => buildActivityChartData(userKey, chartPeriod),
        [userKey, chartPeriod, dashboardProgress, grandDone],
    );

    useEffect(() => {
        const duration = 700;
        const start = performance.now();

        function animate(now) {
            const progress = Math.min((now - start) / duration, 1);
            setStats({
                streak: Math.floor(targetStats.streak * progress),
                words: Math.floor(targetStats.words * progress),
                xp: Math.floor(targetStats.xp * progress),
            });

            if (progress < 1) requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }, [targetStats]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const data = activeChartData;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = 160;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        function roundRect(context, x, y, w, h, radius) {
            if (h <= 0) return;

            const safeRadius = Math.min(radius, h / 2, w / 2);
            context.beginPath();
            context.moveTo(x + safeRadius, y);
            context.lineTo(x + w - safeRadius, y);
            context.quadraticCurveTo(x + w, y, x + w, y + safeRadius);
            context.lineTo(x + w, y + h);
            context.lineTo(x, y + h);
            context.lineTo(x, y + safeRadius);
            context.quadraticCurveTo(x, y, x + safeRadius, y);
            context.closePath();
        }

        const animationDuration = 800;
        const animationStart = performance.now();

        function drawFrame(now) {
            const progress = Math.min((now - animationStart) / animationDuration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            ctx.clearRect(0, 0, width, height);

            const count = data.labels.length;
            const padL = 36;
            const padR = 12;
            const padT = 12;
            const padB = 28;
            const plotW = width - padL - padR;
            const plotH = height - padT - padB;
            const maxVal = Math.max(...data.xp, ...data.words, 1) * 1.15;
            const groupW = plotW / count;
            const barW = Math.min(groupW * 0.32, 16);
            const gap = 4;

            ctx.strokeStyle = 'rgba(0,0,0,.06)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i += 1) {
                const y = padT + (plotH / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padL, y);
                ctx.lineTo(width - padR, y);
                ctx.stroke();

                const val = Math.round(maxVal - (maxVal / 4) * i);
                ctx.fillStyle = 'rgba(119,119,119,.7)';
                ctx.font = '600 10px Nunito, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(val, padL - 6, y + 4);
            }

            data.labels.forEach((label, i) => {
                const cx = padL + groupW * i + groupW / 2;

                const reviewH = (data.xp[i] / maxVal) * plotH * ease;
                ctx.fillStyle = 'rgba(28,176,246,.78)';
                roundRect(ctx, cx - barW - gap / 2, padT + plotH - reviewH, barW, reviewH, 4);
                ctx.fill();

                const learnH = (data.words[i] / maxVal) * plotH * ease;
                ctx.fillStyle = 'rgba(88,204,2,.88)';
                roundRect(ctx, cx + gap / 2, padT + plotH - learnH, barW, learnH, 4);
                ctx.fill();

                ctx.fillStyle = 'rgba(119,119,119,.92)';
                ctx.font = '700 11px Nunito, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(label, cx, height - 6);
            });

            if (progress < 1) requestAnimationFrame(drawFrame);
        }

        requestAnimationFrame(drawFrame);
    }, [activeChartData]);

    const handleTaskAction = (task) => {
        if (task.id === 'daily-checkin') {
            const result = completeDashboardTask(userKey, task.id);
            setDashboardProgress(result.progress);
            return;
        }

        if (task.page) {
            navigate(`/dashboard/${task.page}`);
        }
    };

    const totalLearn = activeChartData.words.reduce((sum, value) => sum + value, 0);
    const totalReview = activeChartData.xp.reduce((sum, value) => sum + value, 0);

    const customTotal = customCourses.reduce((sum, topic) => sum + topic.words.length, 0);
    const customDone = customCourses.reduce(
        (sum, topic) => sum + topic.words.filter((word) => remembered[word.id]).length,
        0,
    );
    const customPct = customTotal > 0 ? Math.round((customDone / customTotal) * 100) : 0;

    return (
        <main className="dash-main" id="page-dashboard">
            <section className="welcome-banner reveal" data-reveal-order="0">
                <div className="welcome-layout">
                    <div className="welcome-text">
                        <div className="welcome-eyebrow" id="dash-today-label">
                            {new Date().toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            })}
                        </div>
                        <h1 className="welcome-title">Tiếp tục hành trình học từ vựng</h1>
                        <p className="welcome-sub">
                            Bạn đã thuộc <strong id="dash-total-remembered">{stats.words}</strong> từ vựng trên tổng
                            <strong id="dash-total-words"> {grandTotal}</strong> từ. Duy trì nhịp độ ổn định để kho từ
                            vựng tăng đều mỗi ngày.
                        </p>
                        <div className="welcome-actions">
                            <Link to="/dashboard/courses"><button className="btn btn-primary btn-large" id="startStudyBtn">Khóa học</button></Link>
                            <Link to="/dashboard/games"><button className="btn btn-secondary">Trò chơi</button></Link>
                        </div>
                    </div>

                    <div className="welcome-panel">
                        <div className="welcome-pill-row">
                            <div className="welcome-pill">
                                <span>Streak</span>
                                <strong>{stats.streak} ngày</strong>
                            </div>
                            <div className="welcome-pill">
                                <span>Tổng EXP</span>
                                <strong>{stats.xp}</strong>
                            </div>
                        </div>

                        <div className="welcome-focus-card">
                            <span className="welcome-focus-label">Nhịp học hôm nay</span>
                            <strong className="welcome-focus-value">{completedTasks}/{tasksView.length} task</strong>
                            <p>Hôm nay bạn đã nhận <strong>{dashboardProgress.dailyXp} EXP</strong>. Chỉ khi hoàn thành đúng task thì trạng thái mới được cập nhật.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mid-grid">
                <div className="chart-card reveal" data-reveal-order="1">
                    <div className="card-header">
                        <div>
                            <div className="card-eyebrow">Hoạt động</div>
                            <h2 className="card-title-text">{chartPeriod === 'week' ? 'Tuần này' : 'Tháng này'}</h2>
                        </div>
                        <div className="chart-tabs">
                            <button className={`chart-tab ${chartPeriod === 'week' ? 'active' : ''}`} onClick={() => setChartPeriod('week')}>Tuần</button>
                            <button className={`chart-tab ${chartPeriod === 'month' ? 'active' : ''}`} onClick={() => setChartPeriod('month')}>Tháng</button>
                        </div>
                    </div>

                    <div className="chart-area" id="chartArea" style={{ height: '160px', position: 'relative' }}>
                        <canvas ref={canvasRef} />
                    </div>

                    <div className="chart-summary">
                        <div className="chart-summary-card">
                            <span>{chartPeriod === 'week' ? 'Từ mới 7 ngày' : 'Từ mới 4 tuần'}</span>
                            <strong>{totalLearn}</strong>
                        </div>
                        <div className="chart-summary-card">
                            <span>{chartPeriod === 'week' ? 'EXP 7 ngày' : 'EXP 4 tuần'}</span>
                            <strong>{totalReview}</strong>
                        </div>
                    </div>

                    <div className="chart-legend">
                        <span className="legend-dot" style={{ background: 'var(--blue)' }}></span> Từ mới đã học
                        <span className="legend-dot" style={{ background: 'var(--green)', marginLeft: '16px' }}></span> EXP thực nhận
                    </div>
                </div>

                <div className="today-card reveal" data-reveal-order="2">
                    <div className="card-header">
                        <div>
                            <div className="card-eyebrow">Hôm nay</div>
                            <h2 className="card-title-text">Mục tiêu ngày</h2>
                        </div>
                        <span className="badge badge-streak">{completedTasks}/{tasksView.length} task hoàn thành</span>
                    </div>

                    <div className="today-progress">
                        <div className="today-progress-bar">
                            <span style={{ width: `${Math.max(todayTaskPct, 8)}%` }}></span>
                        </div>
                        <p>Task chỉ được tính xong khi bạn thực hiện đúng hành động tương ứng trong hệ thống.</p>
                    </div>

                    <div className="task-list">
                        {tasksView.map((task) => (
                            <div key={task.id} className={`task-item ${task.isDone ? 'done' : 'active'}`}>
                                <span className={`task-check ${!task.isDone ? 'pending' : ''}`}>{task.isDone ? '✓' : '○'}</span>
                                <div className="task-info">
                                    <strong>{task.title}</strong>
                                    <span>{task.desc}</span>
                                </div>
                                <button
                                    className={`btn btn-small ${task.isDone ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => !task.isDone && handleTaskAction(task)}
                                    disabled={task.isDone}
                                >
                                    {task.isDone ? 'Hoàn thành' : 'Làm ngay'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <section className="courses-section">
                <div className="section-header-dash">
                    <div>
                        <div className="card-eyebrow">Module</div>
                        <h2 className="card-title-text">Tài liệu học tập có sẵn</h2>
                    </div>
                </div>

                <div className="courses-grid-dash">
                    {allCourses.map((course) => {
                        let total = 0;
                        let done = 0;

                        course.topics.forEach((topic) => {
                            total += topic.words.length;
                            topic.words.forEach((word) => {
                                if (remembered[word.id]) done += 1;
                            });
                        });

                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        const langName = course.lang === 'en' ? 'Tiếng Anh' : course.lang === 'ko' ? 'Tiếng Hàn' : 'Ngoại ngữ';
                        const bannerGradient = course.lang === 'en'
                            ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)'
                            : 'linear-gradient(135deg,#f0fdf4,#dcfce7)';

                        return (
                            <div key={course.id} className="course-dash-card reveal" data-course-id={course.id}>
                                <div className="course-dash-top" style={{ background: bannerGradient }}>
                                    <span className="course-flag">{langName}</span>
                                </div>
                                <div className="course-dash-body">
                                    <h3 className="course-dash-name">{course.title}</h3>
                                    <p className="course-dash-desc">
                                        {course.id === 'toeic-basic'
                                            ? 'Bộ từ vựng cốt lõi cho kỳ thi TOEIC từ 0 - 500 điểm.'
                                            : 'Hangul, giao tiếp hằng ngày và từ vựng TOPIK I.'}
                                    </p>
                                    <div className="course-dash-meta">
                                        <span className="cd-meta-words">{total} từ</span>
                                        <span className="cd-meta-topics">{course.topics.length} chủ đề</span>
                                        <span>Level A1</span>
                                    </div>
                                    <div className="course-progress-section">
                                        <div className="course-progress-header">
                                            <span>Tiến độ</span>
                                            <span><strong className="cd-done">{done}</strong> / <strong className="cd-total">{total}</strong> từ · <strong className="cd-pct">{pct}%</strong></span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill course-fill"
                                                style={{
                                                    background: 'var(--blue)',
                                                    width: `${pct}%`,
                                                    transition: 'width 0.6s ease',
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="course-dash-footer">
                                    <Link
                                        to={`/dashboard/courses?tab=${course.lang === 'en' ? 'english' : 'korean'}`}
                                        className="btn btn-primary btn-small cd-view-btn"
                                    >
                                        Xem ngay
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    <div className="course-dash-card reveal" style={{ transitionDelay: '160ms' }}>
                        <div className="course-dash-top" style={{ background: 'linear-gradient(135deg,#fdf4ff,#ede9fe)' }}>
                            <span className="course-flag">Cá nhân</span>
                        </div>
                        <div className="course-dash-body">
                            <h3 className="course-dash-name">Bộ từ vựng của riêng bạn</h3>
                            <p className="course-dash-desc">Danh sách các chủ đề từ vựng do bạn tự thêm và quản lý cá nhân.</p>
                            <div className="course-dash-meta">
                                <span className="cd-meta-words-custom">{customTotal} từ</span>
                                <span className="cd-meta-topics-custom">{customCourses.length} chủ đề</span>
                            </div>
                            <div className="course-progress-section">
                                <div className="course-progress-header">
                                    <span>Tiến độ</span>
                                    <span>
                                        <strong className="cd-done-custom">{customDone}</strong> /
                                        <strong className="cd-total-custom">{customTotal}</strong> từ ·
                                        <strong className="cd-pct-custom"> {customPct}%</strong>
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill course-fill-custom"
                                        style={{
                                            background: 'var(--golden)',
                                            width: `${customPct}%`,
                                            transition: 'width 0.6s ease',
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="course-dash-footer">
                            <button
                                className="btn btn-small"
                                onClick={() => navigate('/dashboard/courses?tab=custom')}
                                style={{ background: 'linear-gradient(135deg,var(--golden),#ffad00)', boxShadow: '0 3px 0 #cc8800', color: '#fff', width: '100%', fontSize: '13px', borderRadius: '10px' }}
                            >
                                Xem ngay
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
