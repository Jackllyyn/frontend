import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ListChecks,
    BookOpen,
    GitCompare,
    Calculator,
    Trophy,
    Library,
    ChevronDown,
    Menu,
    X,
    LogOut,
    User,
    CalendarCheck,
    ClipboardList,
    Users,
    Star
} from 'lucide-react';

const Sidebar = ({ user, setIsAuthenticated, setUser }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState({
        kriteria: false,
        pairwise: false,
        normalisasi: false,
        hasil: false
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const isAdmin = user?.role === 'admin';

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = () => {
        if (window.confirm('Yakin ingin logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof setIsAuthenticated === 'function') {
                setIsAuthenticated(false);
            }
            if (typeof setUser === 'function') {
                setUser(null);
            }
            navigate('/login');
        }
    };

    // ===== USER MENU =====
    const userMenuItems = [
        { path: '/user/buku', label: 'Data Buku', icon: BookOpen },
        { path: '/user/peminjaman', label: 'Peminjaman', icon: CalendarCheck },
        { path: '/user/riwayat', label: 'Riwayat', icon: ClipboardList },
        { path: '/user/nilai-alternatif', label: 'Penilaian Buku', icon: Star },
        { path: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    // ===== ADMIN MENU =====
    const adminMenuItems = [
        { path: '/buku', label: 'Data Buku', icon: BookOpen },
        { path: '/peminjaman', label: 'Verifikasi Peminjaman', icon: CalendarCheck },
    ];

    // ===== ADMIN AHP MENU =====
    const adminAHPItems = {
        kriteria: {
            label: 'Kriteria',
            icon: ListChecks,
            items: [
                { path: '/kriteria', label: 'Data Kriteria' },
                { path: '/sub-kriteria', label: 'Data Sub Kriteria' },
                { path: '/nilai-alternatif', label: 'Nilai Alternatif' },
            ]
        },
        pairwise: {
            label: 'Perbandingan',
            icon: GitCompare,
            items: [
                { path: '/pairwise', label: 'Pairwise Kriteria' },
                { path: '/pairwise-sub', label: 'Pairwise Sub Kriteria' },
            ]
        },
        normalisasi: {
            label: 'Normalisasi',
            icon: Calculator,
            items: [
                { path: '/normalisasi', label: 'Normalisasi Kriteria' },
                { path: '/normalisasi-sub', label: 'Normalisasi Sub Kriteria' },
            ]
        },
        hasil: {
            label: 'Hasil AHP',
            icon: Trophy,
            items: [
                { path: '/hasil-global', label: 'Hasil Global' },
                { path: '/hasil', label: 'Perankingan Buku' },
            ]
        }
    };

    // ===== ADMIN MANAGEMENT =====
    const adminManagementItems = [
        { path: '/admin/users', label: 'Kelola User', icon: Users },
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    const SidebarLink = ({ to, label, icon: Icon, isChild = false }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''} ${isChild ? 'child' : ''}`
                }
                onClick={() => setMobileOpen(false)}
            >
                {Icon && <Icon size={isChild ? 16 : 20} className="link-icon" />}
                <span className="link-label">{label}</span>
                {isChild && isActive(to) && <span className="active-indicator">●</span>}
            </NavLink>
        );
    };

    const DropdownMenu = ({ menuKey, menu }) => {
        const isOpen = openMenus[menuKey];
        const Icon = menu.icon;
        const hasActiveChild = menu.items.some(item => isActive(item.path));

        return (
            <div className="dropdown-menu">
                <div
                    className={`dropdown-header ${hasActiveChild ? 'has-active' : ''}`}
                    onClick={() => toggleMenu(menuKey)}
                >
                    <div className="dropdown-header-left">
                        <Icon size={20} className="dropdown-icon" />
                        <span className="dropdown-label">{menu.label}</span>
                    </div>
                    <ChevronDown 
                        size={16} 
                        className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`}
                    />
                </div>
                <div className={`dropdown-items ${isOpen ? 'open' : ''}`}>
                    {menu.items.map((item, idx) => (
                        <SidebarLink
                            key={idx}
                            to={item.path}
                            label={item.label}
                            isChild={true}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <button 
                className="mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="brand-icon-wrapper">
                        <Library size={26} className="brand-icon" />
                    </div>
                    <div className="brand-text">
                        <span className="brand-title">SPK AHP</span>
                        <span className="brand-sub">Perpustakaan Brebes</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {isAdmin ? (
                        // ===== ADMIN MENU =====
                        <>
                            {adminMenuItems.map((item, idx) => (
                                <SidebarLink 
                                    key={idx}
                                    to={item.path} 
                                    label={item.label} 
                                    icon={item.icon} 
                                />
                            ))}

                            <div className="nav-divider" />
                            
                            <DropdownMenu menuKey="kriteria" menu={adminAHPItems.kriteria} />
                            <DropdownMenu menuKey="pairwise" menu={adminAHPItems.pairwise} />
                            <DropdownMenu menuKey="normalisasi" menu={adminAHPItems.normalisasi} />
                            <DropdownMenu menuKey="hasil" menu={adminAHPItems.hasil} />
                            
                            <div className="nav-divider" />
                            
                            {adminManagementItems.map((item, idx) => (
                                <SidebarLink 
                                    key={idx}
                                    to={item.path} 
                                    label={item.label} 
                                    icon={item.icon} 
                                />
                            ))}
                        </>
                    ) : (
                        // ===== USER MENU =====
                        <>
                            {userMenuItems.map((item, idx) => (
                                <SidebarLink 
                                    key={idx}
                                    to={item.path} 
                                    label={item.label} 
                                    icon={item.icon} 
                                />
                            ))}
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user?.nama_lengkap?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.nama_lengkap || user?.username || 'User'}</div>
                            <div className="user-role">{isAdmin ? 'Administrator' : 'User'}</div>
                        </div>
                    </div>
                    
                    <button className="btn-logout" onClick={handleLogout}>
                        <LogOut size={15} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 260px;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                    transition: transform 0.3s ease;
                    border-right: 1px solid #eef2f7;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }

                /* Mobile Toggle */
                .mobile-toggle {
                    position: fixed;
                    top: 14px;
                    left: 14px;
                    z-index: 1001;
                    background: white;
                    border: 1px solid #eef2f7;
                    border-radius: 10px;
                    padding: 8px;
                    cursor: pointer;
                    display: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    color: #2d3748;
                }

                .mobile-toggle:hover {
                    background: #f7fafc;
                }

                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.25);
                    z-index: 999;
                    display: none;
                }

                /* Brand */
                .sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 20px 22px 16px;
                    border-bottom: 1px solid #f0f4f9;
                    flex-shrink: 0;
                }

                .brand-icon-wrapper {
                    width: 40px;
                    height: 40px;
                    background: #4f6ef7;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .brand-icon {
                    color: white;
                }

                .brand-text {
                    display: flex;
                    flex-direction: column;
                }

                .brand-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: #1a202c;
                    line-height: 1.2;
                }

                .brand-sub {
                    font-size: 11px;
                    color: #7a8aa0;
                    font-weight: 400;
                }

                /* Navigation */
                .sidebar-nav {
                    flex: 1;
                    padding: 12px 10px 8px;
                    overflow-y: auto;
                }

                .sidebar-nav::-webkit-scrollbar {
                    width: 3px;
                }

                .sidebar-nav::-webkit-scrollbar-thumb {
                    background: #dce1e8;
                    border-radius: 10px;
                }

                .nav-divider {
                    height: 1px;
                    background: #edf2f7;
                    margin: 6px 10px;
                }

                /* Link */
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 9px 14px;
                    color: #4a5568;
                    text-decoration: none;
                    border-radius: 10px;
                    transition: all 0.15s ease;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 1px;
                    position: relative;
                }

                .sidebar-link:hover {
                    background: #f7fafc;
                    color: #1a202c;
                }

                .sidebar-link.active {
                    background: #f0f4ff;
                    color: #4f6ef7;
                }

                .sidebar-link.active .link-icon {
                    color: #4f6ef7;
                }

                .sidebar-link .link-icon {
                    flex-shrink: 0;
                    color: #8a9aa8;
                    transition: color 0.15s;
                }

                .sidebar-link:hover .link-icon {
                    color: #4f6ef7;
                }

                .sidebar-link.child {
                    padding-left: 44px;
                    font-size: 13px;
                    font-weight: 400;
                    color: #5a6a7e;
                }

                .sidebar-link.child:hover {
                    background: #f7fafc;
                    color: #2d3748;
                }

                .sidebar-link.child.active {
                    background: #f0f4ff;
                    color: #4f6ef7;
                }

                .sidebar-link.child.active .link-icon {
                    color: #4f6ef7;
                }

                .active-indicator {
                    margin-left: auto;
                    font-size: 8px;
                    color: #4f6ef7;
                }

                /* Dropdown */
                .dropdown-menu {
                    margin-bottom: 1px;
                }

                .dropdown-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 9px 14px;
                    color: #4a5568;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-size: 14px;
                    font-weight: 500;
                    user-select: none;
                }

                .dropdown-header:hover {
                    background: #f7fafc;
                    color: #1a202c;
                }

                .dropdown-header.has-active {
                    color: #1a202c;
                }

                .dropdown-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .dropdown-icon {
                    color: #8a9aa8;
                    transition: color 0.15s;
                }

                .dropdown-header:hover .dropdown-icon {
                    color: #4f6ef7;
                }

                .dropdown-chevron {
                    color: #a0aec0;
                    transition: transform 0.25s ease, color 0.15s;
                    flex-shrink: 0;
                }

                .dropdown-chevron.rotated {
                    transform: rotate(180deg);
                }

                .dropdown-header:hover .dropdown-chevron {
                    color: #4f6ef7;
                }

                .dropdown-items {
                    overflow: hidden;
                    max-height: 0;
                    transition: max-height 0.3s ease;
                }

                .dropdown-items.open {
                    max-height: 500px;
                }

                /* Footer */
                .sidebar-footer {
                    padding: 14px 18px 16px;
                    border-top: 1px solid #edf2f7;
                    flex-shrink: 0;
                }

                .sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: #4f6ef7;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 14px;
                    flex-shrink: 0;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    color: #1a202c;
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-role {
                    color: #8a9aa8;
                    font-size: 12px;
                }

                .btn-logout {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 8px 16px;
                    background: #f7fafc;
                    border: none;
                    border-radius: 8px;
                    color: #4a5568;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-logout:hover {
                    background: #fff5f5;
                    color: #e53e3e;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .mobile-toggle {
                        display: flex;
                    }

                    .sidebar-overlay {
                        display: block;
                    }

                    .sidebar {
                        transform: translateX(-100%);
                        width: 280px;
                    }

                    .sidebar.mobile-open {
                        transform: translateX(0);
                    }

                    .sidebar-brand {
                        padding: 16px 20px 14px;
                    }

                    .sidebar-nav {
                        padding: 10px 10px;
                    }
                }

                @media (min-width: 769px) {
                    .sidebar-overlay {
                        display: none !important;
                    }
                }

                /* Animation */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-6px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .dropdown-items.open .sidebar-link {
                    animation: slideIn 0.2s ease forwards;
                }

                .dropdown-items.open .sidebar-link:nth-child(2) {
                    animation-delay: 0.04s;
                }

                .dropdown-items.open .sidebar-link:nth-child(3) {
                    animation-delay: 0.08s;
                }

                .dropdown-items.open .sidebar-link:nth-child(4) {
                    animation-delay: 0.12s;
                }
            `}</style>
        </>
    );
};

export default Sidebar;