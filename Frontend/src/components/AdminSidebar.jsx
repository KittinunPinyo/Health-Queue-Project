import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink, useLocation } from 'react-router-dom';

// SVG Icons
const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ClinicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9z"></path>
        <line x1="12" y1="2" x2="12" y2="22"></line>
    </svg>
);

const PatientsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const HistoryIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

function AdminSidebar() {
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState(['appointments']); // เปิด นัดหมาย เป็นค่าเริ่มต้น
    const { t } = useLanguage();

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => 
            prev.includes(menuId) 
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    // เช็คว่า path ปัจจุบันอยู่ใน submenu ไหม
    const isAppointmentActive = location.pathname.includes('/admin/home') || location.pathname.includes('/admin/history');

    const menuItems = [
        { 
            id: 'appointments',
            titleKey: 'appointments',
            icon: <CalendarIcon />,
            hasSubmenu: true,
            submenus: [
                { titleKey: 'notifyPatients', to: '/admin/home', icon: <BellIcon /> },
                { titleKey: 'appointmentHistory', to: '/admin/history', icon: <HistoryIcon /> },
            ]
        },
        { titleKey: 'clinics', to: '/admin/clinics', icon: <ClinicIcon /> },
        { titleKey: 'patients', to: '/admin/appointments', icon: <PatientsIcon /> },
        { titleKey: 'chat', to: '/admin/chat', icon: <ChatIcon /> },
        { titleKey: 'settings', to: '/admin/profile', icon: <SettingsIcon /> },
    ];

    const handleLogout = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    return (
        <>
            <style>
                {`
                    .admin-sidebar {
                        position: fixed;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        width: 280px;
                        background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
                        display: flex;
                        flex-direction: column;
                        z-index: 1001;
                        box-shadow: 4px 0 20px rgba(0,0,0,0.15);
                        overflow: hidden;
                    }

                    .sidebar-header {
                        padding: 28px 24px;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }

                    .sidebar-logo {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        color: white;
                    }

                    .sidebar-logo-icon {
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                    }

                    .sidebar-logo-text {
                        font-size: 20px;
                        font-weight: 700;
                        color: white;
                    }

                    .sidebar-menu {
                        flex: 1;
                        padding: 24px 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                    }

                    .sidebar-item {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px 18px;
                        color: rgba(255,255,255,0.7);
                        text-decoration: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        border: none;
                        background: none;
                        width: 100%;
                        text-align: left;
                    }

                    .sidebar-item:hover {
                        background: rgba(255,255,255,0.1);
                        color: white;
                    }

                    .sidebar-item.active {
                        background: rgba(139, 92, 246, 0.3);
                        color: white;
                        font-weight: 600;
                    }

                    .sidebar-item.active::before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 4px;
                        height: 28px;
                        background: #a855f7;
                        border-radius: 0 4px 4px 0;
                    }

                    .sidebar-item svg {
                        flex-shrink: 0;
                        opacity: 0.8;
                    }

                    .sidebar-item.active svg {
                        opacity: 1;
                    }

                    .sidebar-footer {
                        padding: 16px 12px;
                        border-top: 1px solid rgba(255,255,255,0.1);
                    }

                    .logout-btn {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        padding: 14px 16px;
                        color: rgba(255,255,255,0.7);
                        text-decoration: none;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        border: none;
                        background: none;
                        width: 100%;
                        text-align: left;
                    }

                    .logout-btn:hover {
                        background: rgba(239, 68, 68, 0.2);
                        color: #fca5a5;
                    }

                    /* Submenu styles */
                    .sidebar-parent {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16px;
                        padding: 16px 18px;
                        color: rgba(255,255,255,0.7);
                        text-decoration: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        border: none;
                        background: none;
                        width: 100%;
                        text-align: left;
                    }

                    .sidebar-parent:hover {
                        background: rgba(255,255,255,0.1);
                        color: white;
                    }

                    .sidebar-parent.active {
                        background: rgba(139, 92, 246, 0.3);
                        color: white;
                        font-weight: 600;
                    }

                    .sidebar-parent-content {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }

                    .sidebar-chevron {
                        transition: transform 0.2s ease;
                    }

                    .sidebar-chevron.expanded {
                        transform: rotate(180deg);
                    }

                    .sidebar-submenu {
                        overflow: hidden;
                        transition: max-height 0.3s ease;
                        margin-left: 20px;
                        border-left: 2px solid rgba(255,255,255,0.15);
                        padding-left: 12px;
                    }

                    .sidebar-subitem {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 16px;
                        color: rgba(255,255,255,0.6);
                        text-decoration: none;
                        border-radius: 10px;
                        font-size: 14px;
                        font-weight: 400;
                        transition: all 0.2s ease;
                        margin: 4px 0;
                    }

                    .sidebar-subitem:hover {
                        background: rgba(255,255,255,0.08);
                        color: white;
                    }

                    .sidebar-subitem.active {
                        background: rgba(139, 92, 246, 0.25);
                        color: white;
                        font-weight: 500;
                    }

                    /* Responsive */
                    @media (max-width: 768px) {
                        .admin-sidebar {
                            width: 70px;
                        }
                        .sidebar-logo-text,
                        .sidebar-item span,
                        .sidebar-parent span,
                        .sidebar-subitem span,
                        .sidebar-chevron,
                        .sidebar-submenu,
                        .logout-btn span {
                            display: none;
                        }
                        .sidebar-item,
                        .sidebar-parent,
                        .logout-btn {
                            justify-content: center;
                            padding: 14px;
                        }
                    }
                `}
            </style>

            <aside className="admin-sidebar">
                {/* Header with Logo */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            🏥
                        </div>
                        <span className="sidebar-logo-text">HealthQueue</span>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="sidebar-menu">
                    {menuItems.map((item) => (
                        item.hasSubmenu ? (
                            <div key={item.id}>
                                {/* Parent menu with submenu */}
                                <button
                                    className={`sidebar-parent ${isAppointmentActive ? 'active' : ''}`}
                                    onClick={() => toggleMenu(item.id)}
                                >
                                    <div className="sidebar-parent-content">
                                        {item.icon}
                                        <span>{t(item.titleKey || item.title)}</span>
                                    </div>
                                    <div className={`sidebar-chevron ${expandedMenus.includes(item.id) ? 'expanded' : ''}`}>
                                        <ChevronDownIcon />
                                    </div>
                                </button>
                                
                                {/* Submenu */}
                                <div 
                                    className="sidebar-submenu"
                                    style={{ 
                                        maxHeight: expandedMenus.includes(item.id) ? '200px' : '0',
                                        marginTop: expandedMenus.includes(item.id) ? '4px' : '0'
                                    }}
                                >
                                    {item.submenus.map((sub) => (
                                        <NavLink
                                            key={sub.to}
                                            to={sub.to}
                                            className={({ isActive }) => 
                                                `sidebar-subitem ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            {sub.icon}
                                            <span>{t(sub.titleKey || sub.title)}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => 
                                    `sidebar-item ${isActive ? 'active' : ''}`
                                }
                                style={{ position: 'relative' }}
                            >
                                {item.icon}
                                <span>{t(item.titleKey || item.title)}</span>
                            </NavLink>
                        )
                    ))}
                </nav>

                {/* Footer with Logout */}
                <div className="sidebar-footer">
                        <button className="logout-btn" onClick={handleLogout}>
                        <LogoutIcon />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;
