import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import axiosClient from '../utils/axiosClient';
import '../assets/css/login-styles.css';

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigateAfterLogin = (nextUser) => {
        navigate(nextUser?.role === 'admin' ? '/manager' : '/dashboard');
    };

    const resolveApiBaseUrl = () => {
        const configuredBaseUrl = axiosClient.defaults.baseURL?.trim().replace(/\/$/, '');
        if (configuredBaseUrl) {
            return configuredBaseUrl;
        }

        if (typeof window !== 'undefined') {
            if (window.location.port === '5173') {
                return 'http://localhost:4000/api';
            }

            return `${window.location.origin}/api`;
        }

        return 'http://localhost:4000/api';
    };

    useEffect(() => {
        if (user?.token) {
            navigateAfterLogin(user);
        }
    }, [user, navigate]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code || !state) return;

        let active = true;
        const completeGoogleLogin = async () => {
            setLoading(true);
            setErrorMessage('');

            try {
                const result = await axiosClient.post('/auth/google/complete', {
                    code,
                    state,
                });

                if (!active || !result?.user || !result?.token) {
                    throw new Error('Phan hoi dang nhap khong hop le.');
                }

                login({
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                    status: result.user.status,
                    token: result.token,
                });

                window.history.replaceState({}, '', '/login');
                navigateAfterLogin(result.user);
            } catch (error) {
                if (active) {
                    setErrorMessage(error.response?.data?.error || error.message || 'Dang nhap Google that bai');
                    window.history.replaceState({}, '', '/login');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void completeGoogleLogin();

        return () => {
            active = false;
        };
    }, [login, navigate]);

    const handleEmailLogin = async () => {
        setErrorMessage('');

        if (!email.trim() || !password.trim()) {
            setErrorMessage('Vui long nhap day du email va mat khau.');
            return;
        }

        setLoading(true);
        try {
            const result = await axiosClient.post('/auth/login', {
                email: email.trim(),
                password,
            });

            if (!result?.user || !result?.token) {
                throw new Error('Phan hoi dang nhap khong hop le.');
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
            setErrorMessage(error.response?.data?.error || error.message || 'Dang nhap that bai');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMessage('');
        const baseUrl = resolveApiBaseUrl();
        const redirectTo = `${window.location.origin}/login`;
        window.location.href = `${baseUrl.replace(/\/$/, '')}/auth/google/start?redirectTo=${encodeURIComponent(redirectTo)}`;
    };

    return (
        <main className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-sidebar">
                    <div className="auth-sidebar-content">
                        <h2 className="sidebar-title">Mung ban<br />Quay tro lai!</h2>
                        <p className="sidebar-subtitle">Tiep tuc hanh trinh chinh phuc ngon ngu cung Pkastudy.</p>

                        <ul className="modern-benefits-list">
                            <li><span className="b-icon">+</span> Dong bo tien trinh hoc</li>
                            <li><span className="b-icon">+</span> Mo khoa bai hoc moi</li>
                            <li><span className="b-icon">+</span> Chat cung tro ly AI</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-main">
                    <div className="auth-form-header">
                        <h1 className="be-vietnam-pro-extrabold">Dang nhap</h1>
                        <p>Nhap thong tin tai khoan cua ban de tiep tuc.</p>
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
                            <label htmlFor="login-email">Email cua ban</label>
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
                            <label htmlFor="login-password">Mat khau</label>
                        </div>

                        {errorMessage && <div className="alert-box error">{errorMessage}</div>}

                        <div className="form-options">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Ghi nho dang nhap
                            </label>
                            <a href="#" className="text-link-small">Quen mat khau?</a>
                        </div>

                        <button
                            type="button"
                            className="btn-modern-primary btn-lg btn-block"
                            onClick={handleEmailLogin}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Dang nhap ngay'}
                        </button>

                        <div className="auth-divider">
                            <span>hoac</span>
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
                            Dang nhap voi Google
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        <p>Chua co tai khoan? <Link to="/register" className="text-link-bold">Dang ky mien phi</Link></p>
                        <p className="legal-text">
                            Pkastudy - Nen tang hoc ngoai ngu ung dung AI thong minh.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
