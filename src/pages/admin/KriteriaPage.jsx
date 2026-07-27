import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, ListChecks, X, Search, Filter } from 'lucide-react';

const API_URL = '/api';

const KriteriaPage = () => {
  const [kriteria, setKriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ nama_kriteria: '', tipe: 'benefit' });

  useEffect(() => {
    fetchKriteria();
  }, []);

  const fetchKriteria = async () => {
    try {
      const res = await axios.get(`${API_URL}/kriteria`);
      setKriteria(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kriteria.trim()) {
      alert('⚠️ Nama kriteria wajib diisi!');
      return;
    }

    try {
      if (editing) {
        await axios.put(`${API_URL}/kriteria/${editing}`, formData);
      } else {
        await axios.post(`${API_URL}/kriteria`, formData);
      }
      setShowModal(false);
      setEditing(null);
      setFormData({ nama_kriteria: '', tipe: 'benefit' });
      fetchKriteria();
    } catch (error) {
      alert('❌ Gagal: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kriteria ini?')) return;
    try {
      await axios.delete(`${API_URL}/kriteria/${id}`);
      fetchKriteria();
    } catch (error) {
      alert('❌ Gagal hapus: ' + error.message);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditing(item.id_kriteria);
      setFormData({ nama_kriteria: item.nama_kriteria, tipe: item.tipe });
    } else {
      setEditing(null);
      setFormData({ nama_kriteria: '', tipe: 'benefit' });
    }
    setShowModal(true);
  };

  const formatNumber = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0.0000';
    return parseFloat(val).toFixed(4);
  };

  const filteredKriteria = kriteria.filter(item =>
    item.nama_kriteria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="kriteria-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <ListChecks size={22} />
          </div>
          <div>
            <h1 className="page-title">Manajemen Kriteria</h1>
            <p className="page-subtitle">Kelola kriteria penilaian untuk proses AHP</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Tambah Kriteria</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari kriteria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="toolbar-info">
          <span>{filteredKriteria.length} kriteria</span>
        </div>
      </div>

      {/* Content */}
      <div className="content-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : filteredKriteria.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <ListChecks size={40} />
            </div>
            <h3>Belum ada kriteria</h3>
            <p>Klik tombol "Tambah Kriteria" untuk memulai</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th className="col-name">Nama Kriteria</th>
                  <th className="col-type">Tipe</th>
                  <th className="col-weight">Bobot</th>
                  <th className="col-actions">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredKriteria.map((item, index) => (
                  <tr key={item.id_kriteria}>
                    <td className="col-no">{index + 1}</td>
                    <td className="col-name">
                      <span className="kriteria-name">{item.nama_kriteria}</span>
                    </td>
                    <td className="col-type">
                      <span className={`type-badge ${item.tipe}`}>
                        {item.tipe === 'benefit' ? 'Benefit' : 'Cost'}
                      </span>
                    </td>
                    <td className="col-weight">
                      {item.bobot > 0 ? (
                        <span className="weight-value">{formatNumber(item.bobot)}</span>
                      ) : (
                        <span className="weight-empty">-</span>
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
                          onClick={() => handleDelete(item.id_kriteria)}
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Kriteria' : 'Tambah Kriteria'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nama Kriteria</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Rating, Popularitas"
                  value={formData.nama_kriteria}
                  onChange={(e) => setFormData({ ...formData, nama_kriteria: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Kriteria</label>
                <select
                  className="form-select"
                  value={formData.tipe}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                >
                  <option value="benefit">Benefit (Semakin tinggi semakin baik)</option>
                  <option value="cost">Cost (Semakin rendah semakin baik)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editing ? 'Update Kriteria' : 'Simpan Kriteria'}
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
        .kriteria-page {
          padding: 24px 32px;
          max-width: 1200px;
          margin: 0 auto;
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

        /* ===== TOOLBAR ===== */
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 360px;
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
          padding: 9px 12px 9px 40px;
          border: 1.5px solid #e8ecf2;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #fafbfc;
          color: #1a2332;
        }

        .search-input:focus {
          outline: none;
          border-color: #4a6cf7;
          background: white;
          box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.08);
        }

        .search-input::placeholder {
          color: #b0bcc8;
        }

        .toolbar-info {
          font-size: 14px;
          color: #7a8aa0;
          white-space: nowrap;
        }

        /* ===== CONTENT CARD ===== */
        .content-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #eef2f7;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
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
          padding: 14px 16px;
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
          width: 60px;
          color: #9aa8b8;
          font-weight: 500;
        }

        .col-name {
          min-width: 200px;
        }

        .kriteria-name {
          font-weight: 500;
          color: #1a2332;
        }

        .col-type {
          width: 120px;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .type-badge.benefit {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .type-badge.cost {
          background: #fce4ec;
          color: #c62828;
        }

        .col-weight {
          width: 120px;
        }

        .weight-value {
          font-weight: 600;
          color: #1a2332;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }

        .weight-empty {
          color: #b0bcc8;
        }

        .col-actions {
          width: 100px;
          text-align: center;
        }

        .action-group {
          display: flex;
          gap: 6px;
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

        /* ===== LOADING ===== */
        .loading-state {
          display: flex;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #eef2f7;
          border-top: 3px solid #4a6cf7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
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
          margin: 0;
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

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
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

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .kriteria-page {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-left {
            gap: 12px;
          }

          .page-title {
            font-size: 19px;
          }

          .btn-primary {
            justify-content: center;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-wrapper {
            max-width: 100%;
          }

          .data-table th,
          .data-table td {
            padding: 10px 12px;
            font-size: 13px;
          }

          .col-no {
            width: 40px;
          }

          .col-type {
            width: 80px;
          }

          .col-weight {
            width: 80px;
          }

          .col-actions {
            width: 80px;
          }

          .modal-container {
            padding: 24px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .data-table {
            font-size: 12px;
          }

          .data-table th,
          .data-table td {
            padding: 8px 10px;
          }

          .type-badge {
            font-size: 10px;
            padding: 2px 8px;
          }

          .action-btn {
            width: 28px;
            height: 28px;
          }

          .col-weight {
            width: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default KriteriaPage;