import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BookOpen, Calendar, Clock, CheckCircle, XCircle,
    Eye, RefreshCw, AlertCircle, Plus, X, Send,
    History, Library, Search, ChevronRight
} from 'lucide-react';

const API_URL = '/api';

const PeminjamanUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [peminjaman, setPeminjaman] = useState([]);
    const [buku, setBuku] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id_buku: '',
        tanggal_pinjam: ''
    });

    useEffect(() => {
        fetchAllData();
        setFormData({
            id_buku: '',
            tanggal_pinjam: new Date().toISOString().split('T')[0]
        });
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            const [pRes, bRes] = await Promise.all([
                axios.get(`${API_URL}/peminjaman/riwayat`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/alternatif`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            console.log('📊 Riwayat Peminjaman:', pRes.data);
            console.log('📊 Data Buku:', bRes.data);

            setPeminjaman(pRes.data.data || []);
            setBuku(bRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_buku || !formData.tanggal_pinjam) {
            alert('⚠️ Silakan pilih buku dan tanggal pinjam!');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/peminjaman`, {
                id_buku: formData.id_buku,
                tanggal_pinjam: formData.tanggal_pinjam
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuccess('✅ Pengajuan peminjaman berhasil! Menunggu verifikasi admin.');
                setShowModal(false);
                setFormData({ id_buku: '', tanggal_pinjam: new Date().toISOString().split('T')[0] });
                fetchAllData();
                setTimeout(() => setSuccess(''), 4000);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            setError(error.response?.data?.message || '❌ Gagal mengajukan peminjaman');
            setTimeout(() => setError(''), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'pending': { 
                icon: Clock, 
                color: '#ed8936', 
                bg: '#fffbeb', 
                border: '#fde68a',
                label: '⏳ Menunggu Verifikasi' 
            },
            'dipinjam': { 
                icon: BookOpen, 
                color: '#4a6cf7', 
                bg: '#eff6ff', 
                border: '#bfdbfe',
                label: '📖 Dipinjam' 
            },
            'dikembalikan': { 
                icon: CheckCircle, 
                color: '#38a169', 
                bg: '#f0fdf4', 
                border: '#bbf7d0',
                label: '✅ Dikembalikan' 
            },
            'ditolak': { 
                icon: XCircle, 
                color: '#e53e3e', 
                bg: '#fef2f2', 
                border: '#fecaca',
                label: '❌ Ditolak' 
            },
            'terlambat': { 
                icon: AlertCircle, 
                color: '#e53e3e', 
                bg: '#fef2f2', 
                border: '#fecaca',
                label: '⚠️ Terlambat' 
            }
        };
        const conf = config[status] || config['pending'];
        const Icon = conf.icon;
        return (
            <span className={`status-badge ${status}`} style={{ background: conf.bg, color: conf.color, borderColor: conf.border }}>
                <Icon size={14} />
                {conf.label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getBukuTitle = (idBuku) => {
        const book = buku.find(b => b.id_alternatif === idBuku);
        return book?.judul_buku || 'Tidak diketahui';
    };

    const getBukuPenulis = (idBuku) => {
        const book = buku.find(b => b.id_alternatif === idBuku);
        return book?.penulis || '-';
    };

    const getBukuStok = (idBuku) => {
        const book = buku.find(b => b.id_alternatif === idBuku);
        return book?.stok || 0;
    };

    const filteredPeminjaman = peminjaman.filter(item => {
        const matchSearch = 
            getBukuTitle(item.id_buku).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getBukuPenulis(item.id_buku).toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: peminjaman.length,
        pending: peminjaman.filter(p => p.status === 'pending').length,
        dipinjam: peminjaman.filter(p => p.status === 'dipinjam').length,
        dikembalikan: peminjaman.filter(p => p.status === 'dikembalikan').length,
        ditolak: peminjaman.filter(p => p.status === 'ditolak').length
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="peminjaman-user-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Library size={28} style={{ color: '#4a6cf7', marginRight: '12px' }} />
                        Peminjaman Buku
                    </h1>
                    <p className="page-subtitle">
                        Ajukan peminjaman dan pantau status pengajuan Anda
                    </p>
                </div>
                <button className="btn-pinjam" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Ajukan Peminjaman
                </button>
            </div>

            {/* Messages */}
            {success && (
                <div className="alert success">
                    <CheckCircle size={20} />
                    <span>{success}</span>
                    <button className="alert-close" onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="alert error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#4a6cf7' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Peminjaman</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fffbeb', color: '#ed8936' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.pending}</div>
                        <div className="stat-label">Menunggu Verifikasi</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#4a6cf7' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.dipinjam}</div>
                        <div className="stat-label">Sedang Dipinjam</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f0fdf4', color: '#38a169' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.dikembalikan}</div>
                        <div className="stat-label">Dikembalikan</div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="filter-bar">
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Cari judul atau penulis..."
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
                    <option value="pending">⏳ Menunggu Verifikasi</option>
                    <option value="dipinjam">📖 Dipinjam</option>
                    <option value="dikembalikan">✅ Dikembalikan</option>
                    <option value="ditolak">❌ Ditolak</option>
                </select>
                <button className="btn-refresh" onClick={fetchAllData}>
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Table */}
            <div className="card">
                {filteredPeminjaman.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>Belum Ada Peminjaman</h3>
                        <p>Anda belum melakukan peminjaman buku</p>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Ajukan Peminjaman
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Judul Buku</th>
                                    <th>Penulis</th>
                                    <th>Tanggal Pinjam</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPeminjaman.map((item, index) => {
                                    const isPending = item.status === 'pending';
                                    const isDipinjam = item.status === 'dipinjam';
                                    const isDikembalikan = item.status === 'dikembalikan';
                                    const isDitolak = item.status === 'ditolak';

                                    return (
                                        <tr key={item.id_peminjaman}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="book-info">
                                                    <BookOpen size={14} className="book-icon" />
                                                    <span>{getBukuTitle(item.id_buku)}</span>
                                                </div>
                                            </td>
                                            <td>{getBukuPenulis(item.id_buku)}</td>
                                            <td>{formatDate(item.tanggal_pinjam)}</td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td>
                                                <div className="action-group">
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => setShowDetail(showDetail === item.id_peminjaman ? null : item.id_peminjaman)}
                                                        title="Detail"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {isPending && (
                                                        <span className="status-label pending">
                                                            <Clock size={14} /> Menunggu
                                                        </span>
                                                    )}
                                                    {isDipinjam && (
                                                        <span className="status-label dipinjam">
                                                            <BookOpen size={14} /> Dipinjam
                                                        </span>
                                                    )}
                                                    {isDikembalikan && (
                                                        <span className="status-label returned">
                                                            <CheckCircle size={14} /> Selesai
                                                        </span>
                                                    )}
                                                    {isDitolak && (
                                                        <span className="status-label rejected">
                                                            <XCircle size={14} /> Ditolak
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetail && peminjaman.find(p => p.id_peminjaman === showDetail) && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📋 Detail Peminjaman</h3>
                            <button className="modal-close" onClick={() => setShowDetail(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        {(() => {
                            const item = peminjaman.find(p => p.id_peminjaman === showDetail);
                            return (
                                <div className="detail-content">
                                    <div className="detail-row">
                                        <span className="detail-label">Judul Buku</span>
                                        <span className="detail-value">{getBukuTitle(item.id_buku)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Penulis</span>
                                        <span className="detail-value">{getBukuPenulis(item.id_buku)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Tanggal Pinjam</span>
                                        <span className="detail-value">{formatDate(item.tanggal_pinjam)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Tanggal Kembali</span>
                                        <span className="detail-value">{item.tanggal_kembali ? formatDate(item.tanggal_kembali) : '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Status</span>
                                        <span className="detail-value">{getStatusBadge(item.status)}</span>
                                    </div>
                                    {item.status === 'pending' && (
                                        <div className="detail-info pending">
                                            <Clock size={18} />
                                            <span>Pengajuan sedang menunggu verifikasi admin</span>
                                        </div>
                                    )}
                                    {item.status === 'dipinjam' && (
                                        <div className="detail-info dipinjam">
                                            <BookOpen size={18} />
                                            <span>Buku sedang Anda pinjam. Silakan tunggu konfirmasi pengembalian dari admin.</span>
                                        </div>
                                    )}
                                    {item.status === 'ditolak' && (
                                        <div className="detail-info rejected">
                                            <XCircle size={18} />
                                            <span>Pengajuan peminjaman ditolak oleh admin</span>
                                        </div>
                                    )}
                                    {item.status === 'dikembalikan' && (
                                        <div className="detail-info returned">
                                            <CheckCircle size={18} />
                                            <span>Buku sudah dikembalikan. Terima kasih!</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Modal Ajukan Peminjaman */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📖 Ajukan Peminjaman</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Pilih Buku</label>
                                <select
                                    value={formData.id_buku}
                                    onChange={(e) => setFormData({ ...formData, id_buku: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Buku --</option>
                                    {buku
                                        .filter(b => b.stok > 0)
                                        .map(book => (
                                            <option key={book.id_alternatif} value={book.id_alternatif}>
                                                {book.judul_buku} (Stok: {book.stok})
                                            </option>
                                        ))}
                                </select>
                                {formData.id_buku && (
                                    <span className="field-note">
                                        Stok tersisa: {getBukuStok(formData.id_buku)} buku
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Tanggal Pinjam</label>
                                <input
                                    type="date"
                                    value={formData.tanggal_pinjam}
                                    onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-info">
                                <AlertCircle size={16} />
                                <span>Pengajuan akan diverifikasi oleh admin terlebih dahulu</span>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? '⏳ Memproses...' : (
                                        <>
                                            <Send size={16} />
                                            Ajukan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .peminjaman-user-page {
                    padding: 24px 32px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Header */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .page-title {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1a2744;
                    margin: 0;
                    display: flex;
                    align-items: center;
                }

                .page-subtitle {
                    color: #8a9ab8;
                    font-size: 15px;
                    margin-top: 4px;
                }

                .btn-pinjam {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .btn-pinjam:hover {
                    background: #3a5ce7;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.25);
                }

                /* Alert */
                .alert {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 16px;
                }

                .alert.success {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #15803d;
                }

                .alert.error {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                }

                .alert-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.6;
                    padding: 4px;
                }

                .alert-close:hover {
                    opacity: 1;
                }

                /* Stats */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a2744;
                }

                .stat-label {
                    font-size: 12px;
                    color: #8a9ab8;
                }

                /* Filter */
                .filter-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .search-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 14px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    min-width: 200px;
                }

                .search-wrapper svg {
                    color: #8a9ab8;
                }

                .search-wrapper input {
                    flex: 1;
                    border: none;
                    outline: none;
                    padding: 10px 0;
                    font-size: 14px;
                    background: transparent;
                }

                .filter-select {
                    padding: 10px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    background: white;
                    color: #1a2744;
                    cursor: pointer;
                    min-width: 160px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                }

                .btn-refresh {
                    padding: 0 14px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #4a5a7a;
                    transition: all 0.2s ease;
                }

                .btn-refresh:hover {
                    background: #f8fafc;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                /* Card */
                .card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #6a7a8e;
                    border-bottom: 1px solid #eef2f7;
                }

                .data-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f0f4f9;
                    color: #2d3748;
                    vertical-align: middle;
                }

                .data-table tbody tr:hover {
                    background: #fafbfc;
                }

                .data-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .book-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .book-icon {
                    color: #4a6cf7;
                    flex-shrink: 0;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid;
                    white-space: nowrap;
                }

                .action-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    background: transparent;
                    color: #8a9ab8;
                    transition: all 0.15s ease;
                }

                .action-btn.view:hover {
                    background: #eff6ff;
                    color: #4a6cf7;
                }

                .status-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .status-label.pending {
                    background: #fffbeb;
                    color: #ed8936;
                }

                .status-label.dipinjam {
                    background: #eff6ff;
                    color: #4a6cf7;
                }

                .status-label.returned {
                    background: #f0fdf4;
                    color: #38a169;
                }

                .status-label.rejected {
                    background: #fef2f2;
                    color: #e53e3e;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-state h3 {
                    font-size: 18px;
                    color: #1a2744;
                    margin: 16px 0 4px;
                }

                .empty-state p {
                    color: #8a9ab8;
                    margin-bottom: 16px;
                }

                .empty-state .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .empty-state .btn-primary:hover {
                    background: #3a5ce7;
                    transform: translateY(-2px);
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.3);
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
                    max-width: 480px;
                    width: 100%;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.15);
                    animation: slideUp 0.3s ease;
                    max-height: 90vh;
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
                    color: #1a2744;
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
                    color: #8a9ab8;
                    transition: all 0.15s ease;
                }

                .modal-close:hover {
                    background: #f0f2f7;
                    color: #1a2744;
                }

                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .form-group label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #2d3748;
                }

                .form-group select,
                .form-group input {
                    padding: 10px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                    color: #1a2744;
                }

                .form-group select:focus,
                .form-group input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(74,108,247,0.08);
                }

                .field-note {
                    font-size: 12px;
                    color: #8a9ab8;
                }

                .form-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: #fffbeb;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #ed8936;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 11px;
                    background: #f8fafc;
                    color: #4a5568;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-cancel:hover {
                    background: #f0f2f7;
                }

                .btn-submit {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 11px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #3a5ce7;
                    box-shadow: 0 4px 16px rgba(74,108,247,0.25);
                }

                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Detail Content */
                .detail-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f4f9;
                }

                .detail-row:last-child {
                    border-bottom: none;
                }

                .detail-label {
                    color: #8a9ab8;
                    font-weight: 500;
                    font-size: 13px;
                }

                .detail-value {
                    font-weight: 500;
                    color: #1a2744;
                    text-align: right;
                }

                .detail-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-top: 8px;
                }

                .detail-info.pending {
                    background: #fffbeb;
                    color: #ed8936;
                }

                .detail-info.dipinjam {
                    background: #eff6ff;
                    color: #4a6cf7;
                }

                .detail-info.returned {
                    background: #f0fdf4;
                    color: #38a169;
                }

                .detail-info.rejected {
                    background: #fef2f2;
                    color: #e53e3e;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Loading */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #4a6cf7;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .loading-container p {
                    margin-top: 16px;
                    color: #8a9ab8;
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .peminjaman-user-page {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .btn-pinjam {
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .filter-bar {
                        flex-direction: column;
                    }

                    .search-wrapper {
                        min-width: auto;
                    }

                    .data-table {
                        font-size: 12px;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 8px 10px;
                    }

                    .modal-container {
                        padding: 20px;
                        margin: 12px;
                    }

                    .form-actions {
                        flex-direction: column;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default PeminjamanUserPage;