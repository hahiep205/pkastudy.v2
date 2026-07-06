import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import '../assets/css/login-styles.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setErrorMessage('Vui long nhap day du thong tin.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Mat khau xac nhan khong khop.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        name: name.trim(),
                        full_name: name.trim(),
                    },
                },
            });

            if (error) {
                throw error;
            }

            setSuccessMessage('Da tao tai khoan. Vui long kiem tra email de xac minh neu can.');
            setTimeout(() => navigate('/login'), 1000);
        } catch (error) {
            setErrorMessage(error.message || 'Dang ky that bai');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-sidebar">
                    <div className="auth-sidebar-content">
                        <h2 className="sidebar-title">Hoc ngoai ngu<br />Mien phi. Thong minh.</h2>
                        <p className="sidebar-subtitle">Luu tien trinh, hoc voi AI va ket noi cong dong.</p>

                        <ul className="modern-benefits-list">
                            <li><span className="b-icon">+</span> 100% Mien phi tron doi</li>
                            <li><span className="b-icon">+</span> Tro ly AI ho tro 24/7</li>
                            <li><span className="b-icon">+</span> Ca nhan hoa lo trinh hoc</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-main">
                    <div className="auth-form-header">
                        <h1 className="be-vietnam-pro-extrabold">Dang ky ngay</h1>
                        <p>Chao mung ban! Vui long nhap thong tin de bat dau.</p>
                    </div>

                    <form className="modern-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-floating">
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="name">Ho va ten</label>
                        </div>

                        <div className="form-floating">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="email">Email</label>
                        </div>

                        <div className="form-row">
                            <div className="form-floating">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="password">Mat khau</label>
                            </div>
                            <div className="form-floating">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="confirmPassword">Xac nhan mat khau</label>
                            </div>
                        </div>

                        {errorMessage && <div className="alert-box error">{errorMessage}</div>}
                        {successMessage && <div className="alert-box success">{successMessage}</div>}

                        <button
                            type="button"
                            className="btn-modern-primary btn-lg btn-block"
                            onClick={handleRegister}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Tao tai khoan Pkastudy'}
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        <p>Da co tai khoan? <Link to="/login" className="text-link-bold">Dang nhap</Link></p>
                        <p className="legal-text">
                            Bang viec dang ky, ban dong y voi <a href="#" className="text-link">Dieu khoan dich vu</a> va <a href="#" className="text-link">Chinh sach bao mat</a>.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
