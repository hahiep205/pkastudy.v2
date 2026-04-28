const streakLeaders = [
    { rank: 1, name: 'Linh Tran', score: 42, accent: 'orange' },
    { rank: 2, name: 'Minh Khoa', score: 37, accent: 'blue' },
    { rank: 3, name: 'Thu An', score: 33, accent: 'green' },
];

const expLeaders = [
    { rank: 1, name: 'Ngoc Mai', score: 12840, accent: 'blue' },
    { rank: 2, name: 'Quang Huy', score: 11920, accent: 'orange' },
    { rank: 3, name: 'Hoai Thu', score: 11310, accent: 'green' },
];

function getInitial(name) {
    return name.charAt(0).toUpperCase();
}

function getHandle(name) {
    return `@${name.toLowerCase().replace(/\s+/g, '')}`;
}

function LeaderboardCard({ title, subtitle, unit, leaders, tone }) {
    return (
        <section className={`stats2-board stats2-board-${tone} reveal`}>
            <header className="stats2-board-header">
                <div className="stats2-board-copy">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </header>

            <div className="stats2-history">
                {leaders.map((entry) => (
                    <article key={`${title}-${entry.rank}-${entry.name}`} className="stats2-history-item">
                        <div className="stats2-leader-main">
                            <div className="stats2-list-rank">#{entry.rank}</div>
                            <div className={`stats2-avatar-badge accent-${entry.accent}`}>
                                <div className="stats2-avatar-glyph">{getInitial(entry.name)}</div>
                            </div>
                            <div className="stats2-leader-copy">
                                <strong>{entry.name}</strong>
                                <small>{getHandle(entry.name)}</small>
                            </div>
                        </div>
                        <div className="stats2-history-values">
                            <span>
                                {unit === 'ngày'
                                    ? `Chuỗi ${entry.score.toLocaleString('vi-VN')} Streak`
                                    : `${entry.score.toLocaleString('vi-VN')} ${unit}`}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default function Stats() {
    return (
        <main className="dash-main stats-page stats2-page" id="page-stats">
            <section className="stats2-hero reveal" data-reveal-order="0">
                <div className="stats2-hero-copy">
                    <div className="stats2-kicker">Bảng xếp hạng</div>
                    <h1>Theo dõi những người học nổi bật nhất tuần này.</h1>
                    <p>Xem nhanh thứ hạng streak và EXP trong một giao diện ngắn gọn, dễ đọc.</p>
                </div>
            </section>

            <div className="stats2-grid">
                <LeaderboardCard
                    title="Bảng Xếp Hạng Streak"
                    subtitle="Chuỗi ngày học liên tiếp cao nhất"
                    unit="ngày"
                    leaders={streakLeaders}
                    tone="streak"
                />
                <LeaderboardCard
                    title="Bảng Xếp Hạng EXP"
                    subtitle="Tổng EXP tích lũy cao nhất"
                    unit="EXP"
                    leaders={expLeaders}
                    tone="exp"
                />
            </div>
        </main>
    );
}
