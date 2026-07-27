import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <nav className="navbar-public">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <BookOpen size={28} />
            <span>SPK AHP</span>
          </Link>
          <div className="navbar-links">
            <Link to="/">Beranda</Link>
            <Link to="/login" className="btn-login-nav">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="public-content">
        <Outlet />
      </main>

      <style>{`
        .public-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .navbar-public {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #0f172a;
          font-size: 22px;
          font-weight: 700;
        }

        .navbar-brand svg {
          color: #4f46e5;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .navbar-links a {
          text-decoration: none;
          color: #475569;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
        }

        .navbar-links a:hover {
          color: #4f46e5;
        }

        .btn-login-nav {
          background: #4f46e5 !important;
          color: white !important;
          padding: 8px 24px !important;
          border-radius: 8px;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }

        .btn-login-nav:hover {
          background: #4338ca !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .public-content {
          flex: 1;
        }

        @media (max-width: 768px) {
          .navbar-container {
            height: 60px;
          }
          .navbar-brand {
            font-size: 18px;
          }
          .navbar-links a {
            font-size: 14px;
          }
          .btn-login-nav {
            padding: 6px 16px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicLayout;