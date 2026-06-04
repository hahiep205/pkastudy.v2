import { useAuth } from '../../contexts/useAuth';

export default function ManagerTopbar({ onMenuClick, title }) {
    const { user } = useAuth();

    return (
        <header className="manager-topbar">
            <div className="manager-topbar-main">
                <button type="button" className="manager-menu-btn" onClick={onMenuClick} aria-label="Mở menu quản trị">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className="manager-title-block">
                    <h1>{title}</h1>
                </div>
            </div>

            <div className="manager-topbar-actions">
                <div className="manager-topbar-greeting">
                    <span>Xin chào, <strong>{user?.name || 'Quản trị viên'}</strong></span>
                </div>
            </div>
        </header>
    );
}
