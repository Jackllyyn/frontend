import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Trophy, TrendingUp, CheckCircle, XCircle, 
    RefreshCw, Award, BookOpen, Users,
    ChevronDown, ChevronRight, Calculator,
    Layers, Globe, Eye, EyeOff, Sigma
} from 'lucide-react';

const API_URL = '/api';

const HasilPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [ranking, setRanking] = useState([]);
    const [kriteria, setKriteria] = useState([]);
    const [subKriteria, setSubKriteria] = useState([]);
    const [nilaiAlternatif, setNilaiAlternatif] = useState([]);
    const [bobotGlobalMap, setBobotGlobalMap] = useState({});
    const [bobotKriteriaMap, setBobotKriteriaMap] = useState({});
    const [error, setError] = useState('');
    const [detailBuku, setDetailBuku] = useState(null);
    const [showPerhitungan, setShowPerhitungan] = useState({});

    // Urutan kriteria yang diinginkan
    const KRITERIA_ORDER = ['Genre', 'Tahun Terbit', 'Popularitas', 'Rating'];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const [kRes, sRes, nRes, altRes] = await Promise.all([
                axios.get(`${API_URL}/kriteria`),
                axios.get(`${API_URL}/sub-kriteria`),
                axios.get(`${API_URL}/nilai-alternatif`),
                axios.get(`${API_URL}/alternatif`)
            ]);

            console.log('📊 KRITERIA dari DB:', kRes.data.data);
            console.log('📊 SUB-KRITERIA dari DB:', sRes.data.data);

            const kriteriaData = kRes.data.data || [];
            const subData = sRes.data.data || [];
            const nilaiData = nRes.data.data || [];
            const bukuData = altRes.data.data || [];

            // Urutkan kriteria berdasarkan urutan yang diinginkan
            const sortedKriteria = KRITERIA_ORDER.map(nama => {
                return kriteriaData.find(k => k.nama_kriteria === nama);
            }).filter(Boolean);

            // Tambahkan kriteria yang tidak ada di urutan
            const remainingKriteria = kriteriaData.filter(k => !KRITERIA_ORDER.includes(k.nama_kriteria));
            const finalKriteria = [...sortedKriteria, ...remainingKriteria];

            console.log('📊 KRITERIA Terurut:', finalKriteria.map(k => k.nama_kriteria));

            setKriteria(finalKriteria);
            setSubKriteria(subData);
            setNilaiAlternatif(nilaiData);

            // Buat map bobot kriteria dengan urutan yang benar
            const kriteriaMap = {};
            finalKriteria.forEach((k, index) => {
                const bobot = parseFloat(k.bobot) || 0;
                kriteriaMap[k.id_kriteria] = {
                    bobot: bobot,
                    urutan: index,
                    nama: k.nama_kriteria
                };
                console.log(`  ${index + 1}. ${k.nama_kriteria} (ID: ${k.id_kriteria}): ${bobot}`);
            });
            setBobotKriteriaMap(kriteriaMap);

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
            setBobotGlobalMap(globalMap);

            // Hitung ranking buku
            await hitungRanking(subData, nilaiData, bukuData, kriteriaMap, globalMap);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const hitungRanking = async (subs = null, nilai = null, bukuData = null, kriteriaMap = null, globalMapData = null) => {
        const subData = subs || subKriteria;
        const nilaiData = nilai || nilaiAlternatif;
        const kritMap = kriteriaMap || bobotKriteriaMap;
        const globalData = globalMapData || bobotGlobalMap;

        let allBuku = bukuData;
        if (!allBuku) {
            const res = await axios.get(`${API_URL}/alternatif`);
            allBuku = res.data.data || [];
        }

        const bukuIds = [...new Set(nilaiData.map(n => n.id_alternatif))];
        
        if (bukuIds.length === 0 || allBuku.length === 0) {
            setRanking([]);
            return;
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
            const detailNilai = [];
            const rumusPerhitungan = [];

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
                
                const detail = {
                    id_sub: sub.id_sub,
                    nama_sub: sub.nama_sub,
                    id_kriteria: sub.id_kriteria,
                    nama_kriteria: kritMap[sub.id_kriteria]?.nama || 'Tidak diketahui',
                    bobot_global: bobotGlobal,
                    bobot_sub: globalMap[sub.id_sub]?.bobot_sub || 0,
                    bobot_kriteria: globalMap[sub.id_sub]?.bobot_kriteria || 0,
                    urutan_kriteria: kritMap[sub.id_kriteria]?.urutan || 999
                };
                
                detailNilai.push(detail);

                if (bobotGlobal > 0) {
                    rumusPerhitungan.push({
                        nama_kriteria: kritMap[sub.id_kriteria]?.nama || 'Tidak diketahui',
                        nama_sub: sub.nama_sub,
                        bobot_kriteria: globalMap[sub.id_sub]?.bobot_kriteria || 0,
                        bobot_sub: globalMap[sub.id_sub]?.bobot_sub || 0,
                        bobot_global: bobotGlobal,
                        urutan_kriteria: kritMap[sub.id_kriteria]?.urutan || 999
                    });
                }
            }

            // Urutkan berdasarkan urutan kriteria
            detailNilai.sort((a, b) => a.urutan_kriteria - b.urutan_kriteria);
            rumusPerhitungan.sort((a, b) => a.urutan_kriteria - b.urutan_kriteria);

            return {
                id_alternatif: idBuku,
                judul_buku: buku?.judul_buku || 'Tidak diketahui',
                penulis: buku?.penulis || '-',
                skor_total: parseFloat(totalSkor.toFixed(6)),
                detail_nilai: detailNilai,
                rumus: rumusPerhitungan
            };
        });

        hasilRanking.sort((a, b) => b.skor_total - a.skor_total);
        hasilRanking.forEach((item, index) => {
            item.peringkat = index + 1;
        });

        console.log('📊 HASIL RANKING dengan urutan:', hasilRanking);
        setRanking(hasilRanking);
    };

    const handleHitungAHP = async () => {
        setCalculating(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/hitung-global`);
            console.log('📊 Hasil Hitung Global:', res.data);
            await fetchAllData();
            alert('✅ Perhitungan AHP berhasil!');
        } catch (error) {
            console.error('Error calculating:', error);
            setError('❌ Gagal menghitung: ' + (error.response?.data?.message || error.message));
        } finally {
            setCalculating(false);
        }
    };

    const handleRefresh = async () => {
        await fetchAllData();
    };

    const toggleDetailBuku = (id) => {
        setDetailBuku(detailBuku === id ? null : id);
        if (detailBuku !== id) {
            setShowPerhitungan({});
        }
    };

    const togglePerhitungan = (id) => {
        setShowPerhitungan(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getKriteriaName = (idKriteria) => {
        const found = kriteria.find(k => k.id_kriteria === idKriteria);
        return found?.nama_kriteria || 'Tidak diketahui';
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.0000';
        return parseFloat(val).toFixed(4);
    };

    const getMedal = (index) => {
        return index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
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
                    .loading-text { margin-top: 16px; color: #8a9ab8; font-size: 14px; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">🏆 Hasil AHP</h1>
                    <button className="btn btn-outline" onClick={handleRefresh}>
                        <RefreshCw size={16} /> Coba Lagi
                    </button>
                </div>
                <div className="card-error">
                    <XCircle size={48} />
                    <p>{error}</p>
                </div>
                <style>{`
                    .page-wrapper { padding: 24px; max-width: 1200px; margin: 0 auto; }
                    .card-error { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 16px rgba(26,39,68,0.08); }
                    .card-error p { margin: 16px 0; color: #9b2c2c; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="hasil-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏆 Hasil AHP</h1>
                    <p className="page-subtitle">
                        Perankingan Buku Berdasarkan Metode AHP
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8a9ab8' }}>
                            {ranking.length} buku dinilai
                        </span>
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline btn-sm" onClick={handleRefresh}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleHitungAHP}
                        disabled={calculating}
                    >
                        {calculating ? (
                            <>
                                <div className="spinner-small" />
                                Menghitung...
                            </>
                        ) : (
                            <>
                                <TrendingUp size={16} /> Hitung Ulang
                            </>
                        )}
                    </button>
                </div>
            </div>

            {ranking.length === 0 ? (
                <div className="card-empty">
                    <BookOpen size={48} />
                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#4a5a7a' }}>
                        Belum ada hasil ranking
                    </p>
                    <p style={{ fontSize: '14px', color: '#8a9ab8' }}>
                        Pastikan data buku dan nilai alternatif sudah diisi
                    </p>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleHitungAHP}
                        disabled={calculating}
                        style={{ marginTop: '16px' }}
                    >
                        {calculating ? '⏳ Menghitung...' : '🚀 Hitung Sekarang'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2c3e7a' }}>
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <div className="stat-number">{ranking.length}</div>
                                <div className="stat-label">Total Buku</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#e6f7e6', color: '#276749' }}>
                                <Trophy size={20} />
                            </div>
                            <div>
                                <div className="stat-number">
                                    {ranking[0]?.judul_buku || '-'}
                                </div>
                                <div className="stat-label">Peringkat Teratas</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fff3e0', color: '#ed8936' }}>
                                <Layers size={20} />
                            </div>
                            <div>
                                <div className="stat-number">{kriteria.length}</div>
                                <div className="stat-label">Kriteria</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                                <Sigma size={20} />
                            </div>
                            <div>
                                <div className="stat-number">{subKriteria.filter(s => s.bobot_global > 0).length}</div>
                                <div className="stat-label">Sub-Kriteria Aktif</div>
                            </div>
                        </div>
                    </div>

                    {/* Daftar Bobot Kriteria dengan Urutan */}
                    <div className="card bobot-kriteria-card">
                        <div className="card-header">
                            <div className="card-title">
                                <Layers size={20} className="icon" />
                                Bobot Kriteria (Urutan: Genre → Tahun Terbit → Popularitas → Rating)
                            </div>
                            <span style={{ fontSize: '13px', color: '#8a9ab8' }}>
                                Total: {formatNumber(kriteria.reduce((sum, k) => sum + (parseFloat(k.bobot) || 0), 0))}
                            </span>
                        </div>
                        <div className="bobot-kriteria-grid">
                            {kriteria.map((k, index) => (
                                <div key={k.id_kriteria} className="bobot-kriteria-item">
                                    <span className="bobot-kriteria-nama">
                                        <span className="urutan-badge">{index + 1}</span>
                                        {k.nama_kriteria}
                                    </span>
                                    <span className="bobot-kriteria-nilai">{formatNumber(k.bobot)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <Award size={20} className="icon" />
                                Ranking Buku Rekomendasi
                            </div>
                            <span style={{ fontSize: '13px', color: '#8a9ab8' }}>
                                Skor = Σ (Bobot Kriteria × Bobot Sub-Kriteria)
                            </span>
                        </div>

                        <div className="ranking-list">
                            {ranking.map((item, index) => {
                                const isTop3 = index < 3;
                                const score = item.skor_total || 0;

                                return (
                                    <div
                                        key={item.id_alternatif}
                                        className={`ranking-item ${isTop3 ? 'top' : ''}`}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                        onClick={() => toggleDetailBuku(item.id_alternatif)}
                                    >
                                        <div className="ranking-position">
                                            <span className="medal">{getMedal(index)}</span>
                                        </div>
                                        <div className="ranking-info">
                                            <div className="ranking-title">{item.judul_buku}</div>
                                            <div className="ranking-meta">
                                                {item.penulis || 'Penulis tidak diketahui'}
                                            </div>
                                        </div>
                                        <div className="ranking-score">
                                            <div className="score-bar-wrapper">
                                                <div 
                                                    className="score-bar"
                                                    style={{
                                                        width: `${Math.min(score * 100, 100)}%`,
                                                        background: isTop3 ? '#ff9800' : '#4a90d9'
                                                    }}
                                                />
                                            </div>
                                            <span className="score-value">{formatNumber(score)}</span>
                                        </div>
                                        <div className="ranking-expand">
                                            {detailBuku === item.id_alternatif ? (
                                                <ChevronDown size={18} />
                                            ) : (
                                                <ChevronRight size={18} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {detailBuku && ranking.find(b => b.id_alternatif === detailBuku) && (
                        <div className="card detail-card">
                            <div className="detail-header">
                                <h3 className="detail-title">
                                    <Calculator size={18} />
                                    Detail Perhitungan
                                    <span style={{ fontSize: '14px', fontWeight: 400, color: '#8a9ab8' }}>
                                        {ranking.find(b => b.id_alternatif === detailBuku)?.judul_buku}
                                    </span>
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        onClick={() => togglePerhitungan(detailBuku)}
                                    >
                                        {showPerhitungan[detailBuku] ? (
                                            <><EyeOff size={14} /> Sembunyi</>
                                        ) : (
                                            <><Eye size={14} /> Lihat Rumus</>
                                        )}
                                    </button>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        onClick={() => setDetailBuku(null)}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>

                            {ranking.find(b => b.id_alternatif === detailBuku)?.detail_nilai && (
                                <div className="detail-content">
                                    <div className="detail-summary">
                                        <div className="detail-summary-item">
                                            <span>Total Skor</span>
                                            <span className="detail-summary-value">
                                                {formatNumber(ranking.find(b => b.id_alternatif === detailBuku)?.skor_total)}
                                            </span>
                                        </div>
                                        <div className="detail-summary-item">
                                            <span>Sub-Kriteria Terpilih</span>
                                            <span className="detail-summary-value">
                                                {ranking.find(b => b.id_alternatif === detailBuku)?.detail_nilai.length}
                                            </span>
                                        </div>
                                        <div className="detail-summary-item">
                                            <span>Kriteria Terlibat</span>
                                            <span className="detail-summary-value">
                                                {new Set(ranking.find(b => b.id_alternatif === detailBuku)?.detail_nilai.map(d => d.id_kriteria)).size}
                                            </span>
                                        </div>
                                    </div>

                                    <table className="detail-table">
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Kriteria</th>
                                                <th style={{ textAlign: 'center' }}>Bobot Kriteria</th>
                                                <th>Sub-Kriteria</th>
                                                <th style={{ textAlign: 'center' }}>Bobot Sub</th>
                                                <th style={{ textAlign: 'center' }}>Bobot Global</th>
                                                <th style={{ textAlign: 'center' }}>Rumus</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ranking
                                                .find(b => b.id_alternatif === detailBuku)
                                                ?.detail_nilai
                                                .map((item, idx) => {
                                                    const isActive = item.bobot_global > 0;
                                                    return (
                                                        <tr key={idx} className={isActive ? 'active-row' : 'inactive-row'}>
                                                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{item.nama_kriteria}</td>
                                                            <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: '#2c3e7a' }}>
                                                                {formatNumber(item.bobot_kriteria)}
                                                            </td>
                                                            <td>{item.nama_sub}</td>
                                                            <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                                                                {formatNumber(item.bobot_sub)}
                                                            </td>
                                                            <td style={{ 
                                                                textAlign: 'center', 
                                                                fontWeight: isActive ? 700 : 400,
                                                                color: isActive ? '#2c3e7a' : '#8a9ab8',
                                                                fontFamily: 'monospace'
                                                            }}>
                                                                {formatNumber(item.bobot_global)}
                                                                {isActive && ' ✓'}
                                                            </td>
                                                            <td style={{ 
                                                                textAlign: 'center', 
                                                                fontSize: '12px', 
                                                                fontFamily: 'monospace',
                                                                color: isActive ? '#2c3e7a' : '#8a9ab8'
                                                            }}>
                                                                {isActive ? (
                                                                    `${formatNumber(item.bobot_kriteria)} × ${formatNumber(item.bobot_sub)}`
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="5" style={{ fontWeight: 700, textAlign: 'right' }}>
                                                    Total Skor
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: '#2c3e7a', fontFamily: 'monospace' }}>
                                                    {formatNumber(ranking.find(b => b.id_alternatif === detailBuku)?.skor_total)}
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '12px', fontFamily: 'monospace' }}>
                                                    Σ Bobot Global
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    {showPerhitungan[detailBuku] && (
                                        <div className="perhitungan-detail">
                                            <div className="perhitungan-header">
                                                <Sigma size={16} />
                                                <span>Detail Perhitungan Lengkap</span>
                                            </div>
                                            
                                            <div className="perhitungan-box">
                                                <div className="rumus-utama">
                                                    <div className="rumus-label">Rumus Utama:</div>
                                                    <div className="rumus-ekspresi">
                                                        Skor = Σ (Bobot Kriteria × Bobot Sub-Kriteria)
                                                    </div>
                                                </div>

                                                {ranking.find(b => b.id_alternatif === detailBuku)?.rumus.length > 0 && (
                                                    <div className="rumus-langkah">
                                                        <div className="rumus-label">Langkah Perhitungan (Urutan: Genre → Tahun Terbit → Popularitas → Rating):</div>
                                                        {ranking
                                                            .find(b => b.id_alternatif === detailBuku)
                                                            ?.rumus
                                                            .map((item, idx) => (
                                                                <div key={idx} className="rumus-langkah-item">
                                                                    <span className="langkah-number">{idx + 1}.</span>
                                                                    <span className="langkah-text">
                                                                        <strong>{item.nama_kriteria}</strong> → {item.nama_sub}
                                                                    </span>
                                                                    <span className="langkah-rumus">
                                                                        {formatNumber(item.bobot_kriteria)} × {formatNumber(item.bobot_sub)}
                                                                        <span className="langkah-hasil"> = {formatNumber(item.bobot_global)}</span>
                                                                    </span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}

                                                <div className="rumus-total">
                                                    <div className="rumus-label">Total:</div>
                                                    <div className="rumus-ekspresi total">
                                                        Skor = {ranking
                                                            .find(b => b.id_alternatif === detailBuku)
                                                            ?.rumus
                                                            .map((item, idx) => (
                                                                <span key={idx}>
                                                                    {idx > 0 && ' + '}
                                                                    {formatNumber(item.bobot_global)}
                                                                </span>
                                                            ))
                                                        }
                                                        <span className="total-hasil"> = {formatNumber(ranking.find(b => b.id_alternatif === detailBuku)?.skor_total)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <style>{`
                .hasil-page { padding: 24px; max-width: 1200px; margin: 0 auto; }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .page-title { font-size: 26px; font-weight: 700; color: #1a2744; margin: 0; }
                .page-subtitle { color: #8a9ab8; font-size: 15px; margin-top: 4px; }
                .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

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
                .btn-primary { background: #2c3e7a; color: white; }
                .btn-primary:hover:not(:disabled) { background: #3d5a9e; transform: translateY(-2px); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-outline { background: transparent; color: #4a5a7a; border: 2px solid #e2e8f0; }
                .btn-outline:hover { border-color: #2c3e7a; color: #2c3e7a; }
                .btn-sm { padding: 6px 14px; font-size: 12px; }

                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.08);
                    padding: 24px;
                    margin-bottom: 20px;
                }
                .card-empty {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(26,39,68,0.08);
                }
                .card-empty p { margin: 8px 0; }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .card-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a2744;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .card-title .icon { color: #2c3e7a; }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                    box-shadow: 0 2px 8px rgba(26,39,68,0.06);
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
                .stat-number { font-size: 20px; font-weight: 700; color: #1a2744; line-height: 1.2; }
                .stat-label { font-size: 13px; color: #8a9ab8; }

                .bobot-kriteria-card {
                    background: linear-gradient(135deg, #f8faff, #eef3ff);
                    border: 1px solid #dce3f0;
                }
                .bobot-kriteria-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 8px;
                }
                .bobot-kriteria-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 14px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .bobot-kriteria-nama {
                    font-weight: 500;
                    color: #4a5a7a;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .urutan-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    background: #2c3e7a;
                    color: white;
                    border-radius: 50%;
                    font-size: 11px;
                    font-weight: 700;
                }
                .bobot-kriteria-nilai {
                    font-family: 'Courier New', monospace;
                    font-weight: 700;
                    color: #2c3e7a;
                    font-size: 14px;
                }

                .ranking-list { display: flex; flex-direction: column; gap: 8px; }
                .ranking-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 14px 18px;
                    border-radius: 8px;
                    background: #f7f9fc;
                    transition: all 0.2s ease;
                    animation: fadeInUp 0.3s ease;
                    cursor: pointer;
                    border: 1px solid transparent;
                }
                .ranking-item:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(26,39,68,0.08); border-color: #e2e8f0; }
                .ranking-item.top { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #f6e05e; }
                .ranking-position { flex-shrink: 0; width: 40px; text-align: center; }
                .medal { font-size: 24px; }
                .ranking-info { flex: 1; }
                .ranking-title { font-weight: 600; color: #1a2744; }
                .ranking-meta { font-size: 13px; color: #8a9ab8; }
                .ranking-score {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .score-bar-wrapper {
                    width: 100px;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .score-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
                .score-value { font-weight: 700; font-size: 14px; color: #1a2744; min-width: 60px; text-align: right; }
                .ranking-expand { color: #8a9ab8; flex-shrink: 0; }

                .detail-card { 
                    border: 2px solid #2c3e7a; 
                    background: #f8faff; 
                    margin-top: 20px;
                    animation: slideUp 0.3s ease;
                }
                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .detail-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a2744;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    flex-wrap: wrap;
                }
                .detail-summary {
                    display: flex;
                    gap: 24px;
                    padding: 12px 16px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    border-left: 4px solid #2c3e7a;
                }
                .detail-summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    font-size: 13px;
                    color: #8a9ab8;
                }
                .detail-summary-value {
                    font-weight: 700;
                    color: #1a2744;
                    font-size: 16px;
                }

                .detail-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .detail-table th {
                    padding: 10px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #4a5a7a;
                    border-bottom: 2px solid #e2e8f0;
                    font-size: 12px;
                    text-transform: uppercase;
                    background: #f7f9fc;
                }
                .detail-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .detail-table .active-row {
                    background: #f8faff;
                }
                .detail-table .inactive-row {
                    opacity: 0.5;
                    background: #fafafa;
                }
                .detail-table tfoot td {
                    font-weight: 700;
                    border-top: 2px solid #2c3e7a;
                    padding-top: 12px;
                    background: #f7f9fc;
                }

                .perhitungan-detail {
                    margin-top: 20px;
                    border-top: 2px dashed #e2e8f0;
                    padding-top: 20px;
                }
                .perhitungan-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a2744;
                    margin-bottom: 16px;
                }
                .perhitungan-box {
                    background: #f7f9fc;
                    border-radius: 8px;
                    padding: 16px 20px;
                    border: 1px solid #e2e8f0;
                }
                .rumus-utama, .rumus-langkah, .rumus-total {
                    margin-bottom: 12px;
                }
                .rumus-utama:last-child, .rumus-langkah:last-child, .rumus-total:last-child {
                    margin-bottom: 0;
                }
                .rumus-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #8a9ab8;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .rumus-ekspresi {
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    color: #1a2744;
                    padding: 4px 8px;
                    background: white;
                    border-radius: 4px;
                    border: 1px solid #e2e8f0;
                }
                .rumus-ekspresi.total {
                    background: #e8f0fe;
                    border-color: #2c3e7a;
                    font-weight: 600;
                }
                .total-hasil {
                    color: #2c3e7a;
                    font-weight: 700;
                    margin-left: 8px;
                }
                .rumus-langkah-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 8px;
                    background: white;
                    border-radius: 4px;
                    margin-bottom: 4px;
                    border: 1px solid #e2e8f0;
                    font-size: 13px;
                    flex-wrap: wrap;
                }
                .rumus-langkah-item:last-child {
                    margin-bottom: 0;
                }
                .langkah-number {
                    font-weight: 700;
                    color: #2c3e7a;
                    min-width: 24px;
                }
                .langkah-text {
                    color: #4a5a7a;
                    flex: 1;
                    min-width: 150px;
                }
                .langkah-rumus {
                    font-family: 'Courier New', monospace;
                    color: #2c3e7a;
                    background: #f0f4ff;
                    padding: 2px 8px;
                    border-radius: 4px;
                }
                .langkah-hasil {
                    color: #ed8936;
                    font-weight: 600;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .hasil-page { padding: 16px; }
                    .page-header { flex-direction: column; }
                    .header-actions { width: 100%; }
                    .header-actions .btn { flex: 1; justify-content: center; }
                    .stats-grid { grid-template-columns: 1fr 1fr; }
                    .bobot-kriteria-grid { grid-template-columns: 1fr 1fr; }
                    .ranking-item { flex-wrap: wrap; gap: 8px; }
                    .ranking-score { width: 100%; margin-left: 56px; }
                    .score-bar-wrapper { flex: 1; }
                    .detail-table { font-size: 11px; }
                    .detail-table th, .detail-table td { padding: 6px 4px; }
                    .detail-summary { flex-direction: column; gap: 8px; }
                    .detail-header { flex-direction: column; align-items: stretch; }
                    .rumus-langkah-item { flex-direction: column; align-items: flex-start; gap: 4px; }
                }

                @media (max-width: 480px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .bobot-kriteria-grid { grid-template-columns: 1fr; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default HasilPage;