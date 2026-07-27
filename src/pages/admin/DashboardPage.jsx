// DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    BookOpen, 
    ListChecks, 
    Trophy, 
    GitCompare,
    TrendingUp,
    Users,
    Library,
    ArrowRight,
    Calendar,
    Clock,
    Layers
} from 'lucide-react';

const API_URL = '/api';

// Urutan kriteria yang diinginkan
const KRITERIA_ORDER = ['Genre', 'Tahun Terbit', 'Popularitas', 'Rating'];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalKriteria: 0,
        totalBuku: 0,
        totalHasil: 0,
        totalSubKriteria: 0,
        totalPairwise: 0
    });
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [nilaiAlternatif, setNilaiAlternatif] = useState([]);

    useEffect(() => {
        // Set greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Selamat Pagi');
        else if (hour < 15) setGreeting('Selamat Siang');
        else if (hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

        // Set current time
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);

        fetchData();

        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kriteriaRes, bukuRes, hasilRes, subRes, pairwiseRes, nilaiRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/alternatif`),
                axios.get(`${API_URL}/ahp/hasil`),
                axios.get(`${API_URL}/sub-kriteria`),
                axios.get(`${API_URL}/pairwise`),
                axios.get(`${API_URL}/nilai-alternatif`)
            ]);

            const kriteriaData = kriteriaRes.data.data || [];
            const bukuData = bukuRes.data.data || [];
            const subData = subRes.data.data || [];
            const nilaiData = nilaiRes.data.data || [];

            // Urutkan kriteria berdasarkan urutan yang diinginkan
            const sortedKriteria = KRITERIA_ORDER.map(nama => {
                return kriteriaData.find(k => k.nama_kriteria === nama);
            }).filter(Boolean);

            const remainingKriteria = kriteriaData.filter(k => !KRITERIA_ORDER.includes(k.nama_kriteria));
            const finalKriteria = [...sortedKriteria, ...remainingKriteria];

            setKriteria(finalKriteria);
            setSubKriteria(subData);
            setNilaiAlternatif(nilaiData);

            // Buat map bobot kriteria
            const kriteriaMap = {};
            finalKriteria.forEach((k, index) => {
                kriteriaMap[k.id_kriteria] = {
                    bobot: parseFloat(k.bobot) || 0,
                    urutan: index,
                    nama: k.nama_kriteria
                };
            });

            // Buat map bobot global per sub-kriteria
            const globalMap = {};
            subData.forEach((sub) => {
                let bobotGlobal = parseFloat(sub.bobot_global) || 0;
                const bobotKrit = kriteriaMap[sub.id_kriteria]?.bobot || 0;
                const bobotSub = parseFloat(sub.bobot_sub) || 0;
                
                if (bobotGlobal === 0) {
                    bobotGlobal = bobotKrit * bobotSub;
                }
                
                globalMap[sub.id_sub] = {
                    bobot_global: bobotGlobal,
                    bobot_kriteria: bobotKrit,
                    bobot_sub: bobotSub,
                    nama_sub: sub.nama_sub,
                    id_kriteria: sub.id_kriteria,
                    nama_kriteria: kriteriaMap[sub.id_kriteria]?.nama || 'Tidak diketahui',
                    urutan_kriteria: kriteriaMap[sub.id_kriteria]?.urutan || 999
                };
            });

            // Hitung ranking untuk dashboard
            const hasilRanking = await hitungRankingDashboard(subData, nilaiData, bukuData, kriteriaMap, globalMap);

            setStats({
                totalKriteria: finalKriteria.length || 0,
                totalBuku: bukuData.length || 0,
                totalHasil: hasilRanking.length || 0,
                totalSubKriteria: subData.length || 0,
                totalPairwise: pairwiseRes.data.data?.length || 0
            });

            setRecentResults(hasilRanking.slice(0, 5));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const hitungRankingDashboard = async (subs = null, nilai = null, bukuData = null, kriteriaMap = null, globalMapData = null) => {
        const subData = subs || subKriteria;
        const nilaiData = nilai || nilaiAlternatif;
        const kritMap = kriteriaMap || {};
        const globalData = globalMapData || {};

        let allBuku = bukuData;
        if (!allBuku) {
            const res = await axios.get(`${API_URL}/alternatif`);
            allBuku = res.data.data || [];
        }

        const bukuIds = [...new Set(nilaiData.map(n => n.id_alternatif))];
        
        if (bukuIds.length === 0 || allBuku.length === 0) {
            return [];
        }

        // Buat ulang global map dengan urutan yang benar
        const globalMap = {};
        subData.forEach((sub) => {
            let bobotGlobal = parseFloat(sub.bobot_global) || 0;
            if (bobotGlobal === 0) {
                const bobotKrit = kritMap[sub.id_kriteria]?.bobot || 0;
                const bobotSub = parseFloat(sub.bobot_sub) || 0;
                bobotGlobal = bobotKrit * bobotSub;
            }
            globalMap[sub.id_sub] = {
                bobot_global: bobotGlobal,
                bobot_kriteria: kritMap[sub.id_kriteria]?.bobot || 0,
                bobot_sub: parseFloat(sub.bobot_sub) || 0,
                nama_sub: sub.nama_sub,
                id_kriteria: sub.id_kriteria,
                nama_kriteria: kritMap[sub.id_kriteria]?.nama || 'Tidak diketahui',
                urutan_kriteria: kritMap[sub.id_kriteria]?.urutan || 999
            };
        });

        // Hitung skor untuk setiap buku
        const hasilRanking = bukuIds.map(idBuku => {
            const buku = allBuku.find(b => b.id_alternatif === idBuku);
            const nilaiBuku = nilaiData.filter(n => n.id_alternatif === idBuku);
            
            let totalSkor = 0;

            // Urutkan subkriteria berdasarkan urutan kriteria yang diinginkan
            const sortedSubs = [...subData].sort((a, b) => {
                const urutanA = kritMap[a.id_kriteria]?.urutan || 999;
                const urutanB = kritMap[b.id_kriteria]?.urutan || 999;
                if (urutanA !== urutanB) {
                    return urutanA - urutanB;
                }
                return a.id_sub - b.id_sub;
            });

            // Proses setiap subkriteria sesuai urutan
            for (const sub of sortedSubs) {
                const nilaiSub = nilaiBuku.find(n => n.id_sub === sub.id_sub);
                if (!nilaiSub) continue;

                const bobotGlobal = globalMap[sub.id_sub]?.bobot_global || 0;
                totalSkor += bobotGlobal;
            }

            return {
                id_alternatif: idBuku,
                judul_buku: buku?.judul_buku || 'Tidak diketahui',
                penulis: buku?.penulis || '-',
                skor_total: parseFloat(totalSkor.toFixed(6)),
                peringkat: 0
            };
        });

        // Urutkan berdasarkan skor tertinggi
        hasilRanking.sort((a, b) => b.skor_total - a.skor_total);
        hasilRanking.forEach((item, index) => {
            item.peringkat = index + 1;
        });

        return hasilRanking;
    };

    const statCards = [
        { 
            title: 'Kriteria', 
            value: stats.totalKriteria, 
            icon: ListChecks, 
            color: '#4f6ef7',
            bg: 'rgba(79, 110, 247, 0.1)',
            path: '/kriteria'
        },
        { 
            title: 'Sub Kriteria', 
            value: stats.totalSubKriteria, 
            icon: Layers, 
            color: '#7c5cfc',
            bg: 'rgba(124, 92, 252, 0.1)',
            path: '/sub-kriteria'
        },
        { 
            title: 'Data Buku', 
            value: stats.totalBuku, 
            icon: BookOpen, 
            color: '#48bb78',
            bg: 'rgba(72, 187, 120, 0.1)',
            path: '/buku'
        },
        { 
            title: 'Pairwise', 
            value: stats.totalPairwise, 
            icon: GitCompare, 
            color: '#ed8936',
            bg: 'rgba(237, 137, 54, 0.1)',
            path: '/pairwise'
        },
        { 
            title: 'Hasil AHP', 
            value: stats.totalHasil, 
            icon: Trophy, 
            color: '#e53e3e',
            bg: 'rgba(229, 62, 62, 0.1)',
            path: '/hasil'
        },
    ];

    const quickActions = [
        { label: 'Tambah Kriteria', path: '/kriteria', icon: ListChecks, color: '#4f6ef7' },
        { label: 'Tambah Buku', path: '/buku', icon: BookOpen, color: '#48bb78' },
        { label: 'Pairwise Kriteria', path: '/pairwise', icon: GitCompare, color: '#ed8936' },
        { label: 'Lihat Hasil', path: '/hasil', icon: Trophy, color: '#e53e3e' },
    ];

    const getMedal = (index) => {
        return index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Memuat dashboard...</p>
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
                        border-top-color: #4f6ef7;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    .loading-text {
                        margin-top: 16px;
                        color: #8a9ab8;
                        font-size: 14px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <div className="greeting-section">
                        <h1 className="greeting">{greeting} 👋</h1>
                        <p className="greeting-sub">Selamat datang di SPK AHP Perpustakaan Kabupaten Brebes</p>
                    </div>
                    <div className="header-stats">
                        <div className="header-stat">
                            <span className="header-stat-value">{stats.totalKriteria + stats.totalSubKriteria}</span>
                            <span className="header-stat-label">Total Kriteria & Sub</span>
                        </div>
                        <div className="header-stat-divider" />
                        <div className="header-stat">
                            <span className="header-stat-value">{stats.totalBuku}</span>
                            <span className="header-stat-label">Total Buku</span>
                        </div>
                        <div className="header-stat-divider" />
                        <div className="header-stat">
                            <span className="header-stat-value">{stats.totalHasil}</span>
                            <span className="header-stat-label">Hasil Perhitungan</span>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    <div className="time-display">
                        <Clock size={18} />
                        <span>{currentTime}</span>
                    </div>
                    <div className="status-badge">
                        <span className="status-dot" />
                        Sistem Aktif
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card"
                        onClick={() => navigate(stat.path)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="stat-icon-wrapper" style={{ background: stat.bg, color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-number">{stat.value}</div>
                            <div className="stat-label">{stat.title}</div>
                        </div>
                        <ArrowRight size={16} className="stat-arrow" />
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3 className="section-title">Aksi Cepat</h3>
                <div className="quick-actions-grid">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="quick-action-btn"
                            onClick={() => navigate(action.path)}
                            style={{ borderColor: action.color }}
                        >
                            <div className="quick-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                                <action.icon size={18} />
                            </div>
                            <span className="quick-action-label">{action.label}</span>
                            <ArrowRight size={14} className="quick-action-arrow" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Results */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <Trophy size={20} className="icon" />
                        Hasil Perhitungan Terbaru
                    </div>
                    <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => navigate('/hasil')}
                    >
                        Lihat Semua <ArrowRight size={14} />
                    </button>
                </div>

                {recentResults.length === 0 ? (
                    <div className="empty-state">
                        <Trophy size={48} />
                        <p className="empty-title">Belum ada hasil perhitungan</p>
                        <p className="empty-desc">Silakan lakukan perhitungan AHP terlebih dahulu</p>
                        <button className="btn btn-primary" onClick={() => navigate('/pairwise')}>
                            Mulai Perhitungan
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="col-rank">Peringkat</th>
                                    <th>Judul Buku</th>
                                    <th>Penulis</th>
                                    <th className="col-score">Skor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentResults.map((item, index) => (
                                    <tr key={item.id_alternatif} className={index < 3 ? 'top-rank' : ''}>
                                        <td className="col-rank">
                                            <span className="rank-badge">
                                                {getMedal(index)}
                                            </span>
                                        </td>
                                        <td className="col-title">
                                            <span className="title-text">{item.judul_buku}</span>
                                        </td>
                                        <td>{item.penulis || '-'}</td>
                                        <td className="col-score">
                                            <span className="score-badge">
                                                {parseFloat(item.skor_total).toFixed(4)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                /* ===== PAGE ===== */
                .dashboard-page {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* ===== HEADER ===== */
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                    background: white;
                    padding: 24px 28px;
                    border-radius: 16px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.06);
                }

                .header-left {
                    flex: 1;
                }

                .greeting {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1a2744;
                    margin: 0 0 4px 0;
                }

                .greeting-sub {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin: 0;
                }

                .header-stats {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-top: 12px;
                }

                .header-stat {
                    display: flex;
                    flex-direction: column;
                }

                .header-stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2744;
                }

                .header-stat-label {
                    font-size: 12px;
                    color: #8a9ab8;
                    font-weight: 500;
                }

                .header-stat-divider {
                    width: 1px;
                    height: 30px;
                    background: #e2e8f0;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .time-display {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: #f7fafc;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #4a5a7a;
                }

                .time-display svg {
                    color: #8a9ab8;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    background: #e6f7e6;
                    color: #276749;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #48bb78;
                    animation: pulse-dot 2s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }

                /* ===== STATS GRID ===== */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: white;
                    padding: 18px 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(26,39,68,0.05);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                    animation: fadeInUp 0.4s ease forwards;
                    opacity: 0;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(26,39,68,0.1);
                    border-color: #e2e8f0;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .stat-icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-number {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a2744;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 13px;
                    color: #8a9ab8;
                    font-weight: 500;
                }

                .stat-arrow {
                    color: #cbd5e0;
                    transition: transform 0.2s, color 0.2s;
                    flex-shrink: 0;
                }

                .stat-card:hover .stat-arrow {
                    transform: translateX(4px);
                    color: #4f6ef7;
                }

                /* ===== QUICK ACTIONS ===== */
                .quick-actions {
                    margin-bottom: 24px;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                    margin: 0 0 12px 0;
                }

                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                }

                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .quick-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(26,39,68,0.08);
                    border-color: #cbd5e0;
                }

                .quick-action-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .quick-action-label {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 500;
                    color: #1a2744;
                }

                .quick-action-arrow {
                    color: #cbd5e0;
                    transition: transform 0.2s;
                    flex-shrink: 0;
                }

                .quick-action-btn:hover .quick-action-arrow {
                    transform: translateX(4px);
                    color: #4f6ef7;
                }

                /* ===== CARD ===== */
                .card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.06);
                    padding: 20px 24px;
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
                    gap: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                }

                .card-title .icon {
                    color: #4f6ef7;
                }

                /* ===== TABLE ===== */
                .table-wrapper {
                    overflow-x: auto;
                }

                .table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .table thead {
                    background: #f7fafc;
                    border-bottom: 2px solid #e2e8f0;
                }

                .table th {
                    padding: 10px 14px;
                    text-align: left;
                    font-weight: 600;
                    color: #4a5a7a;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .table td {
                    padding: 10px 14px;
                    border-bottom: 1px solid #eef2f7;
                    color: #1a2744;
                }

                .table tbody tr:hover {
                    background: #f7fafc;
                }

                .table tbody tr.top-rank {
                    background: #fffbeb;
                }

                .table tbody tr.top-rank:hover {
                    background: #fef3c7;
                }

                .col-rank {
                    width: 80px;
                    text-align: center;
                }

                .col-score {
                    width: 120px;
                    text-align: right;
                }

                .col-title .title-text {
                    font-weight: 600;
                }

                .rank-badge {
                    font-size: 20px;
                }

                .score-badge {
                    padding: 4px 12px;
                    background: #f0f4ff;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 13px;
                    color: #4f6ef7;
                }

                /* ===== EMPTY STATE ===== */
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #8a9ab8;
                }

                .empty-state svg {
                    opacity: 0.3;
                    color: #8a9ab8;
                    margin-bottom: 12px;
                }

                .empty-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #4a5a7a;
                    margin: 0 0 4px 0;
                }

                .empty-desc {
                    font-size: 14px;
                    margin-bottom: 16px;
                }

                /* ===== BUTTONS ===== */
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
                    background: #4f6ef7;
                    color: white;
                }

                .btn-primary:hover {
                    background: #3d5ae0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 110, 247, 0.3);
                }

                .btn-outline {
                    background: transparent;
                    color: #4a5a7a;
                    border: 2px solid #e2e8f0;
                }

                .btn-outline:hover {
                    border-color: #4f6ef7;
                    color: #4f6ef7;
                }

                .btn-sm {
                    padding: 6px 14px;
                    font-size: 12px;
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .dashboard-page { padding: 16px; }
                    .dashboard-header { padding: 18px 20px; flex-direction: column; }
                    .header-stats { flex-wrap: wrap; }
                    .header-stat-divider { display: none; }
                    .header-right { width: 100%; justify-content: flex-start; }
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
                    .card { padding: 16px; }
                    .table { font-size: 13px; }
                    .table th, .table td { padding: 8px 10px; }
                    .col-rank { width: 50px; }
                    .col-score { width: 80px; }
                }

                @media (max-width: 480px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .quick-actions-grid { grid-template-columns: 1fr; }
                    .table { font-size: 12px; }
                    .table th, .table td { padding: 6px 8px; }
                    .rank-badge { font-size: 18px; }
                    .score-badge { font-size: 11px; padding: 2px 8px; }
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;