import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  UserCircle,
  Shield,
  Calendar,
  Camera,
  Key
} from 'lucide-react';

const ProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update user data in localStorage
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        
        setMessage({ type: 'success', text: 'Profile berhasil diupdate!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok!' });
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password berhasil diubah!' });
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengubah password' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.nama_lengkap) {
      return user.nama_lengkap.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrator' : 'User';
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="card">
          <div className="empty-state">
            <User size={48} />
            <p>Silakan login terlebih dahulu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">
          <UserCircle size={28} />
          Profile Saya
        </h1>
        <p className="page-subtitle">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-large">
              {getInitials()}
            </div>
            <button className="avatar-edit">
              <Camera size={16} />
            </button>
          </div>
          <div className="profile-info">
            <h2>{user.nama_lengkap || user.username}</h2>
            <p className="profile-username">@{user.username}</p>
            <div className="profile-badges">
              <span className="badge-role">
                <Shield size={14} />
                {getRoleLabel(user.role)}
              </span>
              <span className="badge-joined">
                <Calendar size={14} />
                Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* Form Profile */}
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <h3 className="form-section-title">
            <User size={18} />
            Informasi Profile
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Nama Lengkap</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={profileData.nama_lengkap}
                  onChange={(e) => setProfileData({ ...profileData, nama_lengkap: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="input-disabled"
                />
              </div>
              <span className="field-note">Username tidak dapat diubah</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Menyimpan...' : 'Simpan Profile'}
          </button>
        </form>

        {/* Form Change Password */}
        <form onSubmit={handlePasswordChange} className="profile-form password-form">
          <h3 className="form-section-title">
            <Key size={18} />
            Ubah Password
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Password Lama</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="Masukkan password lama"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password Baru</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Masukkan password baru (min 6 karakter)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Konfirmasi Password Baru</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Konfirmasi password baru"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Key size={18} />
            {loading ? 'Memproses...' : 'Ubah Password'}
          </button>
        </form>
      </div>

      <style>{`
        .profile-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .page-title svg {
          color: #4f46e5;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
          padding: 24px;
          max-width: 800px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .profile-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
        }

        .avatar-edit {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #475569;
        }

        .avatar-edit:hover {
          background: #f8fafc;
          border-color: #4f46e5;
          color: #4f46e5;
        }

        .profile-info h2 {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .profile-username {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .profile-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge-role {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 12px;
          background: #eef2ff;
          color: #4f46e5;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-joined {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 12px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .profile-form {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .password-form {
          border-top: 2px solid #f1f5f9;
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 16px 0;
        }

        .form-section-title svg {
          color: #4f46e5;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }

        .input-wrapper input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: #f8fafc;
          color: #0f172a;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .input-wrapper input.input-disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .field-note {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .empty-state svg {
          opacity: 0.3;
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .profile-card {
            padding: 16px;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .profile-badges {
            justify-content: center;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .page-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;