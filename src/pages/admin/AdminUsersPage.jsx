import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Edit, Trash2, Search, RefreshCw, Shield, User } from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_lengkap: '',
    email: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        // Update user
        await axios.put(`/api/auth/users/${editingUser.id_user}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('User berhasil diupdate');
      } else {
        // Create user
        await axios.post('/api/auth/register', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('User berhasil ditambahkan');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', nama_lengkap: '', email: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User berhasil dihapus');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      nama_lengkap: user.nama_lengkap || '',
      email: user.email || '',
      role: user.role || 'user'
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    (user.nama_lengkap && user.nama_lengkap.toLowerCase().includes(search.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getRoleBadge = (role) => {
    if (role === 'admin' || role === 'superadmin') {
      return <span className="badge-admin"><Shield size={12} /> {role}</span>;
    }
    return <span className="badge-user"><User size={12} /> {role}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data user...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <Users size={28} />
            Kelola User
          </h1>
          <p className="page-subtitle">Kelola data user yang terdaftar di sistem</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={fetchUsers}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', password: '', nama_lengkap: '', email: '', role: 'user' });
            setShowModal(true);
          }}>
            <UserPlus size={16} />
            Tambah User
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="card-info">
            Total: <strong>{users.length}</strong> user
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">Belum ada data user</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id_user}>
                    <td>{index + 1}</td>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.nama_lengkap || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => handleEdit(user)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(user.id_user)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  placeholder="Masukkan username"
                />
              </div>
              <div className="form-group">
                <label>Password {!editingUser && '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-users-page {
          padding: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-header-left {
          flex: 1;
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

        .page-header-right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          min-width: 250px;
        }

        .search-wrapper svg {
          color: #94a3b8;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          flex: 1;
          color: #0f172a;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .card-info {
          font-size: 14px;
          color: #64748b;
        }

        .card-info strong {
          color: #0f172a;
        }

        .table-wrapper {
          overflow-x: auto;
          padding: 0 4px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
          vertical-align: middle;
        }

        .table tbody tr:hover {
          background: #f8fafc;
        }

        .table tbody tr:last-child td {
          border-bottom: none;
        }

        .empty-row {
          text-align: center;
          color: #94a3b8;
          padding: 40px 20px !important;
        }

        .badge-admin {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background: #eef2ff;
          color: #4f46e5;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-user {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action.edit {
          background: #eef2ff;
          color: #4f46e5;
        }

        .btn-action.edit:hover {
          background: #e0e7ff;
        }

        .btn-action.delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .btn-action.delete:hover {
          background: #fee2e2;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
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

        .btn-primary:hover {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .btn-outline {
          background: transparent;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn-outline:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0;
          animation: modalSlide 0.3s ease;
        }

        @keyframes modalSlide {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .modal-close:hover {
          color: #0f172a;
        }

        .modal-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .form-group input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: flex-end;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-container p {
          margin-top: 16px;
          color: #94a3b8;
          font-size: 14px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 20px;
          }

          .page-header {
            flex-direction: column;
          }

          .page-header-right {
            width: 100%;
          }

          .page-header-right .btn {
            flex: 1;
            justify-content: center;
          }

          .search-wrapper {
            min-width: auto;
            width: 100%;
          }

          .card-header {
            flex-direction: column;
            padding: 12px 16px;
          }

          .table {
            font-size: 12px;
          }

          .table th,
          .table td {
            padding: 8px 10px;
          }

          .modal {
            margin: 20px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUsersPage;