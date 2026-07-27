import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    BookOpen, X, CheckCircle, AlertCircle, 
    Save, RefreshCw, Search, Filter,
    Layers, Database, Calculator, ChevronDown, ChevronRight,
    Star, Target
} from 'lucide-react';

const API_URL = '/api';

const NilaiAlternatifPage = () => {
    const navigate = useNavigate();
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [buku, setBuku] = useState([]);
    const [nilaiAlternatif, setNilaiAlternatif] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBuku, setSelectedBuku] = useState(null);
    const [selectedValues, setSelectedValues] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [showDetail, setShowDetail] = useState(null);
    const [sortBy, setSortBy] = useState('nama');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const [kRes, sRes, bRes, nRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`),
                axios.get(`${API_URL}/alternatif`),
                axios.get(`${API_URL}/nilai-alternatif`)
            ]);

            setKriteria(kRes.data.data || []);
            setSubKriteria(sRes.data.data || []);
            setBuku(bRes.data.data || []);
            setNilaiAlternatif(nRes.data.data || []);

            if (bRes.data.data?.length > 0) {
                const firstBuku = bRes.data.data[0];
                setSelectedBuku(firstBuku.id_alternatif);
                loadNilaiBuku(firstBuku.id_alternatif, nRes.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const loadNilaiBuku = (idBuku, dataNilai = null) => {
        const nilai = dataNilai || nilaiAlternatif;
        const filtered = nilai.filter(n => n.id_alternatif === idBuku);
        const values = {};
        for (const n of filtered) {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            if (sub) {
                values[sub.id_kriteria] = n.id_sub;
            }
        }
        setSelectedValues(values);
    };

    const handleBukuChange = (id) => {
        setSelectedBuku(parseInt(id));
        loadNilaiBuku(parseInt(id));
        setSuccessMessage('');
        setErrorMessage('');
        setShowDetail(null);
    };

    const handleSubChange = (idKriteria, idSub) => {
        setSelectedValues({
            ...selectedValues,
            [idKriteria]: idSub
        });
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleSave = async () => {
        if (!selectedBuku) {
            setErrorMessage('⚠️ Pilih buku terlebih dahulu!');
            return;
        }

        const allSelected = kriteria.every(k => selectedValues[k.id_kriteria]);
        if (!allSelected) {
            setErrorMessage('⚠️ Semua kriteria harus dipilih!');
            return;
        }

        try {
            await axios.delete(`${API_URL}/nilai-alternatif/buku/${selectedBuku}`);
            
            for (const [idKriteria, idSub] of Object.entries(selectedValues)) {
                if (idSub) {
                    await axios.post(`${API_URL}/nilai-alternatif`, {
                        id_alternatif: selectedBuku,
                        id_sub: idSub
                    });
                }
            }
            
            setSuccessMessage('✅ Nilai alternatif berhasil disimpan!');
            
            const nRes = await axios.get(`${API_URL}/nilai-alternatif`);
            setNilaiAlternatif(nRes.data.data || []);
            loadNilaiBuku(selectedBuku, nRes.data.data || []);
            
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            console.error('Error saving:', error);
            setErrorMessage('❌ Gagal menyimpan: ' + (error.response?.data?.message || error.message));
        }
    };

    // ============================================================
    // FUNGSI GETTER
    // ============================================================

    const getKriteriaSubs = (idKriteria) => {
        return subKriteria.filter(s => s.id_kriteria === idKriteria);
    };

    const getKriteriaName = (id) => {
        const found = kriteria.find(k => k.id_kriteria === id);
        return found?.nama_kriteria || 'Tidak diketahui';
    };

    const getBukuName = (id) => {
        const found = buku.find(b => b.id_alternatif === id);
        return found?.judul_buku || 'Tidak diketahui';
    };

    // ✅ AMBIL BOBOT GLOBAL DARI DATABASE
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

    // ✅ TOTAL SKOR = JUMLAH BOBOT GLOBAL
    const getSkorBuku = (idBuku) => {
        const nilai = nilaiAlternatif.filter(n => n.id_alternatif === idBuku);
        let total = 0;
        for (const n of nilai) {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            if (sub) {
                total += parseFloat(sub.bobot_global) || 0;
            }
        }
        return total;
    };

    // ✅ DETAIL NILAI BUKU
    const getDetailNilaiBuku = (idBuku) => {
        const nilai = nilaiAlternatif.filter(n => n.id_alternatif === idBuku);
        const detail = [];
        for (const n of nilai) {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            if (sub) {
                detail.push({
                    id_kriteria: sub.id_kriteria,
                    nama_kriteria: getKriteriaName(sub.id_kriteria),
                    id_sub: sub.id_sub,
                    nama_sub: sub.nama_sub,
                    bobot_global: parseFloat(sub.bobot_global) || 0
                });
            }
        }
        return detail.sort((a, b) => b.bobot_global - a.bobot_global);
    };

    const getStatusBuku = (idBuku) => {
        const nilai = nilaiAlternatif.filter(n => n.id_alternatif === idBuku);
        const selectedKriteria = new Set(nilai.map(n => {
            const sub = subKriteria.find(s => s.id_sub === n.id_sub);
            return sub?.id_kriteria;
        }).filter(Boolean));
        return selectedKriteria.size;
    };

    const isComplete = (idBuku) => {
        return getStatusBuku(idBuku) === kriteria.length && kriteria.length > 0;
    };

    const getCompletionPercent = (idBuku) => {
        if (kriteria.length === 0) return 0;
        return (getStatusBuku(idBuku) / kriteria.length) * 100;
    };

    const toggleDetail = (id) => {
        setShowDetail(showDetail === id ? null : id);
    };

    const getSortedBuku = () => {
        let filtered = buku.filter(b => 
            b.judul_buku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.penulis && b.penulis.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filterStatus === 'lengkap') {
            filtered = filtered.filter(b => isComplete(b.id_alternatif));
        } else if (filterStatus === 'belum') {
            filtered = filtered.filter(b => !isComplete(b.id_alternatif));
        }

        filtered.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'nama':
                    valA = a.judul_buku.toLowerCase();
                    valB = b.judul_buku.toLowerCase();
                    break;
                case 'skor':
                    valA = getSkorBuku(a.id_alternatif);
                    valB = getSkorBuku(b.id_alternatif);
                    break;
                case 'status':
                    valA = getStatusBuku(a.id_alternatif);
                    valB = getStatusBuku(b.id_alternatif);
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

    // ============================================================
    // RENDER
    // ============================================================

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Memuat data...</p>
            </div>
        );
    }

    if (kriteria.length === 0) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">📚 Nilai Buku</h1>
                </div>
                <div className="card-empty">
                    <AlertCircle size={48} />
                    <p>Belum ada kriteria. Tambahkan kriteria terlebih dahulu.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/kriteria')}>
                        Ke Kriteria
                    </button>
                </div>
            </div>
        );
    }

    const sortedBuku = getSortedBuku();

    return (
        <div className="nilai-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Star size={28} style={{ color: '#2c3e7a', marginRight: '8px' }} />
                        Nilai Alternatif
                    </h1>
                    <p className="page-subtitle">
                        Pilih sub-kriteria untuk setiap buku
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8a9ab8' }}>
                            {buku.filter(b => isComplete(b.id_alternatif)).length}/{buku.length} buku lengkap
                        </span>
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline btn-sm" onClick={fetchAllData}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={16} /> Simpan Nilai
                    </button>
                </div>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="message success">
                    <CheckCircle size={18} />
                    <span>{successMessage}</span>
                    <button className="message-close" onClick={() => setSuccessMessage('')}>
                        <X size={16} />
                    </button>
                </div>
            )}
            {errorMessage && (
                <div className="message error">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                    <button className="message-close" onClick={() => setErrorMessage('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2c3e7a' }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{buku.length}</div>
                        <div className="stat-label">Total Buku</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f7e6', color: '#276749' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">
                            {buku.filter(b => isComplete(b.id_alternatif)).length}
                        </div>
                        <div className="stat-label">Sudah Dinilai</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fff3e0', color: '#ed8936' }}>
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-number">
                            {buku.filter(b => !isComplete(b.id_alternatif)).length}
                        </div>
                        <div className="stat-label">Belum Dinilai</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="stat-number">{kriteria.length}</div>
                        <div className="stat-label">Total Kriteria</div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Left: Daftar Buku */}
                <div className="buku-list-card">
                    <div className="card-header">
                        <div className="card-title">
                            <BookOpen size={18} className="icon" />
                            Daftar Buku
                        </div>
                        <span className="card-badge">
                            {buku.filter(b => isComplete(b.id_alternatif)).length}/{buku.length} lengkap
                        </span>
                    </div>

                    <div className="filter-section">
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Cari buku..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="filter-group">
                            <select
                                className="filter-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="semua">Semua</option>
                                <option value="lengkap">✓ Lengkap</option>
                                <option value="belum">○ Belum</option>
                            </select>
                            <select
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="nama">Sortir: Nama</option>
                                <option value="skor">Sortir: Skor</option>
                                <option value="status">Sortir: Status</option>
                            </select>
                            <button
                                className="btn-sort"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    <div className="buku-list">
                        {sortedBuku.length === 0 ? (
                            <div className="empty-list">
                                <BookOpen size={32} />
                                <p>Belum ada buku</p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/buku')}>
                                    Tambah Buku
                                </button>
                            </div>
                        ) : (
                            sortedBuku.map((b) => {
                                const complete = isComplete(b.id_alternatif);
                                const skor = getSkorBuku(b.id_alternatif);
                                const isSelected = selectedBuku === b.id_alternatif;
                                const percent = getCompletionPercent(b.id_alternatif);

                                return (
                                    <div
                                        key={b.id_alternatif}
                                        className={`buku-item ${isSelected ? 'selected' : ''} ${complete ? 'complete' : ''}`}
                                        onClick={() => handleBukuChange(b.id_alternatif)}
                                    >
                                        <div className="buku-item-info">
                                            <div className="buku-item-title">
                                                {b.judul_buku}
                                                {complete && <CheckCircle size={14} color="#48bb78" />}
                                            </div>
                                            <div className="buku-item-meta">
                                                {b.penulis || 'Penulis tidak diketahui'}
                                            </div>
                                        </div>
                                        <div className="buku-item-status">
                                            <div className="progress-circle">
                                                <svg viewBox="0 0 36 36" className="progress-svg">
                                                    <circle cx="18" cy="18" r="16" fill="none" className="progress-bg" />
                                                    <circle cx="18" cy="18" r="16" fill="none" className="progress-fg" strokeDasharray={`${percent * 1.005} 100`} />
                                                </svg>
                                                <span className="progress-text">{Math.round(percent)}%</span>
                                            </div>
                                            {complete && (
                                                <span className="skor-badge">{formatNumber(skor)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: Form Nilai */}
                <div className="nilai-form-card">
                    <div className="card-header">
                        <div className="card-title">
                            <Layers size={18} className="icon" />
                            {selectedBuku ? `"${getBukuName(selectedBuku)}"` : 'Pilih Buku'}
                        </div>
                        <span className="card-badge">
                            {selectedBuku && `${getStatusBuku(selectedBuku)}/${kriteria.length} kriteria`}
                        </span>
                    </div>

                    {!selectedBuku ? (
                        <div className="empty-state">
                            <Database size={40} />
                            <p>Pilih buku dari daftar di samping</p>
                        </div>
                    ) : (
                        <div className="nilai-form">
                            {kriteria.map(k => {
                                const subs = getKriteriaSubs(k.id_kriteria);
                                const currentValue = selectedValues[k.id_kriteria];
                                const isSelected = !!currentValue;

                                return (
                                    <div key={k.id_kriteria} className={`form-group ${isSelected ? 'selected' : ''}`}>
                                        <div className="form-label">
                                            <div className="form-label-left">
                                                <span className="form-label-icon">
                                                    {isSelected ? <CheckCircle size={14} color="#2c3e7a" /> : <div className="circle-empty" />}
                                                </span>
                                                <span>{k.nama_kriteria}</span>
                                            </div>
                                            <span className="form-label-bobot">
                                                Bobot: {formatNumber(getBobotKriteria(k.id_kriteria))}
                                            </span>
                                        </div>
                                        
                                        {subs.length === 0 ? (
                                            <div className="empty-subs">
                                                <AlertCircle size={16} />
                                                <span>Belum ada sub-kriteria</span>
                                                <button className="btn btn-outline btn-sm" onClick={() => navigate('/sub-kriteria')}>
                                                    Tambah
                                                </button>
                                            </div>
                                        ) : (
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
                                                            <span className="sub-global">{formatNumber(bobotGlobal)}</span>
                                                            {isActive && <CheckCircle size={14} color="#2c3e7a" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Ringkasan Skor */}
                            <div className="form-summary">
                                <div className="summary-item">
                                    <span>Kriteria Terpilih</span>
                                    <span className="summary-value">
                                        {kriteria.filter(k => selectedValues[k.id_kriteria]).length}/{kriteria.length}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span>Total Skor (Σ Bobot Global)</span>
                                    <span className="summary-value" style={{ color: '#2c3e7a', fontWeight: 700, fontSize: '18px' }}>
                                        {formatNumber(getSkorBuku(selectedBuku))}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span>Status</span>
                                    <span className={`summary-value ${kriteria.every(k => selectedValues[k.id_kriteria]) ? 'complete' : 'incomplete'}`}>
                                        {kriteria.every(k => selectedValues[k.id_kriteria]) ? '✅ Lengkap' : '⚠️ Belum Lengkap'}
                                    </span>
                                </div>
                            </div>

                            {/* Tombol Simpan */}
                            <button className="btn btn-primary btn-full" onClick={handleSave}>
                                <Save size={16} /> Simpan Nilai Buku
                            </button>

                            {/* ✅ DETAIL NILAI - TOTAL SKOR PASTI MUNCUL */}
                            {isComplete(selectedBuku) && (
                                <div className="detail-nilai">
                                    <div className="detail-nilai-header" onClick={() => toggleDetail(selectedBuku)}>
                                        <Calculator size={16} />
                                        <span>Detail Perhitungan Skor</span>
                                        {showDetail === selectedBuku ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                    {showDetail === selectedBuku && (
                                        <>
                                            <div className="detail-nilai-list">
                                                {getDetailNilaiBuku(selectedBuku).map((item, idx) => (
                                                    <div key={idx} className="detail-nilai-item">
                                                        <span className="detail-kriteria">{item.nama_kriteria}</span>
                                                        <span className="detail-sub">{item.nama_sub}</span>
                                                        <span className="detail-bobot">
                                                            Bobot Global: {formatNumber(item.bobot_global)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* ✅ TOTAL SKOR - HARUSNYA MUNCUL */}
                                            <div className="detail-nilai-total">
                                                <span>Total Skor (Σ Bobot Global)</span>
                                                <span>{formatNumber(getSkorBuku(selectedBuku))}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .nilai-page {
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

                .header-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
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
                    background: #2c3e7a;
                    color: white;
                }

                .btn-primary:hover {
                    background: #3d5a9e;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(44, 62, 122, 0.3);
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

                .btn-full {
                    width: 100%;
                    justify-content: center;
                    padding: 12px;
                    font-size: 15px;
                }

                .btn-sort {
                    padding: 9px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: #fafbfc;
                    cursor: pointer;
                    font-size: 14px;
                    color: #4a5a7a;
                    transition: all 0.2s ease;
                }

                .btn-sort:hover {
                    border-color: #2c3e7a;
                    background: white;
                }

                .message {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    position: relative;
                }

                .message.success {
                    background: #e6f7e6;
                    color: #276749;
                    border: 1px solid #b7dfb7;
                }

                .message.error {
                    background: #fde8e8;
                    color: #9b2c2c;
                    border: 1px solid #f5c6c6;
                }

                .message-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.6;
                    padding: 4px;
                }

                .message-close:hover {
                    opacity: 1;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(26, 39, 68, 0.06);
                    border: 1px solid #e2e8f0;
                }

                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2744;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 13px;
                    color: #8a9ab8;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.6fr;
                    gap: 20px;
                }

                .buku-list-card,
                .nilai-form-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26, 39, 68, 0.08);
                    padding: 20px;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .card-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .card-title .icon {
                    color: #2c3e7a;
                }

                .card-badge {
                    font-size: 12px;
                    padding: 4px 12px;
                    border-radius: 12px;
                    background: #f7f9fc;
                    color: #4a5a7a;
                    font-weight: 500;
                }

                .filter-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 14px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    transition: border-color 0.2s;
                    background: #fafbfc;
                }

                .search-box:focus-within {
                    border-color: #2c3e7a;
                    background: white;
                }

                .search-icon {
                    color: #8a9ab8;
                }

                .search-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    color: #1a2744;
                    background: transparent;
                }

                .filter-group {
                    display: flex;
                    gap: 6px;
                }

                .filter-select {
                    flex: 1;
                    padding: 8px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 13px;
                    background: #fafbfc;
                    color: #1a2744;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #2c3e7a;
                }

                .buku-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 550px;
                    overflow-y: auto;
                    padding-right: 4px;
                }

                .buku-list::-webkit-scrollbar {
                    width: 4px;
                }

                .buku-list::-webkit-scrollbar-track {
                    background: #f7f9fc;
                    border-radius: 4px;
                }

                .buku-list::-webkit-scrollbar-thumb {
                    background: #d2d6dc;
                    border-radius: 4px;
                }

                .buku-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                    background: #fafbfc;
                }

                .buku-item:hover {
                    background: #f0f2f5;
                    transform: translateX(4px);
                }

                .buku-item.selected {
                    background: #eef2f7;
                    border-color: #2c3e7a;
                    box-shadow: 0 2px 8px rgba(44, 62, 122, 0.1);
                }

                .buku-item.complete {
                    border-left: 3px solid #48bb78;
                }

                .buku-item-info {
                    flex: 1;
                    min-width: 0;
                }

                .buku-item-title {
                    font-weight: 500;
                    color: #1a2744;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .buku-item-meta {
                    font-size: 12px;
                    color: #8a9ab8;
                    margin-top: 2px;
                }

                .buku-item-status {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }

                .progress-circle {
                    position: relative;
                    width: 32px;
                    height: 32px;
                }

                .progress-svg {
                    transform: rotate(-90deg);
                    width: 32px;
                    height: 32px;
                }

                .progress-bg {
                    stroke: #e2e8f0;
                    stroke-width: 3;
                }

                .progress-fg {
                    stroke-width: 3;
                    stroke-linecap: round;
                    transition: stroke-dasharray 0.5s ease;
                    stroke: #48bb78;
                }

                .progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 8px;
                    font-weight: 700;
                    color: #1a2744;
                }

                .skor-badge {
                    font-size: 12px;
                    font-weight: 600;
                    color: #2c3e7a;
                    padding: 2px 8px;
                    background: #e3f2fd;
                    border-radius: 4px;
                }

                .empty-list {
                    text-align: center;
                    padding: 40px 20px;
                    color: #8a9ab8;
                }

                .empty-list p {
                    margin: 12px 0;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #8a9ab8;
                }

                .empty-state p {
                    margin-top: 12px;
                }

                .nilai-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .form-group {
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 2px solid #e2e8f0;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                }

                .form-group.selected {
                    border-color: #2c3e7a;
                    background: #f8faff;
                }

                .form-label {
                    font-weight: 600;
                    font-size: 13px;
                    color: #4a5a7a;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .form-label-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .form-label-icon {
                    display: flex;
                    align-items: center;
                }

                .circle-empty {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid #e2e8f0;
                }

                .form-label-bobot {
                    font-size: 11px;
                    color: #8a9ab8;
                    font-weight: 400;
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
                    padding: 6px 14px;
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
                    border-color: #2c3e7a;
                    background: #eef2f7;
                    color: #1a2744;
                    font-weight: 500;
                    box-shadow: 0 2px 8px rgba(44, 62, 122, 0.1);
                }

                .sub-name {
                    font-weight: 500;
                }

                .sub-global {
                    font-size: 10px;
                    padding: 1px 6px;
                    border-radius: 4px;
                    background: #e3f2fd;
                    color: #2c3e7a;
                    font-weight: 600;
                    font-family: monospace;
                }

                .empty-subs {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #8a9ab8;
                    font-size: 13px;
                }

                .form-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    margin-top: 4px;
                    border: 1px solid #e2e8f0;
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
                    color: #276749;
                }

                .summary-value.incomplete {
                    color: #ed8936;
                }

                .detail-nilai {
                    margin-top: 12px;
                    padding: 12px 16px;
                    background: #f8faff;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .detail-nilai-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #4a5a7a;
                    cursor: pointer;
                    user-select: none;
                }

                .detail-nilai-header:hover {
                    color: #2c3e7a;
                }

                .detail-nilai-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-top: 8px;
                }

                .detail-nilai-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 8px;
                    font-size: 13px;
                    border-bottom: 1px solid #eef2f7;
                    flex-wrap: wrap;
                    gap: 4px;
                }

                .detail-nilai-item:last-child {
                    border-bottom: none;
                }

                .detail-kriteria {
                    font-weight: 600;
                    color: #1a2744;
                    min-width: 120px;
                }

                .detail-sub {
                    color: #4a5a7a;
                    flex: 1;
                    text-align: center;
                }

                .detail-bobot {
                    color: #2c3e7a;
                    font-weight: 600;
                    font-size: 13px;
                    font-family: monospace;
                    background: #e3f2fd;
                    padding: 2px 10px;
                    border-radius: 4px;
                    min-width: 80px;
                    text-align: center;
                }

                .detail-nilai-total {
                    display: flex;
                    justify-content: space-between;
                    padding-top: 10px;
                    margin-top: 8px;
                    border-top: 2px solid #2c3e7a;
                    font-weight: 700;
                    font-size: 15px;
                }

                .detail-nilai-total span:last-child {
                    color: #2c3e7a;
                    font-size: 18px;
                }

                @media (max-width: 1200px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .nilai-page {
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

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .filter-group {
                        flex-wrap: wrap;
                    }

                    .filter-select {
                        min-width: 100px;
                    }

                    .form-summary {
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }

                    .buku-list {
                        max-height: 300px;
                    }

                    .detail-nilai-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 4px;
                    }

                    .detail-sub {
                        text-align: left;
                        width: 100%;
                    }

                    .detail-bobot {
                        width: 100%;
                        text-align: left;
                    }

                    .card-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 4px;
                    }

                    .sub-options {
                        flex-direction: column;
                    }

                    .sub-option {
                        justify-content: center;
                        padding: 8px 12px;
                    }

                    .form-summary {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .nilai-page {
                        padding: 12px;
                    }

                    .buku-item {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }

                    .buku-item-status {
                        justify-content: flex-start;
                    }

                    .detail-nilai-total {
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                    }
                }
            `}</style>
        </div>
    );
};

export default NilaiAlternatifPage;