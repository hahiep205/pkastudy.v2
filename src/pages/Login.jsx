import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import axiosClient from '../utils/axiosClient';
import '../assets/css/login-styles.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigateAfterLogin = (nextUser) => {
        navigate(nextUser?.role === 'admin' ? '/manager' : '/dashboard');
    };

    const handleEmailLogin = async () => {
        setErrorMessage('');

        if (!email.trim() || !password.trim()) {
            setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            const result = await axiosClient.post('/auth/login', { email, password });
            
            if (!result?.user || !result?.token) {
                throw new Error('Phản hồi đăng nhập không hợp lệ.');
            }
            login({
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                status: result.user.status,
                token: result.token,
            });
            navigateAfterLogin(result.user);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || error.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMessage('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const data = await axiosClient.post('/auth/google', { idToken });
            
            if (!data?.user || !data?.token) {
                throw new Error('Phản hồi đăng nhập Google không hợp lệ.');
            }
            login({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                status: data.user.status,
                token: data.token,
            });
            navigateAfterLogin(data.user);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || error.message || 'Đăng nhập Google thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-wrapper">
            <div className="auth-container">
                {/* Phần bên trái: Sidebar (Đồng bộ với Register) */}
                <div className="auth-sidebar">
                    <div className="auth-sidebar-content">
                        <h2 className="sidebar-title">Mừng bạn<br />Quay trở lại!</h2>
                        <p className="sidebar-subtitle">Tiếp tục hành trình chinh phục ngôn ngữ cùng Pkastudy.</p>

                        <ul className="modern-benefits-list">
                            <li><span className="b-icon">✓</span> Đồng bộ tiến trình học</li>
                            <li><span className="b-icon">✓</span> Mở khóa bài học mới</li>
                            <li><span className="b-icon">✓</span> Chat cùng trợ lý AI</li>
                        </ul>
                    </div>
                </div>

                {/* Phần bên phải: Form đăng nhập */}
                <div className="auth-main">
                    <div className="auth-form-header">
                        <h1 className="be-vietnam-pro-extrabold">Đăng nhập</h1>
                        <p>Nhập thông tin tài khoản của bạn để tiếp tục.</p>
                    </div>

                    <form className="modern-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-floating">
                            <input
                                type="email"
                                id="login-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="login-email">Email của bạn</label>
                        </div>

                        <div className="form-floating">
                            <input
                                type="password"
                                id="login-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="login-password">Mật khẩu</label>
                        </div>

                        {errorMessage && <div className="alert-box error">{errorMessage}</div>}

                        <div className="form-options">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Ghi nhớ đăng nhập
                            </label>
                            <a href="#" className="text-link-small">Quên mật khẩu?</a>
                        </div>

                        <button
                            type="button"
                            className="btn-modern-primary btn-lg btn-block"
                            onClick={handleEmailLogin}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Đăng nhập ngay'}
                        </button>

                        <div className="auth-divider">
                            <span>hoặc</span>
                        </div>

                        <button
                            type="button"
                            className="btn-google btn-lg btn-block"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Đăng nhập với Google
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        <p>Chưa có tài khoản? <Link to="/register" className="text-link-bold">Đăng ký miễn phí</Link></p>
                        <p className="legal-text">
                            Pkastudy - Nền tảng học ngoại ngữ ứng dụng AI thông minh.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
