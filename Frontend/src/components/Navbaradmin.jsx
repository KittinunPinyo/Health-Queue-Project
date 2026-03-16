import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';

// (SVG Icons)
const AdminHomeIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const ClinicIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9z"></path><line x1="12" y1="2" x2="12" y2="22"></line></svg> );
const PatientsIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const SettingsIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> );

// 🚀 เพิ่มไอคอน Chat
const ChatIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );

function NavbarAdmin({ inline = false }) {
    const { t } = useLanguage();

    const navStyle = inline
        ? {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '18px',
            height: 'auto',
            backgroundColor: 'transparent',
            position: 'static',
            boxSizing: 'border-box',
        }
        : {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end', // align items to the right
            gap: '18px', // spacing between items
            height: '56px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f0f0f0',
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            zIndex: 900,
            boxSizing: 'border-box',
            padding: '0 20px',
        };

    const menuItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        color: '#4b5563',
        textDecoration: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    };

    const menus = [
        { key: 'appointments', to: '/admin/home', icon: <AdminHomeIcon /> },
        { key: 'clinics', to: '/admin/clinics', icon: <ClinicIcon /> },
        { key: 'patients', to: '/admin/appointments', icon: <PatientsIcon /> },
        { key: 'chat', to: '/admin/chat', icon: <ChatIcon /> },
        { key: 'settings', to: '/admin/profile', icon: <SettingsIcon /> },
    ];

    return (
        <>
            <style>
            {`
                .admin-nav .menu-item.active {
                    color: var(--dark-color, #0f172a);
                    background: #f8fafc;
                    font-weight: 600;
                }
                /* no dropdowns: menu shows only main links */
                @media (max-width: 1024px) {
                    /* keep scrollable on smaller screens and reduce gap */
                    .admin-nav { overflow-x: auto; gap: 12px; padding-right: 12px; }
                }
                @media (max-width: 480px) {
                    .admin-nav { gap: 8px; }
                    .admin-nav .dropdown { left: -6px; }
                }
            `}
            </style>

            <nav style={navStyle} className="admin-nav">
                {menus.map((m) => (
                    <div key={m.title} style={{ position: 'relative', display: 'inline-block' }}>
                        <NavLink to={m.to} className={({isActive}) => `menu-item nav-link-item ${isActive? 'active':''}`} style={menuItemStyle}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <div style={{display:'flex', alignItems:'center'}}>{m.icon}</div>
                                <span style={{fontSize: '0.95rem'}}>{t(m.key)}</span>
                            </div>
                        </NavLink>
                    </div>
                ))}
            </nav>
        </>
    );
}

export default NavbarAdmin;