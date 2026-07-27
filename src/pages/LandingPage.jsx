import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  Star,
  ArrowRight,
  Library
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>Perpustakaan Kabupaten Brebes</span>
            </div>
            <h1 className="hero-title">
              Temukan Buku Rekomendasi Terbaik dengan
              <span className="highlight"> SPK AHP</span>
            </h1>
            <p className="hero-description">
              Sistem Pendukung Keputusan menggunakan metode AHP untuk membantu Anda
              menemukan buku yang paling sesuai dengan preferensi dan kebutuhan Anda.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn-primary">
                Mulai Sekarang
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">12.000+</span>
                <span className="stat-label">Koleksi Buku</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">8.500+</span>
                <span className="stat-label">Anggota Aktif</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Rating Pengguna</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <Library size={120} className="hero-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Fitur</span>
            <h2 className="section-title">Layanan Perpustakaan</h2>
            <p className="section-desc">
              Nikmati berbagai kemudahan dalam mengakses dan memanfaatkan layanan perpustakaan
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={24} />
              </div>
              <h3 className="feature-title">Koleksi Buku Lengkap</h3>
              <p className="feature-desc">Tersedia ribuan judul buku dari berbagai genre dan kategori</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <h3 className="feature-title">Layanan Peminjaman</h3>
              <p className="feature-desc">Sistem peminjaman buku yang mudah dan cepat untuk anggota</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Star size={24} />
              </div>
              <h3 className="feature-title">Sistem Rating</h3>
              <p className="feature-desc">Berikan rating dan review untuk buku yang sudah dibaca</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Award size={24} />
              </div>
              <h3 className="feature-title">Rekomendasi AHP</h3>
              <p className="feature-desc">Sistem pendukung keputusan untuk rekomendasi buku terbaik</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Siap Menemukan Buku Impian Anda?</h2>
          <p className="cta-desc">
            Bergabunglah dengan ribuan pembaca lainnya dan temukan buku terbaik dengan sistem rekomendasi kami
          </p>
          <Link to="/login" className="btn-cta">
            Mulai Sekarang
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #ffffff;
        }

        /* Hero Section */
        .hero-section {
          padding: 80px 24px 80px;
          background: #faf9fe;
          border-bottom: 1px solid #f0eff5;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-badge {
          display: inline-block;
          padding: 6px 18px;
          background: #e8e6f5;
          color: #4a4a6a;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          letter-spacing: 0.3px;
        }

        .hero-title {
          font-size: 46px;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1.15;
          margin-bottom: 18px;
          letter-spacing: -0.5px;
        }

        .hero-title .highlight {
          color: #4f46e5;
        }

        .hero-description {
          font-size: 17px;
          color: #6b6b84;
          line-height: 1.8;
          margin-bottom: 32px;
          max-width: 480px;
        }

        .hero-buttons {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 44px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: #4f46e5;
          color: white;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid #4f46e5;
        }

        .btn-primary:hover {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25);
        }

        .hero-stats {
          display: flex;
          gap: 44px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .stat-label {
          font-size: 13px;
          color: #8b8ba0;
          margin-top: 2px;
        }

        .hero-image {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-illustration {
          width: 320px;
          height: 320px;
          background: #f0eeff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e8e6f5;
        }

        .hero-icon {
          color: #4f46e5;
          opacity: 0.15;
        }

        /* Features Section */
        .features-section {
          padding: 80px 24px;
          background: #ffffff;
          border-bottom: 1px solid #f0eff5;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-badge {
          display: inline-block;
          padding: 4px 16px;
          background: #e8e6f5;
          color: #4a4a6a;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 34px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 12px;
          letter-spacing: -0.3px;
        }

        .section-desc {
          font-size: 17px;
          color: #8b8ba0;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 28px;
        }

        .feature-card {
          padding: 32px 24px 28px;
          background: #faf9fe;
          border-radius: 16px;
          text-align: center;
          transition: all 0.2s ease;
          border: 1px solid #f0eff5;
        }

        .feature-card:hover {
          background: #ffffff;
          border-color: #d4d0e8;
          transform: translateY(-4px);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: #e8e6f5;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #4f46e5;
        }

        .feature-title {
          font-size: 17px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 14px;
          color: #8b8ba0;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 24px;
          background: #faf9fe;
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-size: 34px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 16px;
          letter-spacing: -0.3px;
        }

        .cta-desc {
          font-size: 17px;
          color: #8b8ba0;
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }

        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 36px;
          background: #4f46e5;
          color: white;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid #4f46e5;
        }

        .btn-cta:hover {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .hero-title {
            font-size: 38px;
          }
          .hero-illustration {
            width: 240px;
            height: 240px;
          }
          .hero-icon {
            width: 80px;
            height: 80px;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 48px 16px 56px;
          }
          .hero-title {
            font-size: 28px;
          }
          .hero-description {
            font-size: 15px;
          }
          .hero-stats {
            gap: 24px;
            flex-wrap: wrap;
          }
          .stat-number {
            font-size: 18px;
          }
          .hero-image {
            order: -1;
          }
          .hero-illustration {
            width: 180px;
            height: 180px;
          }
          .hero-icon {
            width: 60px;
            height: 60px;
          }
          .section-title {
            font-size: 26px;
          }
          .section-desc {
            font-size: 15px;
          }
          .features-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .cta-title {
            font-size: 26px;
          }
          .hero-buttons .btn-primary {
            width: 100%;
            justify-content: center;
          }
          .btn-cta {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .hero-stats {
            gap: 16px;
          }
          .stat-number {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;