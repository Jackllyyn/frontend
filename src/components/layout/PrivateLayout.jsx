import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const PrivateLayout = ({ user, setIsAuthenticated, setUser }) => {
  return (
    <div className="private-layout">
      <Sidebar 
        user={user} 
        setIsAuthenticated={setIsAuthenticated} 
        setUser={setUser} 
      />
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      <style>{`
        .private-layout {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }

        .main-content {
          flex: 1;
          margin-left: 270px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .page-content {
          padding: 24px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }

          .page-content {
            padding: 16px;
            margin-top: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivateLayout;