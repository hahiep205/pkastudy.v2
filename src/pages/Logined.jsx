import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import './landingPage/LandingPage.css';
import '../assets/css/logined-page.css';

const quickActions = [
    {
        title: 'Tiếp tục khóa học',
        desc: 'Mở danh sách khóa học, flashcard và các chủ đề bạn đang học dở.',
        to: '/dashboard/courses',
        cta: 'Học tiếp',
        tone: 'blue',
        icon: '01',
    },
    {
        title: 'Luyện đề TOEIC',
        desc: 'Vào kho đề TOEIC đã đồng bộ để luyện full test hoặc từng part.',
        to: '/dashboard/toeic',
        cta: 'TOEIC',
        tone: 'green',
        icon: '02',
    },
    {
        title: 'Ôn tập thông minh',
        desc: 'Xem lại từ vựng, luyện quiz và củng cố các mục dễ quên.',
        to: '/dashboard/review',
        cta: 'Ôn tập',
        tone: 'gold',
        icon: '03',
    },
];

const learningStats = [
    { label: 'Điểm đến', value: 'Dashboard', hint: 'Tất cả công cụ học tập ở một nơi' },
    { label: 'Trọng tâm', value: 'TOEIC', hint: 'Luyện part, câu hỏi và đề full test' },
    { label: 'Trợ lý', value: 'AI', hint: 'Hỏi nhanh khi bí bài hoặc cần gợi ý' },
];

const studyFlow = [
    'Chọn khóa học hoặc đề TOEIC phù hợp',
    'Luyện từng phần với phản hồi tức thì',
    'Quay lại ôn tập các mục cần củng cố',
];

function safeText(value, fallback = '') {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
}

function WelcomeAvatar({ name }) {
    const safeName = safeText(name, 'User');
    const initial = safeName.trim().charAt(0).toUpperCase() || 'U';

    return (
        <div className="logined-avatar" aria-hidden="true">
            {initial}
        </div>
    );
}

function ActionCard({ title, desc, to, cta, tone = 'blue', icon }) {
    return (
        <Link to={to} className={`logined-action-card logined-action-card--${tone}`}>
            <span className="logined-card-index">{icon}</span>
            <span className="logined-action-kicker">{cta}</span>
            <strong>{title}</strong>
            <p>{desc}</p>
            <span className="logined-card-arrow" aria-hidden="true">
                →
            </span>
        </Link>
    );
}

export default function Logined() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const name = safeText(user?.name, 'bạn');
    const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Học viên';

    const handleOpenAI = () => {
        window.dispatchEvent(new CustomEvent('toggleFloatChat'));
    };

    return (
        <main className="logined-page">
            <section className="logined-shell">
                <div className="logined-hero">
                    <div className="logined-hero-copy">
                        <span className="logined-eyebrow">Đăng nhập thành công</span>
                        <h1 className="logined-title">
                            Sẵn sàng học tiếp, <span className="name-logo">{name}</span>?
                        </h1>
                        <p className="logined-subtitle">
                            Không gian học tập của bạn đã sẵn sàng. Vào dashboard để tiếp tục khóa học,
                            luyện TOEIC hoặc mở AI hỗ trợ khi cần một cú hích nhỏ.
                        </p>

                        <div className="logined-hero-actions" aria-label="Tác vụ nhanh">
                            <button type="button" className="logined-btn logined-btn--primary" onClick={() => navigate('/dashboard')}>
                                Vào dashboard
                            </button>
                            <Link to="/dashboard/courses" className="logined-btn logined-btn--secondary">
                                Học tiếp
                            </Link>
                            <button type="button" className="logined-btn logined-btn--ghost" onClick={handleOpenAI}>
                                Mở AI hỗ trợ
                            </button>
                        </div>
                    </div>

                    <aside className="logined-hero-panel" aria-label="Thông tin tài khoản">
                        <div className="logined-profile-card">
                            <WelcomeAvatar name={name} />
                            <div>
                                <span className="logined-profile-label">Tài khoản hiện tại</span>
                                <strong>{name}</strong>
                                <span>{roleLabel}</span>
                            </div>
                        </div>

                        <div className="logined-progress-grid">
                            {learningStats.map((item) => (
                                <div className="logined-metric-card" key={item.label}>
                                    <span>{item.label}</span>
                                    <strong>{item.value}</strong>
                                    <p>{item.hint}</p>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>

                <section className="logined-content-grid" aria-label="Lối tắt học tập">
                    <div className="logined-actions-panel">
                        <div className="logined-section-head">
                            <span className="logined-eyebrow logined-eyebrow--soft">Bắt đầu nhanh</span>
                            <h2>Chọn một hướng học cho phiên này</h2>
                            <p>Một trang chào nhẹ thôi, nhưng vẫn đủ nút để bạn vào đúng việc trong vài giây.</p>
                        </div>

                        <div className="logined-actions-grid">
                            {quickActions.map((action) => (
                                <ActionCard key={action.title} {...action} />
                            ))}
                        </div>
                    </div>

                    <aside className="logined-flow-card" aria-label="Gợi ý luồng học">
                        <span className="logined-eyebrow logined-eyebrow--soft">Gợi ý hôm nay</span>
                        <h2>Luồng học gọn, ít ma sát</h2>
                        <ol>
                            {studyFlow.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                        <div className="logined-flow-note">
                            <strong>Tip nhỏ</strong>
                            <p>Nếu đang phân vân, cứ bắt đầu từ TOEIC hoặc khóa gần nhất. Đà học quan trọng hơn chọn hoàn hảo.</p>
                        </div>
                    </aside>
                </section>
            </section>
        </main>
    );
}
