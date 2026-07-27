import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Edit2, Trash2, ListChecks, X, 
    ArrowLeft, CheckCircle, AlertCircle,
    Layers, Trash2 as TrashIcon, RefreshCw,
    Search, Filter
} from 'lucide-react';

const API_URL = '/api';

const SubKriteriaPage = () => {
    const navigate = useNavigate();
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKriteria, setFilterKriteria] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ id_kriteria: '', nama_sub: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const [kRes, sRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`)
            ]);
            
            setKriteria(kRes.data.data || []);
            setSubKriteria(sRes.data.data || []);
            
            if (kRes.data.data?.length > 0 && filterKriteria === null) {
                setFilterKriteria(kRes.data.data[0].id_kriteria);
            }
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setErrorMessage('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setSuccessMessage('✅ Data berhasil diperbarui!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setRefreshing(false);
    };

    const getKriteriaName = (idKriteria) => {
        const found = kriteria.find(k => k.id_kriteria === idKriteria);
        return found?.nama_kriteria || 'Tidak diketahui';
    };

    const getKriteriaSubCount = (idKriteria) => {
        return subKriteria.filter(s => s.id_kriteria === idKriteria).length;
    };

    const displayedSubs = filterKriteria 
        ? subKriteria.filter(s => s.id_kriteria === filterKriteria)
        : subKriteria;

    const filteredSubs = displayedSubs.filter(item =>
        item.nama_sub.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getKriteriaName(item.id_kriteria).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nama_sub.trim()) {
            setErrorMessage('⚠️ Nama sub-kriteria wajib diisi!');
            return;
        }

        if (!formData.id_kriteria) {
            setErrorMessage('⚠️ Pilih kriteria terlebih dahulu!');
            return;
        }

        try {
            if (editing) {
                await axios.put(`${API_URL}/sub-kriteria/${editing}`, {
                    nama_sub: formData.nama_sub
                });
                setSuccessMessage('✅ Sub-kriteria berhasil diupdate!');
            } else {
                await axios.post(`${API_URL}/sub-kriteria`, {
                    id_kriteria: formData.id_kriteria,
                    nama_sub: formData.nama_sub
                });
                setSuccessMessage('✅ Sub-kriteria berhasil ditambahkan!');
            }
            setShowModal(false);
            setEditing(null);
            setFormData({ id_kriteria: filterKriteria || '', nama_sub: '' });
            setErrorMessage('');
            await fetchData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving:', error);
            setErrorMessage('❌ Gagal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus sub-kriteria ini?')) return;
        try {
            await axios.delete(`${API_URL}/sub-kriteria/${id}`);
            setSuccessMessage('✅ Sub-kriteria berhasil dihapus!');
            await fetchData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('❌ Gagal hapus: ' + error.message);
        }
    };

    const handleTruncate = async () => {
        if (!window.confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA data sub-kriteria!\n\nYakin ingin melanjutkan?')) {
            return;
        }
        
        if (!window.confirm('Konfirmasi kedua: Hapus semua sub-kriteria?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/sub-kriteria/truncate`);
            setSuccessMessage('✅ Semua sub-kriteria berhasil dihapus!');
            await fetchData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error truncating:', error);
            setErrorMessage('❌ Gagal menghapus: ' + (error.response?.data?.message || error.message));
        }
    };

    const openModal = (item = null) => {
        setErrorMessage('');
        if (item) {
            setEditing(item.id_sub);
            setFormData({
                id_kriteria: item.id_kriteria,
                nama_sub: item.nama_sub
            });
        } else {
            setEditing(null);
            setFormData({
                id_kriteria: filterKriteria || '',
                nama_sub: ''
            });
        }
        setShowModal(true);
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(parseFloat(val))) return '-';
        const num = parseFloat(val);
        return isNaN(num) ? '-' : num.toFixed(4);
    };

    if (loading) {
        return (
            <div className="subkriteria-page">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Memuat data...</p>
                </div>
            </div>
        );
    }

    if (kriteria.length === 0) {
        return (
            <div className="subkriteria-page">
                <div className="page-header">
                    <div className="header-left">
                        <div className="header-icon-wrapper">
                            <Layers size={22} />
                        </div>
                        <div>
                            <h1 className="page-title">Manajemen Sub-Kriteria</h1>
                            <p className="page-subtitle">Kelola sub-kriteria untuk setiap kriteria</p>
                        </div>
                    </div>
                    <button className="btn-outline" onClick={() => navigate('/kriteria')}>
                        <ArrowLeft size={16} /> Ke Kriteria
                    </button>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <ListChecks size={40} />
                        </div>
                        <h3>Belum ada kriteria</h3>
                        <p>Tambahkan kriteria terlebih dahulu di halaman Kriteria</p>
                        <button className="btn-primary" onClick={() => navigate('/kriteria')}>
                            Ke Halaman Kriteria
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="subkriteria-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <div className="header-icon-wrapper">
                        <Layers size={22} />
                    </div>
                    <div>
                        <h1 className="page-title">Manajemen Sub-Kriteria</h1>
                        <p className="page-subtitle">
                            Kelola sub-kriteria untuk setiap kriteria AHP
                            <span className="total-badge">{subKriteria.length} sub-kriteria</span>
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-outline btn-sm" 
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> 
                        {refreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                    <button 
                        className="btn-danger btn-sm" 
                        onClick={handleTruncate}
                    >
                        <TrashIcon size={16} /> Hapus Semua
                    </button>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={18} /> Tambah
                    </button>
                </div>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="message success">
                    <CheckCircle size={20} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="message error">
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Content */}
            <div className="content-card">
                {/* Filter & Search */}
                <div className="filter-section">
                    <div className="filter-left">
                        <div className="filter-group">
                            <label className="filter-label">Kriteria</label>
                            <select
                                className="filter-select"
                                value={filterKriteria || ''}
                                onChange={(e) => setFilterKriteria(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">📌 Semua</option>
                                {kriteria.map(k => (
                                    <option key={k.id_kriteria} value={k.id_kriteria}>
                                        {k.nama_kriteria} ({getKriteriaSubCount(k.id_kriteria)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari sub-kriteria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                {filteredSubs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <AlertCircle size={40} />
                        </div>
                        <h3>
                            {searchTerm 
                                ? 'Tidak ada hasil pencarian' 
                                : filterKriteria 
                                    ? `Belum ada sub-kriteria untuk "${getKriteriaName(filterKriteria)}"`
                                    : 'Belum ada sub-kriteria'
                            }
                        </h3>
                        <p>
                            {searchTerm 
                                ? `Tidak ditemukan sub-kriteria dengan kata "${searchTerm}"`
                                : 'Klik tombol "Tambah" untuk menambahkan sub-kriteria baru'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="col-no">No</th>
                                    <th className="col-kriteria">Kriteria</th>
                                    <th className="col-name">Nama Sub-Kriteria</th>
                                    <th className="col-weight">Bobot Sub</th>
                                    <th className="col-weight">Bobot Global</th>
                                    <th className="col-actions">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubs.map((item, index) => {
                                    const bobotSub = parseFloat(item.bobot_sub) || 0;
                                    const bobotGlobal = parseFloat(item.bobot_global) || 0;
                                    
                                    return (
                                        <tr key={item.id_sub}>
                                            <td className="col-no">{index + 1}</td>
                                            <td className="col-kriteria">
                                                <span className="kriteria-tag">
                                                    {getKriteriaName(item.id_kriteria)}
                                                </span>
                                            </td>
                                            <td className="col-name">
                                                <span className="sub-name">{item.nama_sub}</span>
                                            </td>
                                            <td className="col-weight">
                                                {bobotSub > 0 ? (
                                                    <span className="weight-value sub">{formatNumber(bobotSub)}</span>
                                                ) : (
                                                    <span className="weight-empty">—</span>
                                                )}
                                            </td>
                                            <td className="col-weight">
                                                {bobotGlobal > 0 ? (
                                                    <span className="weight-value global">{formatNumber(bobotGlobal)}</span>
                                                ) : (
                                                    <span className="weight-empty">—</span>
                                                )}
                                            </td>
                                            <td className="col-actions">
                                                <div className="action-group">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => openModal(item)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(item.id_sub)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Navigation */}
                <div className="nav-footer">
                    <div className="nav-info">
                        <Layers size={18} />
                        <div>
                            <h4>Lanjutkan ke Perhitungan</h4>
                            <p>
                                {subKriteria.length >= 2 
                                    ? `✅ ${subKriteria.length} sub-kriteria siap dihitung` 
                                    : '⚠️ Minimal 2 sub-kriteria total untuk perhitungan'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="nav-actions">
                        <button 
                            className="btn-nav pairwise" 
                            onClick={() => navigate('/pairwise-sub')}
                            disabled={subKriteria.length < 2}
                        >
                            ⚖️ Pairwise Sub
                        </button>
                        <button 
                            className="btn-nav normalisasi" 
                            onClick={() => navigate('/normalisasi-sub')}
                            disabled={subKriteria.length < 2}
                        >
                            📊 Normalisasi Sub
                        </button>
                        <button 
                            className="btn-nav global" 
                            onClick={() => navigate('/hitung-global')}
                            disabled={subKriteria.length < 2}
                        >
                            🌐 Hitung Global
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Sub-Kriteria' : 'Tambah Sub-Kriteria'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Kriteria</label>
                                <select
                                    className="form-select"
                                    value={formData.id_kriteria}
                                    onChange={(e) => setFormData({ ...formData, id_kriteria: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value="">Pilih Kriteria</option>
                                    {kriteria.map(k => (
                                        <option key={k.id_kriteria} value={k.id_kriteria}>
                                            {k.nama_kriteria} ({getKriteriaSubCount(k.id_kriteria)} sub)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Sub-Kriteria</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Contoh: Sangat Sesuai, 4.5-5.0"
                                    value={formData.nama_sub}
                                    onChange={(e) => setFormData({ ...formData, nama_sub: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-hint">
                                💡 Nilai bobot akan dihitung otomatis di halaman Normalisasi Sub
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit">
                                    {editing ? 'Update Sub-Kriteria' : 'Simpan Sub-Kriteria'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .subkriteria-page {
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

                .btn-primary:hover {
                    background: #3a5ce7;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
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

                .btn-outline:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 18px;
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1.5px solid #fecaca;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-danger:hover {
                    background: #fecaca;
                    border-color: #f87171;
                }

                .btn-sm {
                    padding: 7px 14px;
                    font-size: 13px;
                }

                /* ===== MESSAGES ===== */
                .message {
                    padding: 12px 20px;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
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

                /* ===== CONTENT CARD ===== */
                .content-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                }

                /* ===== FILTER SECTION ===== */
                .filter-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #f0f4f9;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .filter-left {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .filter-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #4a5568;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 13px;
                    background: #fafbfc;
                    color: #1a2332;
                    transition: all 0.2s ease;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.08);
                }

                .search-wrapper {
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
                    padding: 8px 12px 8px 38px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 13px;
                    background: #fafbfc;
                    color: #1a2332;
                    transition: all 0.2s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.08);
                }

                .search-input::placeholder {
                    color: #b0bcc8;
                }

                /* ===== TABLE ===== */
                .table-container {
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
                }

                .data-table tbody tr {
                    transition: background 0.15s ease;
                }

                .data-table tbody tr:hover {
                    background: #fafbfc;
                }

                .data-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .col-no {
                    width: 50px;
                    color: #9aa8b8;
                    font-weight: 500;
                }

                .col-kriteria {
                    min-width: 140px;
                }

                .kriteria-tag {
                    display: inline-block;
                    padding: 3px 12px;
                    background: #eef3ff;
                    color: #4a6cf7;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .col-name {
                    min-width: 160px;
                }

                .sub-name {
                    font-weight: 500;
                    color: #1a2332;
                }

                .col-weight {
                    width: 110px;
                    text-align: center;
                }

                .weight-value {
                    font-weight: 600;
                }

                .weight-value.sub {
                    color: #059669;
                }

                .weight-value.global {
                    color: #4a6cf7;
                }

                .weight-empty {
                    color: #b0bcc8;
                }

                .col-actions {
                    width: 90px;
                    text-align: center;
                }

                .action-group {
                    display: flex;
                    gap: 4px;
                    justify-content: center;
                }

                .action-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    background: transparent;
                    color: #7a8aa0;
                }

                .action-btn.edit:hover {
                    background: #eef3ff;
                    color: #4a6cf7;
                }

                .action-btn.delete:hover {
                    background: #fef0f0;
                    color: #e53e3e;
                }

                /* ===== NAV FOOTER ===== */
                .nav-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f0f4f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    background: #fafbfc;
                }

                .nav-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #4a6cf7;
                }

                .nav-info h4 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a2332;
                }

                .nav-info p {
                    margin: 0;
                    font-size: 13px;
                    color: #7a8aa0;
                }

                .nav-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .btn-nav {
                    padding: 8px 18px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-nav:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .btn-nav.pairwise {
                    background: #eef3ff;
                    color: #4a6cf7;
                }

                .btn-nav.pairwise:hover:not(:disabled) {
                    background: #4a6cf7;
                    color: white;
                }

                .btn-nav.normalisasi {
                    background: #ecfdf5;
                    color: #059669;
                }

                .btn-nav.normalisasi:hover:not(:disabled) {
                    background: #059669;
                    color: white;
                }

                .btn-nav.global {
                    background: #fef3c7;
                    color: #d97706;
                }

                .btn-nav.global:hover:not(:disabled) {
                    background: #d97706;
                    color: white;
                }

                /* ===== EMPTY & LOADING ===== */
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

                .loading-state p {
                    margin-top: 12px;
                    color: #7a8aa0;
                }

                /* ===== MODAL ===== */
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
                    max-width: 440px;
                    width: 92%;
                    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
                    animation: slideUp 0.3s ease;
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
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #2d3748;
                }

                .form-input,
                .form-select {
                    padding: 10px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                    color: #1a2332;
                }

                .form-input:focus,
                .form-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.08);
                }

                .form-input::placeholder {
                    color: #b0bcc8;
                }

                .form-hint {
                    padding: 10px 14px;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #92400e;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
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
                }

                .btn-submit:hover {
                    background: #3a5ce7;
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.25);
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

                /* ===== ANIMATIONS ===== */
                @keyframes spin {
                    to { transform: rotate(360deg); }
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

                .spin {
                    animation: spin 1s linear infinite;
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .subkriteria-page {
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

                    .header-actions .btn-primary,
                    .header-actions .btn-outline,
                    .header-actions .btn-danger {
                        flex: 1;
                        justify-content: center;
                        font-size: 13px;
                        padding: 8px 14px;
                    }

                    .filter-section {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-left {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-group {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-wrapper {
                        min-width: auto;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 8px 10px;
                        font-size: 12px;
                    }

                    .col-no {
                        width: 35px;
                    }

                    .col-weight {
                        width: 70px;
                    }

                    .col-actions {
                        width: 70px;
                    }

                    .nav-footer {
                        flex-direction: column;
                        align-items: stretch;
                        text-align: center;
                    }

                    .nav-actions {
                        justify-content: center;
                    }

                    .nav-actions .btn-nav {
                        flex: 1;
                        text-align: center;
                        font-size: 12px;
                        padding: 8px 12px;
                    }

                    .modal-container {
                        padding: 24px;
                    }

                    .modal-actions {
                        flex-direction: column;
                    }

                    .page-title {
                        font-size: 19px;
                    }

                    .total-badge {
                        font-size: 12px;
                        padding: 1px 10px;
                    }
                }

                @media (max-width: 480px) {
                    .data-table {
                        font-size: 11px;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 6px 8px;
                    }

                    .kriteria-tag {
                        font-size: 10px;
                        padding: 2px 8px;
                    }

                    .action-btn {
                        width: 28px;
                        height: 28px;
                    }

                    .action-btn svg {
                        width: 13px;
                        height: 13px;
                    }

                    .nav-actions {
                        flex-direction: column;
                    }

                    .nav-actions .btn-nav {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubKriteriaPage;