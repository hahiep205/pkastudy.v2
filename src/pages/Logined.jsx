import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import LandingPage from './landingPage/LandingPage';
import '../assets/css/logined-page.css';

function LogoutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M10 17L11.41 15.59L8.83 13H21V11H8.83L11.41 8.41L10 7L5 12L10 17Z"
                fill="currentColor"
            />
            <path
                d="M4 4H11V6H6V18H11V20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                fill="currentColor"
            />
        </svg>
    );
}

export default function Logined() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const greetingName = user?.name || 'bạn';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <main className="logined-home-page">
            <aside className="logined-corner-card" aria-label="Thông tin tài khoản">
                <span className="logined-corner-kicker">Xin chào</span>
                <strong className="logined-corner-name">{greetingName}!</strong>
                <p className="logined-corner-note">Bạn đã đăng nhập thành công.</p>
                <button
                    type="button"
                    className="logined-corner-logout"
                    onClick={handleLogout}
                >
                    <LogoutIcon />
                    <span>Đăng xuất</span>
                </button>
            </aside>

            <LandingPage />
        </main>
    );
}
