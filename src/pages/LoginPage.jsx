import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    User, Lock, Eye, EyeOff, LogIn, BookOpen, ArrowLeft, 
    UserPlus, Mail, UserCheck, X, CheckCircle, AlertCircle
} from 'lucide-react';

const LoginPage = ({ setIsAuthenticated, setUser }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState('');
    const [registerError, setRegisterError] = useState('');

    // Register form state
    const [registerForm, setRegisterForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nama_lengkap: '',
        email: ''
    });
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password
            });

            if (response.data.success) {
                const { user, token } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                if (typeof setIsAuthenticated === 'function') {
                    setIsAuthenticated(true);
                }
                if (typeof setUser === 'function') {
                    setUser(user);
                }
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegisterError('');
        setRegisterSuccess('');
        
        // Validasi
        if (registerForm.password !== registerForm.confirmPassword) {
            setRegisterError('Password dan konfirmasi password tidak cocok!');
            return;
        }
        
        if (registerForm.password.length < 6) {
            setRegisterError('Password minimal 6 karakter!');
            return;
        }

        if (!registerForm.username || !registerForm.password) {
            setRegisterError('Username dan password wajib diisi!');
            return;
        }

        setRegisterLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/auth/register', {
                username: registerForm.username,
                password: registerForm.password,
                nama_lengkap: registerForm.nama_lengkap || null,
                email: registerForm.email || null,
                role: 'user'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRegisterSuccess('✅ Akun berhasil dibuat! Silakan login.');
                setRegisterForm({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    nama_lengkap: '',
                    email: ''
                });
                
                // Tutup modal setelah 2 detik
                setTimeout(() => {
                    setShowRegister(false);
                    setRegisterSuccess('');
                }, 2000);
            }
        } catch (err) {
            setRegisterError(err.response?.data?.message || 'Gagal membuat akun');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Panel */}
                <div className="login-left">
                    <div className="login-brand">
                        <div className="brand-icon">
                            <BookOpen size={32} />
                        </div>
                        <div>
                            <h1>SPK AHP</h1>
                            <p>Perpustakaan Kabupaten Brebes</p>
                        </div>
                    </div>
                    <div className="login-illustration">
                        <BookOpen size={80} className="illustration-icon" />
                    </div>
                    <div className="login-quote">
                        <p>"Membaca adalah jendela dunia"</p>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="login-right">
                    <div className="login-card">
                        <div className="login-header">
                            <h2>Selamat Datang</h2>
                            <p className="login-subtitle">Masuk ke akun Anda</p>
                        </div>

                        {error && (
                            <div className="alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Masukkan username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Masuk
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <div className="demo-cred">
                                <span>Demo: </span>
                                <strong>admin</strong>
                                <span>/</span>
                                <strong>admin123</strong>
                            </div>
                            <div className="login-actions">
                                <button 
                                    className="btn-back"
                                    onClick={() => navigate('/')}
                                >
                                    <ArrowLeft size={16} />
                                    Kembali ke Beranda
                                </button>
                                <button 
                                    className="btn-register"
                                    onClick={() => setShowRegister(true)}
                                >
                                    <UserPlus size={16} />
                                    Daftar Akun
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Register */}
            {showRegister && (
                <div className="modal-overlay" onClick={() => setShowRegister(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <UserPlus size={22} style={{ color: '#4f46e5' }} />
                                <h3>Daftar Akun Baru</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowRegister(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {registerSuccess && (
                            <div className="alert success">
                                <CheckCircle size={18} />
                                <span>{registerSuccess}</span>
                            </div>
                        )}

                        {registerError && (
                            <div className="alert error">
                                <AlertCircle size={18} />
                                <span>{registerError}</span>
                                <button className="alert-close" onClick={() => setRegisterError('')}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="register-form">
                            <div className="form-group">
                                <label>Username <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Masukkan username"
                                        value={registerForm.username}
                                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Nama Lengkap</label>
                                <div className="input-wrapper">
                                    <UserCheck size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Masukkan nama lengkap"
                                        value={registerForm.nama_lengkap}
                                        onChange={(e) => setRegisterForm({ ...registerForm, nama_lengkap: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        placeholder="Masukkan email"
                                        value={registerForm.email}
                                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showRegisterPassword ? 'text' : 'password'}
                                        placeholder="Minimal 6 karakter"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    >
                                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Konfirmasi Password <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        placeholder="Konfirmasi password"
                                        value={registerForm.confirmPassword}
                                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-info">
                                <AlertCircle size={16} style={{ color: '#4f46e5' }} />
                                <span>Dengan mendaftar, Anda menyetujui syarat dan ketentuan yang berlaku.</span>
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    onClick={() => setShowRegister(false)}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit" 
                                    disabled={registerLoading}
                                >
                                    {registerLoading ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            Daftar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f7fc;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                .login-container {
                    display: flex;
                    max-width: 960px;
                    width: 100%;
                    background: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
                    border: 1px solid #f0eff5;
                    min-height: 520px;
                }

                /* Left Panel */
                .login-left {
                    flex: 1.1;
                    padding: 44px 40px 36px;
                    background: #faf9fe;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid #f0eff5;
                }

                .login-brand {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 48px;
                }

                .brand-icon {
                    width: 48px;
                    height: 48px;
                    background: #4f46e5;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .login-brand h1 {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a1a2e;
                    line-height: 1.2;
                }

                .login-brand p {
                    font-size: 13px;
                    color: #8b8ba0;
                }

                .login-illustration {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .illustration-icon {
                    color: #4f46e5;
                    opacity: 0.10;
                }

                .login-quote {
                    margin-top: 32px;
                    padding: 16px 20px;
                    background: #f0eeff;
                    border-radius: 12px;
                    border-left: 3px solid #4f46e5;
                }

                .login-quote p {
                    font-size: 14px;
                    color: #4a4a6a;
                    font-style: italic;
                    font-weight: 450;
                }

                /* Right Panel */
                .login-right {
                    flex: 1;
                    padding: 44px 40px;
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                }

                .login-card {
                    width: 100%;
                    max-width: 360px;
                    margin: 0 auto;
                }

                .login-header {
                    margin-bottom: 32px;
                }

                .login-header h2 {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1a1a2e;
                    letter-spacing: -0.3px;
                }

                .login-subtitle {
                    color: #8b8ba0;
                    font-size: 15px;
                    margin-top: 4px;
                }

                .alert-error {
                    padding: 12px 16px;
                    background: #fef6f6;
                    border: 1px solid #fde2e2;
                    border-radius: 10px;
                    color: #dc2626;
                    font-size: 14px;
                    margin-bottom: 24px;
                }

                .form-group {
                    margin-bottom: 18px;
                }

                .form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1a1a2e;
                    margin-bottom: 6px;
                }

                .required {
                    color: #dc2626;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 14px;
                    color: #b0b0c8;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 13px 16px 13px 44px;
                    border: 1.5px solid #e8e6f0;
                    border-radius: 12px;
                    font-size: 14px;
                    background: #fafafe;
                    color: #1a1a2e;
                    transition: all 0.2s ease;
                }

                .input-wrapper input::placeholder {
                    color: #c5c5d8;
                }

                .input-wrapper input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.06);
                }

                .input-wrapper input:focus ~ .input-icon {
                    color: #4f46e5;
                }

                .toggle-password {
                    position: absolute;
                    right: 14px;
                    background: none;
                    border: none;
                    color: #b0b0c8;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                }

                .toggle-password:hover {
                    color: #4a4a6a;
                    background: #f0eff5;
                }

                .btn-login {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 14px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 8px;
                    border: 1px solid #4f46e5;
                }

                .btn-login:hover:not(:disabled) {
                    background: #4338ca;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25);
                }

                .btn-login:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2.5px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .login-footer {
                    margin-top: 28px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .demo-cred {
                    padding: 8px 18px;
                    background: #f8f7fc;
                    border-radius: 100px;
                    font-size: 13px;
                    color: #6b6b84;
                    border: 1px solid #f0eff5;
                }

                .demo-cred strong {
                    color: #1a1a2e;
                    font-weight: 600;
                }

                .demo-cred strong:last-child {
                    color: #4f46e5;
                }

                .login-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }

                .btn-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: none;
                    color: #8b8ba0;
                    font-size: 13px;
                    cursor: pointer;
                    padding: 6px 12px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    flex: 1;
                    justify-content: center;
                }

                .btn-back:hover {
                    color: #4a4a6a;
                    background: #f8f7fc;
                }

                .btn-register {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex: 1;
                    justify-content: center;
                }

                .btn-register:hover {
                    background: #4338ca;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                    animation: fadeIn 0.2s ease;
                }

                .modal-container {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 460px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
                    animation: slideUp 0.25s ease;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .modal-header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .modal-header-left h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin: 0;
                }

                .modal-close {
                    width: 34px;
                    height: 34px;
                    border: none;
                    border-radius: 8px;
                    background: #f8fafc;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #8a9ab8;
                    transition: all 0.15s;
                }

                .modal-close:hover {
                    background: #f0f2f7;
                    color: #1a1a2e;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .alert.success {
                    background: #eef6ef;
                    border: 1px solid #c6dec7;
                    color: #276749;
                }

                .alert.error {
                    background: #fcf0f0;
                    border: 1px solid #f5d0d0;
                    color: #9b2c2c;
                }

                .alert-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.5;
                    padding: 4px;
                }

                .alert-close:hover {
                    opacity: 1;
                }

                .register-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .form-info {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 10px 12px;
                    background: #f0eeff;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #4a4a6a;
                    line-height: 1.5;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 10px;
                    background: #f8fafc;
                    color: #4a5568;
                    border: 1px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-cancel:hover {
                    background: #f0f2f7;
                }

                .btn-submit {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #4338ca;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }

                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                    display: inline-block;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Responsive */
                @media (max-width: 820px) {
                    .login-container {
                        flex-direction: column;
                        max-width: 420px;
                        min-height: auto;
                    }

                    .login-left {
                        padding: 28px 24px 24px;
                        border-right: none;
                        border-bottom: 1px solid #f0eff5;
                    }

                    .login-right {
                        padding: 32px 24px;
                    }

                    .login-card {
                        max-width: 100%;
                    }

                    .login-brand {
                        margin-bottom: 32px;
                    }

                    .login-illustration {
                        padding: 16px 0;
                    }

                    .illustration-icon {
                        width: 60px;
                        height: 60px;
                    }

                    .login-quote {
                        margin-top: 24px;
                    }

                    .login-header h2 {
                        font-size: 22px;
                    }

                    .modal-container {
                        padding: 24px;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }

                    .login-actions {
                        flex-direction: column;
                    }
                }

                @media (max-width: 480px) {
                    .login-page {
                        padding: 12px;
                    }

                    .login-container {
                        border-radius: 20px;
                    }

                    .login-left {
                        padding: 20px 16px 20px;
                    }

                    .login-right {
                        padding: 24px 16px;
                    }

                    .brand-icon {
                        width: 40px;
                        height: 40px;
                    }

                    .brand-icon svg {
                        width: 22px;
                        height: 22px;
                    }

                    .login-brand h1 {
                        font-size: 18px;
                    }

                    .login-header h2 {
                        font-size: 20px;
                    }

                    .illustration-icon {
                        width: 48px;
                        height: 48px;
                    }

                    .demo-cred {
                        font-size: 12px;
                        padding: 6px 14px;
                    }

                    .modal-container {
                        padding: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;