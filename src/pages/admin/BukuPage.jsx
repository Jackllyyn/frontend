import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
    Plus, Edit2, Trash2, BookOpen, X, 
    Search, ChevronLeft, ChevronRight,
    RefreshCw, Eye, User, Building, Hash, Calendar,
    Upload, FileSpreadsheet, Download, AlertCircle, Info,
    AlertTriangle
} from 'lucide-react';

const API_URL = '/api';

const BukuPage = () => {
    const [buku, setBuku] = useState([]);
    const [filteredBuku, setFilteredBuku] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ 
        judul_buku: '', 
        penulis: '', 
        penerbit: '', 
        tahun_terbit: '', 
        stok: 0 
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);

    // Import states
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Filter states
    const [filterPenerbit, setFilterPenerbit] = useState('');
    const [filterTahun, setFilterTahun] = useState('');
    const [filterStok, setFilterStok] = useState('semua');
    const [penerbitList, setPenerbitList] = useState([]);
    const [tahunList, setTahunList] = useState([]);

    // Truncate state
    const [showTruncateConfirm, setShowTruncateConfirm] = useState(false);

    useEffect(() => {
        fetchBuku();
    }, []);

    useEffect(() => {
        let result = [...buku];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(item => 
                item.judul_buku?.toLowerCase().includes(term) ||
                item.penulis?.toLowerCase().includes(term) ||
                item.penerbit?.toLowerCase().includes(term)
            );
        }

        if (filterPenerbit) {
            result = result.filter(item => item.penerbit === filterPenerbit);
        }

        if (filterTahun) {
            result = result.filter(item => item.tahun_terbit === filterTahun);
        }

        if (filterStok === 'tersedia') {
            result = result.filter(item => item.stok > 0);
        } else if (filterStok === 'habis') {
            result = result.filter(item => item.stok <= 0);
        }

        setFilteredBuku(result);
        setCurrentPage(1);
    }, [searchTerm, buku, filterPenerbit, filterTahun, filterStok]);

    const fetchBuku = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/alternatif`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data.data || [];
            setBuku(data);
            setFilteredBuku(data);

            const penerbits = [...new Set(data.map(item => item.penerbit).filter(Boolean))];
            const tahuns = [...new Set(data.map(item => item.tahun_terbit).filter(Boolean))];
            setPenerbitList(penerbits.sort());
            setTahunList(tahuns.sort());
        } catch (error) {
            console.error('Error:', error);
            setError('Gagal memuat data buku');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterPenerbit('');
        setFilterTahun('');
        setFilterStok('semua');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.judul_buku) {
            alert('Judul buku wajib diisi!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (editing) {
                await axios.put(`${API_URL}/alternatif/${editing}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('✅ Buku berhasil diupdate!');
            } else {
                await axios.post(`${API_URL}/alternatif`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('✅ Buku berhasil ditambahkan!');
            }
            setShowModal(false);
            setEditing(null);
            setFormData({ judul_buku: '', penulis: '', penerbit: '', tahun_terbit: '', stok: 0 });
            fetchBuku();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('❌ Gagal: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus buku ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/alternatif/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('✅ Buku berhasil dihapus!');
            fetchBuku();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('❌ Gagal hapus: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setError(''), 3000);
        }
    };

    // ===== HAPUS SEMUA BUKU =====
    const handleTruncate = async () => {
        setShowTruncateConfirm(false);
        try {
            const token = localStorage.getItem('token');
            
            // Gunakan endpoint POST untuk menghapus semua
            await axios.post(`${API_URL}/alternatif/delete-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSuccess('✅ Semua data buku berhasil dihapus!');
            fetchBuku();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error truncate:', error);
            setError('❌ Gagal menghapus semua data: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setError(''), 3000);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditing(item.id_alternatif);
            setFormData({
                judul_buku: item.judul_buku,
                penulis: item.penulis || '',
                penerbit: item.penerbit || '',
                tahun_terbit: item.tahun_terbit || '',
                stok: item.stok || 0
            });
        } else {
            setEditing(null);
            setFormData({ judul_buku: '', penulis: '', penerbit: '', tahun_terbit: '', stok: 0 });
        }
        setShowModal(true);
    };

    const openDetail = (item) => {
        setSelectedBook(item);
        setShowDetailModal(true);
    };

    // ===== IMPORT EXCEL =====
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        setImportData([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    setError('File Excel kosong!');
                    setUploading(false);
                    return;
                }

                const headers = Object.keys(jsonData[0]);

                const findColumn = (possibleNames) => {
                    for (const name of possibleNames) {
                        const found = headers.find(h => h.toLowerCase() === name.toLowerCase());
                        if (found) return found;
                    }
                    return null;
                };

                const judulCol = findColumn(['judul_buku', 'judul', 'Judul_Buku', 'Judul Buku']);
                const penulisCol = findColumn(['penulis', 'Penulis', 'Pengarang', 'Author']);
                const penerbitCol = findColumn(['penerbit', 'Penerbit', 'Publisher']);
                const tahunCol = findColumn(['tahun_terbit', 'tahun', 'Tahun_Terbit', 'Tahun Terbit']);
                const stokCol = findColumn(['stok', 'Stok', 'Stock', 'Jumlah']);

                if (!judulCol) {
                    setError('❌ Kolom "Judul Buku" tidak ditemukan.');
                    setUploading(false);
                    return;
                }

                const mappedData = jsonData.map(row => ({
                    judul_buku: String(row[judulCol] || '').trim(),
                    penulis: penulisCol ? String(row[penulisCol] || '').trim() : '',
                    penerbit: penerbitCol ? String(row[penerbitCol] || '').trim() : '',
                    tahun_terbit: tahunCol ? String(row[tahunCol] || '').trim() : '',
                    stok: parseInt(stokCol ? row[stokCol] || 0 : 0)
                })).filter(item => item.judul_buku !== '');

                setImportData(mappedData);
                setShowImport(true);
                setUploading(false);
            } catch (error) {
                console.error('Error parsing Excel:', error);
                setError('❌ Gagal membaca file: ' + error.message);
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleImportSave = async () => {
        if (importData.length === 0) {
            setError('Tidak ada data untuk diimport');
            return;
        }

        setImportLoading(true);
        setError('');
        setSuccess('');

        let successCount = 0;
        let failCount = 0;

        try {
            const token = localStorage.getItem('token');
            
            for (const item of importData) {
                if (!item.judul_buku) {
                    failCount++;
                    continue;
                }

                try {
                    await axios.post(`${API_URL}/alternatif`, {
                        judul_buku: item.judul_buku,
                        penulis: item.penulis || null,
                        penerbit: item.penerbit || null,
                        tahun_terbit: item.tahun_terbit || null,
                        stok: item.stok || 0,
                        gambar: null
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error('Error importing item:', item, error);
                }
            }

            setSuccess(`✅ ${successCount} buku berhasil diimport${failCount > 0 ? `, ${failCount} gagal` : ''}`);
            setShowImport(false);
            setImportData([]);
            fetchBuku();
            
            setTimeout(() => setSuccess(''), 4000);
        } catch (error) {
            setError('Gagal mengimport data');
        } finally {
            setImportLoading(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            ['judul_buku', 'penulis', 'penerbit', 'tahun_terbit', 'stok'],
            ['Filosofi Teras', 'Henry Manampiring', 'Penerbit Buku Kompas', '2018', 10],
            ['Bumi Manusia', 'Pramoedya Ananta Toer', 'Lentera Dipantara', '1980', 8]
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(template);
        ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Buku');
        XLSX.writeFile(wb, 'template_import_buku.xlsx');
    };

    const totalPages = Math.ceil(filteredBuku.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredBuku.slice(startIndex, endIndex);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Memuat data buku...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Data Buku</h1>
                    <p className="page-subtitle">
                        Kelola koleksi buku yang akan dinilai
                        <span className="count-badge">{buku.length} buku</span>
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchBuku} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn-refresh" onClick={downloadTemplate} title="Download Template">
                        <FileSpreadsheet size={16} />
                    </button>
                    <button className="btn-refresh" onClick={() => document.getElementById('fileInput').click()} title="Import Excel">
                        <Upload size={16} />
                    </button>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        <span>Tambah Buku</span>
                    </button>
                    <button 
                        className="btn-danger" 
                        onClick={() => setShowTruncateConfirm(true)}
                        title="Hapus Semua Buku"
                    >
                        <Trash2 size={16} />
                        <span>Hapus Semua</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="search-bar">
                <div className="search-wrapper">
                    <Search size={17} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Cari judul, penulis, atau penerbit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-btn" onClick={() => setSearchTerm('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filterPenerbit}
                        onChange={(e) => setFilterPenerbit(e.target.value)}
                    >
                        <option value="">Semua Penerbit</option>
                        {penerbitList.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={filterTahun}
                        onChange={(e) => setFilterTahun(e.target.value)}
                    >
                        <option value="">Semua Tahun</option>
                        {tahunList.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={filterStok}
                        onChange={(e) => setFilterStok(e.target.value)}
                    >
                        <option value="semua">Semua Stok</option>
                        <option value="tersedia">✓ Tersedia</option>
                        <option value="habis">✗ Habis</option>
                    </select>
                    <button className="btn-filter-reset" onClick={resetFilters}>
                        Reset
                    </button>
                </div>
                <div className="search-info">
                    {filteredBuku.length > 0 && (
                        <span>{filteredBuku.length} dari {buku.length} buku</span>
                    )}
                </div>
            </div>

            {/* Messages */}
            {success && (
                <div className="alert success">
                    <span>{success}</span>
                    <button className="alert-close" onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="alert error">
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Book Grid */}
            {filteredBuku.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} className="empty-icon" />
                    {searchTerm || filterPenerbit || filterTahun || filterStok !== 'semua' ? (
                        <>
                            <h3>Tidak ada hasil</h3>
                            <p>Coba ubah filter atau kata kunci pencarian</p>
                            <button className="btn-outline" onClick={resetFilters}>
                                Reset Filter
                            </button>
                        </>
                    ) : (
                        <>
                            <h3>Belum ada data buku</h3>
                            <p>Klik tombol "Tambah Buku" untuk menambahkan koleksi</p>
                            <button className="btn-primary" onClick={() => openModal()}>
                                <Plus size={16} />
                                Tambah Buku
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="books-grid">
                        {currentData.map((item) => (
                            <div key={item.id_alternatif} className="book-card">
                                <div className="book-card-header">
                                    <div className="book-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="book-stok">
                                        <span className={`stok-badge ${item.stok > 0 ? 'available' : 'empty'}`}>
                                            Stok: {item.stok || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="book-card-body">
                                    <h3 className="book-title">{item.judul_buku}</h3>
                                    <p className="book-author">{item.penulis || 'Penulis tidak diketahui'}</p>
                                    <p className="book-publisher">{item.penerbit || 'Penerbit tidak diketahui'}</p>
                                    {item.tahun_terbit && (
                                        <span className="tahun-tag">📅 {item.tahun_terbit}</span>
                                    )}
                                </div>

                                <div className="book-card-actions">
                                    <button 
                                        className="action-btn detail"
                                        onClick={() => openDetail(item)}
                                    >
                                        <Eye size={16} />
                                        <span>Detail</span>
                                    </button>
                                    <button 
                                        className="action-btn edit"
                                        onClick={() => openModal(item)}
                                    >
                                        <Edit2 size={16} />
                                        <span>Edit</span>
                                    </button>
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => handleDelete(item.id_alternatif)}
                                    >
                                        <Trash2 size={16} />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span className="pagination-info">
                                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredBuku.length)} dari {filteredBuku.length}
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                
                                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = idx + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = idx + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + idx;
                                    } else {
                                        pageNum = currentPage - 2 + idx;
                                    }
                                    
                                    return (
                                        <button
                                            key={idx}
                                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => goToPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    className="page-btn"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Truncate Confirmation Modal */}
            {showTruncateConfirm && (
                <div className="modal-overlay" onClick={() => setShowTruncateConfirm(false)}>
                    <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <AlertTriangle size={24} style={{ color: '#e53e3e' }} />
                                <h3 style={{ color: '#e53e3e' }}>Hapus Semua Buku!</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowTruncateConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="truncate-content">
                            <div className="truncate-icon">
                                <AlertTriangle size={56} />
                            </div>
                            <p className="truncate-text">
                                Anda akan menghapus <strong>SEMUA data buku</strong> secara permanen!
                            </p>
                            <div className="truncate-details">
                                <p>📊 Akan menghapus <strong>{buku.length}</strong> buku</p>
                                <p>⚠️ Data yang dihapus <strong>tidak dapat dikembalikan</strong></p>
                                <p>🔄 Disarankan untuk melakukan backup terlebih dahulu</p>
                            </div>
                            
                            <div className="truncate-confirm">
                                <label className="confirm-label">
                                    <input 
                                        type="checkbox" 
                                        id="confirmTruncate"
                                        className="confirm-checkbox"
                                    />
                                    Saya mengerti dan ingin melanjutkan
                                </label>
                            </div>
                        </div>

                        <div className="modal-actions truncate-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowTruncateConfirm(false)}
                            >
                                Batal
                            </button>
                            <button 
                                className="btn-danger-submit" 
                                onClick={() => {
                                    const checkbox = document.getElementById('confirmTruncate');
                                    if (!checkbox.checked) {
                                        alert('Silakan centang konfirmasi terlebih dahulu!');
                                        return;
                                    }
                                    handleTruncate();
                                }}
                            >
                                <Trash2 size={16} />
                                Ya, Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Buku' : 'Tambah Buku'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Judul Buku <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Masukkan judul buku"
                                    value={formData.judul_buku}
                                    onChange={(e) => setFormData({ ...formData, judul_buku: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Penulis</label>
                                    <input
                                        type="text"
                                        placeholder="Nama penulis"
                                        value={formData.penulis}
                                        onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Penerbit</label>
                                    <input
                                        type="text"
                                        placeholder="Nama penerbit"
                                        value={formData.penerbit}
                                        onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tahun Terbit</label>
                                    <input
                                        type="text"
                                        placeholder="Kode tahun terbit"
                                        value={formData.tahun_terbit}
                                        onChange={(e) => setFormData({ ...formData, tahun_terbit: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stok</label>
                                    <input
                                        type="number"
                                        placeholder="Jumlah stok"
                                        value={formData.stok}
                                        onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit">
                                    {editing ? 'Update' : 'Simpan'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detail */}
            {showDetailModal && selectedBook && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <BookOpen size={20} style={{ color: '#4a6cf7' }} />
                                <h3>Detail Buku</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="detail-content">
                            <div className="detail-cover">
                                <div className="detail-cover-icon">
                                    <BookOpen size={48} />
                                </div>
                            </div>

                            <div className="detail-info">
                                <h2 className="detail-title">{selectedBook.judul_buku}</h2>
                                
                                <div className="detail-items">
                                    <div className="detail-item">
                                        <div className="detail-item-icon">
                                            <User size={16} />
                                        </div>
                                        <div className="detail-item-content">
                                            <span className="detail-item-label">Penulis</span>
                                            <span className="detail-item-value">{selectedBook.penulis || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="detail-item-icon">
                                            <Building size={16} />
                                        </div>
                                        <div className="detail-item-content">
                                            <span className="detail-item-label">Penerbit</span>
                                            <span className="detail-item-value">{selectedBook.penerbit || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="detail-item-icon">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="detail-item-content">
                                            <span className="detail-item-label">Tahun Terbit</span>
                                            <span className="detail-item-value">{selectedBook.tahun_terbit || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="detail-item-icon">
                                            <span>📚</span>
                                        </div>
                                        <div className="detail-item-content">
                                            <span className="detail-item-label">Stok</span>
                                            <span className="detail-item-value">
                                                <span className={`stok-badge ${selectedBook.stok > 0 ? 'available' : 'empty'}`}>
                                                    {selectedBook.stok || 0} buku
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions detail-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowDetailModal(false)}
                            >
                                Tutup
                            </button>
                            <button 
                                className="btn-submit" 
                                onClick={() => {
                                    setShowDetailModal(false);
                                    openModal(selectedBook);
                                }}
                            >
                                <Edit2 size={16} />
                                Edit Buku
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="modal-overlay" onClick={() => setShowImport(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <FileSpreadsheet size={22} style={{ color: '#4a6cf7' }} />
                                <h3>Import Data Buku</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowImport(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="import-info">
                            <Info size={16} style={{ color: '#4a6cf7' }} />
                            <span>{importData.length} data siap diimport. Pastikan data sudah benar.</span>
                        </div>

                        <div className="import-preview">
                            <div className="import-preview-header">
                                <span>Preview Data</span>
                                <span className="import-count">{importData.length} baris</span>
                            </div>
                            <div className="table-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Judul Buku</th>
                                            <th>Penulis</th>
                                            <th>Penerbit</th>
                                            <th>Tahun</th>
                                            <th>Stok</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importData.slice(0, 5).map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.judul_buku}</td>
                                                <td>{item.penulis || '-'}</td>
                                                <td>{item.penerbit || '-'}</td>
                                                <td>{item.tahun_terbit || '-'}</td>
                                                <td>{item.stok || 0}</td>
                                            </tr>
                                        ))}
                                        {importData.length > 5 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', color: '#8a9ab8' }}>
                                                    ... dan {importData.length - 5} data lainnya
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowImport(false)}>
                                Batal
                            </button>
                            <button type="button" className="btn-submit" onClick={handleImportSave} disabled={importLoading}>
                                {importLoading ? '⏳ Memproses...' : `Import ${importData.length} Data`}
                            </button>
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
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .count-badge {
                    padding: 2px 12px;
                    background: #f0f2f7;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #4a5a7a;
                    font-weight: 500;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .btn-refresh {
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
                    transition: all 0.15s;
                }

                .btn-refresh:hover {
                    background: #f8fafc;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-primary:hover {
                    background: #3a5ce7;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.25);
                }

                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-danger:hover {
                    background: #c53030;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.25);
                }

                .btn-danger-submit {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 24px;
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-danger-submit:hover {
                    background: #c53030;
                    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.25);
                }

                .btn-outline {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: white;
                    color: #4a5a7a;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-outline:hover {
                    background: #f8fafc;
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                }

                .btn-filter-reset {
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #475569;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .btn-filter-reset:hover {
                    background: #e2e8f0;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
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
                    min-width: 200px;
                    transition: border-color 0.2s;
                }

                .search-wrapper:focus-within {
                    border-color: #4a6cf7;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.06);
                }

                .search-icon {
                    color: #aab4c8;
                    flex-shrink: 0;
                }

                .search-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    padding: 9px 0;
                    font-size: 14px;
                    background: transparent;
                    color: #1a2332;
                }

                .search-input::placeholder {
                    color: #bcc4d4;
                }

                .clear-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #aab4c8;
                    padding: 4px;
                    border-radius: 4px;
                }

                .clear-btn:hover {
                    color: #1a2332;
                    background: #f0f2f7;
                }

                .filter-group {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    color: #1a2332;
                    cursor: pointer;
                    min-width: 110px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                }

                .search-info {
                    font-size: 13px;
                    color: #8a9ab8;
                    white-space: nowrap;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
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

                .books-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .book-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                    transition: all 0.2s ease;
                }

                .book-card:hover {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
                    border-color: #d0d5e0;
                }

                .book-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px 10px;
                    border-bottom: 1px solid #f4f6fa;
                }

                .book-icon {
                    width: 40px;
                    height: 40px;
                    background: #f0f4ff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                }

                .book-stok {
                    display: flex;
                    align-items: center;
                }

                .stok-badge {
                    display: inline-block;
                    padding: 3px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .stok-badge.available {
                    background: #eef6ef;
                    color: #276749;
                }

                .stok-badge.empty {
                    background: #fcf0f0;
                    color: #9b2c2c;
                }

                .book-card-body {
                    padding: 14px 16px 12px;
                }

                .book-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2332;
                    margin: 0 0 4px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .book-author {
                    font-size: 13px;
                    color: #5a6a7e;
                    margin: 0 0 2px;
                }

                .book-publisher {
                    font-size: 13px;
                    color: #8a9ab8;
                    margin: 0 0 6px;
                }

                .tahun-tag {
                    display: inline-block;
                    padding: 2px 10px;
                    background: #f0f2f7;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #6a7a8e;
                    font-weight: 400;
                }

                .book-card-actions {
                    display: flex;
                    gap: 4px;
                    padding: 8px 16px 14px;
                    border-top: 1px solid #f4f6fa;
                }

                .action-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 6px 10px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 6px;
                    background: white;
                    font-size: 12px;
                    font-weight: 500;
                    color: #5a6a7e;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .action-btn:hover {
                    background: #f8fafc;
                }

                .action-btn.detail:hover {
                    border-color: #4a6cf7;
                    color: #4a6cf7;
                    background: #f0f4ff;
                }

                .action-btn.edit:hover {
                    border-color: #f59e0b;
                    color: #f59e0b;
                    background: #fffbeb;
                }

                .action-btn.delete:hover {
                    border-color: #e53e3e;
                    color: #e53e3e;
                    background: #fcf0f0;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #eef2f7;
                }

                .empty-icon {
                    color: #d0d5e0;
                    margin-bottom: 8px;
                }

                .empty-state h3 {
                    font-size: 17px;
                    color: #1a2332;
                    margin: 0 0 4px;
                }

                .empty-state p {
                    color: #8a9ab8;
                    font-size: 14px;
                    margin: 0 0 14px;
                }

                .pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 4px;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .pagination-info {
                    font-size: 13px;
                    color: #8a9ab8;
                }

                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }

                .page-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 34px;
                    height: 34px;
                    padding: 0 8px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: #4a5a7a;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .page-btn:hover:not(:disabled):not(.active) {
                    background: #f0f2f7;
                }

                .page-btn.active {
                    background: #4a6cf7;
                    color: white;
                }

                .page-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.25);
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
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.25s ease;
                }

                .modal-detail {
                    max-width: 560px;
                }

                .modal-danger {
                    border-top: 4px solid #e53e3e;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .modal-header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
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

                .detail-content {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 20px;
                }

                .detail-cover {
                    flex-shrink: 0;
                }

                .detail-cover-icon {
                    width: 120px;
                    height: 160px;
                    background: #f0f4ff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                    border: 1px solid #e8ecf2;
                }

                .detail-info {
                    flex: 1;
                }

                .detail-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a2332;
                    margin: 0 0 16px;
                }

                .detail-items {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #eef2f7;
                }

                .detail-item-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4a6cf7;
                    flex-shrink: 0;
                }

                .detail-item-content {
                    display: flex;
                    flex-direction: column;
                }

                .detail-item-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #8a9ab8;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .detail-item-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1a2332;
                }

                .detail-actions {
                    border-top: 1px solid #eef2f7;
                    padding-top: 16px;
                }

                /* Truncate Modal */
                .truncate-content {
                    text-align: center;
                    padding: 10px 0 20px;
                }

                .truncate-icon {
                    color: #e53e3e;
                    margin-bottom: 16px;
                }

                .truncate-text {
                    font-size: 16px;
                    color: #1a2332;
                    margin-bottom: 16px;
                }

                .truncate-details {
                    text-align: left;
                    padding: 12px 16px;
                    background: #fcf0f0;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    color: #4a5568;
                }

                .truncate-details p {
                    margin: 4px 0;
                }

                .truncate-confirm {
                    display: flex;
                    justify-content: center;
                }

                .confirm-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #4a5568;
                    cursor: pointer;
                }

                .confirm-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .truncate-actions {
                    border-top: 1px solid #eef2f7;
                    padding-top: 16px;
                    display: flex;
                    gap: 10px;
                }

                /* Form */
                .form-group {
                    margin-bottom: 14px;
                }

                .form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 4px;
                }

                .form-group .required {
                    color: #e53e3e;
                }

                .form-group input {
                    width: 100%;
                    padding: 9px 14px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #fafbfc;
                    color: #1a2332;
                    transition: all 0.15s;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.06);
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 18px;
                }

                .btn-submit {
                    flex: 1;
                    padding: 10px 20px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .btn-submit:hover {
                    background: #3a5ce7;
                }

                .btn-cancel {
                    padding: 10px 24px;
                    background: #f8fafc;
                    color: #4a5568;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-cancel:hover {
                    background: #f0f2f7;
                }

                /* Import Styles */
                .import-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #f0f4ff;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    color: #1a2744;
                }

                .import-preview {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .import-preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 500;
                    font-size: 13px;
                    color: #1a2744;
                }

                .import-count {
                    font-size: 12px;
                    color: #8a9ab8;
                    font-weight: 400;
                }

                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .preview-table th {
                    padding: 8px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #6a7a8e;
                    border-bottom: 1px solid #e2e8f0;
                    background: #fafbfc;
                }

                .preview-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #f0f4f9;
                    color: #2d3748;
                }

                .table-wrapper {
                    overflow-x: auto;
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

                /* Responsive */
                @media (max-width: 1024px) {
                    .search-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-group {
                        flex-wrap: wrap;
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

                    .header-actions {
                        flex-wrap: wrap;
                    }

                    .header-actions .btn {
                        flex: 1;
                        justify-content: center;
                    }

                    .search-wrapper {
                        min-width: auto;
                    }

                    .filter-group {
                        flex-direction: column;
                    }

                    .filter-select {
                        width: 100%;
                    }

                    .btn-filter-reset {
                        width: 100%;
                        text-align: center;
                    }

                    .search-info {
                        text-align: right;
                    }

                    .books-grid {
                        grid-template-columns: 1fr;
                    }

                    .detail-content {
                        flex-direction: column;
                        align-items: center;
                    }

                    .detail-cover-icon {
                        width: 100px;
                        height: 140px;
                    }

                    .detail-title {
                        text-align: center;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .modal {
                        padding: 20px;
                        margin: 16px;
                    }

                    .pagination {
                        flex-direction: column;
                        align-items: center;
                    }

                    .modal-actions,
                    .truncate-actions {
                        flex-direction: column;
                    }

                    .truncate-details {
                        font-size: 13px;
                    }
                }

                @media (max-width: 480px) {
                    .page-container {
                        padding: 12px;
                    }

                    .book-card-actions {
                        flex-wrap: wrap;
                    }

                    .action-btn {
                        flex: 1;
                        min-width: 60px;
                        font-size: 11px;
                    }

                    .page-btn {
                        min-width: 30px;
                        height: 30px;
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BukuPage;