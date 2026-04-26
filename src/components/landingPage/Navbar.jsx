import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo2 from '../../assets/images/logo2.png';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Xử lý đóng/mở menu và các hiệu ứng đi kèm
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.classList.remove('mobile-menu-open');
        };
    }, [isMobileMenuOpen]);

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/"><img src={logo2} style={{ width: '179px', height: 'auto' }} alt="pkastudy Logo" className="nav-logo" /></Link>
            </div>

            <button
                className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <div
                className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={closeMenu}
            ></div>

            <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="mobile-menu-header">
                    <Link to="/" onClick={closeMenu}><img src={logo2} alt="pkastudy Logo" className="mobile-menu-logo" /></Link>
                    <button className="mobile-menu-close" onClick={closeMenu} aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <nav className="mobile-menu-nav">
                    <Link to="/" className="mobile-nav-link" onClick={closeMenu}>Trang chủ</Link>
                    <Link to="#" className="mobile-nav-link" onClick={closeMenu}>Giới thiệu</Link>
                    <Link to="/dashboard/courses" className="mobile-nav-link" onClick={closeMenu}>Tài liệu</Link>
                    <Link to="#" className="mobile-nav-link" onClick={closeMenu}>Chatbot AI</Link>
                </nav>

                <div className="mobile-menu-actions">
                    <Link to="/login" onClick={closeMenu}><button className="btn btn-secondary btn-mobile-menu">Đăng nhập</button></Link>
                    <Link to="/register" onClick={closeMenu}><button className="btn btn-primary btn-mobile-menu">Đăng ký</button></Link>
                </div>
            </div>

            <div className="nav-links">
                <Link to="/" className="nav-link">Trang chủ</Link>
                <Link to="#" className="nav-link">Giới thiệu</Link>
                <Link to="/dashboard/courses" className="nav-link">Tài liệu</Link>
                <Link to="#" className="nav-link">Chatbot AI</Link>
            </div>

            <div className="nav-right">
                <Link to="/login"><button className="btn btn-nav btn-secondary" style={{ maxHeight: '38px', width: 'auto' }}>Đăng nhập</button></Link>
                <Link to="/register"><button className="btn btn-nav btn-primary" style={{ maxHeight: '38px', width: 'auto' }}>Đăng ký</button></Link>
            </div>
        </nav>
    );
}
