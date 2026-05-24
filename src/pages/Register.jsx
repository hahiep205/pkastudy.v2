import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import '../assets/css/login-styles.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const navigate = useNavigate();
    const [codeSent, setCodeSent] = useState(false);
    const [sendCodeMessage, setSendCodeMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sendingCode, setSendingCode] = useState(false);
    const [registering, setRegistering] = useState(false);

    const handleSendVerificationCode = async () => {
        setErrorMessage('');
        setSendCodeMessage('');
        if (!email.trim()) {
            setErrorMessage('Vui lòng nhập email');
            return;
        }

        setSendingCode(true);
        try {
            const res = await axiosClient.post('/auth/send-verification', { email });
            setCodeSent(true);
            setSendCodeMessage(res.message || 'Đã gửi mã xác thực. Vui lòng kiểm tra email.');
        } catch (error) {
            setErrorMessage(error.response?.data?.error || error.message || 'Lỗi gửi mã xác thực');
        } finally {
            setSendingCode(false);
        }
    };

    const handleRegister = async () => {
        setErrorMessage('');
        if (!name.trim() || !email.trim() || !password.trim() || !verificationCode.trim()) {
            setErrorMessage('Vui lòng điền đủ thông tin và mã xác thực');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp');
            return;
        }

        setRegistering(true);
        try {
            await axiosClient.post('/auth/register', {
                name,
                email,
                password,
                verificationCode
            });
            navigate('/login');
        } catch (error) {
            setErrorMessage(error.response?.data?.error || error.message || 'Đăng ký thất bại');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <main className="auth-wrapper">
            <div className="auth-container">
                {/* Phần bên trái: Hình ảnh hoặc Giới thiệu */}
                <div className="auth-sidebar">
                    <div className="auth-sidebar-content">
                        <h2 className="sidebar-title">Học ngoại ngữ<br />Miễn phí. Thông minh.</h2>
                        <p className="sidebar-subtitle">Lưu tiến trình, học với AI và kết nối cộng đồng.</p>

                        <ul className="modern-benefits-list">
                            <li><span className="b-icon">✦</span> 100% Miễn phí trọn đời</li>
                            <li><span className="b-icon">✦</span> Trợ lý AI hỗ trợ 24/7</li>
                            <li><span className="b-icon">✦</span> Cá nhân hóa lộ trình học</li>
                        </ul>
                    </div>
                </div>

                {/* Phần bên phải: Form đăng ký */}
                <div className="auth-main">
                    <div className="auth-form-header">
                        <h1 className="be-vietnam-pro-extrabold">Đăng ký ngay</h1>
                        <p>Chào mừng bạn! Vui lòng nhập thông tin để bắt đầu.</p>
                    </div>

                    <form className="modern-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-floating">
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder=" " required />
                            <label htmlFor="name">Họ và tên</label>
                        </div>

                        <div className="form-row split-email-code">
                            <div className="form-floating email-field">
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
                            <button
                                type="button"
                                className={`btn-get-code ${codeSent ? 'sent' : ''}`}
                                onClick={handleSendVerificationCode}
                                disabled={sendingCode || !email.trim()}
                            >
                                {sendingCode ? <span className="spinner-sm"></span> : codeSent ? 'Gửi lại' : 'Lấy mã'}
                            </button>
                        </div>

                        {/* Ô nhập mã — luôn hiển thị, disable cho đến khi gửi mã */}
                        <div className={`form-floating code-field ${!codeSent ? 'field-locked' : 'animated fadeIn'}`}>
                            <input
                                type="text"
                                id="code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder=" "
                                maxLength="6"
                                disabled={!codeSent}
                                required
                            />
                            <label htmlFor="code">
                                {codeSent ? 'Mã xác thực (6 số)' : 'Nhập mã xác thực sau khi gửi email'}
                            </label>
                            {codeSent && sendCodeMessage && (
                                <span className="code-hint">✓ Mã đã gửi tới {email}</span>
                            )}
                        </div>

                        {codeSent && (
                            <div className="form-floating animated fadeIn">
                                <input type="text" id="code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder=" " maxLength="6" required />
                                <label htmlFor="code">Mã xác thực (6 số)</label>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-floating">
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " required />
                                <label htmlFor="password">Mật khẩu</label>
                            </div>
                            <div className="form-floating">
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder=" " required />
                                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                            </div>
                        </div>

                        {/* Thông báo lỗi/thành công */}
                        {errorMessage && <div className="alert-box error">{errorMessage}</div>}
                        {sendCodeMessage && <div className="alert-box success">{sendCodeMessage}</div>}

                        <button
                            type="button"
                            className="btn-modern-primary btn-lg btn-block"
                            onClick={handleRegister}
                            disabled={registering}
                        >
                            {registering ? <span className="spinner"></span> : 'Tạo tài khoản Pkastudy'}
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        <p>Đã có tài khoản? <Link to="/login" className="text-link-bold">Đăng nhập</Link></p>
                        <p className="legal-text">
                            Bằng việc đăng ký, bạn đồng ý với <a href="#" className="text-link">Điều khoản dịch vụ</a> và <a href="#" className="text-link">Chính sách bảo mật</a>.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}