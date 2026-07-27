import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  GitCompare,
  Save,
  RefreshCw,
  CheckCircle,
  Eye,
  ArrowRight,
  AlertCircle,
  Info,
  ArrowUpDown,
} from "lucide-react";

const API_URL = "/api";

const PairwisePage = () => {
  const navigate = useNavigate();
  const [kriteria, setKriteria] = useState([]);
  const [pairwiseValues, setPairwiseValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasPairwise, setHasPairwise] = useState(false);
  const [errors, setErrors] = useState({});
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    fetchKriteria();
    checkPairwise();
  }, []);

  const fetchKriteria = async () => {
    try {
      const res = await axios.get(`${API_URL}/kriteria`);
      const data = res.data.data || [];
      setKriteria(data);
      initPairwiseValues(data.length);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPairwise = async () => {
    try {
      const res = await axios.get(`${API_URL}/pairwise`);
      setHasPairwise(res.data.data?.length > 0);
    } catch (error) {
      console.error("Error checking pairwise:", error);
    }
  };

  const initPairwiseValues = (n) => {
    const values = [];
    for (let i = 0; i < n; i++) {
      values[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          values[i][j] = 1;
        } else if (i < j) {
          values[i][j] = null;
        } else {
          values[i][j] = null;
        }
      }
    }
    setPairwiseValues(values);
  };

  const handleVerticalInput = (columnIndex, rowIndex, value) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < 1 || numValue > 9) {
      if (value !== "" && value !== null) {
        setErrors({
          ...errors,
          [`${rowIndex}-${columnIndex}`]: "Nilai harus 1-9",
        });
        return;
      }
    } else {
      const newErrors = { ...errors };
      delete newErrors[`${rowIndex}-${columnIndex}`];
      setErrors(newErrors);
    }

    const newValues = [...pairwiseValues];

    if (rowIndex < columnIndex) {
      newValues[rowIndex][columnIndex] = numValue || null;
      if (numValue && numValue > 0) {
        newValues[columnIndex][rowIndex] = 1 / numValue;
      } else {
        newValues[columnIndex][rowIndex] = null;
      }
      setPairwiseValues(newValues);
      setSaved(false);
    }
  };

  const getColumnTotal = (columnIndex) => {
    let total = 0;
    const n = kriteria.length;
    for (let i = 0; i < n; i++) {
      const val = pairwiseValues[i]?.[columnIndex];
      if (val && !isNaN(val)) {
        total += val;
      }
    }
    return total;
  };

  const validatePairwise = () => {
    const newErrors = {};
    const n = kriteria.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = pairwiseValues[i]?.[j];
        if (!val || val < 1 || val > 9) {
          newErrors[`${i}-${j}`] = "Nilai harus antara 1-9";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validatePairwise()) {
      alert("⚠️ Ada nilai yang tidak valid. Periksa kembali!");
      return;
    }

    setSaving(true);
    try {
      const n = kriteria.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const nilai = pairwiseValues[i]?.[j];
          if (nilai && nilai > 0) {
            await axios.post(`${API_URL}/pairwise`, {
              kriteria_1: kriteria[i].id_kriteria, 
              kriteria_2: kriteria[j].id_kriteria, 
              nilai: nilai,
            });
          }
        }
      }
      setSaved(true);
      setHasPairwise(true);

      alert("✅ Data pairwise berhasil disimpan!");
      navigate("/normalisasi");
    } catch (error) {
      alert(
        "❌ Gagal menyimpan: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset semua nilai pairwise?")) {
      initPairwiseValues(kriteria.length);
      setSaved(false);
      setErrors({});
    }
  };

  const getKriteriaName = (index) => {
    return kriteria[index]?.nama_kriteria || `K${index + 1}`;
  };

  const getScaleLabel = (value) => {
    const scales = {
      1: "Sama penting",
      2: "Sedikit lebih",
      3: "Lebih penting",
      4: "Lebih penting +",
      5: "Sangat penting",
      6: "Sangat penting +",
      7: "Sangat amat penting",
      8: "Sangat amat penting +",
      9: "Mutlak penting",
    };
    return scales[value] || "";
  };

  const getScaleColor = (value) => {
    if (!value) return "#d1d5db";
    if (value <= 2) return "#6b7280";
    if (value <= 4) return "#3b82f6";
    if (value <= 6) return "#8b5cf6";
    return "#7c3aed";
  };

  const goToNormalisasi = () => {
    navigate("/normalisasi");
  };

  const isAllFilled = () => {
    const n = kriteria.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!pairwiseValues[i]?.[j]) {
          return false;
        }
      }
    }
    return true;
  };

  if (loading) {
    return (
      <div className="pairwise-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (kriteria.length < 2) {
    return (
      <div className="pairwise-page">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon-wrapper">
              <GitCompare size={22} />
            </div>
            <div>
              <h1 className="page-title">Pairwise Comparison</h1>
              <p className="page-subtitle">
                Bandingkan kriteria secara berpasangan
              </p>
            </div>
          </div>
        </div>
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <GitCompare size={40} />
            </div>
            <h3>Minimal 2 kriteria</h3>
            <p>
              Tambahkan minimal 2 kriteria terlebih dahulu di halaman Kriteria
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/kriteria")}
            >
              Ke Halaman Kriteria
            </button>
          </div>
        </div>
      </div>
    );
  }

  const n = kriteria.length;

  return (
    <div className="pairwise-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <GitCompare size={22} />
          </div>
          <div>
            <h1 className="page-title">Pairwise Comparison</h1>
            <p className="page-subtitle">
              Bandingkan kriteria secara berpasangan
              <span className="total-badge">{kriteria.length} kriteria</span>
            </p>
          </div>
        </div>
        <div className="header-actions">
          {hasPairwise && (
            <button className="btn-outline" onClick={goToNormalisasi}>
              <Eye size={16} /> Lihat Normalisasi
            </button>
          )}
          <button className="btn-outline btn-sm" onClick={handleReset}>
            <RefreshCw size={16} /> Reset
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner-white" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} /> Simpan & Hitung
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="message success">
          <CheckCircle size={20} />
          <span>Data pairwise berhasil disimpan!</span>
          <button className="btn-nav pairwise" onClick={goToNormalisasi}>
            Lihat Normalisasi <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="content-card">
        {/* Info Panel */}
        <div className="info-panel">
          <div className="info-content">
            <Info size={18} />
            <div>
              <strong>Cara Input:</strong> Isi perbandingan{" "}
              <strong>VERTIKAL (ke bawah)</strong> pada setiap kolom
            </div>
          </div>
          <div className="info-scales">
            <span className="scale-dot" style={{ background: "#6b7280" }} />
            <span>1-2: Sama</span>
            <span className="scale-dot" style={{ background: "#3b82f6" }} />
            <span>3-4: Cukup</span>
            <span className="scale-dot" style={{ background: "#8b5cf6" }} />
            <span>5-6: Penting</span>
            <span className="scale-dot" style={{ background: "#7c3aed" }} />
            <span>7-9: Sangat</span>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="pairwise-table">
            <thead>
              <tr>
                <th className="header-corner">
                  <span>Kriteria</span>
                  <ArrowUpDown size={12} />
                </th>
                {kriteria.map((k, idx) => (
                  <th
                    key={idx}
                    className={`header-column ${hoveredColumn === idx ? "hover" : ""}`}
                    onMouseEnter={() => setHoveredColumn(idx)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    <div className="header-column-content">
                      <span>{k.nama_kriteria}</span>
                      <span className="header-direction">⬇ input</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }).map((_, i) => (
                <tr
                  key={i}
                  className={hoveredRow === i ? "hover" : ""}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="row-label">
                    <span>{getKriteriaName(i)}</span>
                    <span className="row-direction">
                      {i === 0 ? "↗ hasil" : `baris ${i + 1}`}
                    </span>
                  </td>
                  {Array.from({ length: n }).map((_, j) => {
                    const value = pairwiseValues[i]?.[j];
                    const isDiag = i === j;
                    const isLower = i > j;
                    const hasError = errors[`${i}-${j}`];

                    return (
                      <td
                        key={j}
                        className={`cell ${isDiag ? "diagonal" : ""} ${isLower ? "lower" : ""} ${hoveredColumn === j ? "column-hover" : ""}`}
                      >
                        {isDiag ? (
                          <span className="diagonal-value">1</span>
                        ) : isLower ? (
                          <span className="lower-value">
                            {value ? `1/${value.toFixed(1)}` : "—"}
                          </span>
                        ) : (
                          <div className="input-wrapper">
                            <select
                              value={value || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleVerticalInput(j, i, val);
                              }}
                              className={`input-select ${hasError ? "error" : ""} ${hoveredColumn === j ? "hover" : ""}`}
                            >
                              <option value="">Pilih</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                                <option key={v} value={v}>
                                  {v} — {getScaleLabel(v)}
                                </option>
                              ))}
                            </select>
                            {value && (
                              <span
                                className="scale-label"
                                style={{ color: getScaleColor(value) }}
                              >
                                {getScaleLabel(value)}
                              </span>
                            )}
                            {hasError && (
                              <span className="error-label">
                                <AlertCircle size={12} /> {hasError}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="footer-label">Total</td>
                {Array.from({ length: n }).map((_, j) => {
                  const total = getColumnTotal(j);
                  return (
                    <td
                      key={j}
                      className={`footer-total ${hoveredColumn === j ? "hover" : ""}`}
                    >
                      {total.toFixed(4)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Navigation */}
        <div className="nav-footer">
          <div className="nav-info">
            <div className="nav-status">
              {isAllFilled() ? (
                <CheckCircle size={18} className="status-success" />
              ) : (
                <AlertCircle size={18} className="status-warning" />
              )}
              <span>
                {isAllFilled()
                  ? "✅ Semua perbandingan telah diisi"
                  : `⚠️ ${
                      (n * (n - 1)) / 2 -
                      Object.values(pairwiseValues)
                        .flat()
                        .filter((v) => v !== null && v !== 1).length
                    } perbandingan tersisa`}
              </span>
            </div>
          </div>
          <div className="nav-actions">
            <button
              className="btn-nav normalisasi"
              onClick={goToNormalisasi}
              disabled={!hasPairwise && !saved}
            >
              📊 Ke Normalisasi
            </button>
          </div>
        </div>
      </div>

      <style>{`
                .pairwise-page {
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

                .btn-sm {
                    padding: 7px 14px;
                    font-size: 13px;
                }

                .spinner-white {
                    width: 16px;
                    height: 16px;
                    border: 2px solid white;
                    border-top: 2px solid transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
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
                    flex-wrap: wrap;
                }

                .message.success {
                    background: #ecfdf5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }

                .btn-nav {
                    padding: 6px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-left: auto;
                }

                .btn-nav.pairwise {
                    background: #eef3ff;
                    color: #4a6cf7;
                }

                .btn-nav.pairwise:hover {
                    background: #4a6cf7;
                    color: white;
                }

                /* ===== CONTENT CARD ===== */
                .content-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #eef2f7;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                }

                /* ===== INFO PANEL ===== */
                .info-panel {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 20px;
                    background: #f8fafc;
                    border-bottom: 1px solid #eef2f7;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .info-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #4a5568;
                    font-size: 13px;
                }

                .info-content strong {
                    color: #1a2332;
                }

                .info-scales {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #6a7a8e;
                }

                .scale-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    display: inline-block;
                }

                /* ===== TABLE ===== */
                .table-container {
                    overflow-x: auto;
                    padding: 0;
                }

                .pairwise-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .pairwise-table th,
                .pairwise-table td {
                    padding: 10px 12px;
                    border: 1px solid #eef2f7;
                    text-align: center;
                    transition: all 0.15s ease;
                }

                /* ===== HEADER ===== */
                .header-corner {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #4a5568;
                    min-width: 140px;
                    position: sticky;
                    left: 0;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    justify-content: center;
                }

                .header-column {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #4a5568;
                    min-width: 160px;
                    transition: all 0.3s ease;
                }

                .header-column.hover {
                    background: #eef3ff;
                    border-color: #4a6cf7;
                }

                .header-column-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .header-direction {
                    font-size: 10px;
                    color: #9aa8b8;
                    font-weight: 400;
                }

                /* ===== ROWS ===== */
                .row-label {
                    background: #f8fafc;
                    font-weight: 500;
                    color: #2d3748;
                    min-width: 140px;
                    position: sticky;
                    left: 0;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .row-direction {
                    font-size: 10px;
                    color: #9aa8b8;
                    font-weight: 400;
                }

                .cell {
                    transition: all 0.15s ease;
                }

                .cell.diagonal {
                    background: #f8fafc;
                }

                .cell.lower {
                    background: #f8faff;
                }

                .cell.column-hover {
                    background: rgba(74, 108, 247, 0.04);
                }

                tr.hover .row-label {
                    background: #eef3ff;
                }

                /* ===== VALUES ===== */
                .diagonal-value {
                    display: inline-block;
                    padding: 4px 12px;
                    background: #eef2f7;
                    border-radius: 6px;
                    font-weight: 700;
                    color: #6a7a8e;
                }

                .lower-value {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(74, 108, 247, 0.06);
                    border-radius: 6px;
                    color: #4a6cf7;
                    font-weight: 500;
                    font-size: 13px;
                }

                /* ===== INPUT ===== */
                .input-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .input-select {
                    width: 100%;
                    padding: 8px 28px 8px 10px;
                    border: 1.5px solid #e8ecf2;
                    border-radius: 8px;
                    font-size: 13px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #1a2332;
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                }

                .input-select:hover {
                    border-color: #b0bcc8;
                }

                .input-select.hover {
                    border-color: #4a6cf7;
                    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.08);
                }

                .input-select:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.12);
                }

                .input-select.error {
                    border-color: #f87171;
                    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
                }

                .scale-label {
                    font-size: 10px;
                    font-weight: 500;
                    color: #6b7280;
                }

                .error-label {
                    font-size: 10px;
                    color: #ef4444;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* ===== FOOTER ===== */
                .footer-label {
                    background: #f8fafc;
                    font-weight: 700;
                    color: #4a5568;
                    border-top: 2px solid #4a6cf7;
                    position: sticky;
                    left: 0;
                    z-index: 2;
                }

                .footer-total {
                    background: #f8fafc;
                    font-weight: 700;
                    color: #4a6cf7;
                    font-size: 15px;
                    border-top: 2px solid #4a6cf7;
                    transition: all 0.3s ease;
                }

                .footer-total.hover {
                    background: #eef3ff;
                }

                /* ===== NAV FOOTER ===== */
                .nav-footer {
                    padding: 14px 20px;
                    border-top: 1px solid #eef2f7;
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
                }

                .nav-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #4a5568;
                }

                .status-success {
                    color: #059669;
                }

                .status-warning {
                    color: #d97706;
                }

                .nav-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn-nav.normalisasi {
                    padding: 8px 20px;
                    background: #ecfdf5;
                    color: #059669;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-nav.normalisasi:hover:not(:disabled) {
                    background: #059669;
                    color: white;
                }

                .btn-nav.normalisasi:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
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
                    .pairwise-page {
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
                    .header-actions .btn-outline {
                        flex: 1;
                        justify-content: center;
                        font-size: 13px;
                        padding: 8px 14px;
                    }

                    .info-panel {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .info-scales {
                        flex-wrap: wrap;
                    }

                    .pairwise-table {
                        font-size: 12px;
                    }

                    .pairwise-table th,
                    .pairwise-table td {
                        padding: 6px 8px;
                    }

                    .header-corner,
                    .row-label {
                        min-width: 80px;
                        font-size: 11px;
                    }

                    .header-column {
                        min-width: 100px;
                    }

                    .input-select {
                        font-size: 11px;
                        padding: 4px 20px 4px 6px;
                        min-width: 80px;
                    }

                    .nav-footer {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .nav-actions {
                        justify-content: center;
                    }

                    .page-title {
                        font-size: 19px;
                    }

                    .total-badge {
                        font-size: 12px;
                    }
                }

                @media (max-width: 480px) {
                    .pairwise-table {
                        font-size: 10px;
                    }

                    .pairwise-table th,
                    .pairwise-table td {
                        padding: 4px 4px;
                    }

                    .header-column {
                        min-width: 70px;
                    }

                    .input-select {
                        font-size: 10px;
                        padding: 2px 16px 2px 4px;
                        min-width: 60px;
                    }

                    .scale-label,
                    .error-label {
                        font-size: 8px;
                    }

                    .diagonal-value,
                    .lower-value {
                        font-size: 10px;
                        padding: 2px 6px;
                    }
                }
            `}</style>
    </div>
  );
};

export default PairwisePage;
