import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    GitCompare, Save, RefreshCw, CheckCircle, 
    ArrowLeft, AlertCircle, Layers
} from 'lucide-react';

const API_URL = '/api';

const PairwiseSubPage = () => {
    const navigate = useNavigate();
    const [kriteria, setKriteria] = useState([]);
    const [selectedKriteria, setSelectedKriteria] = useState(null);
    const [subKriteria, setSubKriteria] = useState([]);
    const [pairwiseValues, setPairwiseValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [hoveredColumn, setHoveredColumn] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kRes, sRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`)
            ]);
            
            setKriteria(kRes.data.data || []);
            setSubKriteria(sRes.data.data || []);
            
            if (kRes.data.data?.length > 0) {
                const first = kRes.data.data[0];
                setSelectedKriteria(first.id_kriteria);
                loadPairwise(first.id_kriteria);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Gagal mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const loadPairwise = async (idKriteria) => {
        try {
            const res = await axios.get(`${API_URL}/pairwise-sub/${idKriteria}`);
            const data = res.data.data || [];
            const values = {};
            for (const item of data) {
                const key = `${item.sub_1}-${item.sub_2}`;
                values[key] = item.nilai;
            }
            setPairwiseValues(values);
        } catch (error) {
            console.error('Error loading pairwise:', error);
        }
    };

    const handleKriteriaChange = (id) => {
        setSelectedKriteria(parseInt(id));
        loadPairwise(parseInt(id));
        setSaved(false);
        setSuccessMessage('');
        setErrorMessage('');
    };

    const getSubs = (idKriteria) => {
        return subKriteria.filter(s => s.id_kriteria === idKriteria);
    };

    const getValue = (i, j) => {
        if (i === j) return 1;
        if (i < j) {
            const key = `${subKriteria[i].id_sub}-${subKriteria[j].id_sub}`;
            return pairwiseValues[key] || 3;
        } else {
            const key = `${subKriteria[j].id_sub}-${subKriteria[i].id_sub}`;
            return pairwiseValues[key] ? 1 / pairwiseValues[key] : 1/3;
        }
    };

    const handleValueChange = (i, j, value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 9) return;
        
        if (i < j) {
            const key = `${subKriteria[i].id_sub}-${subKriteria[j].id_sub}`;
            setPairwiseValues({ ...pairwiseValues, [key]: numValue });
            setSaved(false);
            setSuccessMessage('');
            setErrorMessage('');
        }
    };

    const handleSave = async () => {
        const subs = getSubs(selectedKriteria);
        if (subs.length < 2) {
            setErrorMessage('⚠️ Minimal 2 sub-kriteria!');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        try {
            await axios.delete(`${API_URL}/pairwise-sub/${selectedKriteria}`);
            
            for (let i = 0; i < subs.length; i++) {
                for (let j = i + 1; j < subs.length; j++) {
                    const nilai = getValue(i, j);
                    await axios.post(`${API_URL}/pairwise-sub`, {
                        id_kriteria: selectedKriteria,
                        sub_1: subs[i].id_sub,
                        sub_2: subs[j].id_sub,
                        nilai: nilai
                    });
                }
            }
            
            setSaved(true);
            setSuccessMessage(`✅ Data perbandingan berhasil disimpan`);
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            console.error('Error saving:', error);
            setErrorMessage('❌ Gagal menyimpan: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset semua nilai perbandingan?')) {
            setPairwiseValues({});
            setSaved(false);
            setSuccessMessage('');
            setErrorMessage('');
        }
    };

    const getScaleLabel = (value) => {
        const scales = {
            1: 'Sama penting',
            2: 'Sedikit lebih',
            3: 'Lebih penting',
            4: 'Lebih penting +',
            5: 'Sangat penting',
            6: 'Sangat penting +',
            7: 'Sangat amat penting',
            8: 'Sangat amat penting +',
            9: 'Mutlak penting'
        };
        return scales[value] || '';
    };

    const getKriteriaName = (id) => {
        const found = kriteria.find(k => k.id_kriteria === id);
        return found?.nama_kriteria || 'Tidak diketahui';
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '-';
        return typeof val === 'number' ? val.toFixed(4) : parseFloat(val).toFixed(4);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Memuat data...</p>
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

    const subs = getSubs(selectedKriteria);
    const n = subs.length;

    return (
        <div className="pairwise-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Perbandingan Sub-Kriteria</h1>
                    <p className="page-subtitle">
                        Bandingkan tingkat kepentingan antar sub-kriteria
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => navigate('/sub-kriteria')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <button className="btn btn-outline" onClick={handleReset}>
                        <RefreshCw size={16} /> Reset
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || n < 2}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="message success">
                    <CheckCircle size={18} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="message error">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Main Card */}
            <div className="card">
                {/* Kriteria Selector */}
                <div className="kriteria-selector">
                    <label className="selector-label">Pilih Kriteria</label>
                    <div className="selector-wrapper">
                        <select
                            value={selectedKriteria || ''}
                            onChange={(e) => handleKriteriaChange(parseInt(e.target.value))}
                            className="selector-select"
                        >
                            {kriteria.map(k => (
                                <option key={k.id_kriteria} value={k.id_kriteria}>
                                    {k.nama_kriteria} ({getSubs(k.id_kriteria).length} sub)
                                </option>
                            ))}
                        </select>
                        <span className="selector-badge">
                            {n} sub-kriteria
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {n < 2 ? (
                    <div className="empty-state">
                        <AlertCircle size={40} />
                        <p className="empty-title">Minimal 2 sub-kriteria</p>
                        <p className="empty-desc">
                            Tambahkan sub-kriteria di halaman <strong>Manajemen Sub-Kriteria</strong>
                        </p>
                        <button className="btn btn-primary" onClick={() => navigate('/sub-kriteria')}>
                            Ke Sub-Kriteria
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Info */}
                        <div className="info-box">
                            <span className="info-icon">💡</span>
                            <span>
                                Input <strong>vertikal (ke bawah)</strong> pada setiap kolom.
                                Nilai di bawah diagonal akan terisi otomatis (kebalikan).
                            </span>
                        </div>

                        {/* Matrix Table */}
                        <div className="table-wrapper">
                            <table className="pairwise-matrix">
                                <thead>
                                    <tr>
                                        <th className="th-first">Sub-Kriteria</th>
                                        {subs.map((sub, idx) => (
                                            <th 
                                                key={idx}
                                                className={`th-col ${hoveredColumn === idx ? 'hover' : ''}`}
                                                onMouseEnter={() => setHoveredColumn(idx)}
                                                onMouseLeave={() => setHoveredColumn(null)}
                                            >
                                                <div className="th-label">{sub.nama_sub}</div>
                                                <div className="th-sub">⬇ Input ke bawah</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: n }).map((_, i) => (
                                        <tr key={i} className={i === n - 1 ? 'tr-last' : ''}>
                                            <td className="td-first">{subs[i].nama_sub}</td>
                                            {Array.from({ length: n }).map((_, j) => {
                                                const value = getValue(i, j);
                                                const isDiag = i === j;
                                                const isLower = i > j;
                                                const isHovered = hoveredColumn === j;

                                                if (isDiag) {
                                                    return (
                                                        <td key={j} className="td-diag">1</td>
                                                    );
                                                }

                                                if (isLower) {
                                                    return (
                                                        <td key={j} className="td-lower">
                                                            {value ? `1/${value.toFixed(1)}` : '-'}
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={j} className={`td-input ${isHovered ? 'hover' : ''}`}>
                                                        <select
                                                            value={value || 3}
                                                            onChange={(e) => handleValueChange(i, j, e.target.value)}
                                                            className="input-select"
                                                        >
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                                                                <option key={v} value={v}>
                                                                    {v} - {getScaleLabel(v)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {value && (
                                                            <div className="input-label">{getScaleLabel(value)}</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="tf-first">Total</td>
                                        {Array.from({ length: n }).map((_, j) => {
                                            let total = 0;
                                            for (let i = 0; i < n; i++) {
                                                total += getValue(i, j);
                                            }
                                            return (
                                                <td key={j} className="tf-total">
                                                    {formatNumber(total)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer Info */}
                        <div className="footer-info">
                            <span className="footer-icon">⚖️</span>
                            <span>
                                Skala <strong>1</strong> = sama penting, <strong>9</strong> = mutlak lebih penting
                            </span>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                /* ===== PAGE ===== */
                .pairwise-page {
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
                    text-decoration: none;
                }

                .btn-primary {
                    background: #2c3e7a;
                    color: white;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #3d5a9e;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(44, 62, 122, 0.3);
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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

                /* ===== MESSAGES ===== */
                .message {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .message.success {
                    background: #e6f7e6;
                    color: #276749;
                }
                .message.error {
                    background: #fde8e8;
                    color: #9b2c2c;
                }

                /* ===== CARD ===== */
                .card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26, 39, 68, 0.08);
                    padding: 24px;
                }

                /* ===== KRITERIA SELECTOR ===== */
                .kriteria-selector {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .selector-label {
                    font-weight: 600;
                    color: #4a5a7a;
                    font-size: 14px;
                }

                .selector-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .selector-select {
                    padding: 10px 14px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    min-width: 220px;
                    background: white;
                    color: #1a2744;
                    transition: border-color 0.2s;
                }
                .selector-select:focus {
                    outline: none;
                    border-color: #2c3e7a;
                }

                .selector-badge {
                    padding: 4px 14px;
                    background: #eef2f7;
                    border-radius: 20px;
                    font-size: 13px;
                    color: #4a5a7a;
                }

                /* ===== EMPTY STATE ===== */
                .empty-state {
                    text-align: center;
                    padding: 48px 20px;
                    color: #8a9ab8;
                }
                .empty-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #4a5a7a;
                    margin: 12px 0 4px;
                }
                .empty-desc {
                    font-size: 14px;
                    margin-bottom: 16px;
                }

                /* ===== INFO BOX ===== */
                .info-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #4a5a7a;
                    margin-bottom: 16px;
                }
                .info-icon {
                    font-size: 18px;
                }

                /* ===== MATRIX TABLE ===== */
                .table-wrapper {
                    overflow-x: auto;
                }

                .pairwise-matrix {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .pairwise-matrix th,
                .pairwise-matrix td {
                    padding: 10px 12px;
                    border: 1px solid #e2e8f0;
                    text-align: center;
                    min-width: 100px;
                }

                .th-first,
                .td-first,
                .tf-first {
                    min-width: 120px;
                    background: #f7f9fc;
                    font-weight: 600;
                    color: #1a2744;
                    text-align: left;
                }

                .th-col {
                    background: #f7f9fc;
                    transition: background 0.2s;
                }
                .th-col.hover {
                    background: rgba(44, 62, 122, 0.05);
                }

                .th-label {
                    font-weight: 700;
                    font-size: 13px;
                    color: #1a2744;
                }
                .th-sub {
                    font-size: 10px;
                    color: #8a9ab8;
                    font-weight: 400;
                    margin-top: 2px;
                }

                .td-diag {
                    background: #f7f9fc;
                    font-weight: 700;
                    color: #8a9ab8;
                }

                .td-lower {
                    background: rgba(74, 144, 217, 0.04);
                    color: #4a5a7a;
                    font-size: 13px;
                }

                .td-input {
                    padding: 6px 8px;
                }
                .td-input.hover {
                    background: rgba(44, 62, 122, 0.02);
                }

                .input-select {
                    width: 100%;
                    padding: 8px 10px;
                    border: 2px solid #e2e8f0;
                    border-radius: 6px;
                    background: white;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 120px;
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                    padding-right: 28px;
                }
                .input-select:focus {
                    outline: none;
                    border-color: #2c3e7a;
                    box-shadow: 0 0 0 3px rgba(44, 62, 122, 0.1);
                }

                .input-label {
                    margin-top: 4px;
                    font-size: 9px;
                    color: #6c8fc7;
                    font-weight: 500;
                }

                .tf-first {
                    font-weight: 700;
                }
                .tf-total {
                    font-weight: 700;
                    color: #2c3e7a;
                    font-size: 14px;
                }

                .tr-last td {
                    border-bottom: none;
                }

                /* ===== FOOTER INFO ===== */
                .footer-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 16px;
                    padding: 12px 16px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #4a5a7a;
                }
                .footer-icon {
                    font-size: 18px;
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .pairwise-page {
                        padding: 16px;
                    }
                    .page-header {
                        flex-direction: column;
                    }
                    .header-actions {
                        width: 100%;
                    }
                    .header-actions .btn {
                        flex: 1;
                        justify-content: center;
                    }
                    .pairwise-matrix th,
                    .pairwise-matrix td {
                        padding: 6px 8px;
                        min-width: 80px;
                        font-size: 12px;
                    }
                    .th-first,
                    .td-first,
                    .tf-first {
                        min-width: 80px;
                    }
                    .input-select {
                        min-width: 80px;
                        font-size: 11px;
                        padding: 4px 6px;
                    }
                    .kriteria-selector {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .selector-select {
                        min-width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .pairwise-matrix th,
                    .pairwise-matrix td {
                        padding: 4px 4px;
                        min-width: 60px;
                        font-size: 11px;
                    }
                    .input-select {
                        min-width: 60px;
                        font-size: 10px;
                        padding: 2px 4px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PairwiseSubPage;