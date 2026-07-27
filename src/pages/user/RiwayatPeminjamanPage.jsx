import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    History, BookOpen, Calendar, Clock, CheckCircle, XCircle,
    Search, Filter, Eye, RefreshCw, AlertCircle, ChevronLeft,
    ChevronRight, AlertTriangle, X, Info, Star, BarChart3,
    TrendingUp, Award, Layers, ChevronDown
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const API_URL = '/api';

const RiwayatPeminjamanPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [peminjaman, setPeminjaman] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [showDetail, setShowDetail] = useState(null);
    const [showRating, setShowRating] = useState(null);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [user, setUser] = useState(null);

    // Data untuk penilaian
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [selectedValues, setSelectedValues] = useState({});
    const [selectedBuku, setSelectedBuku] = useState(null);
    const [nilaiAlternatifUser, setNilaiAlternatifUser] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        fetchRiwayat();
        fetchKriteria();
        fetchNilaiAlternatifUser();
        const interval = setInterval(fetchRiwayat, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterData();
    }, [peminjaman, searchTerm, filterStatus]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
        setCurrentPage(1);
    }, [filteredData, itemsPerPage]);

    const fetchRiwayat = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/peminjaman/riwayat`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📊 Riwayat Peminjaman:', response.data);
            setPeminjaman(response.data.data || []);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching riwayat:', error);
            setError('Gagal mengambil data riwayat');
        } finally {
            setLoading(false);
        }
    };

    const fetchKriteria = async () => {
        try {
            const [kRes, sRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`)
            ]);
            setKriteria(kRes.data.data || []);
            setSubKriteria(sRes.data.data || []);
        } catch (error) {
            console.error('Error fetching kriteria:', error);
        }
    };

    // Ambil nilai alternatif dari USER (bukan admin)
    const fetchNilaiAlternatifUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = user?.id_user || JSON.parse(localStorage.getItem('user') || '{}').id_user;
            const response = await axios.get(`${API_URL}/nilai-alternatif-user?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNilaiAlternatifUser(response.data.data || []);
        } catch (error) {
            console.error('Error fetching nilai alternatif user:', error);
        }
    };

    const filterData = () => {
        let result = [...peminjaman];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item => 
                (item.judul_buku && item.judul_buku.toLowerCase().includes(term)) ||
                (item.penulis && item.penulis.toLowerCase().includes(term))
            );
        }

        if (filterStatus !== 'semua') {
            result = result.filter(item => item.status === filterStatus);
        }

        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setFilteredData(result);
    };

    // Cek apakah buku sudah pernah dinilai oleh user
    const isBookRated = (idBuku) => {
        return nilaiAlternatifUser.some(n => n.id_alternatif === idBuku);
    };

    const handleOpenRating = (item) => {
        // Cek apakah sudah pernah dinilai
        if (isBookRated(item.id_buku)) {
            alert('📌 Buku ini sudah Anda nilai sebelumnya!');
            return;
        }
        setSelectedBuku(item);
        setSelectedValues({});
        setShowRating(item.id_peminjaman);
    };

    const handleSubChange = (idKriteria, idSub) => {
        setSelectedValues({
            ...selectedValues,
            [idKriteria]: idSub
        });
    };

    const handleRatingSubmit = async () => {
        if (!selectedBuku) return;

        // Cek apakah sudah pernah dinilai (double check)
        if (isBookRated(selectedBuku.id_buku)) {
            alert('📌 Buku ini sudah Anda nilai sebelumnya!');
            setShowRating(null);
            return;
        }

        // Cek apakah semua kriteria sudah dipilih
        const allSelected = kriteria.every(k => selectedValues[k.id_kriteria]);
        if (!allSelected) {
            alert('⚠️ Silakan pilih sub-kriteria untuk semua kriteria!');
            return;
        }

        setSubmittingRating(true);
        try {
            const token = localStorage.getItem('token');
            const userId = user?.id_user || JSON.parse(localStorage.getItem('user') || '{}').id_user;
            
            // Simpan nilai ke tabel nilai_alternatif_user
            for (const [idKriteria, idSub] of Object.entries(selectedValues)) {
                if (idSub) {
                    await axios.post(`${API_URL}/nilai-alternatif-user`, {
                        id_alternatif: selectedBuku.id_buku,
                        id_sub: idSub,
                        nilai: 1 // nilai 1 berarti dipilih
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            alert('✅ Penilaian buku berhasil disimpan!');
            setShowRating(null);
            setSelectedBuku(null);
            setSelectedValues({});
            
            // Refresh data
            await fetchNilaiAlternatifUser();
            await fetchRiwayat();
        } catch (error) {
            alert('❌ Gagal menyimpan penilaian: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmittingRating(false);
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
                icon: AlertTriangle, 
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

    const formatDateTime = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ===== CHART DATA =====
    const getMostBorrowedBooks = () => {
        const bookCount = {};
        const dikembalikan = peminjaman.filter(p => p.status === 'dikembalikan');
        
        dikembalikan.forEach(item => {
            const key = item.id_buku;
            if (!bookCount[key]) {
                bookCount[key] = {
                    judul: item.judul_buku || 'Tidak diketahui',
                    count: 0
                };
            }
            bookCount[key].count++;
        });

        return Object.values(bookCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const mostBorrowed = getMostBorrowedBooks();

    const barChartData = {
        labels: mostBorrowed.map(item => item.judul.length > 15 ? item.judul.substring(0, 15) + '...' : item.judul),
        datasets: [
            {
                label: 'Jumlah Dipinjam',
                data: mostBorrowed.map(item => item.count),
                backgroundColor: ['#4a6cf7', '#7c3aed', '#38a169', '#ed8936', '#e53e3e'],
                borderRadius: 6,
                borderSkipped: false,
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Dipinjam ${context.parsed.y} kali`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
            }
        }
    };

    const statusDistribution = {
        labels: ['Menunggu', 'Dipinjam', 'Dikembalikan', 'Ditolak', 'Terlambat'],
        datasets: [
            {
                data: [
                    peminjaman.filter(p => p.status === 'pending').length,
                    peminjaman.filter(p => p.status === 'dipinjam').length,
                    peminjaman.filter(p => p.status === 'dikembalikan').length,
                    peminjaman.filter(p => p.status === 'ditolak').length,
                    peminjaman.filter(p => p.status === 'terlambat').length
                ],
                backgroundColor: ['#ed8936', '#4a6cf7', '#38a169', '#e53e3e', '#e53e3e'],
                borderWidth: 2,
                borderColor: '#ffffff',
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 11 }
                }
            }
        },
        cutout: '60%'
    };

    const getStatusCount = (status) => {
        return peminjaman.filter(p => p.status === status).length;
    };

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const currentData = getCurrentPageData();

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const stats = {
        total: peminjaman.length,
        pending: getStatusCount('pending'),
        dipinjam: getStatusCount('dipinjam'),
        dikembalikan: getStatusCount('dikembalikan'),
        ditolak: getStatusCount('ditolak'),
        terlambat: getStatusCount('terlambat')
    };

    const getSubsByKriteria = (idKriteria) => {
        return subKriteria.filter(s => s.id_kriteria === idKriteria);
    };

    const getBobotGlobal = (idSub) => {
        const found = subKriteria.find(s => s.id_sub === idSub);
        return found?.bobot_global || 0;
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.0000';
        return parseFloat(val).toFixed(4);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Memuat riwayat...</p>
            </div>
        );
    }

    return (
        <div className="riwayat-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <History size={28} style={{ color: '#4a6cf7', marginRight: '12px' }} />
                        Riwayat Peminjaman
                    </h1>
                    <p className="page-subtitle">
                        Pantau status peminjaman dan berikan penilaian untuk buku yang sudah dikembalikan
                        {lastUpdate && (
                            <span style={{ marginLeft: '12px', fontSize: '12px', color: '#8a9ab8' }}>
                                Terakhir update: {formatDateTime(lastUpdate)}
                            </span>
                        )}
                    </p>
                </div>
                <button className="btn-refresh" onClick={fetchRiwayat}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="alert error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <BarChart3 size={18} className="chart-icon" />
                            <span>Buku Paling Sering Dipinjam</span>
                        </div>
                        <span className="chart-badge">Top 5</span>
                    </div>
                    <div className="chart-wrapper">
                        {mostBorrowed.length > 0 ? (
                            <Bar data={barChartData} options={barChartOptions} />
                        ) : (
                            <div className="chart-empty">
                                <p>Belum ada data peminjaman</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <TrendingUp size={18} className="chart-icon" />
                            <span>Distribusi Status Peminjaman</span>
                        </div>
                        <span className="chart-badge">Total {stats.total}</span>
                    </div>
                    <div className="chart-wrapper doughnut-wrapper">
                        {stats.total > 0 ? (
                            <Doughnut data={statusDistribution} options={doughnutOptions} />
                        ) : (
                            <div className="chart-empty">
                                <p>Belum ada data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => setFilterStatus('semua')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#4a6cf7' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>
                {stats.pending > 0 && (
                    <div className="stat-card" onClick={() => setFilterStatus('pending')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#fffbeb', color: '#ed8936' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="stat-number">{stats.pending}</div>
                            <div className="stat-label">⏳ Menunggu</div>
                        </div>
                    </div>
                )}
                {stats.dipinjam > 0 && (
                    <div className="stat-card" onClick={() => setFilterStatus('dipinjam')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#eff6ff', color: '#4a6cf7' }}>
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="stat-number">{stats.dipinjam}</div>
                            <div className="stat-label">📖 Dipinjam</div>
                        </div>
                    </div>
                )}
                {stats.dikembalikan > 0 && (
                    <div className="stat-card" onClick={() => setFilterStatus('dikembalikan')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#f0fdf4', color: '#38a169' }}>
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <div className="stat-number">{stats.dikembalikan}</div>
                            <div className="stat-label">✅ Dikembalikan</div>
                        </div>
                    </div>
                )}
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
                    <option value="semua">Semua Status</option>
                    <option value="pending">⏳ Menunggu Verifikasi</option>
                    <option value="dipinjam">📖 Dipinjam</option>
                    <option value="dikembalikan">✅ Dikembalikan</option>
                    <option value="ditolak">❌ Ditolak</option>
                    <option value="terlambat">⚠️ Terlambat</option>
                </select>
            </div>

            {/* Table */}
            <div className="card">
                {currentData.length === 0 ? (
                    <div className="empty-state">
                        <History size={48} />
                        <h3>{searchTerm || filterStatus !== 'semua' ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat'}</h3>
                        <p>
                            {searchTerm || filterStatus !== 'semua' 
                                ? 'Coba gunakan kata kunci atau filter lain' 
                                : 'Anda belum melakukan peminjaman buku'}
                        </p>
                        {!searchTerm && filterStatus === 'semua' && (
                            <button className="btn-primary" onClick={() => navigate('/user/peminjaman')}>
                                <BookOpen size={18} />
                                Ajukan Peminjaman
                            </button>
                        )}
                    </div>
                ) : (
                    <>
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
                                    {currentData.map((item, index) => {
                                        const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        const isReturned = item.status === 'dikembalikan';
                                        const isRated = isReturned && isBookRated(item.id_buku);
                                        
                                        return (
                                            <tr key={item.id_peminjaman}>
                                                <td>{globalIndex}</td>
                                                <td>
                                                    <div className="book-info">
                                                        <BookOpen size={14} className="book-icon" />
                                                        <span>{item.judul_buku || 'Tidak diketahui'}</span>
                                                    </div>
                                                </td>
                                                <td>{item.penulis || '-'}</td>
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
                                                        {isReturned && !isRated && (
                                                            <button
                                                                className="action-btn rating"
                                                                onClick={() => handleOpenRating(item)}
                                                                title="Beri Penilaian (AHP)"
                                                            >
                                                                <Award size={16} />
                                                            </button>
                                                        )}
                                                        {isReturned && isRated && (
                                                            <span className="rated-badge">
                                                                <CheckCircle size={14} style={{ color: '#38a169' }} />
                                                                Sudah Dinilai
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

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button 
                                    className="page-btn"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                    Sebelumnya
                                </button>
                                <div className="page-numbers">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`page-number ${page === currentPage ? 'active' : ''}`}
                                            onClick={() => goToPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    className="page-btn"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Selanjutnya
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        <div className="table-info">
                            Menampilkan {filteredData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
                        </div>
                    </>
                )}
            </div>

            {/* Rating Modal - Berbasis Kriteria & Sub Kriteria */}
            {showRating && selectedBuku && (
                <div className="modal-overlay" onClick={() => setShowRating(null)}>
                    <div className="modal-container rating-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <Award size={20} style={{ color: '#f59e0b', marginRight: '8px' }} />
                                Penilaian Buku (AHP)
                            </h3>
                            <button className="modal-close" onClick={() => setShowRating(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="rating-book">
                            <BookOpen size={24} style={{ color: '#4a6cf7' }} />
                            <div>
                                <h4>{selectedBuku.judul_buku}</h4>
                                <p>{selectedBuku.penulis || '-'}</p>
                            </div>
                            <div className="rating-warning">
                                <AlertCircle size={16} />
                                <span>Penilaian hanya bisa dilakukan satu kali</span>
                            </div>
                        </div>

                        <div className="rating-info">
                            <AlertCircle size={16} style={{ color: '#ed8936' }} />
                            <span>Pilih sub-kriteria yang sesuai untuk setiap kriteria di bawah ini</span>
                        </div>

                        <div className="rating-form">
                            {kriteria.map(k => {
                                const subs = getSubsByKriteria(k.id_kriteria);
                                const currentValue = selectedValues[k.id_kriteria];
                                
                                return (
                                    <div key={k.id_kriteria} className="rating-group">
                                        <div className="rating-group-label">
                                            <span className="kriteria-name">{k.nama_kriteria}</span>
                                            <span className="kriteria-bobot">
                                                Bobot: {formatNumber(k.bobot)}
                                            </span>
                                        </div>
                                        <div className="sub-options">
                                            {subs.map(s => {
                                                const isActive = currentValue === s.id_sub;
                                                const bobotGlobal = getBobotGlobal(s.id_sub);
                                                return (
                                                    <button
                                                        key={s.id_sub}
                                                        className={`sub-option ${isActive ? 'active' : ''}`}
                                                        onClick={() => handleSubChange(k.id_kriteria, s.id_sub)}
                                                    >
                                                        <span className="sub-name">{s.nama_sub}</span>
                                                        <span className="sub-bobot">{formatNumber(bobotGlobal)}</span>
                                                        {isActive && <CheckCircle size={14} color="#4a6cf7" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rating-summary">
                            <div className="summary-item">
                                <span>Kriteria Terpilih</span>
                                <span className="summary-value">
                                    {kriteria.filter(k => selectedValues[k.id_kriteria]).length}/{kriteria.length}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span>Status</span>
                                <span className={`summary-value ${kriteria.every(k => selectedValues[k.id_kriteria]) ? 'complete' : 'incomplete'}`}>
                                    {kriteria.every(k => selectedValues[k.id_kriteria]) ? '✅ Lengkap' : '⚠️ Belum Lengkap'}
                                </span>
                            </div>
                        </div>

                        <div className="rating-note">
                            <AlertCircle size={14} style={{ color: '#ed8936' }} />
                            <span>Setelah disimpan, penilaian tidak dapat diubah. Pastikan pilihan Anda sudah benar!</span>
                        </div>

                        <div className="rating-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowRating(null)}
                            >
                                Batal
                            </button>
                            <button 
                                className="btn-submit" 
                                onClick={handleRatingSubmit}
                                disabled={submittingRating}
                            >
                                {submittingRating ? '⏳ Memproses...' : 'Simpan Penilaian'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            const statusInfo = {
                                'pending': { icon: Clock, color: '#ed8936', label: 'Menunggu Verifikasi' },
                                'dipinjam': { icon: BookOpen, color: '#4a6cf7', label: 'Sedang Dipinjam' },
                                'dikembalikan': { icon: CheckCircle, color: '#38a169', label: 'Sudah Dikembalikan' },
                                'ditolak': { icon: XCircle, color: '#e53e3e', label: 'Ditolak' },
                                'terlambat': { icon: AlertTriangle, color: '#e53e3e', label: 'Terlambat' }
                            };
                            const statusInfoData = statusInfo[item.status] || statusInfo['pending'];
                            const StatusIcon = statusInfoData.icon;

                            return (
                                <div className="detail-content">
                                    <div className="detail-status-header" style={{ borderLeftColor: statusInfoData.color }}>
                                        <StatusIcon size={20} style={{ color: statusInfoData.color }} />
                                        <span style={{ color: statusInfoData.color, fontWeight: 600 }}>
                                            {statusInfoData.label}
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">Judul Buku</span>
                                        <span className="detail-value">{item.judul_buku || 'Tidak diketahui'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Penulis</span>
                                        <span className="detail-value">{item.penulis || '-'}</span>
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
                                    <div className="detail-row">
                                        <span className="detail-label">Tanggal Pengajuan</span>
                                        <span className="detail-value">{formatDateTime(item.created_at)}</span>
                                    </div>

                                    <div className={`detail-info ${item.status}`}>
                                        {item.status === 'pending' && (
                                            <><Clock size={18} />⏳ Pengajuan sedang menunggu verifikasi admin</>
                                        )}
                                        {item.status === 'dipinjam' && (
                                            <><BookOpen size={18} />📖 Buku sedang Anda pinjam</>
                                        )}
                                        {item.status === 'dikembalikan' && (
                                            <><CheckCircle size={18} />✅ Buku sudah dikembalikan. Berikan penilaian!</>
                                        )}
                                        {item.status === 'ditolak' && (
                                            <><XCircle size={18} />❌ Pengajuan ditolak oleh admin</>
                                        )}
                                        {item.status === 'terlambat' && (
                                            <><AlertTriangle size={18} />⚠️ Buku terlambat dikembalikan</>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            <style>{`
                .riwayat-page {
                    padding: 24px 32px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

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

                .btn-refresh {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #4a5a7a;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .btn-refresh:hover {
                    background: #f8fafc;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 16px;
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

                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .chart-card {
                    background: white;
                    border-radius: 12px;
                    padding: 16px 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .chart-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2744;
                }

                .chart-icon {
                    color: #4a6cf7;
                }

                .chart-badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 10px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    color: #64748b;
                }

                .chart-wrapper {
                    height: 180px;
                    position: relative;
                }

                .doughnut-wrapper {
                    height: 200px;
                }

                .chart-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                }

                .stat-icon {
                    width: 36px;
                    height: 36px;
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
                    font-size: 11px;
                    color: #8a9ab8;
                }

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
                    position: relative;
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

                .clear-search {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #8a9ab8;
                    padding: 4px;
                }

                .clear-search:hover {
                    color: #1a2744;
                }

                .filter-select {
                    padding: 10px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    background: white;
                    color: #1a2744;
                    cursor: pointer;
                    min-width: 180px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                }

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

                .action-btn.rating {
                    color: #f59e0b;
                }

                .action-btn.rating:hover {
                    background: #fffbeb;
                }

                .rated-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 12px;
                    background: #e6f7e6;
                    color: #38a169;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

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

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 20px;
                    border-top: 1px solid #f0f4f9;
                    flex-wrap: wrap;
                }

                .page-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 14px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #4a5a7a;
                    transition: all 0.15s ease;
                }

                .page-btn:hover:not(:disabled) {
                    background: #eff6ff;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .page-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .page-numbers {
                    display: flex;
                    gap: 4px;
                }

                .page-number {
                    width: 36px;
                    height: 36px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #4a5a7a;
                    transition: all 0.15s ease;
                }

                .page-number:hover {
                    background: #f8fafc;
                    border-color: #4a6cf7;
                }

                .page-number.active {
                    background: #4a6cf7;
                    color: white;
                    border-color: #4a6cf7;
                }

                .table-info {
                    text-align: center;
                    padding: 12px 16px;
                    font-size: 13px;
                    color: #8a9ab8;
                    border-top: 1px solid #f0f4f9;
                }

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
                    max-width: 520px;
                    width: 100%;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.15);
                    animation: slideUp 0.3s ease;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .rating-modal {
                    max-width: 520px;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .modal-header h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2744;
                    margin: 0;
                    display: flex;
                    align-items: center;
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

                .rating-book {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border-radius: 10px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }

                .rating-book h4 {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a2744;
                    margin: 0;
                }

                .rating-book p {
                    font-size: 13px;
                    color: #8a9ab8;
                    margin: 4px 0 0;
                }

                .rating-warning {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: auto;
                    padding: 2px 10px;
                    background: #fef2f2;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #dc2626;
                }

                .rating-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: #fffbeb;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #ed8936;
                    margin-bottom: 16px;
                }

                .rating-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .rating-group {
                    padding: 12px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    background: #fafbfc;
                    transition: all 0.2s ease;
                }

                .rating-group:hover {
                    border-color: #cbd5e1;
                }

                .rating-group-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    color: #1a2744;
                }

                .kriteria-bobot {
                    font-size: 12px;
                    font-weight: 400;
                    color: #8a9ab8;
                }

                .sub-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .sub-option {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 2px solid #e2e8f0;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 12px;
                    color: #4a5a7a;
                }

                .sub-option:hover {
                    border-color: #8a9ab8;
                    transform: translateY(-1px);
                }

                .sub-option.active {
                    border-color: #4a6cf7;
                    background: #eff6ff;
                    color: #1a2744;
                    font-weight: 500;
                }

                .sub-name {
                    font-weight: 500;
                }

                .sub-bobot {
                    font-size: 10px;
                    padding: 1px 6px;
                    border-radius: 4px;
                    background: #eef2ff;
                    color: #4a6cf7;
                    font-weight: 600;
                    font-family: monospace;
                }

                .rating-summary {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 16px;
                }

                .summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    font-size: 13px;
                    color: #8a9ab8;
                }

                .summary-value {
                    font-weight: 700;
                    color: #1a2744;
                    font-size: 15px;
                }

                .summary-value.complete {
                    color: #38a169;
                }

                .summary-value.incomplete {
                    color: #ed8936;
                }

                .rating-note {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    background: #fef2f2;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #dc2626;
                    margin-bottom: 16px;
                }

                .rating-actions {
                    display: flex;
                    gap: 12px;
                }

                .rating-actions .btn-cancel {
                    flex: 1;
                    padding: 10px;
                    background: #f8fafc;
                    color: #4a5568;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .rating-actions .btn-cancel:hover {
                    background: #f0f2f7;
                }

                .rating-actions .btn-submit {
                    flex: 2;
                    padding: 10px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .rating-actions .btn-submit:hover:not(:disabled) {
                    background: #3a5ce7;
                    box-shadow: 0 4px 16px rgba(74,108,247,0.25);
                }

                .rating-actions .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .detail-content {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .detail-status-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-left: 4px solid;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
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
                    gap: 10px;
                    padding: 12px 16px;
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

                .detail-info.dikembalikan {
                    background: #f0fdf4;
                    color: #38a169;
                }

                .detail-info.ditolak {
                    background: #fef2f2;
                    color: #e53e3e;
                }

                .detail-info.terlambat {
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

                @media (max-width: 1024px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .riwayat-page {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .btn-refresh {
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr 1fr;
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

                    .pagination {
                        flex-direction: column;
                    }

                    .modal-container {
                        padding: 20px;
                        margin: 12px;
                    }

                    .rating-actions {
                        flex-direction: column;
                    }

                    .chart-wrapper {
                        height: 150px;
                    }

                    .doughnut-wrapper {
                        height: 170px;
                    }

                    .rating-summary {
                        grid-template-columns: 1fr;
                    }

                    .sub-options {
                        flex-direction: column;
                    }

                    .sub-option {
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .page-numbers {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default RiwayatPeminjamanPage;