import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, Search, X, Calendar, User, BookOpen, 
    CheckCircle, XCircle, Clock, Eye, Edit2, Trash2,
    RefreshCw, AlertCircle, Clock as ClockIcon
} from 'lucide-react';

const API_URL = '/api';

const PeminjamanPage = () => {
    const [loading, setLoading] = useState(true);
    const [peminjaman, setPeminjaman] = useState([]);
    const [users, setUsers] = useState([]);
    const [buku, setBuku] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        id_user: '',
        id_buku: '',
        tanggal_pinjam: '',
        tanggal_kembali: '',
        status: 'pending'
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const [pRes, uRes, bRes] = await Promise.all([
                axios.get(`${API_URL}/peminjaman/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/auth/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/alternatif`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setPeminjaman(pRes.data?.data || []);
            setUsers(uRes.data?.data || []);
            setBuku(bRes.data?.data || []);
        } catch (error) {
            setError('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_user || !formData.id_buku || !formData.tanggal_pinjam) {
            alert('Semua field wajib diisi!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (editing) {
                await axios.put(`${API_URL}/peminjaman/admin/${editing}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Data peminjaman berhasil diupdate');
            } else {
                await axios.post(`${API_URL}/peminjaman/admin`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Peminjaman berhasil ditambahkan');
            }
            setShowModal(false);
            setEditing(null);
            setFormData({ id_user: '', id_buku: '', tanggal_pinjam: '', tanggal_kembali: '', status: 'pending' });
            fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert('Gagal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleVerifikasi = async (id) => {
        if (!window.confirm('Setujui peminjaman ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/peminjaman/admin/${id}/verifikasi`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Peminjaman berhasil diverifikasi');
            fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert('Gagal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleTolak = async (id) => {
        if (!window.confirm('Tolak peminjaman ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/peminjaman/admin/${id}/tolak`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Peminjaman ditolak');
            fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert('Gagal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePengembalian = async (id) => {
        if (!window.confirm('Buku sudah dikembalikan?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/peminjaman/admin/${id}/kembali`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Buku berhasil dikembalikan');
            fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert('Gagal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data peminjaman ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/peminjaman/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Data peminjaman dihapus');
            fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert('Gagal: ' + error.message);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditing(item.id_peminjaman);
            setFormData({
                id_user: item.id_user,
                id_buku: item.id_buku,
                tanggal_pinjam: item.tanggal_pinjam ? item.tanggal_pinjam.split('T')[0] : '',
                tanggal_kembali: item.tanggal_kembali ? item.tanggal_kembali.split('T')[0] : '',
                status: item.status
            });
        } else {
            setEditing(null);
            setFormData({
                id_user: '',
                id_buku: '',
                tanggal_pinjam: new Date().toISOString().split('T')[0],
                tanggal_kembali: '',
                status: 'pending'
            });
        }
        setShowModal(true);
    };

    const getUserName = (idUser) => {
        const user = users.find(u => u.id_user === idUser);
        return user?.nama_lengkap || user?.username || 'User tidak ditemukan';
    };

    const getBukuTitle = (idBuku) => {
        const book = buku.find(b => b.id_alternatif === idBuku);
        return book?.judul_buku || 'Buku tidak ditemukan';
    };

    const getStatusBadge = (status) => {
        const config = {
            'pending': { icon: ClockIcon, bg: '#fef3e8', color: '#b7794a', label: 'Menunggu Verifikasi' },
            'dipinjam': { icon: BookOpen, bg: '#e8f0fe', color: '#4a6cf7', label: 'Dipinjam' },
            'dikembalikan': { icon: CheckCircle, bg: '#e6f7e6', color: '#38a169', label: 'Dikembalikan' },
            'ditolak': { icon: XCircle, bg: '#fde8e8', color: '#e53e3e', label: 'Ditolak' },
            'terlambat': { icon: AlertCircle, bg: '#fde8e8', color: '#e53e3e', label: 'Terlambat' }
        };
        const conf = config[status] || config['pending'];
        const Icon = conf.icon;
        return (
            <span className="status-badge" style={{ background: conf.bg, color: conf.color }}>
                <Icon size={13} />
                {conf.label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredPeminjaman = peminjaman.filter(item => {
        const userName = getUserName(item.id_user);
        const bukuTitle = getBukuTitle(item.id_buku);
        const matchSearch = 
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bukuTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: peminjaman.length,
        pending: peminjaman.filter(p => p.status === 'pending').length,
        dipinjam: peminjaman.filter(p => p.status === 'dipinjam').length,
        dikembalikan: peminjaman.filter(p => p.status === 'dikembalikan').length,
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manajemen Peminjaman</h1>
                    <p className="page-subtitle">Verifikasi dan kelola peminjaman buku</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchAllData}>
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        <span>Tambah Peminjaman</span>
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {success && (
                <div className="alert success">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f0fe', color: '#4a6cf7' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3e8', color: '#b7794a' }}>
                        <ClockIcon size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.pending}</div>
                        <div className="stat-label">Menunggu</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f0fe', color: '#4a6cf7' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.dipinjam}</div>
                        <div className="stat-label">Dipinjam</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f7e6', color: '#38a169' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.dikembalikan}</div>
                        <div className="stat-label">Dikembalikan</div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <div className="search-wrapper">
                    <Search size={17} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Cari pengguna atau judul buku..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="semua">Semua Status</option>
                    <option value="pending">Menunggu Verifikasi</option>
                    <option value="dipinjam">Dipinjam</option>
                    <option value="dikembalikan">Dikembalikan</option>
                    <option value="ditolak">Ditolak</option>
                    <option value="terlambat">Terlambat</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-card">
                {filteredPeminjaman.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={44} className="empty-icon" />
                        <h3>Belum ada data peminjaman</h3>
                        <p>Mulai tambahkan peminjaman baru</p>
                        <button className="btn-primary" onClick={() => openModal()}>
                            <Plus size={18} />
                            Tambah Peminjaman
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Pengguna</th>
                                    <th>Judul Buku</th>
                                    <th>Tanggal Pinjam</th>
                                    <th>Status</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPeminjaman.map((item, index) => (
                                    <React.Fragment key={item.id_peminjaman}>
                                        <tr>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {getUserName(item.id_user).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{getUserName(item.id_user)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="book-cell">
                                                    <BookOpen size={14} />
                                                    <span>{getBukuTitle(item.id_buku)}</span>
                                                </div>
                                            </td>
                                            <td>{formatDate(item.tanggal_pinjam)}</td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td>
                                                <div className="action-group">
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => setShowDetail(showDetail === item.id_peminjaman ? null : item.id_peminjaman)}
                                                        title="Detail"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button
                                                                className="action-btn verify"
                                                                onClick={() => handleVerifikasi(item.id_peminjaman)}
                                                                title="Setujui"
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                            <button
                                                                className="action-btn reject"
                                                                onClick={() => handleTolak(item.id_peminjaman)}
                                                                title="Tolak"
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status === 'dipinjam' && (
                                                        <button
                                                            className="action-btn return"
                                                            onClick={() => handlePengembalian(item.id_peminjaman)}
                                                            title="Kembalikan"
                                                        >
                                                            <CheckCircle size={15} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => openModal(item)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(item.id_peminjaman)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {showDetail === item.id_peminjaman && (
                                            <tr className="detail-row">
                                                <td colSpan="6">
                                                    <div className="detail-panel">
                                                        <div className="detail-grid">
                                                            <div>
                                                                <div className="detail-label">Pengguna</div>
                                                                <div className="detail-value">{getUserName(item.id_user)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="detail-label">Judul Buku</div>
                                                                <div className="detail-value">{getBukuTitle(item.id_buku)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="detail-label">Tanggal Pinjam</div>
                                                                <div className="detail-value">{formatDate(item.tanggal_pinjam)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="detail-label">Tanggal Kembali</div>
                                                                <div className="detail-value">{formatDate(item.tanggal_kembali)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="detail-label">Status</div>
                                                                <div className="detail-value">{getStatusBadge(item.status)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="detail-label">ID Peminjaman</div>
                                                                <div className="detail-value" style={{ fontSize: '12px', color: '#8a9ab8' }}>#{item.id_peminjaman}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Peminjaman' : 'Tambah Peminjaman'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Pengguna</label>
                                <select
                                    value={formData.id_user}
                                    onChange={(e) => setFormData({ ...formData, id_user: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih Pengguna</option>
                                    {users.map(user => (
                                        <option key={user.id_user} value={user.id_user}>
                                            {user.nama_lengkap || user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Buku</label>
                                <select
                                    value={formData.id_buku}
                                    onChange={(e) => setFormData({ ...formData, id_buku: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih Buku</option>
                                    {buku.map(book => (
                                        <option key={book.id_alternatif} value={book.id_alternatif}>
                                            {book.judul_buku} (Stok: {book.stok})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tanggal Pinjam</label>
                                    <input
                                        type="date"
                                        value={formData.tanggal_pinjam}
                                        onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Kembali</label>
                                    <input
                                        type="date"
                                        value={formData.tanggal_kembali}
                                        onChange={(e) => setFormData({ ...formData, tanggal_kembali: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="pending">Menunggu Verifikasi</option>
                                    <option value="dipinjam">Dipinjam</option>
                                    <option value="dikembalikan">Dikembalikan</option>
                                    <option value="ditolak">Ditolak</option>
                                    <option value="terlambat">Terlambat</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-submit">
                                    {editing ? 'Update' : 'Simpan'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                /* ===== BASE ===== */
                .page-container {
                    padding: 24px 28px;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }

                /* ===== LOADING ===== */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 300px;
                    gap: 16px;
                }

                .spinner {
                    width: 36px;
                    height: 36px;
                    border: 3px solid #e8ecf2;
                    border-top-color: #4a6cf7;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* ===== HEADER ===== */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .page-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1a2332;
                    margin: 0;
                    letter-spacing: -0.3px;
                }

                .page-subtitle {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin-top: 2px;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .btn-refresh {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #e8ecf2;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #7a8aa0;
                    transition: all 0.2s;
                }

                .btn-refresh:hover {
                    background: #f8fafc;
                    border-color: #d0d5e0;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    background: #3a5ce7;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.25);
                }

                /* ===== ALERTS ===== */
                .alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    border-radius: 10px;
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

                /* ===== STATS ===== */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 18px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #eef2f7;
                }

                .stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2332;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 12px;
                    color: #8a9ab8;
                }

                /* ===== FILTER ===== */
                .filter-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .search-wrapper {
                    flex: 1;
                    position: relative;
                    min-width: 180px;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #aab4c8;
                }

                .search-input {
                    width: 100%;
                    padding: 9px 12px 9px 38px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    background: #fafbfc;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.06);
                }

                .filter-select {
                    padding: 9px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    background: #fafbfc;
                    color: #1a2332;
                    cursor: pointer;
                    min-width: 150px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                }

                /* ===== TABLE ===== */
                .table-card {
                    background: white;
                    border-radius: 14px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                }

                .table-wrapper {
                    overflow-x: auto;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .data-table thead {
                    background: #f8fafc;
                }

                .data-table th {
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                    color: #7a8aa0;
                    border-bottom: 1px solid #eef2f7;
                }

                .data-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f4f6fa;
                    color: #2d3748;
                }

                .data-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .data-table tbody tr:hover {
                    background: #fafbfc;
                }

                .text-center {
                    text-align: center;
                }

                /* ===== CELLS ===== */
                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #4a6cf7;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 12px;
                    flex-shrink: 0;
                }

                .book-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #4a6cf7;
                }

                /* ===== STATUS BADGE ===== */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                /* ===== ACTIONS ===== */
                .action-group {
                    display: flex;
                    gap: 3px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .action-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    background: transparent;
                    color: #8a9aa8;
                }

                .action-btn:hover {
                    background: #f0f2f7;
                }

                .action-btn.view:hover { background: #e8f0fe; color: #4a6cf7; }
                .action-btn.verify { color: #38a169; }
                .action-btn.verify:hover { background: #e6f7e6; }
                .action-btn.reject { color: #e53e3e; }
                .action-btn.reject:hover { background: #fde8e8; }
                .action-btn.return { color: #4a6cf7; }
                .action-btn.return:hover { background: #e8f0fe; }
                .action-btn.edit:hover { background: #e8f0fe; color: #4a6cf7; }
                .action-btn.delete:hover { background: #fde8e8; color: #e53e3e; }

                /* ===== DETAIL PANEL ===== */
                .detail-row td {
                    padding: 0 !important;
                    border-bottom: none !important;
                }

                .detail-row:hover td {
                    background: transparent !important;
                }

                .detail-panel {
                    padding: 20px 24px 20px 24px;
                    background: #f8fafc;
                    border-top: 1px solid #eef2f7;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                }

                .detail-label {
                    font-size: 11px;
                    color: #8a9ab8;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .detail-value {
                    font-size: 14px;
                    color: #1a2332;
                    margin-top: 2px;
                }

                /* ===== EMPTY STATE ===== */
                .empty-state {
                    text-align: center;
                    padding: 56px 20px;
                }

                .empty-icon {
                    color: #d0d5e0;
                    margin-bottom: 12px;
                }

                .empty-state h3 {
                    font-size: 17px;
                    color: #1a2332;
                    margin: 0 0 4px;
                }

                .empty-state p {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin: 0 0 16px;
                }

                /* ===== MODAL ===== */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.2s ease;
                }

                .modal {
                    background: white;
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 480px;
                    width: 92%;
                    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12);
                    animation: slideUp 0.25s ease;
                    max-height: 92vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .modal-header h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2332;
                    margin: 0;
                }

                .modal-close {
                    width: 36px;
                    height: 36px;
                    border: none;
                    border-radius: 10px;
                    background: #f8fafc;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #8a9aa8;
                    transition: all 0.15s;
                }

                .modal-close:hover {
                    background: #f0f2f7;
                    color: #1a2332;
                }

                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .form-group label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #2d3748;
                }

                .form-group input,
                .form-group select {
                    padding: 10px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    background: #fafbfc;
                    color: #1a2332;
                    transition: all 0.2s;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.06);
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 8px;
                }

                .btn-submit {
                    flex: 1;
                    padding: 11px 20px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-submit:hover {
                    background: #3a5ce7;
                }

                .btn-cancel {
                    padding: 11px 24px;
                    background: #f8fafc;
                    color: #4a5568;
                    border: 1px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel:hover {
                    background: #f0f2f7;
                }

                /* ===== ANIMATIONS ===== */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(16px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .page-container {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .header-actions .btn-primary {
                        flex: 1;
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .filter-bar {
                        flex-direction: column;
                    }

                    .filter-select {
                        width: 100%;
                    }

                    .data-table {
                        font-size: 13px;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 10px 12px;
                    }

                    .action-group {
                        gap: 2px;
                    }

                    .action-btn {
                        width: 28px;
                        height: 28px;
                    }

                    .modal {
                        padding: 24px;
                        margin: 16px;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .detail-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .detail-panel {
                        padding: 16px 16px 16px 16px;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                    }

                    .stat-card {
                        padding: 12px 14px;
                    }

                    .stat-number {
                        font-size: 17px;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }

                    .detail-grid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PeminjamanPage;