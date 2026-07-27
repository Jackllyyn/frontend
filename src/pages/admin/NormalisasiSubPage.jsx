import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Calculator, CheckCircle, AlertCircle, 
    ArrowLeft, RefreshCw, Zap, TrendingUp,
    Table, Layers, Info, Award
} from 'lucide-react';

const API_URL = '/api';

const NormalisasiSubPage = () => {
    const navigate = useNavigate();
    const [kriteria, setKriteria] = useState([]);
    const [selectedKriteria, setSelectedKriteria] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [processingAll, setProcessingAll] = useState(false);
    const [summary, setSummary] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [globalLoading, setGlobalLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const kRes = await axios.get(`${API_URL}/kriteria`);
            setKriteria(kRes.data.data || []);

            if (kRes.data.data?.length > 0) {
                setSelectedKriteria(kRes.data.data[0].id_kriteria);
                await loadPreview(kRes.data.data[0].id_kriteria);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Gagal mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async (idKriteria) => {
        setCalculating(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/normalisasi-sub/${idKriteria}`);
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setData(null);
                setError(res.data.message || 'Gagal menghitung normalisasi untuk kriteria ini');
            }
        } catch (error) {
            console.error('Error:', error);
            setData(null);
            setError(error.response?.data?.message || 'Gagal menghitung normalisasi untuk kriteria ini');
        } finally {
            setCalculating(false);
        }
    };

    const handleHitungSimpanSemua = async () => {
        setProcessingAll(true);
        setError('');
        setSuccessMessage('');
        setSummary(null);
        try {
            const res = await axios.post(`${API_URL}/normalisasi-sub/simpan-semua`);
            if (res.data.success) {
                setSummary(res.data.data);
                setSuccessMessage(`✅ ${res.data.message}`);
                setTimeout(() => setSuccessMessage(''), 5000);

                if (selectedKriteria) {
                    await loadPreview(selectedKriteria);
                }
            } else {
                setError(res.data.message || 'Gagal menghitung & menyimpan bobot sub-kriteria');
            }
        } catch (error) {
            console.error('Error hitung-simpan-semua:', error);
            setError(error.response?.data?.message || 'Gagal menghitung & menyimpan bobot sub-kriteria');
        } finally {
            setProcessingAll(false);
        }
    };

    const handleSimpanKriteria = async () => {
        if (!selectedKriteria) {
            setError('Pilih kriteria terlebih dahulu!');
            return;
        }

        setProcessingAll(true);
        setError('');
        setSuccessMessage('');
        try {
            const res = await axios.post(`${API_URL}/normalisasi-sub/${selectedKriteria}/simpan`);
            if (res.data.success) {
                setSuccessMessage(`✅ ${res.data.message}`);
                await loadPreview(selectedKriteria);
            } else {
                setError(res.data.message || 'Gagal menyimpan');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.response?.data?.message || 'Gagal menyimpan');
        } finally {
            setProcessingAll(false);
        }
    };

    const handleHitungGlobal = async () => {
        setGlobalLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const res = await axios.post(`${API_URL}/hitung-global`);
            if (res.data.success) {
                setSuccessMessage(`✅ ${res.data.message}`);
                setTimeout(() => {
                    navigate('/hasil-global');
                }, 1000);
            } else {
                setError(res.data.message || 'Gagal menghitung global');
            }
        } catch (error) {
            console.error('Error hitung global:', error);
            setError(error.response?.data?.message || 'Gagal menghitung global');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleKriteriaChange = async (id) => {
        setSelectedKriteria(parseInt(id));
        await loadPreview(parseInt(id));
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '-';
        return typeof val === 'number' ? val.toFixed(4) : parseFloat(val).toFixed(4);
    };

    const renderMatrix = (matrix, labels, title, totalRow = null, isNormalized = false) => {
        if (!matrix || matrix.length === 0) return null;
        const n = matrix.length;

        return (
            <div className="matrix-wrapper">
                <div className="matrix-header">
                    <span className="matrix-title">{title}</span>
                    {isNormalized && (
                        <span className="matrix-badge">Total kolom = 1</span>
                    )}
                </div>
                <div className="table-container">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th className="matrix-corner">
                                    {isNormalized ? 'Normalisasi' : 'Pairwise'}
                                </th>
                                {labels.map((label, idx) => (
                                    <th key={idx} className="matrix-col">{label}</th>
                                ))}
                                {isNormalized && (
                                    <th className="matrix-total-col">Total</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: n }).map((_, i) => (
                                <tr key={i}>
                                    <td className="matrix-row-label">{labels[i]}</td>
                                    {Array.from({ length: n }).map((_, j) => (
                                        <td key={j} className={`matrix-value ${i === j ? 'diagonal' : ''}`}>
                                            {matrix[i] && matrix[i][j] !== undefined ? formatNumber(matrix[i][j]) : '-'}
                                        </td>
                                    ))}
                                    {isNormalized && (
                                        <td className="matrix-total-value">
                                            {matrix[i] ? formatNumber(matrix[i].reduce((a, b) => a + b, 0)) : '-'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        {!isNormalized && totalRow && totalRow.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td className="footer-label">Total</td>
                                    {totalRow.map((val, idx) => (
                                        <td key={idx} className="footer-total">
                                            {formatNumber(val)}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="normalisasi-page">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Memuat data...</p>
                </div>
            </div>
        );
    }

    if (kriteria.length === 0) {
        return (
            <div className="normalisasi-page">
                <div className="page-header">
                    <div className="header-left">
                        <div className="header-icon-wrapper">
                            <Calculator size={22} />
                        </div>
                        <div>
                            <h1 className="page-title">Normalisasi Sub-Kriteria</h1>
                            <p className="page-subtitle">Hasil perhitungan normalisasi sub-kriteria</p>
                        </div>
                    </div>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <AlertCircle size={40} />
                        </div>
                        <h3>Belum ada kriteria</h3>
                        <p>Tambahkan kriteria terlebih dahulu di halaman Kriteria</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="normalisasi-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <div className="header-icon-wrapper">
                        <Calculator size={22} />
                    </div>
                    <div>
                        <h1 className="page-title">Normalisasi Sub-Kriteria</h1>
                        <p className="page-subtitle">
                            Hasil perhitungan normalisasi & bobot sub-kriteria
                            <span className="total-badge">{kriteria.length} kriteria</span>
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-outline" onClick={() => navigate('/sub-kriteria')}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
            </div>

            {/* Action Cards */}
            <div className="actions-grid">
                {/* Card 1: Hitung & Simpan Semua */}
                <div className="action-card primary">
                    <div className="action-card-header">
                        <Zap size={20} className="icon-warning" />
                        <h3>Hitung & Simpan Semua</h3>
                    </div>
                    <p className="action-card-desc">
                        Menghitung normalisasi AHP untuk <strong>setiap kriteria</strong> sekaligus
                        dan menyimpan bobotnya ke database.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={handleHitungSimpanSemua}
                        disabled={processingAll}
                    >
                        {processingAll ? '⏳ Memproses...' : '⚡ Proses Semua'}
                    </button>
                    {summary && (
                        <div className="summary-box">
                            {summary.berhasil?.length > 0 && (
                                <div className="summary-success">
                                    ✅ {summary.berhasil.length} kriteria berhasil
                                </div>
                            )}
                            {summary.dilewati?.length > 0 && (
                                <div className="summary-skip">
                                    ⚠️ {summary.dilewati.length} kriteria dilewati
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 2: Simpan Kriteria Ini */}
                <div className="action-card secondary">
                    <div className="action-card-header">
                        <Layers size={20} className="icon-info" />
                        <h3>Simpan Kriteria Ini</h3>
                    </div>
                    <p className="action-card-desc">
                        Menyimpan bobot sub-kriteria untuk kriteria yang sedang dipilih.
                    </p>
                    <button
                        className="btn-success"
                        onClick={handleSimpanKriteria}
                        disabled={processingAll || !selectedKriteria}
                    >
                        💾 Simpan
                    </button>
                </div>

                {/* Card 3: Hitung Global */}
                <div className="action-card global">
                    <div className="action-card-header">
                        <TrendingUp size={20} className="icon-global" />
                        <h3>Hitung Global</h3>
                    </div>
                    <p className="action-card-desc">
                        Mengalikan Bobot Kriteria × Bobot Sub-Kriteria untuk semua sub-kriteria.
                    </p>
                    <button
                        className="btn-global"
                        onClick={handleHitungGlobal}
                        disabled={globalLoading}
                    >
                        {globalLoading ? '⏳ Menghitung...' : '🌐 Hitung Global'}
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

            {error && (
                <div className="message error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Content */}
            <div className="content-card">
                {/* Preview Header */}
                <div className="preview-header">
                    <div className="preview-label">
                        <Info size={16} />
                        <span>Detail Kriteria</span>
                    </div>
                    <div className="preview-controls">
                        <select
                            value={selectedKriteria || ''}
                            onChange={(e) => handleKriteriaChange(parseInt(e.target.value))}
                            className="preview-select"
                        >
                            {kriteria.map(k => (
                                <option key={k.id_kriteria} value={k.id_kriteria}>
                                    {k.nama_kriteria}
                                </option>
                            ))}
                        </select>
                        <button className="btn-outline btn-sm" onClick={() => loadPreview(selectedKriteria)}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>

                {calculating ? (
                    <div className="loading-state">
                        <div className="loading-spinner-small" />
                        <p>Menghitung normalisasi...</p>
                    </div>
                ) : !data ? (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <Calculator size={40} />
                        </div>
                        <h3>Belum ada data normalisasi</h3>
                        <p>Pastikan pairwise sub-kriteria sudah diisi</p>
                        <button className="btn-primary" onClick={() => navigate('/pairwise-sub')}>
                            Ke Pairwise Sub
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Konsistensi */}
                        <div className={`consistency-box ${data.konsistensi.isConsistent ? 'success' : 'error'}`}>
                            <div className="consistency-icon">
                                {data.konsistensi.isConsistent ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <AlertCircle size={20} />
                                )}
                            </div>
                            <div className="consistency-text">
                                <strong>Uji Konsistensi:</strong>
                                <span className={data.konsistensi.isConsistent ? 'text-success' : 'text-error'}>
                                    {data.konsistensi.isConsistent ? '✅ Konsisten' : '❌ Tidak Konsisten (CR ≥ 0.1)'}
                                </span>
                            </div>
                            <div className="consistency-values">
                                <span>λ max = <strong>{data.konsistensi.lambdaMax}</strong></span>
                                <span>CI = <strong>{data.konsistensi.CI}</strong></span>
                                <span>CR = <strong>{data.konsistensi.CR}</strong></span>
                            </div>
                        </div>

                        {/* Matriks */}
                        {renderMatrix(
                            data.matrix.data,
                            data.matrix.labels,
                            'Matriks Pairwise',
                            data.totalPerKolom,
                            false
                        )}

                        {renderMatrix(
                            data.normalizedMatrix.data,
                            data.normalizedMatrix.labels,
                            'Matriks Normalisasi',
                            null,
                            true
                        )}

                        {/* Bobot Sub */}
                        <div className="bobot-section">
                            <div className="section-header">
                                <Award size={18} />
                                <span>Bobot Sub-Kriteria</span>
                            </div>
                            <div className="bobot-list">
                                {data.subs.map((item, index) => {
                                    const colors = ['#4a6cf7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
                                    const color = colors[index % colors.length];
                                    return (
                                        <div key={index} className="bobot-item">
                                            <div className="bobot-label">
                                                <span>{item.nama_sub}</span>
                                                <span className="bobot-value" style={{ color }}>
                                                    {item.bobot.toFixed(4)}
                                                </span>
                                            </div>
                                            <div className="bobot-bar">
                                                <div className="bobot-bar-fill" style={{
                                                    width: `${item.bobot * 100}%`,
                                                    background: color
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Eigen Values */}
                        {data.eigenValues && (
                            <div className="eigen-section">
                                <div className="section-header">
                                    <TrendingUp size={18} />
                                    <span>Eigen Value (λ) per Sub-Kriteria</span>
                                </div>
                                <div className="eigen-grid">
                                    {data.eigenValues.map((val, index) => (
                                        <div key={index} className="eigen-item">
                                            <span>{data.subs[index].nama_sub}</span>
                                            <span className="eigen-value">{val.toFixed(4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                .normalisasi-page {
                    padding: 24px 32px;
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* ===== HEADER ===== */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .header-icon-wrapper {
                    width: 44px;
                    height: 44px;
                    background: #f0f4ff;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                }

                .page-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a2332;
                    letter-spacing: -0.3px;
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 14px;
                    color: #7a8aa0;
                    margin: 2px 0 0;
                }

                .total-badge {
                    font-size: 13px;
                    font-weight: 500;
                    color: #4a6cf7;
                    background: #eef3ff;
                    padding: 2px 12px;
                    border-radius: 20px;
                    margin-left: 10px;
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                /* ===== BUTTONS ===== */
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
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(74, 108, 247, 0.2);
                }

                .btn-primary:hover:not(:disabled) {
                    background: #3a5ce7;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
                }

                .btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #059669;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-success:hover:not(:disabled) {
                    background: #047857;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
                }

                .btn-global {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #d97706;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-global:hover:not(:disabled) {
                    background: #b45309;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(217, 119, 6, 0.3);
                }

                .btn-outline {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 18px;
                    background: transparent;
                    color: #4a5568;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-outline:hover {
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                    background: #f8faff;
                }

                .btn-sm {
                    padding: 7px 14px;
                    font-size: 13px;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* ===== ACTION CARDS ===== */
                .actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .action-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px 24px;
                    border: 1px solid #eef2f7;
                    transition: all 0.2s;
                }

                .action-card:hover {
                    box-shadow: 0 4px 16px rgba(26, 39, 68, 0.06);
                    border-color: #d0d8e4;
                }

                .action-card.primary {
                    border-left: 4px solid #4a6cf7;
                }
                .action-card.secondary {
                    border-left: 4px solid #059669;
                }
                .action-card.global {
                    border-left: 4px solid #d97706;
                }

                .action-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .action-card-header h3 {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0;
                }

                .icon-warning { color: #d97706; }
                .icon-info { color: #059669; }
                .icon-global { color: #d97706; }

                .action-card-desc {
                    font-size: 13px;
                    color: #4a5568;
                    margin: 0 0 12px 0;
                    line-height: 1.5;
                }

                .summary-box {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #eef2f7;
                    display: flex;
                    gap: 16px;
                    font-size: 13px;
                    flex-wrap: wrap;
                }

                .summary-success { color: #059669; }
                .summary-skip { color: #dc2626; }

                /* ===== CONTENT CARD ===== */
                .content-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                }

                /* ===== MESSAGES ===== */
                .message {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    animation: fadeIn 0.3s ease;
                }

                .message.success {
                    background: #ecfdf5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }

                .message.error {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                /* ===== PREVIEW HEADER ===== */
                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid #f0f4f9;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .preview-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #1a2332;
                    font-size: 14px;
                }

                .preview-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .preview-select {
                    padding: 8px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    min-width: 180px;
                    background: #fafbfc;
                    color: #1a2332;
                    transition: all 0.2s ease;
                }

                .preview-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.08);
                }

                /* ===== LOADING ===== */
                .loading-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .loading-spinner {
                    width: 36px;
                    height: 36px;
                    border: 3px solid #eef2f7;
                    border-top: 3px solid #4a6cf7;
                    border-radius: 50%;
                    margin: 0 auto;
                    animation: spin 0.8s linear infinite;
                }

                .loading-spinner-small {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #eef2f7;
                    border-top: 3px solid #4a6cf7;
                    border-radius: 50%;
                    margin: 0 auto 12px;
                    animation: spin 0.8s linear infinite;
                }

                .loading-state p {
                    margin-top: 12px;
                    color: #7a8aa0;
                }

                /* ===== EMPTY STATE ===== */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    background: #f8fafc;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: #c8d0dc;
                }

                .empty-state h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0 0 4px;
                }

                .empty-state p {
                    font-size: 14px;
                    color: #7a8aa0;
                    margin: 0 0 16px;
                }

                /* ===== CONSISTENCY ===== */
                .consistency-box {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    margin: 16px 24px;
                    border-radius: 10px;
                    flex-wrap: wrap;
                    border: 1.5px solid #eef2f7;
                }

                .consistency-box.success {
                    background: #ecfdf5;
                    border-color: #86efac;
                }

                .consistency-box.error {
                    background: #fef2f2;
                    border-color: #fca5a5;
                }

                .consistency-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .consistency-box.success .consistency-icon {
                    background: #86efac;
                    color: #065f46;
                }

                .consistency-box.error .consistency-icon {
                    background: #fca5a5;
                    color: #991b1b;
                }

                .consistency-text {
                    font-size: 14px;
                    color: #1a2332;
                }

                .text-success { color: #059669; font-weight: 600; }
                .text-error { color: #dc2626; font-weight: 600; }

                .consistency-values {
                    display: flex;
                    gap: 16px;
                    font-size: 13px;
                    color: #4a5568;
                    margin-left: auto;
                    flex-wrap: wrap;
                }

                .consistency-values strong {
                    color: #1a2332;
                }

                /* ===== MATRIX ===== */
                .matrix-wrapper {
                    padding: 0 24px 20px;
                }

                .matrix-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    padding-top: 16px;
                }

                .matrix-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2332;
                }

                .matrix-badge {
                    font-size: 12px;
                    color: #059669;
                    background: #ecfdf5;
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-weight: 500;
                }

                .table-container {
                    overflow-x: auto;
                }

                .matrix-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .matrix-table th {
                    padding: 8px 12px;
                    background: #f8fafc;
                    color: #4a5568;
                    font-weight: 600;
                    text-align: center;
                    border: 1px solid #eef2f7;
                    font-size: 12px;
                }

                .matrix-table td {
                    padding: 6px 12px;
                    border: 1px solid #eef2f7;
                    text-align: center;
                    color: #2d3748;
                    font-size: 13px;
                }

                .matrix-corner {
                    min-width: 80px;
                    text-align: left !important;
                    font-size: 11px;
                    color: #7a8aa0 !important;
                }

                .matrix-col {
                    min-width: 70px;
                }

                .matrix-total-col {
                    min-width: 70px;
                    background: #ecfdf5;
                    color: #059669;
                }

                .matrix-row-label {
                    font-weight: 500;
                    color: #1a2332;
                    text-align: left !important;
                    background: #f8fafc;
                }

                .matrix-value {
                    font-family: 'Menlo', 'Monaco', monospace;
                }

                .matrix-value.diagonal {
                    background: rgba(74, 108, 247, 0.04);
                    font-weight: 600;
                    color: #4a6cf7;
                }

                .matrix-total-value {
                    background: #ecfdf5;
                    color: #059669;
                    font-weight: 700;
                    font-family: 'Menlo', 'Monaco', monospace;
                }

                .footer-label {
                    background: #f8fafc;
                    font-weight: 700;
                    color: #4a5568;
                    border-top: 2px solid #4a6cf7;
                    padding: 8px 12px;
                    text-align: center;
                }

                .footer-total {
                    background: #f8fafc;
                    font-weight: 700;
                    color: #4a6cf7;
                    border-top: 2px solid #4a6cf7;
                    padding: 8px 12px;
                    text-align: center;
                    font-family: 'Menlo', 'Monaco', monospace;
                }

                .matrix-table tbody tr:hover td {
                    background: #fafbfc;
                }

                /* ===== BOBOT SECTION ===== */
                .bobot-section {
                    padding: 0 24px 20px;
                }

                .eigen-section {
                    padding: 0 24px 20px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    color: #1a2332;
                }

                .bobot-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .bobot-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .bobot-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #2d3748;
                }

                .bobot-value {
                    font-weight: 700;
                    font-size: 14px;
                }

                .bobot-bar {
                    width: 100%;
                    height: 6px;
                    background: #f0f2f7;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .bobot-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.6s ease;
                }

                /* ===== EIGEN ===== */
                .eigen-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 8px;
                }

                .eigen-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 14px;
                    background: #f8fafc;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #2d3748;
                    border: 1px solid #eef2f7;
                }

                .eigen-value {
                    font-weight: 700;
                    color: #4a6cf7;
                    font-family: 'Menlo', 'Monaco', monospace;
                }

                /* ===== ANIMATIONS ===== */
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .normalisasi-page {
                        padding: 16px;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .header-left {
                        gap: 12px;
                    }

                    .header-actions {
                        flex-wrap: wrap;
                    }

                    .header-actions .btn {
                        flex: 1;
                        justify-content: center;
                        font-size: 13px;
                        padding: 8px 14px;
                    }

                    .actions-grid {
                        grid-template-columns: 1fr;
                    }

                    .preview-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .preview-controls {
                        flex-direction: column;
                    }

                    .preview-select {
                        width: 100%;
                    }

                    .consistency-box {
                        flex-direction: column;
                        align-items: flex-start;
                        margin: 12px 16px;
                    }

                    .consistency-values {
                        margin-left: 0;
                    }

                    .matrix-wrapper {
                        padding: 0 16px 16px;
                    }

                    .bobot-section {
                        padding: 0 16px 16px;
                    }

                    .eigen-section {
                        padding: 0 16px 16px;
                    }

                    .page-title {
                        font-size: 19px;
                    }

                    .total-badge {
                        font-size: 12px;
                    }
                }

                @media (max-width: 480px) {
                    .action-card {
                        padding: 16px;
                    }

                    .matrix-table {
                        font-size: 11px;
                    }

                    .matrix-table th,
                    .matrix-table td {
                        padding: 4px 6px;
                    }

                    .eigen-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .consistency-values {
                        flex-direction: column;
                        gap: 4px;
                    }
                }
            `}</style>
        </div>
    );
};

export default NormalisasiSubPage;