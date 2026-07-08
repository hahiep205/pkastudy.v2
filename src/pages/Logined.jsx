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
                        <button type="button" className="lp-btn lp-btn--primary" onClick={handleOpenAI}>
                            Mở AI hỗ trợ
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

            </section>

        </main>
    );
}
