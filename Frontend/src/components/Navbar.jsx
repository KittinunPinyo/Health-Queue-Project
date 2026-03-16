import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// (SVG Icons)
const HomeIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const CalendarIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> );
const BellIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> );
const ProfileIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );

function Navbar() {
    const { t } = useLanguage();
    
    // (CSS Styles)
    const navStyle = {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '65px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f0f0f0',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxSizing: 'border-box'
    };
    const linkStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        color: '#999999',
        fontSize: '11px',
        height: '100%',
    };
    const iconWrapperStyle = {
        position: 'relative',
        marginBottom: '4px'
    };

    return (
        <>
            {/* (CSS ที่จำเป็นสำหรับ .active และ Badge) */}
            <style>
            {`
                .patient-nav .nav-link-item.active {
                    color: var(--primary-color, #007bff);
                    font-weight: 600;
                }
                .patient-nav .nav-link-item.active svg {
                    stroke: var(--primary-color, #007bff);
                }
                .patient-nav .notification-badge {
                    position: absolute;
                    top: -3px;
                    right: -8px;
                    width: 10px;
                    height: 10px;
                    background-color: var(--danger-color, #dc3545);
                    border-radius: 50%;
                    border: 2px solid white;
                    display: none; /* (ซ่อนไว้ก่อน) */
                }
            `}
            </style>
            
            <nav style={navStyle} className="patient-nav">
                <NavLink to="/patient/home" className="nav-link-item" style={linkStyle}>
                    <div style={iconWrapperStyle}><HomeIcon /></div>
                    <span>{t('home')}</span>
                </NavLink>

                <NavLink to="/patient/appointments" className="nav-link-item" style={linkStyle}>
                    <div style={iconWrapperStyle}><CalendarIcon /></div>
                    <span>{t('appointments')}</span>
                </NavLink>
                
                <NavLink to="/patient/notifications" className="nav-link-item" style={linkStyle}>
                    <div style={iconWrapperStyle}>
                        <BellIcon />
                        <span id="patient-notification-badge" className="notification-badge"></span>
                    </div>
                    <span>{t('notifications')}</span>
                </NavLink>

                <NavLink to="/patient/profile" className="nav-link-item" style={linkStyle}>
                    <div style={iconWrapperStyle}><ProfileIcon /></div>
                    <span>{t('profile')}</span>
                </NavLink>
            </nav>
        </>
    );
}

export default Navbar;