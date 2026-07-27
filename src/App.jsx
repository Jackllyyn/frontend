import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// ============================================================
// SET BASE URL API - TANPA /api
// ============================================================
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://backend-production-71d0.up.railway.app';

axios.defaults.baseURL = API_BASE_URL;

console.log('📍 API Base URL:', API_BASE_URL);

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import PrivateLayout from './components/layout/PrivateLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// ============ USER PAGES ============
import UserDashboard from './pages/user/DashboardPage';
import UserBuku from './pages/user/BukuUserPage';
import UserPeminjaman from './pages/user/PeminjamanUserPage';
import UserRiwayat from './pages/user/RiwayatPeminjamanPage';
import UserProfile from './pages/user/ProfilePage';
import UserNilaiAlternatif from './pages/user/NilaiAlternatifUserPage';

// ============ ADMIN PAGES ============
import AdminDashboard from './pages/admin/DashboardPage';
import AdminBuku from './pages/admin/BukuPage';
import AdminPeminjaman from './pages/admin/PeminjamanPage';
import AdminProfile from './pages/admin/ProfilePage';
import AdminKriteria from './pages/admin/KriteriaPage';
import AdminSubKriteria from './pages/admin/SubKriteriaPage';
import AdminPairwise from './pages/admin/PairwisePage';
import AdminPairwiseSub from './pages/admin/PairwiseSubPage';
import AdminNormalisasi from './pages/admin/NormalisasiPage';
import AdminNormalisasiSub from './pages/admin/NormalisasiSubPage';
import AdminHasilGlobal from './pages/admin/HasilGlobalPage';
import AdminHasil from './pages/admin/HasilPage';
import AdminNilaiAlternatif from './pages/admin/NilaiAlternatifPage';
import AdminUsers from './pages/admin/AdminUsersPage';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = ['user', 'admin'] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// User Route Component (hanya untuk user biasa)
const UserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Memuat Aplikasi...</p>
        <style>{`
          .app-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f1f5f9;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          .app-loading p {
            margin-top: 16px;
            color: #64748b;
            font-size: 16px;
            font-weight: 500;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* ============ PUBLIC ROUTES ============ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <LoginPage 
            setIsAuthenticated={setIsAuthenticated} 
            setUser={setUser} 
          />
        } />
      </Route>

      {/* ============ USER ROUTES (HANYA USER) ============ */}
      <Route element={
        <UserRoute>
          <PrivateLayout 
            user={user} 
            setIsAuthenticated={setIsAuthenticated} 
            setUser={setUser} 
          />
        </UserRoute>
      }>
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/buku" element={<UserBuku />} />
        <Route path="/user/peminjaman" element={<UserPeminjaman />} />
        <Route path="/user/riwayat" element={<UserRiwayat />} />
        <Route path="/user/profile" element={<UserProfile user={user} setUser={setUser} />} />
        <Route path="/user/nilai-alternatif" element={<UserNilaiAlternatif />} />
      </Route>

      {/* ============ ADMIN ROUTES (HANYA ADMIN) ============ */}
      <Route element={
        <AdminRoute>
          <PrivateLayout 
            user={user} 
            setIsAuthenticated={setIsAuthenticated} 
            setUser={setUser} 
          />
        </AdminRoute>
      }>
        {/* Dashboard */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        
        {/* Manajemen Buku & Peminjaman */}
        <Route path="/buku" element={<AdminBuku />} />
        <Route path="/peminjaman" element={<AdminPeminjaman />} />
        <Route path="/profile" element={<AdminProfile user={user} setUser={setUser} />} />
        
        {/* AHP Management */}
        <Route path="/kriteria" element={<AdminKriteria />} />
        <Route path="/sub-kriteria" element={<AdminSubKriteria />} />
        <Route path="/pairwise" element={<AdminPairwise />} />
        <Route path="/pairwise-sub" element={<AdminPairwiseSub />} />
        <Route path="/normalisasi" element={<AdminNormalisasi />} />
        <Route path="/normalisasi-sub" element={<AdminNormalisasiSub />} />
        <Route path="/hasil-global" element={<AdminHasilGlobal />} />
        <Route path="/hitung-global" element={<AdminHasilGlobal />} />
        <Route path="/hasil" element={<AdminHasil />} />
        <Route path="/nilai-alternatif" element={<AdminNilaiAlternatif />} />
        
        {/* Admin Management */}
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* ============ FALLBACK ============ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
