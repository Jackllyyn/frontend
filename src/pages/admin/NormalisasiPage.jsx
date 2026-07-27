import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Table, 
    CheckCircle, 
    XCircle, 
    TrendingUp,
    ArrowLeft,
    Layers,
    Info,
    BarChart3,
    RefreshCw,
    Grid3x3,
    Calculator
} from 'lucide-react';

const API_URL = '/api';

const NormalisasiPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNormalisasi();
    }, []);

    const fetchNormalisasi = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/normalisasi`);
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data normalisasi');
        } finally {
            setLoading(false);
        }
    };

    const MatrixTable = ({ data, labels, title, isNormalized = false }) => {
        if (!data || data.length === 0) return null;

        return (
            <div className="matrix-wrapper">
                <div className="matrix-title-bar">
                    <span className="matrix-title">{title}</span>
                    {isNormalized && (
                        <span className="matrix-badge">✓ Total Kolom = 1</span>
                    )}
                </div>
                <div className="table-scroll">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th className="th-corner">Kriteria</th>
                                {labels.map((label, idx) => (
                                    <th key={idx}>{label}</th>
                                ))}
                                {isNormalized && (
                                    <th className="th-total">Total</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}>
                                    <td className="td-label">{labels[i]}</td>
                                    {row.map((value, j) => (
                                        <td key={j} className="td-value">
                                            {typeof value === 'number' ? value.toFixed(4) : value}
                                        </td>
                                    ))}
                                    {isNormalized && (
                                        <td className="td-total">
                                            {row.reduce((a, b) => a + b, 0).toFixed(4)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const BobotKriteria = ({ bobot }) => {
        if (!bobot || bobot.length === 0) return null;

        const colors = ['#4f6ef7', '#38a169', '#d69e2e', '#805ad5', '#e53e3e'];

        return (
            <div className="bobot-wrapper">
                <div className="bobot-header">
                    <BarChart3 size={18} />
                    <span>Bobot Kriteria</span>
                    <span className="bobot-badge">Total = 1.0000</span>
                </div>
                <div className="bobot-items">
                    {bobot.map((item, index) => (
                        <div key={item.id_kriteria} className="bobot-item">
                            <div className="bobot-row">
                                <span className="bobot-name">{item.nama_kriteria}</span>
                                <span className="bobot-number" style={{ color: colors[index % colors.length] }}>
                                    {item.bobot.toFixed(4)}
                                </span>
                            </div>
                            <div className="bobot-bar">
                                <div 
                                    className="bobot-fill"
                                    style={{
                                        width: `${item.bobot * 100}%`,
                                        background: colors[index % colors.length]
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="info-box">
                    <Info size={16} />
                    <span><strong>Rumus:</strong> Bobot = rata-rata setiap baris pada matriks normalisasi</span>
                </div>
            </div>
        );
    };

    const Konsistensi = ({ data }) => {
        if (!data) return null;
        const isConsistent = data.isConsistent;

        return (
            <div className={`konsistensi ${isConsistent ? 'valid' : 'invalid'}`}>
                <div className="konsistensi-top">
                    <div className={`konsistensi-icon ${isConsistent ? 'valid' : 'invalid'}`}>
                        {isConsistent ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                        <div className="konsistensi-title">
                            {isConsistent ? '✓ Konsisten' : '✗ Tidak Konsisten'}
                        </div>
                        <div className="konsistensi-sub">
                            {isConsistent ? 'CR ≤ 0.1, matriks perbandingan konsisten' : 'CR > 0.1, periksa kembali nilai pairwise!'}
                        </div>
                    </div>
                </div>

                <div className="konsistensi-grid">
                    <div className="konsistensi-item">
                        <span className="konsistensi-label">λ max</span>
                        <span className="konsistensi-value">{data.lambdaMax}</span>
                    </div>
                    <div className="konsistensi-item">
                        <span className="konsistensi-label">CI</span>
                        <span className="konsistensi-value">{data.CI}</span>
                    </div>
                    <div className="konsistensi-item">
                        <span className="konsistensi-label">CR</span>
                        <span className={`konsistensi-value ${isConsistent ? 'valid' : 'invalid'}`}>
                            {data.CR}
                        </span>
                    </div>
                    <div className="konsistensi-item">
                        <span className="konsistensi-label">RI (n={data.n})</span>
                        <span className="konsistensi-value">{data.RI}</span>
                    </div>
                </div>

                <div className="konsistensi-rumus">
                    <span>CI = ({data.lambdaMax} - {data.n}) / ({data.n} - 1) = {data.CI}</span>
                    <span>CR = {data.CI} / {data.RI} = {data.CR}</span>
                </div>
            </div>
        );
    };

    const BobotGlobalSub = ({ data }) => {
        if (!data || data.length === 0) return null;

        const colors = ['#4f6ef7', '#38a169', '#d69e2e', '#805ad5', '#e53e3e'];

        return (
            <div className="bobot-global-wrapper">
                <div className="bobot-header">
                    <Layers size={18} />
                    <span>Bobot Global Sub-Kriteria</span>
                    <span className="bobot-badge">Bobot Kriteria × Bobot Sub</span>
                </div>
                <div className="bobot-global-items">
                    {data.map((item, index) => (
                        <div key={index} className="bobot-global-item">
                            <div className="bobot-global-row">
                                <span className="bobot-global-label">
                                    <span className="bobot-global-kriteria">{item.kriteria}</span>
                                    <span className="bobot-global-arrow">→</span>
                                    <span className="bobot-global-sub">{item.sub}</span>
                                </span>
                                <span className="bobot-global-number">
                                    {item.bobot_global.toFixed(4)}
                                </span>
                            </div>
                            <div className="bobot-global-bar">
                                <div 
                                    className="bobot-global-fill"
                                    style={{
                                        width: `${item.bobot_global * 100}%`,
                                        background: colors[index % colors.length]
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Menghitung normalisasi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="page-head">
                    <div className="page-head-left">
                        <div className="page-icon"><Calculator size={20} /></div>
                        <div>
                            <h1 className="page-title">Normalisasi & Bobot</h1>
                            <p className="page-desc">Hasil perhitungan normalisasi kriteria</p>
                        </div>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('/pairwise')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
                <div className="card">
                    <div className="empty">
                        <XCircle size={40} />
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={() => navigate('/pairwise')}>
                            <ArrowLeft size={16} /> Kembali ke Pairwise
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="page">
                <div className="page-head">
                    <div className="page-head-left">
                        <div className="page-icon"><Calculator size={20} /></div>
                        <div>
                            <h1 className="page-title">Normalisasi & Bobot</h1>
                            <p className="page-desc">Hasil perhitungan normalisasi kriteria</p>
                        </div>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('/pairwise')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
                <div className="card">
                    <div className="empty">
                        <Calculator size={40} />
                        <h3>Belum ada data</h3>
                        <p>Silakan input pairwise terlebih dahulu</p>
                        <button className="btn-primary" onClick={() => navigate('/pairwise')}>
                            <ArrowLeft size={16} /> Ke Pairwise
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="page-head">
                <div className="page-head-left">
                    <div className="page-icon"><Calculator size={20} /></div>
                    <div>
                        <h1 className="page-title">Normalisasi & Bobot</h1>
                        <p className="page-desc">
                            Hasil perhitungan normalisasi dari matriks pairwise
                            <span className="page-badge">{data.kriteriaNames?.length || 0} Kriteria</span>
                        </p>
                    </div>
                </div>
                <div className="page-actions">
                    <button className="btn-icon" onClick={fetchNormalisasi} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/pairwise')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/hasil')}>
                        Ke Hasil <TrendingUp size={16} />
                    </button>
                </div>
            </div>

            {/* Konsistensi */}
            <Konsistensi data={data.konsistensi} />

            {/* Content */}
            <div className="card">
                {/* Matriks Pairwise */}
                <div className="card-section">
                    <MatrixTable 
                        data={data.matrix.data}
                        labels={data.matrix.labels}
                        title="Matriks Perbandingan Berpasangan"
                    />
                </div>

                {/* Matriks Normalisasi */}
                <div className="card-section">
                    <MatrixTable 
                        data={data.normalizedMatrix.data}
                        labels={data.normalizedMatrix.labels}
                        title="Matriks Normalisasi"
                        isNormalized={true}
                    />
                    <div className="info-box">
                        <Info size={16} />
                        <span><strong>Rumus:</strong> Nilai_normalisasi = Nilai_matriks / Total_kolom</span>
                    </div>
                </div>

                {/* Bobot Kriteria */}
                <div className="card-section">
                    <BobotKriteria bobot={data.bobotKriteria} />
                </div>

                {/* Bobot Global Sub-Kriteria */}
                {data.bobotGlobal && data.bobotGlobal.length > 0 && (
                    <div className="card-section">
                        <BobotGlobalSub data={data.bobotGlobal} />
                    </div>
                )}
            </div>

            <style>{`
                /* ===== PAGE ===== */
                .page {
                    padding: 24px 28px;
                    max-width: 1100px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* ===== HEADER ===== */
                .page-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .page-head-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .page-icon {
                    width: 42px;
                    height: 42px;
                    background: #f0f4ff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4f6ef7;
                }

                .page-title {
                    font-size: 21px;
                    font-weight: 700;
                    color: #1a2332;
                    margin: 0;
                }

                .page-desc {
                    font-size: 14px;
                    color: #7a8aa0;
                    margin: 2px 0 0;
                }

                .page-badge {
                    font-size: 12px;
                    font-weight: 500;
                    color: #4f6ef7;
                    background: #f0f4ff;
                    padding: 2px 12px;
                    border-radius: 20px;
                    margin-left: 10px;
                }

                .page-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                /* ===== BUTTONS ===== */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 9px 18px;
                    background: #4f6ef7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.15s;
                }
                .btn-primary:hover { background: #3a5ce7; }

                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 9px 16px;
                    background: transparent;
                    color: #4a5568;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.15s;
                }
                .btn-secondary:hover { border-color: #4f6ef7; color: #4f6ef7; background: #f8faff; }

                .btn-icon {
                    width: 40px;
                    height: 40px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #7a8aa0;
                    transition: 0.15s;
                }
                .btn-icon:hover { background: #f8fafc; border-color: #4f6ef7; color: #4f6ef7; }

                /* ===== CARD ===== */
                .card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                }

                .card-section {
                    padding: 18px 24px;
                    border-bottom: 1px solid #f0f4f9;
                }
                .card-section:last-child { border-bottom: none; }

                /* ===== MATRIKS ===== */
                .matrix-wrapper {
                    margin-bottom: 0;
                }

                .matrix-title-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .matrix-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2332;
                }

                .matrix-badge {
                    font-size: 11px;
                    color: #276749;
                    background: #eef6ef;
                    padding: 2px 12px;
                    border-radius: 20px;
                }

                .table-scroll {
                    overflow-x: auto;
                }

                .matrix-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                    min-width: 400px;
                }

                .matrix-table th {
                    padding: 8px 12px;
                    background: #f8fafc;
                    color: #4a5568;
                    font-weight: 600;
                    text-align: center;
                    border: 1px solid #eef2f7;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .matrix-table td {
                    padding: 7px 12px;
                    border: 1px solid #eef2f7;
                    text-align: center;
                    color: #2d3748;
                }

                .th-corner {
                    min-width: 90px;
                    text-align: left !important;
                }

                .td-label {
                    font-weight: 500;
                    color: #1a2332;
                    text-align: left !important;
                }

                .td-value {
                    font-family: 'Menlo', 'Monaco', monospace;
                    font-size: 12px;
                }

                .th-total {
                    background: #eef6ef;
                    color: #276749;
                }

                .td-total {
                    background: #eef6ef;
                    color: #276749;
                    font-weight: 700;
                    font-family: 'Menlo', 'Monaco', monospace;
                    font-size: 12px;
                }

                .matrix-table tbody tr:hover td {
                    background: #fafbfc;
                }

                /* ===== KONSISTENSI ===== */
                .konsistensi {
                    padding: 16px 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 2px solid;
                }

                .konsistensi.valid {
                    background: #f0fdf4;
                    border-color: #86efac;
                }

                .konsistensi.invalid {
                    background: #fef2f2;
                    border-color: #fca5a5;
                }

                .konsistensi-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .konsistensi-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .konsistensi-icon.valid {
                    background: #86efac;
                    color: #065f46;
                }

                .konsistensi-icon.invalid {
                    background: #fca5a5;
                    color: #991b1b;
                }

                .konsistensi-title {
                    font-weight: 700;
                    font-size: 15px;
                    color: #1a2332;
                }

                .konsistensi-sub {
                    font-size: 13px;
                    color: #4a5568;
                }

                .konsistensi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    padding: 10px 0;
                    border-top: 1px solid rgba(0,0,0,0.04);
                    border-bottom: 1px solid rgba(0,0,0,0.04);
                    margin-bottom: 10px;
                }

                .konsistensi-item {
                    display: flex;
                    flex-direction: column;
                }

                .konsistensi-label {
                    font-size: 10px;
                    color: #7a8aa0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .konsistensi-value {
                    font-weight: 700;
                    font-size: 16px;
                    color: #1a2332;
                }

                .konsistensi-value.valid { color: #276749; }
                .konsistensi-value.invalid { color: #9b2c2c; }

                .konsistensi-rumus {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    font-size: 12px;
                    color: #4a5568;
                    font-family: 'Menlo', 'Monaco', monospace;
                    padding: 8px 12px;
                    background: rgba(0,0,0,0.02);
                    border-radius: 6px;
                }

                /* ===== BOBOT ===== */
                .bobot-wrapper,
                .bobot-global-wrapper {
                    margin-bottom: 0;
                }

                .bobot-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    color: #1a2332;
                }

                .bobot-badge {
                    font-size: 11px;
                    font-weight: 500;
                    color: #7a8aa0;
                    background: #f0f2f7;
                    padding: 2px 12px;
                    border-radius: 20px;
                }

                .bobot-items,
                .bobot-global-items {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .bobot-item,
                .bobot-global-item {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .bobot-row,
                .bobot-global-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bobot-name {
                    font-weight: 500;
                    color: #2d3748;
                    font-size: 14px;
                }

                .bobot-number {
                    font-weight: 700;
                    font-size: 15px;
                }

                .bobot-bar,
                .bobot-global-bar {
                    width: 100%;
                    height: 5px;
                    background: #f0f2f7;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .bobot-fill,
                .bobot-global-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.6s ease;
                }

                /* Bobot Global */
                .bobot-global-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .bobot-global-kriteria {
                    font-weight: 600;
                    color: #1a2332;
                }

                .bobot-global-arrow {
                    color: #aab4c8;
                    font-size: 11px;
                }

                .bobot-global-sub {
                    color: #4a5568;
                }

                .bobot-global-number {
                    font-weight: 700;
                    font-size: 14px;
                    color: #4f6ef7;
                }

                .bobot-global-bar {
                    height: 4px;
                }

                /* ===== INFO ===== */
                .info-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 14px;
                    background: #f8fafc;
                    border-radius: 8px;
                    margin-top: 10px;
                    font-size: 13px;
                    color: #4a5568;
                }

                .info-box strong {
                    color: #1a2332;
                }

                /* ===== EMPTY & LOADING ===== */
                .empty {
                    text-align: center;
                    padding: 48px 20px;
                }
                .empty svg { color: #c8d0dc; margin-bottom: 8px; }
                .empty h3 { font-size: 17px; color: #1a2332; margin: 0 0 4px; }
                .empty p { font-size: 14px; color: #7a8aa0; margin: 0 0 16px; }

                .loading {
                    text-align: center;
                    padding: 48px 20px;
                }
                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #eef2f7;
                    border-top-color: #4f6ef7;
                    border-radius: 50%;
                    margin: 0 auto;
                    animation: spin 0.7s linear infinite;
                }
                .loading p { margin-top: 12px; color: #7a8aa0; }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .page { padding: 16px; }

                    .page-head { flex-direction: column; align-items: stretch; }
                    .page-head-left { gap: 10px; }
                    .page-actions { flex-wrap: wrap; }
                    .page-actions .btn-primary,
                    .page-actions .btn-secondary { flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px; }

                    .card-section { padding: 14px 16px; }

                    .matrix-table { font-size: 12px; min-width: 300px; }
                    .matrix-table th,
                    .matrix-table td { padding: 5px 8px; }
                    .th-corner { min-width: 60px; }

                    .konsistensi-grid { grid-template-columns: repeat(2, 1fr); }
                    .konsistensi-top { flex-wrap: wrap; }

                    .page-title { font-size: 18px; }
                    .page-badge { font-size: 11px; }
                }

                @media (max-width: 480px) {
                    .matrix-table { font-size: 11px; min-width: 250px; }
                    .matrix-table th,
                    .matrix-table td { padding: 4px 6px; }
                    .konsistensi-grid { grid-template-columns: 1fr 1fr; gap: 4px; }
                    .konsistensi-value { font-size: 14px; }
                    .konsistensi-rumus { font-size: 11px; }
                    .bobot-number { font-size: 13px; }
                }
            `}</style>
        </div>
    );
};

export default NormalisasiPage;