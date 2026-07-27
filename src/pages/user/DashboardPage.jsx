import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    BookOpen, Users, Calendar, Star, TrendingUp, Clock, 
    CheckCircle, Award, Library, ChevronRight, AlertCircle,
    BookMarked, Eye, CalendarDays, UserCheck, BarChart3,
    PieChart as PieChartIcon
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

const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalBuku: 0,
        totalDipinjam: 0,
        totalDikembalikan: 0,
        totalPending: 0,
        totalUser: 0
    });
    const [bukuTersedia, setBukuTersedia] = useState([]);
    const [bukuPopuler, setBukuPopuler] = useState([]);
    const [peminjamanAktif, setPeminjamanAktif] = useState([]);
    const [rekomendasi, setRekomendasi] = useState([]);
    const [rekomendasiGlobal, setRekomendasiGlobal] = useState([]);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [statusChartData, setStatusChartData] = useState({
        labels: [],
        datasets: []
    });

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const userId = user?.id_user || JSON.parse(localStorage.getItem('user') || '{}').id_user;
            
            // 1. Ambil semua buku
            const bukuRes = await axios.get(`${API_URL}/alternatif`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const semuaBuku = bukuRes.data.data || [];
            
            // 2. Ambil riwayat peminjaman user
            const peminjamanRes = await axios.get(`${API_URL}/peminjaman/riwayat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const peminjaman = peminjamanRes.data.data || [];
            
            // 3. Ambil sub kriteria untuk bobot global
            const subRes = await axios.get(`${API_URL}/sub-kriteria`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const subKriteria = subRes.data.data || [];

            // 4. Ambil dashboard stats dari backend
            const statsRes = await axios.get(`${API_URL}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 5. Ambil semua nilai alternatif (dari admin) untuk rekomendasi global
            const nilaiAdminRes = await axios.get(`${API_URL}/nilai-alternatif`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const nilaiAdmin = nilaiAdminRes.data.data || [];

            // 6. Ambil nilai alternatif user untuk rekomendasi personal
            const nilaiUserRes = await axios.get(`${API_URL}/nilai-alternatif-user?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const nilaiUser = nilaiUserRes.data.data || [];

            console.log('📊 Nilai Admin:', nilaiAdmin.length);
            console.log('📊 Nilai User:', nilaiUser.length);
            console.log('📊 Sub Kriteria:', subKriteria.length);
            console.log('📊 Semua Buku:', semuaBuku.length);

            // Hitung statistik
            const totalDipinjam = peminjaman.filter(p => p.status === 'dipinjam').length;
            const totalDikembalikan = peminjaman.filter(p => p.status === 'dikembalikan').length;
            const totalPending = peminjaman.filter(p => p.status === 'pending').length;
            const totalBuku = semuaBuku.length;
            const totalUser = statsRes.data.data?.totalUser || 0;

            // Buku tersedia (stok > 0)
            const tersedia = semuaBuku.filter(b => b.stok > 0).slice(0, 6);

            // Peminjaman aktif (dipinjam atau pending)
            const aktif = peminjaman
                .filter(p => p.status === 'dipinjam' || p.status === 'pending')
                .slice(0, 5);

            // Buku populer dari dashboard stats
            const populer = statsRes.data.data?.bukuPopuler || [];

            // ===== REKOMENDASI GLOBAL (dari semua sumber) =====
            // Gabungkan semua nilai dari admin dan user
            const semuaNilai = [...nilaiAdmin, ...nilaiUser];
            
            // Buat map bobot global per sub kriteria
            const bobotGlobalMap = {};
            subKriteria.forEach(sub => {
                bobotGlobalMap[sub.id_sub] = parseFloat(sub.bobot_global) || 0;
            });

            // Kelompokkan nilai berdasarkan buku
            const bukuIds = [...new Set(semuaNilai.map(n => n.id_alternatif))];
            const bukuDenganSkorGlobal = [];

            console.log('📊 Buku IDs dengan nilai:', bukuIds);

            bukuIds.forEach(idBuku => {
                const buku = semuaBuku.find(b => b.id_alternatif === idBuku);
                if (!buku) return;

                const nilaiBuku = semuaNilai.filter(n => n.id_alternatif === idBuku);
                let totalSkor = 0;

                nilaiBuku.forEach(n => {
                    const bobotGlobal = bobotGlobalMap[n.id_sub] || 0;
                    const nilai = parseFloat(n.nilai) || 1;
                    totalSkor += bobotGlobal * nilai;
                });

                bukuDenganSkorGlobal.push({
                    id_alternatif: buku.id_alternatif,
                    judul_buku: buku.judul_buku,
                    penulis: buku.penulis || '-',
                    skor: parseFloat(totalSkor.toFixed(6)),
                    totalNilai: nilaiBuku.length,
                    sumber: nilaiBuku.some(n => n.id_user) ? 'User' : 'Admin'
                });
            });

            // Urutkan berdasarkan skor tertinggi
            const rekomendasiGlobalData = bukuDenganSkorGlobal
                .sort((a, b) => b.skor - a.skor)
                .slice(0, 5);

            console.log('📊 Rekomendasi Global:', rekomendasiGlobalData);

            setRekomendasiGlobal(rekomendasiGlobalData);

            // ===== REKOMENDASI PERSONAL (dari penilaian user sendiri) =====
            const bukuIdsUser = [...new Set(nilaiUser.map(n => n.id_alternatif))];
            const bukuDenganSkorUser = [];

            bukuIdsUser.forEach(idBuku => {
                const buku = semuaBuku.find(b => b.id_alternatif === idBuku);
                if (!buku) return;

                const nilaiBuku = nilaiUser.filter(n => n.id_alternatif === idBuku);
                let totalSkor = 0;

                nilaiBuku.forEach(n => {
                    const bobotGlobal = bobotGlobalMap[n.id_sub] || 0;
                    const nilai = parseFloat(n.nilai) || 1;
                    totalSkor += bobotGlobal * nilai;
                });

                bukuDenganSkorUser.push({
                    id_alternatif: buku.id_alternatif,
                    judul_buku: buku.judul_buku,
                    penulis: buku.penulis || '-',
                    skor: parseFloat(totalSkor.toFixed(6)),
                    totalNilai: nilaiBuku.length
                });
            });

            const rekomendasiPersonal = bukuDenganSkorUser
                .sort((a, b) => b.skor - a.skor)
                .slice(0, 3);

            setRekomendasi(rekomendasiPersonal);

            setStats({
                totalBuku,
                totalDipinjam,
                totalDikembalikan,
                totalPending,
                totalUser
            });
            setBukuTersedia(tersedia);
            setBukuPopuler(populer);
            setPeminjamanAktif(aktif);

            // ===== CHART DATA =====
            // Chart Peminjaman Bulanan
            const bulanMap = {};
            peminjaman.forEach(p => {
                const bulan = new Date(p.created_at).toLocaleDateString('id-ID', { month: 'short' });
                if (!bulanMap[bulan]) bulanMap[bulan] = 0;
                bulanMap[bulan]++;
            });

            const bulanLabels = Object.keys(bulanMap);
            const bulanValues = Object.values(bulanMap);

            setChartData({
                labels: bulanLabels.length > 0 ? bulanLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                datasets: [
                    {
                        label: 'Jumlah Peminjaman',
                        data: bulanValues.length > 0 ? bulanValues : [0, 0, 0, 0, 0, 0],
                        backgroundColor: ['#4a6cf7', '#7c3aed', '#38a169', '#ed8936', '#e53e3e', '#06b6d4'],
                        borderRadius: 6,
                        borderSkipped: false,
                    }
                ]
            });

            // Chart Status Peminjaman
            const ditolak = peminjaman.filter(p => p.status === 'ditolak').length;
            const terlambat = peminjaman.filter(p => p.status === 'terlambat').length;

            setStatusChartData({
                labels: ['Menunggu', 'Dipinjam', 'Dikembalikan', 'Ditolak', 'Terlambat'],
                datasets: [
                    {
                        data: [
                            totalPending,
                            totalDipinjam,
                            totalDikembalikan,
                            ditolak,
                            terlambat
                        ],
                        backgroundColor: ['#ed8936', '#4a6cf7', '#38a169', '#e53e3e', '#e53e3e'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                    }
                ]
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'pending': { color: '#ed8936', bg: '#fffbeb', label: '⏳ Menunggu Verifikasi' },
            'dipinjam': { color: '#4a6cf7', bg: '#eff6ff', label: '📖 Dipinjam' },
            'dikembalikan': { color: '#38a169', bg: '#f0fdf4', label: '✅ Dikembalikan' },
            'ditolak': { color: '#e53e3e', bg: '#fef2f2', label: '❌ Ditolak' },
            'terlambat': { color: '#e53e3e', bg: '#fef2f2', label: '⚠️ Terlambat' }
        };
        const conf = config[status] || config['pending'];
        return (
            <span style={{ 
                padding: '2px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 600,
                background: conf.bg,
                color: conf.color
            }}>
                {conf.label}
            </span>
        );
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.0000';
        return parseFloat(val).toFixed(4);
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y} peminjaman`;
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
                ticks: { font: { size: 11 } }
            }
        }
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Memuat Dashboard...</p>
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

    const statCards = [
        { icon: Library, value: stats.totalBuku, label: 'Total Buku', color: '#4a6cf7', bg: '#eff6ff', path: '/user/buku' },
        { icon: BookOpen, value: stats.totalDipinjam, label: 'Dipinjam', color: '#ed8936', bg: '#fffbeb', path: '/user/riwayat' },
        { icon: CheckCircle, value: stats.totalDikembalikan, label: 'Dikembalikan', color: '#38a169', bg: '#f0fdf4', path: '/user/riwayat' },
        { icon: Clock, value: stats.totalPending, label: 'Menunggu Verifikasi', color: '#f59e0b', bg: '#fef3c7', path: '/user/riwayat' },
    ];

    return (
        <div className="dashboard-user">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        Selamat Datang, {user?.nama_lengkap || user?.username || 'User'}! 👋
                    </h1>
                    <p className="dashboard-subtitle">
                        Temukan buku favorit Anda di Perpustakaan Kabupaten Brebes
                    </p>
                </div>
                <button 
                    className="btn-pinjam"
                    onClick={() => navigate('/user/buku')}
                >
                    <BookOpen size={18} />
                    Cari Buku
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card"
                        onClick={() => navigate(stat.path)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="stat-number">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <BarChart3 size={18} className="chart-icon" />
                            <span>Peminjaman Per Bulan</span>
                        </div>
                        <span className="chart-badge">Total {stats.totalDipinjam + stats.totalDikembalikan}</span>
                    </div>
                    <div className="chart-wrapper">
                        <Bar data={chartData} options={barOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <PieChartIcon size={18} className="chart-icon" />
                            <span>Status Peminjaman</span>
                        </div>
                        <span className="chart-badge">Total {stats.total}</span>
                    </div>
                    <div className="chart-wrapper doughnut-wrapper">
                        {stats.totalDipinjam > 0 || stats.totalDikembalikan > 0 || stats.totalPending > 0 ? (
                            <Doughnut data={statusChartData} options={doughnutOptions} />
                        ) : (
                            <div className="chart-empty">
                                <p>Belum ada data peminjaman</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* REKOMENDASI GLOBAL */}
            <div className="card rekomendasi-card global">
                <div className="card-header">
                    <h3 className="card-title">
                        <Award size={20} style={{ color: '#f59e0b' }} />
                        Rekomendasi Buku Terbaik
                        <span className="rekomendasi-sub">Berdasarkan penilaian semua pengguna</span>
                    </h3>
                    <button 
                        className="btn-link"
                        onClick={() => navigate('/user/buku')}
                    >
                        Lihat Semua <ChevronRight size={16} />
                    </button>
                </div>
                {rekomendasiGlobal.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={40} style={{ opacity: 0.3, color: '#f59e0b' }} />
                        <p>Belum ada rekomendasi. Silakan lakukan penilaian buku terlebih dahulu.</p>
                        <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/user/nilai-alternatif')}
                        >
                            Berikan Penilaian
                        </button>
                    </div>
                ) : (
                    <div className="rekomendasi-list">
                        {rekomendasiGlobal.map((buku, index) => {
                            const medals = ['🥇', '🥈', '🥉', '🏅', '⭐'];
                            return (
                                <div 
                                    key={buku.id_alternatif || index} 
                                    className="rekomendasi-item"
                                    onClick={() => navigate(`/user/buku/${buku.id_alternatif}`)}
                                >
                                    <span className="rekomendasi-medal">{medals[index] || `#${index + 1}`}</span>
                                    <div className="rekomendasi-info">
                                        <span className="rekomendasi-title">{buku.judul_buku}</span>
                                        <span className="rekomendasi-author">{buku.penulis || '-'}</span>
                                        <span className="rekomendasi-sumber">{buku.sumber === 'User' ? '👤 Penilaian User' : '📊 Data Admin'}</span>
                                    </div>
                                    <div className="rekomendasi-skor">
                                        <Star size={14} style={{ color: '#f59e0b' }} />
                                        <span>{formatNumber(buku.skor || 0)}</span>
                                    </div>
                                    <span className="rekomendasi-badge">
                                        {buku.totalNilai} nilai
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {rekomendasiGlobal.length > 0 && (
                    <div className="rekomendasi-footer">
                        <span>✨ {rekomendasiGlobal.length} buku terbaik dari {stats.totalUser || 'semua'} pengguna</span>
                    </div>
                )}
            </div>

            {/* REKOMENDASI PERSONAL */}
            {rekomendasi.length > 0 && (
                <div className="card rekomendasi-card personal">
                    <div className="card-header">
                        <h3 className="card-title">
                            <UserCheck size={20} style={{ color: '#4a6cf7' }} />
                            Rekomendasi Untuk Anda
                            <span className="rekomendasi-sub">Berdasarkan penilaian Anda</span>
                        </h3>
                    </div>
                    <div className="rekomendasi-list personal-list">
                        {rekomendasi.map((buku, index) => {
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div 
                                    key={buku.id_alternatif || index} 
                                    className="rekomendasi-item personal"
                                    onClick={() => navigate(`/user/buku/${buku.id_alternatif}`)}
                                >
                                    <span className="rekomendasi-medal">{medals[index]}</span>
                                    <div className="rekomendasi-info">
                                        <span className="rekomendasi-title">{buku.judul_buku}</span>
                                        <span className="rekomendasi-author">{buku.penulis || '-'}</span>
                                    </div>
                                    <div className="rekomendasi-skor">
                                        <Star size={14} style={{ color: '#4a6cf7' }} />
                                        <span>{formatNumber(buku.skor || 0)}</span>
                                    </div>
                                    <span className="rekomendasi-badge personal-badge">
                                        {buku.totalNilai} kriteria
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Two Columns: Buku Tersedia & Peminjaman Aktif */}
            <div className="two-columns">
                {/* Buku Tersedia */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Library size={20} style={{ color: '#38a169' }} />
                            Buku Tersedia
                        </h3>
                        <button 
                            className="btn-link"
                            onClick={() => navigate('/user/buku')}
                        >
                            Lihat Semua <ChevronRight size={16} />
                        </button>
                    </div>
                    {bukuTersedia.length === 0 ? (
                        <div className="empty-state small">
                            <p>Belum ada buku tersedia</p>
                        </div>
                    ) : (
                        <div className="buku-list">
                            {bukuTersedia.map((buku) => (
                                <div 
                                    key={buku.id_alternatif} 
                                    className="buku-item"
                                    onClick={() => navigate(`/user/buku/${buku.id_alternatif}`)}
                                >
                                    <div className="buku-item-icon">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="buku-item-info">
                                        <span className="buku-item-title">{buku.judul_buku}</span>
                                        <span className="buku-item-author">{buku.penulis || '-'}</span>
                                    </div>
                                    <span className="buku-item-stok">Stok: {buku.stok}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Peminjaman Aktif */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <BookMarked size={20} style={{ color: '#4a6cf7' }} />
                            Peminjaman Aktif
                        </h3>
                        <button 
                            className="btn-link"
                            onClick={() => navigate('/user/riwayat')}
                        >
                            Lihat Semua <ChevronRight size={16} />
                        </button>
                    </div>
                    {peminjamanAktif.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={40} style={{ opacity: 0.3 }} />
                            <p>Belum ada peminjaman aktif</p>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate('/user/buku')}
                            >
                                Pinjam Buku Sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="peminjaman-list">
                            {peminjamanAktif.map((item) => (
                                <div key={item.id_peminjaman} className="peminjaman-item">
                                    <div className="peminjaman-info">
                                        <span className="peminjaman-title">{item.judul_buku}</span>
                                        <span className="peminjaman-date">
                                            <CalendarDays size={14} />
                                            {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="peminjaman-status">
                                        {getStatusBadge(item.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .dashboard-user {
                    padding: 24px 32px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .dashboard-title {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1a2744;
                    margin: 0;
                }

                .dashboard-subtitle {
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
                }

                .btn-pinjam:hover {
                    background: #3a5ce7;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.25);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(26,39,68,0.06);
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(26,39,68,0.1);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-number {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a2744;
                }

                .stat-label {
                    font-size: 13px;
                    color: #8a9ab8;
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

                .chart-icon { color: #4a6cf7; }
                .chart-badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 10px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    color: #64748b;
                }
                .chart-wrapper { height: 180px; position: relative; }
                .doughnut-wrapper { height: 200px; }
                .chart-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.06);
                    padding: 20px 24px;
                    margin-bottom: 20px;
                    border: 1px solid #e2e8f0;
                }

                .rekomendasi-card.global {
                    border-color: #fde68a;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                }

                .rekomendasi-card.personal {
                    border-color: #bfdbfe;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                    margin: 0;
                    flex-wrap: wrap;
                }

                .rekomendasi-sub {
                    font-size: 11px;
                    font-weight: 400;
                    color: #8a9ab8;
                    margin-left: 4px;
                }

                .btn-link {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    color: #4a6cf7;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .btn-link:hover { background: #eef2ff; }

                .empty-state {
                    text-align: center;
                    padding: 30px 20px;
                    color: #8a9ab8;
                }
                .empty-state.small { padding: 20px; }
                .empty-state p { margin: 8px 0; }

                .rekomendasi-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .rekomendasi-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 10px;
                    border: 1px solid #fde68a;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .rekomendasi-item.personal {
                    border-color: #bfdbfe;
                }

                .rekomendasi-item:hover {
                    transform: translateX(4px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }

                .rekomendasi-medal { font-size: 28px; flex-shrink: 0; }
                .rekomendasi-info { flex: 1; min-width: 0; }
                .rekomendasi-title {
                    font-weight: 600;
                    color: #1a2744;
                    font-size: 15px;
                }
                .rekomendasi-author {
                    font-size: 13px;
                    color: #8a9ab8;
                }
                .rekomendasi-sumber {
                    font-size: 11px;
                    color: #8a9ab8;
                    display: block;
                }
                .rekomendasi-skor {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 700;
                    color: #f59e0b;
                    font-size: 14px;
                    font-family: monospace;
                }
                .rekomendasi-item.personal .rekomendasi-skor { color: #4a6cf7; }
                .rekomendasi-badge {
                    font-size: 11px;
                    padding: 2px 10px;
                    background: #eef2ff;
                    color: #4a6cf7;
                    border-radius: 12px;
                    font-weight: 500;
                }
                .rekomendasi-badge.personal-badge { background: #dbeafe; }
                .rekomendasi-footer {
                    text-align: center;
                    padding-top: 12px;
                    font-size: 12px;
                    color: #8a9ab8;
                    border-top: 1px solid #fde68a;
                    margin-top: 12px;
                }

                .peminjaman-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .peminjaman-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    border-radius: 8px;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .peminjaman-item:hover { background: #f1f5f9; }
                .peminjaman-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .peminjaman-title { font-weight: 500; color: #1a2744; }
                .peminjaman-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 13px;
                    color: #8a9ab8;
                }
                .peminjaman-status { flex-shrink: 0; }

                .buku-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .buku-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .buku-item:hover { background: #f8fafc; }
                .buku-item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #eef2ff;
                    color: #4a6cf7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .buku-item-info { flex: 1; }
                .buku-item-title {
                    font-weight: 500;
                    color: #1a2744;
                    font-size: 14px;
                }
                .buku-item-author {
                    font-size: 12px;
                    color: #8a9ab8;
                    margin-left: 8px;
                }
                .buku-item-stok {
                    font-size: 12px;
                    color: #38a169;
                    font-weight: 500;
                }

                .two-columns {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: #4a6cf7;
                    color: white;
                }
                .btn-primary:hover {
                    background: #3a5ce7;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(74,108,247,0.25);
                }
                .btn-sm { padding: 6px 14px; font-size: 12px; }

                @media (max-width: 1024px) {
                    .charts-grid { grid-template-columns: 1fr; }
                    .two-columns { grid-template-columns: 1fr; }
                }

                @media (max-width: 768px) {
                    .dashboard-user { padding: 16px; }
                    .dashboard-header { flex-direction: column; align-items: stretch; }
                    .btn-pinjam { justify-content: center; }
                    .stats-grid { grid-template-columns: 1fr 1fr; }
                    .chart-wrapper { height: 150px; }
                    .doughnut-wrapper { height: 170px; }
                    .peminjaman-item { flex-direction: column; align-items: flex-start; }
                    .peminjaman-info { flex-direction: column; align-items: flex-start; gap: 4px; }
                    .rekomendasi-item { flex-wrap: wrap; }
                    .rekomendasi-medal { font-size: 22px; }
                }

                @media (max-width: 480px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .buku-item { flex-wrap: wrap; }
                    .buku-item-stok { margin-left: 44px; }
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;