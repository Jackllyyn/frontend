import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Globe, CheckCircle, AlertCircle, 
    ArrowLeft, RefreshCw, Printer,
    TrendingUp, Layers, Calculator,
    ChevronDown, ChevronRight
} from 'lucide-react';

const API_URL = '/api';

const HasilGlobalPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [expandedKriteria, setExpandedKriteria] = useState({});
    const [showDetail, setShowDetail] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Ambil semua sub-kriteria dengan bobot global
            const sRes = await axios.get(`${API_URL}/sub-kriteria`);
            if (!sRes.data.success) {
                throw new Error('Gagal mengambil data sub-kriteria');
            }

            // 2. Ambil bobot kriteria untuk perhitungan
            const kRes = await axios.get(`${API_URL}/kriteria`);
            const kriteria = kRes.data.data || [];

            const allSubs = sRes.data.data || [];
            
            // 3. Buat map bobot kriteria
            const bobotKriteriaMap = {};
            for (const k of kriteria) {
                bobotKriteriaMap[k.id_kriteria] = parseFloat(k.bobot) || 0;
            }

            // 4. Kelompokkan berdasarkan kriteria & hitung detail
            const grouped = {};
            let totalGlobal = 0;

            for (const item of allSubs) {
                const bobotKrit = bobotKriteriaMap[item.id_kriteria] || 0;
                const bobotSub = parseFloat(item.bobot_sub) || 0;
                const bobotGlobal = bobotKrit * bobotSub;
                
                if (!grouped[item.id_kriteria]) {
                    grouped[item.id_kriteria] = {
                        id_kriteria: item.id_kriteria,
                        nama_kriteria: item.nama_kriteria || 'Tidak diketahui',
                        bobot_kriteria: bobotKrit,
                        total_bobot_kriteria: 0,
                        subs: []
                    };
                }
                
                grouped[item.id_kriteria].subs.push({
                    id_sub: item.id_sub,
                    nama_sub: item.nama_sub,
                    bobot_sub: bobotSub,
                    bobot_global: bobotGlobal,
                    bobot_global_persen: (bobotGlobal * 100).toFixed(2) + '%'
                });
                
                grouped[item.id_kriteria].total_bobot_kriteria += bobotGlobal;
                totalGlobal += bobotGlobal;
            }

            // 5. Sortir
            const groupedArray = Object.values(grouped);
            for (const g of groupedArray) {
                g.subs.sort((a, b) => b.bobot_global - a.bobot_global);
            }
            groupedArray.sort((a, b) => b.total_bobot_kriteria - a.total_bobot_kriteria);

            setData({
                grouped: groupedArray,
                all: allSubs,
                totalGlobal: totalGlobal,
                totalGlobalPersen: (totalGlobal * 100).toFixed(2) + '%'
            });

            // Set default expanded = true untuk semua
            const expanded = {};
            for (const g of groupedArray) {
                expanded[g.id_kriteria] = true;
            }
            setExpandedKriteria(expanded);

        } catch (err) {
            console.error('Error:', err);
            setError('Gagal mengambil data: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedKriteria(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleAllExpand = () => {
        const allExpanded = {};
        for (const g of data?.grouped || []) {
            allExpanded[g.id_kriteria] = !showDetail;
        }
        setExpandedKriteria(allExpanded);
        setShowDetail(!showDetail);
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.0000';
        return parseFloat(val).toFixed(4);
    };

    const getColor = (index) => {
        const colors = ['#4a90d9', '#48bb78', '#ed8936', '#9f7aea', '#fc8181', '#68d391', '#63b3ed', '#f6ad55'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Memuat hasil global...</p>
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
                        border-top-color: #2c3e7a;
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

    if (error) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Hasil Global</h1>
                    <button className="btn btn-outline" onClick={() => navigate('/sub-kriteria')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
                <div className="card-error">
                    <AlertCircle size={48} />
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchData}>Coba Lagi</button>
                </div>
                <style>{`
                    .page-wrapper { padding: 24px; max-width: 1200px; margin: 0 auto; }
                    .card-error { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 16px rgba(26,39,68,0.08); }
                    .card-error p { margin: 16px 0; color: #9b2c2c; }
                `}</style>
            </div>
        );
    }

    if (!data || data.all.length === 0) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Hasil Global</h1>
                    <button className="btn btn-outline" onClick={() => navigate('/sub-kriteria')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
                <div className="card-empty">
                    <Calculator size={48} />
                    <p>Belum ada data perhitungan global</p>
                    <p className="empty-hint">Lakukan perhitungan global terlebih dahulu</p>
                    <button className="btn btn-primary" onClick={() => navigate('/sub-kriteria')}>
                        Ke Sub-Kriteria
                    </button>
                </div>
                <style>{`
                    .card-empty { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 16px rgba(26,39,68,0.08); }
                    .card-empty p { margin: 8px 0; color: #8a9ab8; }
                    .empty-hint { font-size: 14px; }
                `}</style>
            </div>
        );
    }

    const colors = ['#4a90d9', '#48bb78', '#ed8936', '#9f7aea', '#fc8181', '#68d391'];

    return (
        <div className="global-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🌐 Hasil Global</h1>
                    <p className="page-subtitle">
                        Bobot Global = Bobot Kriteria × Bobot Sub-Kriteria
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline btn-sm" onClick={toggleAllExpand}>
                        {showDetail ? 'Sembunyikan Semua' : 'Tampilkan Semua'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={fetchData}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/sub-kriteria')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
            </div>

            {/* Total Global */}
            <div className="total-card">
                <div className="total-icon">
                    <Globe size={32} />
                </div>
                <div className="total-content">
                    <div className="total-label">Total Bobot Global</div>
                    <div className="total-value">{data.totalGlobalPersen}</div>
                    <div className="total-sub">
                        Dari {data.all.length} sub-kriteria yang dinilai
                    </div>
                </div>
                <div className="total-progress">
                    <div className="progress-ring">
                        <div className="progress-ring-fill" style={{
                            width: `${Math.min(data.totalGlobal * 100, 100)}%`
                        }} />
                    </div>
                    <span className="progress-text">{data.totalGlobalPersen}</span>
                </div>
            </div>

            {/* Per Kriteria */}
            <div className="kriteria-section">
                <h3 className="section-title">
                    <Layers size={18} />
                    Penjabaran per Kriteria
                </h3>

                {data.grouped.map((group, idx) => {
                    const isExpanded = expandedKriteria[group.id_kriteria] !== false;
                    const color = getColor(idx);

                    return (
                        <div key={group.id_kriteria} className="kriteria-card">
                            <div 
                                className="kriteria-header"
                                onClick={() => toggleExpand(group.id_kriteria)}
                            >
                                <div className="kriteria-header-left">
                                    <div className="kriteria-badge" style={{ background: color }}>
                                        {group.nama_kriteria.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="kriteria-name">{group.nama_kriteria}</div>
                                        <div className="kriteria-meta">
                                            {group.subs.length} sub-kriteria · 
                                            Bobot Kriteria: {formatNumber(group.bobot_kriteria)}
                                        </div>
                                    </div>
                                </div>
                                <div className="kriteria-header-right">
                                    <div className="kriteria-total">
                                        {formatNumber(group.total_bobot_kriteria * 100)}%
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown size={18} className="chevron" />
                                    ) : (
                                        <ChevronRight size={18} className="chevron" />
                                    )}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="kriteria-body">
                                    {/* Progress bar total kriteria */}
                                    <div className="kriteria-progress">
                                        <div className="kriteria-progress-bar" style={{
                                            width: `${group.total_bobot_kriteria * 100}%`,
                                            background: color
                                        }} />
                                    </div>

                                    {/* Tabel sub-kriteria */}
                                    <table className="sub-table">
                                        <thead>
                                            <tr>
                                                <th>Sub-Kriteria</th>
                                                <th className="col-center">Bobot Sub</th>
                                                <th className="col-center">Bobot Global</th>
                                                <th className="col-center">Kontribusi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.subs.map((sub, subIdx) => {
                                                const subColor = colors[subIdx % colors.length];
                                                return (
                                                    <tr key={sub.id_sub}>
                                                        <td className="sub-name">{sub.nama_sub}</td>
                                                        <td className="col-center">{formatNumber(sub.bobot_sub)}</td>
                                                        <td className="col-center">
                                                            <span style={{ fontWeight: 600, color: subColor }}>
                                                                {formatNumber(sub.bobot_global)}
                                                            </span>
                                                        </td>
                                                        <td className="col-center">
                                                            <div className="contribution-bar">
                                                                <div className="contribution-fill" style={{
                                                                    width: sub.bobot_global_persen,
                                                                    background: subColor
                                                                }} />
                                                                <span className="contribution-text">
                                                                    {sub.bobot_global_persen}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Rumus */}
                                    <div className="rumus-box">
                                        <div className="rumus-title">
                                            <Calculator size={14} />
                                            <span>Perhitungan</span>
                                        </div>
                                        <div className="rumus-content">
                                            {group.subs.map((sub, subIdx) => (
                                                <div key={sub.id_sub} className="rumus-item">
                                                    <span className="rumus-sub">{sub.nama_sub}</span>
                                                    <span className="rumus-equals">=</span>
                                                    <span className="rumus-value">
                                                        {formatNumber(group.bobot_kriteria)} × {formatNumber(sub.bobot_sub)}
                                                    </span>
                                                    <span className="rumus-equals">=</span>
                                                    <span className="rumus-result" style={{ color: colors[subIdx % colors.length] }}>
                                                        {formatNumber(sub.bobot_global)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                /* ===== PAGE ===== */
                .global-page {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* ===== HEADER ===== */
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
                }
                .page-subtitle {
                    color: #8a9ab8;
                    font-size: 15px;
                    margin-top: 4px;
                }
                .header-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                /* ===== BUTTONS ===== */
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
                    background: #2c3e7a;
                    color: white;
                }
                .btn-primary:hover {
                    background: #3d5a9e;
                    transform: translateY(-2px);
                }
                .btn-outline {
                    background: transparent;
                    color: #4a5a7a;
                    border: 2px solid #e2e8f0;
                }
                .btn-outline:hover {
                    border-color: #2c3e7a;
                    color: #2c3e7a;
                }
                .btn-sm {
                    padding: 6px 14px;
                    font-size: 12px;
                }

                /* ===== TOTAL CARD ===== */
                .total-card {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 24px 28px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.08);
                    margin-bottom: 24px;
                    border: 2px solid #2c3e7a;
                    flex-wrap: wrap;
                }
                .total-icon {
                    width: 56px;
                    height: 56px;
                    background: #eef2f7;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2c3e7a;
                }
                .total-content {
                    flex: 1;
                }
                .total-label {
                    font-size: 13px;
                    color: #8a9ab8;
                    font-weight: 500;
                }
                .total-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1a2744;
                }
                .total-sub {
                    font-size: 13px;
                    color: #8a9ab8;
                }
                .total-progress {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .progress-ring {
                    width: 80px;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-ring-fill {
                    height: 100%;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #2c3e7a, #4a90d9);
                    transition: width 0.8s ease;
                }
                .progress-text {
                    font-weight: 700;
                    font-size: 18px;
                    color: #2c3e7a;
                    min-width: 60px;
                }

                /* ===== KRITERIA SECTION ===== */
                .kriteria-section {
                    margin-top: 8px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a2744;
                    margin-bottom: 16px;
                }

                /* ===== KRITERIA CARD ===== */
                .kriteria-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(26,39,68,0.06);
                    margin-bottom: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    transition: box-shadow 0.2s;
                }
                .kriteria-card:hover {
                    box-shadow: 0 4px 16px rgba(26,39,68,0.1);
                }

                .kriteria-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 20px;
                    cursor: pointer;
                    transition: background 0.2s;
                    user-select: none;
                }
                .kriteria-header:hover {
                    background: #f7f9fc;
                }

                .kriteria-header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .kriteria-badge {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                .kriteria-name {
                    font-weight: 600;
                    color: #1a2744;
                    font-size: 15px;
                }
                .kriteria-meta {
                    font-size: 13px;
                    color: #8a9ab8;
                }
                .kriteria-header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .kriteria-total {
                    font-weight: 700;
                    font-size: 16px;
                    color: #1a2744;
                }
                .chevron {
                    color: #8a9ab8;
                    transition: transform 0.2s;
                }

                .kriteria-body {
                    padding: 0 20px 20px 20px;
                    border-top: 1px solid #e2e8f0;
                    animation: fadeIn 0.3s ease;
                }
                .kriteria-progress {
                    width: 100%;
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 2px;
                    margin: 12px 0 16px 0;
                    overflow: hidden;
                }
                .kriteria-progress-bar {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.8s ease;
                }

                /* ===== SUB TABLE ===== */
                .sub-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .sub-table th {
                    padding: 8px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #4a5a7a;
                    border-bottom: 2px solid #e2e8f0;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .sub-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .sub-table tr:last-child td {
                    border-bottom: none;
                }
                .sub-table tr:hover td {
                    background: #f7f9fc;
                }
                .sub-name {
                    font-weight: 500;
                    color: #1a2744;
                }
                .col-center {
                    text-align: center;
                }

                .contribution-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: center;
                }
                .contribution-fill {
                    width: 60px;
                    height: 6px;
                    border-radius: 3px;
                    background: #e2e8f0;
                    transition: width 0.6s ease;
                }
                .contribution-text {
                    font-size: 13px;
                    font-weight: 600;
                    min-width: 50px;
                    text-align: right;
                }

                /* ===== RUMUS BOX ===== */
                .rumus-box {
                    margin-top: 12px;
                    padding: 12px 16px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .rumus-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #4a5a7a;
                    margin-bottom: 8px;
                }
                .rumus-content {
                    display: grid;
                    gap: 4px;
                    font-size: 13px;
                    font-family: 'Courier New', monospace;
                }
                .rumus-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                    flex-wrap: wrap;
                }
                .rumus-sub {
                    color: #1a2744;
                    font-weight: 500;
                    min-width: 100px;
                }
                .rumus-equals {
                    color: #8a9ab8;
                    font-weight: 300;
                }
                .rumus-value {
                    color: #4a5a7a;
                    font-family: 'Courier New', monospace;
                }
                .rumus-result {
                    font-weight: 700;
                    font-size: 14px;
                }

                /* ===== ANIMATIONS ===== */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .global-page { padding: 16px; }
                    .page-header { flex-direction: column; }
                    .header-actions { width: 100%; }
                    .header-actions .btn { flex: 1; justify-content: center; }
                    .total-card { flex-direction: column; text-align: center; }
                    .total-progress { width: 100%; justify-content: center; }
                    .kriteria-header { flex-direction: column; align-items: flex-start; gap: 8px; }
                    .kriteria-header-right { width: 100%; justify-content: space-between; }
                    .sub-table { font-size: 12px; }
                    .sub-table th, .sub-table td { padding: 6px 8px; }
                    .contribution-fill { width: 40px; }
                    .rumus-item { font-size: 12px; flex-wrap: wrap; }
                    .rumus-sub { min-width: 60px; }
                }
            `}</style>
        </div>
    );
};

export default HasilGlobalPage;