import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const IconWrapper = ({ children }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);
const HomeIcon = () => (<IconWrapper><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></IconWrapper>);
const CalendarIcon = () => (<IconWrapper><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></IconWrapper>);
const ProfileIcon = () => (<IconWrapper><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></IconWrapper>);
const BellIcon = () => (<IconWrapper><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></IconWrapper>);
const ChatIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>);

function NavbarPatient() {
    const { t } = useLanguage();
    const navStyle = {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '64px',
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
        color: '#64748b',
        fontSize: '12px',
        height: '100%'
    };

    return (
        <nav style={navStyle}>
            <NavLink to="/patient/home" style={linkStyle} className={({ isActive }) => isActive ? 'active' : ''}>
                <HomeIcon />
                <span>หน้าแรก</span>
            </NavLink>
            <NavLink to="/patient/appointments" style={linkStyle} className={({ isActive }) => isActive ? 'active' : ''}>
                <CalendarIcon />
                <span>นัดหมาย</span>
            </NavLink>
            <NavLink to="/patient/chat" style={linkStyle} className={({ isActive }) => isActive ? 'active' : ''}>
                <ChatIcon />
                <span>แชท</span>
            </NavLink>
            <NavLink to="/patient/notifications" style={linkStyle} className={({ isActive }) => isActive ? 'active' : ''}>
                <BellIcon />
                <span>แจ้งเตือน</span>
            </NavLink>
            <NavLink to="/patient/profile" style={linkStyle} className={({ isActive }) => isActive ? 'active' : ''}>
                <ProfileIcon />
                <span>โปรไฟล์</span>
            </NavLink>
        </nav>
    );
}

export default NavbarPatient;
