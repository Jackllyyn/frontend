import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="main-container">
          {children}
        </div>
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 24px 32px;
          background: var(--bg-main);
          min-height: 100vh;
        }

        .main-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 72px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;