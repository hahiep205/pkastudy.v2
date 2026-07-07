import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import './landingPage/LandingPage.css';
import '../assets/css/logined-page.css';

function safeText(value, fallback = '') {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
}

function WelcomeAvatar({ name }) {
    const safeName = safeText(name, 'User');
    const initial = safeName.trim().charAt(0).toUpperCase();

    return (
        <div className="logined-avatar" aria-hidden="true">
            {initial}
        </div>
    );
}

function ActionCard({ title, desc, to, cta, tone = 'blue' }) {
    return (
        <Link to={to} className={`logined-action-card logined-action-card--${tone}`}>
            <span className="logined-action-kicker">{cta}</span>
            <strong>{title}</strong>
            <p>{desc}</p>
        </Link>
    );
}

export default function Logined() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const name = safeText(user?.name, 'user');
    const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Học viên';

    const handleOpenAI = () => {
        window.dispatchEvent(new CustomEvent('toggleFloatChat'));
    };

    return (
        <main className="logined-page">
            <section className="logined-hero">
                <div className="logined-hero-copy">
                    <span className="logined-eyebrow">Đã đăng nhập thành công</span>
                    <h1 className="logined-title">
                        Xin chào, <span className="name-logo">{name}</span>!
                    </h1>
                    <p className="logined-subtitle">
                        Đây là không gian riêng của bạn trên Pkastudy. Từ đây bạn có thể tiếp tục học, mở dashboard, hoặc vào AI để hỏi nhanh bất kỳ điều gì.
                    </p>

                    <div className="logined-hero-actions">
                        <button type="button" className="lp-btn lp-btn--primary" onClick={() => navigate('/dashboard')}>
                            Vào dashboard
                        </button>
                        <Link to="/dashboard/courses" className="lp-btn lp-btn--secondary">
                            Học tiếp
                        </Link>
                        <button type="button" className="lp-btn lp-btn--ghost-white" onClick={handleOpenAI}>
                            Mở AI
                        </button>
                    </div>

                    <div className="logined-profile-chip">
                        <WelcomeAvatar name={name} />
                        <div>
                            <strong>{name}</strong>
                            <span>{roleLabel}</span>
                        </div>
                    </div>
                </div>

                <div className="logined-hero-panel">
                    <div className="logined-panel-card logined-panel-card--top">
                        <span className="logined-panel-label">Hôm nay</span>
                        <strong>Giữ nhịp học đều trong 15 phút</strong>
                        <p>Ôn flashcard, làm một bài luyện ngắn, rồi chốt lại bằng AI trợ lý.</p>
                    </div>

                    <div className="logined-progress-grid">
                        <article className="logined-metric-card">
                            <span>Focus</span>
                            <strong>3 bước</strong>
                            <p>Flashcard, quiz, review</p>
                        </article>
                        <article className="logined-metric-card">
                            <span>Lộ trình</span>
                            <strong>1 ngày</strong>
                            <p>Tiếp tục từ bài gần nhất</p>
                        </article>
                        <article className="logined-metric-card">
                            <span>Hỗ trợ</span>
                            <strong>AI</strong>
                            <p>Giải thích nhanh khi bí</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="logined-actions">
                <div className="lp-container">
                    <div className="logined-section-head">
                        <span className="logined-eyebrow logined-eyebrow--soft">Lối tắt nhanh</span>
                        <h2 className="lp-heading">Chọn việc tiếp theo cho phiên học của bạn</h2>
                        <p className="lp-subheading">
                            Những điểm vào quan trọng nhất đã được gom sẵn để bạn không phải tìm lại từ đầu.
                        </p>
                    </div>

                    <div className="logined-actions-grid">
                        <ActionCard
                            tone="blue"
                            to="/dashboard"
                            cta="Đi ngay"
                            title="Mở bảng điều khiển học tập"
                            desc="Xem tổng quan tiến trình, streak và các mục cần ưu tiên trong ngày."
                        />
                        <ActionCard
                            tone="green"
                            to="/dashboard/courses"
                            cta="Tiếp tục"
                            title="Vào danh sách bài học"
                            desc="Chọn một chủ đề đang học dở hoặc mở bộ từ vựng phù hợp cấp độ."
                        />
                        <ActionCard
                            tone="gold"
                            to="/dashboard/settings"
                            cta="Tuỳ chỉnh"
                            title="Điều chỉnh trải nghiệm"
                            desc="Sửa hồ sơ, giao diện và các thiết lập cá nhân để học thoải mái hơn."
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
