import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BookOpen, Search, Eye, RefreshCw, Calendar, User, 
    BookMarked, Clock, CheckCircle, XCircle, AlertCircle,
    ArrowRight, X, Plus, Filter, ChevronDown, ChevronRight,
    Info, Send, Home, Library, Star, Award,
    ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';

const API_URL = '/api';

const BukuUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [buku, setBuku] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuku, setSelectedBuku] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showModalPinjam, setShowModalPinjam] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('semua');
    const [tanggalPinjam, setTanggalPinjam] = useState('');
    const [user, setUser] = useState(null);
    const [peminjamanUser, setPeminjamanUser] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);

    // Filter
    const [filterPenerbit, setFilterPenerbit] = useState('');
    const [filterTahun, setFilterTahun] = useState('');
    const [penerbitList, setPenerbitList] = useState([]);
    const [tahunList, setTahunList] = useState([]);

    // Helper functions
    const getStatusPeminjaman = (idBuku) => {
        const peminjaman = peminjamanUser.find(p => p.id_buku === idBuku);
        if (!peminjaman) return null;
        return peminjaman.status;
    };

    const isBukuDipinjam = (idBuku) => {
        const status = getStatusPeminjaman(idBuku);
        return status === 'dipinjam' || status === 'pending';
    };

    // Use useMemo for filtered data to optimize performance
    const filteredBuku = useMemo(() => {
        let result = [...buku];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(item => 
                item.judul_buku?.toLowerCase().includes(term) ||
                item.penulis?.toLowerCase().includes(term) ||
                item.penerbit?.toLowerCase().includes(term)
            );
        }

        // Penerbit filter
        if (filterPenerbit) {
            result = result.filter(item => item.penerbit === filterPenerbit);
        }

        // Tahun filter
        if (filterTahun) {
            result = result.filter(item => item.tahun_terbit === filterTahun);
        }

        // Status filter
        if (filterStatus === 'tersedia') {
            result = result.filter(item => item.stok > 0 && !isBukuDipinjam(item.id_alternatif));
        } else if (filterStatus === 'dipinjam') {
            result = result.filter(item => isBukuDipinjam(item.id_alternatif));
        } else if (filterStatus === 'habis') {
            result = result.filter(item => item.stok <= 0);
        }

        return result;
    }, [buku, searchTerm, filterPenerbit, filterTahun, filterStatus, peminjamanUser]);

    // Calculate total pages
    const totalPages = useMemo(() => {
        return Math.ceil(filteredBuku.length / itemsPerPage) || 1;
    }, [filteredBuku, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredBuku]);

    // Get current page data
    const currentData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBuku.slice(startIndex, endIndex);
    }, [filteredBuku, currentPage, itemsPerPage]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        const today = new Date().toISOString().split('T')[0];
        setTanggalPinjam(today);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            
            const bRes = await axios.get(`${API_URL}/alternatif`);
            const data = bRes.data.data || [];
            setBuku(data);

            // Extract unique penerbit and tahun for filters
            const penerbits = [...new Set(data.map(item => item.penerbit).filter(Boolean))];
            const tahuns = [...new Set(data.map(item => item.tahun_terbit).filter(Boolean))];
            setPenerbitList(penerbits.sort());
            setTahunList(tahuns.sort());

            if (token) {
                const pRes = await axios.get(`${API_URL}/peminjaman/riwayat`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPeminjamanUser(pRes.data.data || []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Gagal mengambil data buku');
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterPenerbit('');
        setFilterTahun('');
        setFilterStatus('semua');
        setCurrentPage(1);
    };

    const handlePinjam = (buku) => {
        setSelectedBuku(buku);
        setShowModalPinjam(true);
    };

    const handleSubmitPinjam = async (e) => {
        e.preventDefault();
        if (!selectedBuku || !tanggalPinjam) {
            setError('⚠️ Semua field wajib diisi!');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/peminjaman`, {
                id_buku: selectedBuku.id_alternatif,
                tanggal_pinjam: tanggalPinjam
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuccess('✅ Pengajuan peminjaman berhasil! Menunggu verifikasi admin.');
                setShowModalPinjam(false);
                setSelectedBuku(null);
                fetchData();
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

    const handleDetail = (buku) => {
        setSelectedBuku(buku);
        setShowDetail(true);
    };

    const getStatusBadge = (status) => {
        const config = {
            'pending': { icon: Clock, color: '#ed8936', bg: '#fff3e0', label: 'Menunggu Verifikasi' },
            'dipinjam': { icon: BookOpen, color: '#4a6cf7', bg: '#e3f2fd', label: 'Dipinjam' },
            'dikembalikan': { icon: CheckCircle, color: '#38a169', bg: '#e6f7e6', label: 'Dikembalikan' },
            'ditolak': { icon: XCircle, color: '#e53e3e', bg: '#fce4ec', label: 'Ditolak' }
        };
        const conf = config[status];
        if (!conf) return null;
        const Icon = conf.icon;
        return (
            <span className={`status-badge ${status}`}>
                <Icon size={12} />
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

    const stats = {
        total: buku.length,
        tersedia: buku.filter(b => b.stok > 0 && !isBukuDipinjam(b.id_alternatif)).length,
        dipinjam: buku.filter(b => isBukuDipinjam(b.id_alternatif)).length,
        habis: buku.filter(b => b.stok <= 0).length
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Memuat data buku...</p>
                <style>{`
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
                    .loading-container p { margin-top: 16px; color: #8a9ab8; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="buku-user-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Library size={28} style={{ color: '#4a6cf7', marginRight: '8px' }} />
                        Koleksi Buku Perpustakaan
                    </h1>
                    <p className="page-subtitle">
                        Temukan dan pinjam buku favorit Anda
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8a9ab8' }}>
                            {stats.total} judul buku tersedia
                        </span>
                    </p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={fetchData}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Messages */}
            {success && (
                <div className="alert-success">
                    <CheckCircle size={20} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2c3e7a' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Buku</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f7e6', color: '#38a169' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.tersedia}</div>
                        <div className="stat-label">Tersedia</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fff3e0', color: '#ed8936' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.dipinjam}</div>
                        <div className="stat-label">Dipinjam</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fce4ec', color: '#c62828' }}>
                        <XCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.habis}</div>
                        <div className="stat-label">Stok Habis</div>
                    </div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="filter-bar">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Cari judul, penulis, atau penerbit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filterPenerbit}
                        onChange={(e) => setFilterPenerbit(e.target.value)}
                    >
                        <option value="">Semua Penerbit</option>
                        {penerbitList.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={filterTahun}
                        onChange={(e) => setFilterTahun(e.target.value)}
                    >
                        <option value="">Semua Tahun</option>
                        {tahunList.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="semua">Semua Buku</option>
                        <option value="tersedia">✅ Tersedia</option>
                        <option value="dipinjam">📖 Dipinjam</option>
                        <option value="habis">❌ Stok Habis</option>
                    </select>
                    <button className="btn-filter-reset" onClick={resetFilters}>
                        Reset
                    </button>
                </div>
            </div>

            {/* Grid Buku */}
            <div className="buku-grid">
                {currentData.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>Buku tidak ditemukan</h3>
                        <p>Coba gunakan kata kunci lain atau ubah filter</p>
                        {(searchTerm || filterPenerbit || filterTahun || filterStatus !== 'semua') && (
                            <button className="btn btn-outline" onClick={resetFilters}>
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    currentData.map((item) => {
                        const isDipinjam = isBukuDipinjam(item.id_alternatif);
                        const statusPeminjaman = getStatusPeminjaman(item.id_alternatif);
                        const isTersedia = item.stok > 0 && !isDipinjam;

                        return (
                            <div key={item.id_alternatif} className="buku-card">
                                <div className="buku-card-header">
                                    <div className="buku-card-image">
                                        {item.gambar ? (
                                            <img src={item.gambar} alt={item.judul_buku} />
                                        ) : (
                                            <div className="book-icon-placeholder">
                                                <BookOpen size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="buku-card-status">
                                        {isDipinjam ? (
                                            <span className="status-dipinjam">
                                                {statusPeminjaman === 'pending' ? '⏳ Menunggu' : '📖 Dipinjam'}
                                            </span>
                                        ) : item.stok <= 0 ? (
                                            <span className="status-habis">❌ Habis</span>
                                        ) : (
                                            <span className="status-tersedia">✅ Tersedia</span>
                                        )}
                                    </div>
                                </div>

                                <div className="buku-card-body">
                                    <h3 className="buku-card-title">{item.judul_buku}</h3>
                                    <p className="buku-card-penulis">{item.penulis || 'Penulis tidak diketahui'}</p>
                                    <p className="buku-card-penerbit">{item.penerbit || '-'}</p>
                                    <div className="buku-card-meta">
                                        <span className="meta-item">
                                            <BookOpen size={14} />
                                            Stok: {item.stok}
                                        </span>
                                        {item.tahun_terbit && (
                                            <span className="meta-item">
                                                📅 {item.tahun_terbit}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="buku-card-actions">
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        onClick={() => handleDetail(item)}
                                    >
                                        <Eye size={14} /> Detail
                                    </button>
                                    <button 
                                        className={`btn btn-primary btn-sm ${!isTersedia ? 'disabled' : ''}`}
                                        onClick={() => handlePinjam(item)}
                                        disabled={!isTersedia}
                                    >
                                        {isTersedia ? (
                                            <>
                                                <Send size={14} /> Pinjam
                                            </>
                                        ) : isDipinjam ? (
                                            '⏳ Diproses'
                                        ) : (
                                            '❌ Habis'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <span className="pagination-info">
                        Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredBuku.length)} dari {filteredBuku.length}
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="page-btn"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        {(() => {
                            const pages = [];
                            const total = totalPages;
                            const current = currentPage;
                            
                            if (total <= 5) {
                                for (let i = 1; i <= total; i++) {
                                    pages.push(i);
                                }
                            } else if (current <= 3) {
                                for (let i = 1; i <= 5; i++) {
                                    pages.push(i);
                                }
                            } else if (current >= total - 2) {
                                for (let i = total - 4; i <= total; i++) {
                                    pages.push(i);
                                }
                            } else {
                                for (let i = current - 2; i <= current + 2; i++) {
                                    pages.push(i);
                                }
                            }
                            
                            return pages.map((pageNum) => (
                                <button
                                    key={pageNum}
                                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => goToPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ));
                        })()}

                        <button
                            className="page-btn"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRightIcon size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Detail Buku */}
            {showDetail && selectedBuku && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal-container detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📖 Detail Buku</h3>
                            <button className="modal-close" onClick={() => setShowDetail(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="detail-content">
                            <div className="detail-image">
                                {selectedBuku.gambar ? (
                                    <img src={selectedBuku.gambar} alt={selectedBuku.judul_buku} />
                                ) : (
                                    <div className="book-icon-large">
                                        <BookOpen size={64} />
                                    </div>
                                )}
                            </div>
                            <div className="detail-info">
                                <h2>{selectedBuku.judul_buku}</h2>
                                <div className="detail-row">
                                    <span className="detail-label">Penulis</span>
                                    <span>{selectedBuku.penulis || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Penerbit</span>
                                    <span>{selectedBuku.penerbit || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Tahun Terbit</span>
                                    <span>{selectedBuku.tahun_terbit || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Stok</span>
                                    <span className={selectedBuku.stok > 0 ? 'stok-tersedia' : 'stok-habis'}>
                                        {selectedBuku.stok} buku
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status</span>
                                    {isBukuDipinjam(selectedBuku.id_alternatif) ? (
                                        <span className="status-badge-detail dipinjam">
                                            Sedang Dipinjam
                                        </span>
                                    ) : selectedBuku.stok <= 0 ? (
                                        <span className="status-badge-detail habis">Stok Habis</span>
                                    ) : (
                                        <span className="status-badge-detail tersedia">Tersedia</span>
                                    )}
                                </div>
                                {isBukuDipinjam(selectedBuku.id_alternatif) && (
                                    <div className="detail-row">
                                        <span className="detail-label">Status Peminjaman</span>
                                        {getStatusBadge(getStatusPeminjaman(selectedBuku.id_alternatif))}
                                    </div>
                                )}
                                <div className="detail-actions">
                                    <button 
                                        className={`btn btn-primary btn-full ${selectedBuku.stok <= 0 || isBukuDipinjam(selectedBuku.id_alternatif) ? 'disabled' : ''}`}
                                        onClick={() => {
                                            setShowDetail(false);
                                            handlePinjam(selectedBuku);
                                        }}
                                        disabled={selectedBuku.stok <= 0 || isBukuDipinjam(selectedBuku.id_alternatif)}
                                    >
                                        {selectedBuku.stok <= 0 ? '❌ Stok Habis' : 
                                         isBukuDipinjam(selectedBuku.id_alternatif) ? '⏳ Sedang Diproses' : 
                                         <><Send size={16} /> Ajukan Peminjaman</>}
                                    </button>
                                    <button className="btn btn-outline btn-full" onClick={() => setShowDetail(false)}>
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pinjam */}
            {showModalPinjam && selectedBuku && (
                <div className="modal-overlay" onClick={() => setShowModalPinjam(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📖 Ajukan Peminjaman</h3>
                            <button className="modal-close" onClick={() => setShowModalPinjam(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitPinjam} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Judul Buku</label>
                                <div className="form-static">
                                    <BookOpen size={16} />
                                    <span>{selectedBuku.judul_buku}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Penulis</label>
                                <div className="form-static">
                                    <User size={16} />
                                    <span>{selectedBuku.penulis || '-'}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stok</label>
                                <div className="form-static">
                                    <BookOpen size={16} />
                                    <span>{selectedBuku.stok} buku tersedia</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tanggal Pinjam</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={tanggalPinjam}
                                    onChange={(e) => setTanggalPinjam(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-info-box">
                                <AlertCircle size={16} />
                                <div>
                                    <strong>Informasi:</strong>
                                    <p>Pengajuan akan diverifikasi oleh admin terlebih dahulu. 
                                    Buku akan langsung dipinjam setelah admin menyetujui pengajuan.</p>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? '⏳ Memproses...' : (
                                        <>
                                            <Send size={16} />
                                            Ajukan Peminjaman
                                        </>
                                    )}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowModalPinjam(false)}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .buku-user-page {
                    padding: 24px 32px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
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

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: #4a6cf7;
                    color: white;
                }

                .btn-primary:hover:not(.disabled) {
                    background: #3a5ce7;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
                }

                .btn-primary.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-outline {
                    background: transparent;
                    color: #4a5a7a;
                    border: 2px solid #e2e8f0;
                }

                .btn-outline:hover {
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .btn-sm {
                    padding: 6px 14px;
                    font-size: 12px;
                }

                .btn-full {
                    width: 100%;
                    justify-content: center;
                    padding: 12px;
                }

                .btn-filter-reset {
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #475569;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .btn-filter-reset:hover {
                    background: #e2e8f0;
                }

                .alert-success {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #e6f7e6;
                    border: 1px solid #b7dfb7;
                    border-radius: 8px;
                    color: #276749;
                    margin-bottom: 16px;
                }

                .alert-error {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #fde8e8;
                    border: 1px solid #f5c6c6;
                    border-radius: 8px;
                    color: #9b2c2c;
                    margin-bottom: 16px;
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

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
                    box-shadow: 0 2px 8px rgba(26,39,68,0.06);
                    border: 1px solid #e2e8f0;
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
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 12px;
                    color: #8a9ab8;
                }

                .filter-bar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .search-wrapper {
                    flex: 1;
                    position: relative;
                    min-width: 200px;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9aa8b8;
                }

                .search-input {
                    width: 100%;
                    padding: 9px 12px 9px 40px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.08);
                }

                .clear-search {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #8a9ab8;
                    padding: 4px;
                }

                .clear-search:hover {
                    color: #1a2744;
                }

                .filter-group {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 13px;
                    background: #fafbfc;
                    color: #1a2332;
                    cursor: pointer;
                    min-width: 120px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                }

                .buku-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }

                .buku-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(26,39,68,0.06);
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }

                .buku-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(26,39,68,0.1);
                }

                .buku-card-header {
                    position: relative;
                    padding: 20px;
                    background: #f8fafc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 140px;
                    border-bottom: 1px solid #eef2f7;
                }

                .buku-card-image {
                    width: 100%;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .buku-card-image img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .book-icon-placeholder {
                    width: 80px;
                    height: 80px;
                    background: #eef2ff;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                }

                .buku-card-status {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                }

                .status-tersedia {
                    background: #e6f7e6;
                    color: #38a169;
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .status-dipinjam {
                    background: #fff3e0;
                    color: #ed8936;
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .status-habis {
                    background: #fce4ec;
                    color: #e53e3e;
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .buku-card-body {
                    padding: 16px 20px;
                    flex: 1;
                }

                .buku-card-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                    margin: 0 0 4px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .buku-card-penulis {
                    color: #4a5a7a;
                    font-size: 13px;
                    margin: 0 0 2px 0;
                }

                .buku-card-penerbit {
                    color: #8a9ab8;
                    font-size: 12px;
                    margin: 0 0 8px 0;
                }

                .buku-card-meta {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #8a9ab8;
                }

                .buku-card-actions {
                    padding: 12px 20px;
                    border-top: 1px solid #eef2f7;
                    display: flex;
                    gap: 8px;
                }

                .buku-card-actions .btn {
                    flex: 1;
                    justify-content: center;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 12px;
                }

                .empty-state h3 {
                    font-size: 18px;
                    color: #1a2744;
                    margin: 16px 0 4px;
                }

                .empty-state p {
                    color: #8a9ab8;
                }

                /* Pagination */
                .pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 4px;
                    flex-wrap: wrap;
                    gap: 10px;
                    border-top: 1px solid #eef2f7;
                    margin-top: 20px;
                }

                .pagination-info {
                    font-size: 13px;
                    color: #8a9ab8;
                }

                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }

                .page-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 34px;
                    height: 34px;
                    padding: 0 8px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: #4a5a7a;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .page-btn:hover:not(:disabled):not(.active) {
                    background: #f0f2f7;
                }

                .page-btn.active {
                    background: #4a6cf7;
                    color: white;
                }

                .page-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.2s ease;
                }

                .modal-container {
                    background: white;
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 560px;
                    width: 92%;
                    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
                    animation: slideUp 0.3s ease;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .detail-modal {
                    max-width: 720px;
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
                    color: #7a8aa0;
                    transition: all 0.15s ease;
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

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .form-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #2d3748;
                }

                .form-input {
                    padding: 10px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                    color: #1a2332;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.08);
                }

                .form-static {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: #f8fafc;
                    border-radius: 10px;
                    border: 1.5px solid #e8ecf2;
                    color: #1a2744;
                }

                .form-info-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #fff3e0;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #ed8936;
                }

                .form-info-box strong {
                    display: block;
                }

                .form-info-box p {
                    margin: 2px 0 0 0;
                    font-size: 13px;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
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
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #3a5ce7;
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.25);
                }

                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
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
                    transition: all 0.2s ease;
                }

                .btn-cancel:hover {
                    background: #f0f2f7;
                }

                /* Detail Modal */
                .detail-content {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 24px;
                }

                .detail-image {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border-radius: 12px;
                    min-height: 200px;
                    padding: 20px;
                }

                .detail-image img {
                    max-width: 100%;
                    max-height: 200px;
                    object-fit: contain;
                }

                .book-icon-large {
                    color: #4a6cf7;
                    opacity: 0.3;
                }

                .detail-info h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2744;
                    margin: 0 0 16px 0;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f4f9;
                }

                .detail-label {
                    color: #8a9ab8;
                    font-weight: 500;
                }

                .stok-tersedia {
                    color: #38a169;
                    font-weight: 600;
                }

                .stok-habis {
                    color: #e53e3e;
                    font-weight: 600;
                }

                .status-badge-detail {
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .status-badge-detail.tersedia {
                    background: #e6f7e6;
                    color: #38a169;
                }

                .status-badge-detail.dipinjam {
                    background: #fff3e0;
                    color: #ed8936;
                }

                .status-badge-detail.habis {
                    background: #fce4ec;
                    color: #e53e3e;
                }

                .detail-actions {
                    margin-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .status-badge.pending {
                    background: #fff3e0;
                    color: #ed8936;
                }

                .status-badge.dipinjam {
                    background: #e3f2fd;
                    color: #4a6cf7;
                }

                .status-badge.dikembalikan {
                    background: #e6f7e6;
                    color: #38a169;
                }

                .status-badge.ditolak {
                    background: #fce4ec;
                    color: #e53e3e;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-group {
                        flex-wrap: wrap;
                    }

                    .filter-select {
                        flex: 1;
                        min-width: 100px;
                    }
                }

                @media (max-width: 768px) {
                    .buku-user-page {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-bar {
                        flex-direction: column;
                    }

                    .filter-group {
                        flex-direction: column;
                    }

                    .filter-select {
                        width: 100%;
                    }

                    .btn-filter-reset {
                        width: 100%;
                        text-align: center;
                    }

                    .buku-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .detail-content {
                        grid-template-columns: 1fr;
                    }

                    .modal-container {
                        padding: 20px;
                        margin: 16px;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }

                    .buku-card-actions {
                        flex-direction: column;
                    }

                    .pagination {
                        flex-direction: column;
                        align-items: center;
                    }
                }

                @media (max-width: 480px) {
                    .buku-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .page-btn {
                        min-width: 30px;
                        height: 30px;
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BukuUserPage;