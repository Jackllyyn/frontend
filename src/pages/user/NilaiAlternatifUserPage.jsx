import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    BookOpen, X, CheckCircle, AlertCircle, 
    Save, RefreshCw, Search,
    Award, Star, TrendingUp, Eye, 
    History, Clock, ChevronRight, Lock
} from 'lucide-react';

const API_URL = '/api';

const NilaiAlternatifUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [bukuDikembalikan, setBukuDikembalikan] = useState([]);
    const [bukuDipinjam, setBukuDipinjam] = useState([]);
    const [nilaiAlternatifUser, setNilaiAlternatifUser] = useState([]);
    const [selectedBuku, setSelectedBuku] = useState(null);
    const [selectedValues, setSelectedValues] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sortBy, setSortBy] = useState('skor');
    const [sortOrder, setSortOrder] = useState('desc');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const token = localStorage.getItem('token');
            const userId = user?.id_user || JSON.parse(localStorage.getItem('user') || '{}').id_user;

            const [kRes, sRes, bRes, nRes, pRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`),
                axios.get(`${API_URL}/alternatif`),
                axios.get(`${API_URL}/nilai-alternatif-user?userId=${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/peminjaman/riwayat`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            console.log('📊 Nilai Alternatif User:', nRes.data);

            setKriteria(kRes.data.data || []);
            setSubKriteria(sRes.data.data || []);
            setNilaiAlternatifUser(nRes.data.data || []);
            
            const allBuku = bRes.data.data || [];
            const peminjaman = pRes.data.data || [];

            const sudahDikembalikan = peminjaman
                .filter(p => p.status === 'dikembalikan')
                .map(p => p.id_buku);
            
            const bukuSudahDikembalikan = allBuku.filter(b => 
                sudahDikembalikan.includes(b.id_alternatif)
            );
            setBukuDikembalikan(bukuSudahDikembalikan);

            const sedangDipinjam = peminjaman
                .filter(p => p.status === 'dipinjam' || p.status === 'pending')
                .map(p => p.id_buku);
            const bukuSedangDipinjam = allBuku.filter(b => 
                sedangDipinjam.includes(b.id_alternatif)
            );
            setBukuDipinjam(bukuSedangDipinjam);

        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBukuClick = (buku) => {
        setSelectedBuku(buku);
        const complete = checkComplete(buku.id_alternatif);
        setIsReadOnly(complete);
        loadNilaiBuku(buku.id_alternatif);
        setShowModal(true);
    };

    const loadNilaiBuku = (idBuku) => {
        const filtered = nilaiAlternatifUser.filter(n => n.id_alternatif === idBuku);
        const values = {};
        for (const n of filtered) {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            if (sub) {
                values[sub.id_kriteria] = n.id_sub;
            }
        }
        setSelectedValues(values);
    };

    const handleSubChange = (idKriteria, idSub) => {
        if (isReadOnly) return;
        setSelectedValues({
            ...selectedValues,
            [idKriteria]: idSub
        });
        setSuccessMessage('');
        setErrorMessage('');
    };

    const checkComplete = (idBuku) => {
        const nilai = nilaiAlternatifUser.filter(n => n.id_alternatif === idBuku);
        const selectedKriteria = new Set(nilai.map(n => {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            return sub?.id_kriteria;
        }).filter(Boolean));
        return selectedKriteria.size === kriteria.length && kriteria.length > 0;
    };

    const handleSave = async () => {
        if (!selectedBuku) return;
        if (isReadOnly) {
            setErrorMessage('Buku ini sudah dinilai dan tidak dapat diubah!');
            return;
        }

        const allSelected = kriteria.every(k => selectedValues[k.id_kriteria]);
        if (!allSelected) {
            setErrorMessage('Semua kriteria harus dipilih!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userId = user?.id_user || JSON.parse(localStorage.getItem('user') || '{}').id_user;
            
            // Hapus nilai lama user untuk buku ini
            await axios.delete(`${API_URL}/nilai-alternatif-user/buku/${selectedBuku.id_alternatif}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Simpan nilai baru user
            for (const [idKriteria, idSub] of Object.entries(selectedValues)) {
                if (idSub) {
                    await axios.post(`${API_URL}/nilai-alternatif-user`, {
                        id_alternatif: selectedBuku.id_alternatif,
                        id_sub: idSub,
                        nilai: 1
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            
            setSuccessMessage('Penilaian berhasil disimpan!');
            setShowModal(false);
            
            // Refresh data
            const nRes = await axios.get(`${API_URL}/nilai-alternatif-user?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNilaiAlternatifUser(nRes.data.data || []);
            
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving:', error);
            setErrorMessage('Gagal menyimpan: ' + (error.response?.data?.message || error.message));
        }
    };

    const getKriteriaSubs = (idKriteria) => {
        return subKriteria.filter(s => s.id_kriteria === idKriteria);
    };

    const getBobotGlobal = (idSub) => {
        const found = subKriteria.find(s => s.id_sub === idSub);
        return found?.bobot_global || 0;
    };

    const getBobotKriteria = (idKriteria) => {
        const found = kriteria.find(k => k.id_kriteria === idKriteria);
        return found?.bobot || 0;
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.0000';
        return parseFloat(val).toFixed(4);
    };

    const getSkorBuku = (idBuku) => {
        const nilai = nilaiAlternatifUser.filter(n => n.id_alternatif === idBuku);
        let total = 0;
        for (const n of nilai) {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            if (sub) {
                total += parseFloat(sub.bobot_global) || 0;
            }
        }
        return total;
    };

    const getStatusBuku = (idBuku) => {
        const nilai = nilaiAlternatifUser.filter(n => n.id_alternatif === idBuku);
        const selectedKriteria = new Set(nilai.map(n => {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            return sub?.id_kriteria;
        }).filter(Boolean));
        return selectedKriteria.size;
    };

    const isComplete = (idBuku) => {
        return checkComplete(idBuku);
    };

    const getSortedBuku = () => {
        let filtered = [...bukuDikembalikan];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b => 
                b.judul_buku.toLowerCase().includes(term) ||
                (b.penulis && b.penulis.toLowerCase().includes(term))
            );
        }

        if (filterStatus === 'sudah') {
            filtered = filtered.filter(b => isComplete(b.id_alternatif));
        } else if (filterStatus === 'belum') {
            filtered = filtered.filter(b => !isComplete(b.id_alternatif));
        }

        filtered.sort((a, b) => {
            const skorA = getSkorBuku(a.id_alternatif);
            const skorB = getSkorBuku(b.id_alternatif);
            const statusA = getStatusBuku(a.id_alternatif);
            const statusB = getStatusBuku(b.id_alternatif);

            let valA, valB;
            switch (sortBy) {
                case 'nama':
                    valA = a.judul_buku.toLowerCase();
                    valB = b.judul_buku.toLowerCase();
                    break;
                case 'skor':
                    valA = skorA;
                    valB = skorB;
                    break;
                case 'status':
                    valA = statusA;
                    valB = statusB;
                    break;
                default:
                    valA = a.judul_buku.toLowerCase();
                    valB = b.judul_buku.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        return filtered;
    };

    const sortedBuku = getSortedBuku();

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Memuat data...</p>
            </div>
        );
    }

    if (kriteria.length === 0) {
        return (
            <div className="empty-state-full">
                <AlertCircle size={44} />
                <h3>Belum Ada Kriteria</h3>
                <p>Silakan tunggu admin menambahkan kriteria penilaian</p>
            </div>
        );
    }

    const totalDikembalikan = bukuDikembalikan.length;
    const totalSudahDinilai = bukuDikembalikan.filter(b => isComplete(b.id_alternatif)).length;
    const totalBelumDinilai = totalDikembalikan - totalSudahDinilai;

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Penilaian Buku</h1>
                    <p className="page-subtitle">Berikan penilaian untuk buku yang sudah Anda kembalikan</p>
                </div>
                <button className="btn-refresh" onClick={fetchAllData}>
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="alert success">
                    <CheckCircle size={18} />
                    <span>{successMessage}</span>
                    <button className="alert-close" onClick={() => setSuccessMessage('')}>
                        <X size={16} />
                    </button>
                </div>
            )}
            {errorMessage && (
                <div className="alert error">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                    <button className="alert-close" onClick={() => setErrorMessage('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eef2f7' }}>
                        <History size={18} style={{ color: '#4a5568' }} />
                    </div>
                    <div>
                        <div className="stat-number">{totalDikembalikan}</div>
                        <div className="stat-label">Dikembalikan</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f7e6' }}>
                        <CheckCircle size={18} style={{ color: '#38a169' }} />
                    </div>
                    <div>
                        <div className="stat-number">{totalSudahDinilai}</div>
                        <div className="stat-label">Sudah Dinilai</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3e8' }}>
                        <Clock size={18} style={{ color: '#b7794a' }} />
                    </div>
                    <div>
                        <div className="stat-number">{totalBelumDinilai}</div>
                        <div className="stat-label">Belum Dinilai</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f0fe' }}>
                        <BookOpen size={18} style={{ color: '#4a6cf7' }} />
                    </div>
                    <div>
                        <div className="stat-number">{bukuDipinjam.length}</div>
                        <div className="stat-label">Sedang Dipinjam</div>
                    </div>
                </div>
            </div>

            {/* Rekomendasi */}
            {totalSudahDinilai > 0 && (
                <div className="rekomendasi-card">
                    <div className="rekomendasi-header">
                        <TrendingUp size={18} style={{ color: '#b7794a' }} />
                        <h3>Rekomendasi Buku Terbaik</h3>
                        <span className="rekomendasi-badge">Berdasarkan penilaian Anda</span>
                    </div>
                    <div className="rekomendasi-list">
                        {sortedBuku
                            .filter(b => isComplete(b.id_alternatif))
                            .slice(0, 3)
                            .map((buku, index) => {
                                const skor = getSkorBuku(buku.id_alternatif);
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={buku.id_alternatif} className="rekomendasi-item">
                                        <span className="rekomendasi-medal">{medals[index]}</span>
                                        <div className="rekomendasi-info">
                                            <div className="rekomendasi-title">{buku.judul_buku}</div>
                                            <div className="rekomendasi-author">{buku.penulis || '-'}</div>
                                        </div>
                                        <div className="rekomendasi-skor">
                                            <Star size={14} style={{ color: '#b7794a' }} />
                                            <span>{formatNumber(skor)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            )}

            {totalDikembalikan === 0 ? (
                <div className="empty-state">
                    <BookOpen size={44} />
                    <h3>Belum Ada Buku yang Dikembalikan</h3>
                    <p>Anda belum mengembalikan buku apapun. Silakan pinjam dan kembalikan buku terlebih dahulu.</p>
                    <button className="btn-primary" onClick={() => navigate('/user/peminjaman')}>
                        Pinjam Buku
                    </button>
                </div>
            ) : (
                <>
                    {/* Filter */}
                    <div className="filter-bar">
                        <div className="search-wrapper">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Cari judul atau penulis..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="clear-search" onClick={() => setSearchTerm('')}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <select
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="semua">Semua Buku</option>
                            <option value="sudah">Sudah Dinilai</option>
                            <option value="belum">Belum Dinilai</option>
                        </select>
                        <div className="sort-group">
                            <select
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="skor">Skor</option>
                                <option value="nama">Nama</option>
                                <option value="status">Status</option>
                            </select>
                            <button
                                className="btn-sort"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    {/* Buku Grid */}
                    <div className="buku-grid">
                        {sortedBuku.length === 0 ? (
                            <div className="empty-state small">
                                <p>Tidak ada buku yang sesuai</p>
                            </div>
                        ) : (
                            sortedBuku.map((buku) => {
                                const complete = isComplete(buku.id_alternatif);
                                const skor = getSkorBuku(buku.id_alternatif);
                                const statusCount = getStatusBuku(buku.id_alternatif);

                                return (
                                    <div
                                        key={buku.id_alternatif}
                                        className={`buku-card ${complete ? 'completed' : ''}`}
                                        onClick={() => handleBukuClick(buku)}
                                    >
                                        <div className="buku-card-header">
                                            <div className="buku-icon">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="buku-card-status">
                                                {complete ? (
                                                    <span className="badge success">
                                                        <CheckCircle size={12} />
                                                        Selesai
                                                    </span>
                                                ) : (
                                                    <span className="badge warning">
                                                        <AlertCircle size={12} />
                                                        {statusCount}/{kriteria.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="buku-card-body">
                                            <h3 className="buku-title">{buku.judul_buku}</h3>
                                            <p className="buku-author">{buku.penulis || 'Penulis tidak diketahui'}</p>
                                            {complete && (
                                                <div className="buku-skor">
                                                    <Star size={14} style={{ color: '#b7794a' }} />
                                                    <span>Skor: {formatNumber(skor)}</span>
                                                </div>
                                            )}
                                            <div className="buku-progress">
                                                <div className="progress-track">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ 
                                                            width: `${(statusCount / kriteria.length) * 100}%`,
                                                            background: complete ? '#48bb78' : '#b7794a'
                                                        }}
                                                    />
                                                </div>
                                                <span className="progress-text">
                                                    {Math.round((statusCount / kriteria.length) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="buku-card-footer">
                                            <button className={`btn-action ${complete ? 'readonly' : ''}`}>
                                                {complete ? (
                                                    <>
                                                        <Eye size={15} />
                                                        Lihat Penilaian
                                                    </>
                                                ) : (
                                                    <>
                                                        <Award size={15} />
                                                        Berikan Penilaian
                                                    </>
                                                )}
                                                <ChevronRight size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && selectedBuku && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                {isReadOnly ? (
                                    <Eye size={20} style={{ color: '#4a6cf7' }} />
                                ) : (
                                    <Award size={20} style={{ color: '#b7794a' }} />
                                )}
                                <h3>{isReadOnly ? 'Detail Penilaian' : 'Penilaian Buku'}</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-book">
                            <h4>{selectedBuku.judul_buku}</h4>
                            <p>{selectedBuku.penulis || 'Penulis tidak diketahui'}</p>
                            {isReadOnly && (
                                <div className="readonly-badge">
                                    <Lock size={12} />
                                    <span>Telah dinilai, tidak dapat diubah</span>
                                </div>
                            )}
                        </div>

                        <div className="modal-body">
                            {kriteria.map(k => {
                                const subs = getKriteriaSubs(k.id_kriteria);
                                const currentValue = selectedValues[k.id_kriteria];
                                const isSelected = !!currentValue;

                                return (
                                    <div key={k.id_kriteria} className={`form-group ${isSelected ? 'selected' : ''} ${isReadOnly ? 'readonly' : ''}`}>
                                        <div className="form-label">
                                            <span>{k.nama_kriteria}</span>
                                            <span className="form-bobot">{formatNumber(getBobotKriteria(k.id_kriteria))}</span>
                                        </div>
                                        <div className="sub-options">
                                            {subs.map(s => {
                                                const isActive = currentValue === s.id_sub;
                                                const bobotGlobal = getBobotGlobal(s.id_sub);
                                                return (
                                                    <button
                                                        key={s.id_sub}
                                                        className={`sub-option ${isActive ? 'active' : ''} ${isReadOnly ? 'readonly' : ''}`}
                                                        onClick={() => handleSubChange(k.id_kriteria, s.id_sub)}
                                                        disabled={isReadOnly}
                                                    >
                                                        <span className="sub-name">{s.nama_sub}</span>
                                                        <span className="sub-bobot">{formatNumber(bobotGlobal)}</span>
                                                        {isActive && <CheckCircle size={12} style={{ color: isReadOnly ? '#4a6cf7' : '#b7794a' }} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="modal-footer">
                            <div className="modal-summary">
                                <div className="summary-item">
                                    <span>Kriteria Terpilih</span>
                                    <span>{kriteria.filter(k => selectedValues[k.id_kriteria]).length}/{kriteria.length}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Total Skor</span>
                                    <span style={{ color: isReadOnly ? '#4a6cf7' : '#b7794a', fontWeight: 700 }}>
                                        {formatNumber(getSkorBuku(selectedBuku.id_alternatif))}
                                    </span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Tutup
                                </button>
                                {!isReadOnly && (
                                    <button className="btn-save" onClick={handleSave}>
                                        <Save size={16} />
                                        Simpan Penilaian
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .page-container {
                    padding: 24px 28px;
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 300px;
                    gap: 12px;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #eef2f7;
                    border-top-color: #4a6cf7;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .loading-state p {
                    color: #8a9ab8;
                    font-size: 14px;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .page-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a2332;
                    margin: 0;
                }

                .page-subtitle {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin-top: 2px;
                }

                .btn-refresh {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: white;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #4a5a7a;
                    font-size: 13px;
                    transition: all 0.15s;
                }

                .btn-refresh:hover {
                    background: #f8fafc;
                    border-color: #b7794a;
                    color: #b7794a;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
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

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 10px;
                    border: 1px solid #eef2f7;
                }

                .stat-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-number {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a2332;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 12px;
                    color: #8a9ab8;
                }

                .rekomendasi-card {
                    background: #faf8f0;
                    border: 1px solid #e8e0d0;
                    border-radius: 10px;
                    padding: 14px 18px;
                    margin-bottom: 20px;
                }

                .rekomendasi-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .rekomendasi-header h3 {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0;
                }

                .rekomendasi-badge {
                    font-size: 11px;
                    color: #8a9ab8;
                    font-weight: 400;
                }

                .rekomendasi-list {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .rekomendasi-item {
                    flex: 1;
                    min-width: 160px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e8e0d0;
                }

                .rekomendasi-medal {
                    font-size: 20px;
                }

                .rekomendasi-info {
                    flex: 1;
                    min-width: 0;
                }

                .rekomendasi-title {
                    font-weight: 600;
                    color: #1a2332;
                    font-size: 13px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .rekomendasi-author {
                    font-size: 11px;
                    color: #8a9ab8;
                }

                .rekomendasi-skor {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 600;
                    color: #b7794a;
                    font-size: 13px;
                }

                .filter-bar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 18px;
                    flex-wrap: wrap;
                }

                .search-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 12px;
                    background: white;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    min-width: 180px;
                }

                .search-wrapper svg {
                    color: #aab4c8;
                    flex-shrink: 0;
                }

                .search-wrapper input {
                    flex: 1;
                    border: none;
                    outline: none;
                    padding: 9px 0;
                    font-size: 14px;
                    background: transparent;
                    color: #1a2332;
                }

                .clear-search {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #aab4c8;
                    padding: 4px;
                }

                .clear-search:hover {
                    color: #1a2332;
                }

                .filter-select {
                    padding: 9px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    background: white;
                    color: #1a2332;
                    cursor: pointer;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #b7794a;
                }

                .sort-group {
                    display: flex;
                    gap: 6px;
                }

                .sort-group .filter-select {
                    min-width: 80px;
                }

                .btn-sort {
                    padding: 9px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 14px;
                    color: #4a5a7a;
                    transition: all 0.15s;
                }

                .btn-sort:hover {
                    border-color: #b7794a;
                    color: #b7794a;
                }

                .empty-state {
                    text-align: center;
                    padding: 48px 20px;
                    background: white;
                    border-radius: 10px;
                    border: 1px solid #eef2f7;
                }

                .empty-state.small {
                    padding: 24px 20px;
                    grid-column: 1 / -1;
                }

                .empty-state h3 {
                    font-size: 17px;
                    color: #1a2332;
                    margin: 10px 0 4px;
                }

                .empty-state p {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin: 0 0 14px;
                }

                .empty-state-full {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-state-full h3 {
                    font-size: 18px;
                    color: #1a2332;
                    margin: 12px 0 4px;
                }

                .empty-state-full p {
                    color: #8a9ab8;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 9px 20px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-primary:hover {
                    background: #3a5ce7;
                }

                .buku-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 16px;
                }

                .buku-card {
                    background: white;
                    border-radius: 10px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .buku-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    border-color: #d0d5e0;
                }

                .buku-card.completed {
                    border-left: 4px solid #48bb78;
                }

                .buku-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px 8px;
                }

                .buku-icon {
                    width: 40px;
                    height: 40px;
                    background: #f0f4ff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                    flex-shrink: 0;
                }

                .buku-card-status {
                    margin-left: auto;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .badge.success {
                    background: #e6f7e6;
                    color: #276749;
                }

                .badge.warning {
                    background: #fef3e8;
                    color: #b7794a;
                }

                .buku-card-body {
                    padding: 4px 14px 12px;
                }

                .buku-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0 0 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .buku-author {
                    font-size: 12px;
                    color: #8a9ab8;
                    margin: 0 0 6px;
                }

                .buku-skor {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #b7794a;
                }

                .buku-progress {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 6px;
                }

                .progress-track {
                    flex: 1;
                    height: 4px;
                    background: #eef2f7;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }

                .progress-text {
                    font-size: 11px;
                    font-weight: 600;
                    color: #8a9ab8;
                    min-width: 32px;
                    text-align: right;
                }

                .buku-card-footer {
                    padding: 8px 14px 12px;
                    border-top: 1px solid #f0f4f9;
                }

                .btn-action {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 7px;
                    background: #f8fafc;
                    border: 1px solid #e8ecf2;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #4a5a7a;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-action:hover {
                    background: #faf8f0;
                    border-color: #b7794a;
                    color: #b7794a;
                }

                .btn-action.readonly:hover {
                    background: #f0f4ff;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.25);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                    animation: fadeIn 0.2s ease;
                }

                .modal {
                    background: white;
                    border-radius: 14px;
                    padding: 28px;
                    max-width: 520px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
                    animation: slideUp 0.25s ease;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 14px;
                }

                .modal-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .modal-header-left h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a2332;
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
                    color: #1a2332;
                }

                .modal-book {
                    padding: 10px 14px;
                    background: #f8fafc;
                    border-radius: 8px;
                    margin-bottom: 14px;
                }

                .modal-book h4 {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0;
                }

                .modal-book p {
                    font-size: 12px;
                    color: #8a9ab8;
                    margin: 2px 0 0;
                }

                .readonly-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 6px;
                    padding: 2px 10px;
                    background: #e8f0fe;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #4a6cf7;
                    font-weight: 500;
                }

                .modal-body {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .form-group {
                    padding: 10px 12px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    background: #fafbfc;
                    transition: all 0.15s;
                }

                .form-group.selected {
                    border-color: #b7794a;
                    background: #faf8f0;
                }

                .form-group.readonly {
                    border-color: #dce3f0;
                    background: #f8fafc;
                    opacity: 0.85;
                }

                .form-group.readonly.selected {
                    border-color: #4a6cf7;
                    background: #f0f4ff;
                }

                .form-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 13px;
                    color: #4a5a7a;
                    margin-bottom: 4px;
                }

                .form-bobot {
                    font-size: 11px;
                    font-weight: 400;
                    color: #8a9ab8;
                }

                .sub-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }

                .sub-option {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    border: 1.5px solid #e8ecf2;
                    background: white;
                    cursor: pointer;
                    transition: all 0.15s;
                    font-size: 12px;
                    color: #4a5a7a;
                }

                .sub-option:hover:not(.readonly) {
                    border-color: #b7794a;
                }

                .sub-option.active {
                    border-color: #b7794a;
                    background: #faf8f0;
                    color: #1a2332;
                    font-weight: 500;
                }

                .sub-option.readonly {
                    cursor: default;
                    opacity: 0.7;
                }

                .sub-option.readonly.active {
                    border-color: #4a6cf7;
                    background: #f0f4ff;
                    opacity: 1;
                }

                .sub-option.readonly:hover {
                    border-color: #e8ecf2;
                }

                .sub-name {
                    font-weight: 500;
                }

                .sub-bobot {
                    font-size: 10px;
                    padding: 1px 6px;
                    border-radius: 4px;
                    background: #f0f4ff;
                    color: #4a6cf7;
                    font-weight: 600;
                    font-family: monospace;
                }

                .modal-footer {
                    margin-top: 14px;
                }

                .modal-summary {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    padding: 10px 14px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e8ecf2;
                    margin-bottom: 12px;
                }

                .summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    font-size: 13px;
                    color: #8a9ab8;
                }

                .summary-item span:last-child {
                    font-weight: 700;
                    color: #1a2332;
                    font-size: 15px;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 9px;
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

                .btn-save {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px;
                    background: #b7794a;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-save:hover {
                    background: #a0683a;
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

                @media (max-width: 768px) {
                    .page-container {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
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

                    .sort-group {
                        flex-wrap: wrap;
                    }

                    .buku-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .rekomendasi-list {
                        flex-direction: column;
                    }

                    .modal {
                        padding: 20px;
                    }

                    .modal-summary {
                        grid-template-columns: 1fr;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .buku-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default NilaiAlternatifUserPage;