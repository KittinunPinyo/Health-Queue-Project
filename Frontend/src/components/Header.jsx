import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import NavbarAdmin from './Navbaradmin.jsx';
import { useLanguage } from '../contexts/LanguageContext';

// --- SVG Icons ---
// ปรับขนาด SVG เป็น 24px เพื่อให้ใหญ่และชัดเจน
const IconWrapper = ({ children, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const HomeIcon = () => (<IconWrapper><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></IconWrapper>);
const CalendarIcon = () => (<IconWrapper><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></IconWrapper>);
const BellIcon = () => (<IconWrapper><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></IconWrapper>);
const ProfileIcon = () => (<IconWrapper><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></IconWrapper>);
const BackIcon = () => (<IconWrapper><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></IconWrapper>);
const ChatIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>);


function updateNotificationBadge() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser || currentUser.role === 'admin') return;
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        const unreadCount = notifications.filter(n => (n.patientId === currentUser.id || n.patientId === 'all') && !n.read).length;
        const badge = document.getElementById('patient-notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'flex';
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) { console.error(e); }
}

function Header({ title, logoSrc = '/public/healthqueue.png', onBack }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const isPatient = location.pathname.includes('/patient');
    const isAdmin = location.pathname.includes('/admin');
    
    // State สำหรับ Notification Dropdown
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [animateBell, setAnimateBell] = useState(false);
    const prevUnread = React.useRef(0);
    const startedRef = React.useRef(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langRef = React.useRef(null);

    // โหลดและอัพเดท notifications
    const loadNotifications = () => {
        try {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser || currentUser.role === 'admin') return;
            
            const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
            const userNotifications = allNotifications.filter(
                n => n.patientId === currentUser.id || n.patientId === 'all'
            );
            
            setNotifications(userNotifications.slice(0, 10)); // แสดง 10 รายการล่าสุด
            setUnreadCount(userNotifications.filter(n => !n.read).length);
        } catch (e) { console.error(e); }
    };

    // Mark notification as read
    const markAsRead = (notifId) => {
        try {
            const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
            const updated = allNotifications.map(n => 
                n.id === notifId ? { ...n, read: true } : n
            );
            localStorage.setItem('notifications', JSON.stringify(updated));
            loadNotifications();
            try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'marked-read' } })); } catch(e) {}
        } catch (e) { console.error(e); }
    };

    // Mark all as read
    const markAllAsRead = () => {
        try {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser) return;
            
            const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
            const updated = allNotifications.map(n => 
                (n.patientId === currentUser.id || n.patientId === 'all') ? { ...n, read: true } : n
            );
            localStorage.setItem('notifications', JSON.stringify(updated));
            loadNotifications();
            try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'marked-all-read' } })); } catch(e) {}
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadNotifications();
    }, [location.pathname]);

    // ปิด dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showNotifications && !e.target.closest('.notification-container')) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        
        return () => document.removeEventListener('click', handleClickOutside);
        // cleanup additional listener
        // Note: can't unregister onNotificationsChanged here because return executes once
    }, [showNotifications]);

    // Close language menu when clicking outside
    useEffect(() => {
        const handleClickOutsideLang = (e) => {
            if (showLangMenu && langRef.current && !langRef.current.contains(e.target)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutsideLang);
        return () => document.removeEventListener('click', handleClickOutsideLang);
    }, [showLangMenu]);

    // ensure we also wire up on mount/unmount the notifications-changed listener
    useEffect(() => {
        const onNotificationsChanged = () => loadNotifications();
        window.addEventListener('notifications-changed', onNotificationsChanged);
        return () => window.removeEventListener('notifications-changed', onNotificationsChanged);
    }, []);

    // Watch unreadCount and trigger tiny wiggle when it increases
    useEffect(() => {
        if (!startedRef.current) {
            // initialize baseline without animating on first load
            prevUnread.current = unreadCount;
            startedRef.current = true;
            return;
        }

        if (prevUnread.current < unreadCount) {
            // new notification(s) arrived
            setAnimateBell(true);
            // stop animation after a short time
            const t = setTimeout(() => setAnimateBell(false), 1100);
            return () => clearTimeout(t);
        }
        prevUnread.current = unreadCount;
    }, [unreadCount]);

    return (
        <>
            <style>
                {`
                    :root {
                        --header-h: 4.5rem;
                        --primary: #007bff;
                    }

                    .modern-header {
                        position: fixed;
                        top: 0; left: 0; right: 0;
                        height: var(--header-h);
                        background: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: space-between; /* แยกซ้ายขวาออกจากกัน */
                        padding: 0 3%; /* ระยะห่างจากขอบจอซ้ายขวา */
                        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                        z-index: 1000;
                    }

                    /* --- Logo (Left) --- */
                    .header-left {
                        display: flex;
                        align-items: center;
                        z-index: 2; /* อยู่ชั้นบนเพื่อให้กดได้ */
                    }
                    .header-logo {
                        height: 7rem; /* ปรับความสูงโลโก้ */
                        width: auto;
                    }

                    /* --- Title (Center) --- */
                    .header-title {
                        position: absolute; /* ✨ Key Fix: ลอยอยู่ตรงกลางเสมอ */
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: #333;
                        white-space: nowrap;
                        pointer-events: none; /* ไม่ให้บังการคลิก */
                    }

                    /* --- Nav (Right) --- */
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        z-index: 2;
                    }

                    .nav-link {
                        display: flex;
                        flex-direction: row; /* ✨ Key Fix: บังคับแนวนอน */
                        align-items: center;
                        gap: 8px;
                        padding: 0.6rem 1rem;
                        border-radius: 30px; /* ทรงแคปซูลแบบรูปที่ 2 */
                        text-decoration: none;
                        color: #64748b;
                        font-size: 0.95rem;
                        font-weight: 500;
                        white-space: nowrap; /* ✨ Key Fix: ห้ามตัดบรรทัด */
                        transition: all 0.2s ease;
                    }

                    .nav-link:hover {
                        background-color: #f8fafc;
                        color: var(--primary);
                    }

                    .nav-link.active {
                        background-color: #eff6ff; /* พื้นหลังสีฟ้าอ่อน */
                        color: var(--primary);     /* ตัวหนังสือสีฟ้าเข้ม */
                        font-weight: 600;
                    }

                    /* Notification Badge */
                    .notif-badge {
                        position: absolute;
                        /* แก้ไขตำแหน่งตรงนี้: ปรับ top และ right เป็นค่าติดลบเพื่อดันออกไป */
                        top: -5px; 
                        right: -5px;
                        background: #ef4444;
                        color: white;
                        font-size: 0.6rem;
                        width: 16px; height: 16px;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: 2px solid #fff;
                    }

                    /* Back Button */
                    .btn-back {
                        background: none;
                        border: 1px solid #e2e8f0;
                        border-radius: 50%;
                        width: 40px; height: 40px;
                        display: flex; justify-content: center; align-items: center;
                        cursor: pointer;
                        color: #64748b;
                    }
                    .btn-back:hover { background: #f1f5f9; color: var(--primary); }

                    /* Mobile Responsive */
                    @media (max-width: 768px) {
                        .nav-text { display: none; } /* ซ่อน text ในมือถือ */
                        .nav-link { padding: 0.6rem; border-radius: 50%; } /* เปลี่ยนเป็นวงกลม */
                    }
                `}
            </style>

            <header className="modern-header" style={{ '--header-h': isAdmin ? '6.5rem' : '4.5rem' }}>
                {/* Left Section: Logo or Back Button */}
                <div className="header-left">
                    {onBack ? (
                        <button onClick={onBack} className="btn-back" title="ย้อนกลับ">
                            <BackIcon />
                        </button>
                    ) : (
                        logoSrc && (
                            <img
                                src={logoSrc}
                                alt="Logo"
                                className="header-logo"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23007bff\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial,Helvetica,sans-serif\'%3EH%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        )
                    )}
                </div>

                {/* Center Section: Title */}
                <div className="header-title">
                    {title}
                </div>

                {/* Right Section: Navigation */}
                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* Home Icon for Patient - ซ้ายสุด */}
                    {isPatient && (
                        <NavLink 
                            to="/patient/home" 
                            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                color: '#64748b',
                                gap: '4px'
                            }}
                        >
                            <HomeIcon />
                            
                        </NavLink>
                    )}

                    {/* Language selector moved below (after profile) per UX request */}
                    
                    {/* Appointments Icon for Patient */}
                    {isPatient && (
                        <NavLink 
                            to="/patient/appointments" 
                            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                color: '#64748b',
                                gap: '4px'
                            }}
                        >
                            <CalendarIcon />
                          
                        </NavLink>
                    )}
                    
                    {/* Notification Icon for Patient - Dropdown */}
                    {isPatient && (
                        <div className="notification-container" style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNotifications(!showNotifications);
                                }}
                                style={{ 
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: showNotifications ? '#007bff' : '#64748b',
                                    gap: '4px',
                                    padding: '0.5rem'
                                }}
                            >
                                <style>{animateBell ? `@keyframes wiggle { 0% { transform: rotate(0); } 15% { transform: rotate(-15deg); } 30% { transform: rotate(12deg); } 45% { transform: rotate(-8deg); } 60% { transform: rotate(6deg); } 75% { transform: rotate(-4deg); } 100% { transform: rotate(0);} }
                                    .bell-wiggle { display: inline-block; transform-origin: center bottom; animation: wiggle 1s ease-in-out; }` : ''}</style>
                                <span className={animateBell ? 'bell-wiggle' : ''}><BellIcon /></span>
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '10px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: '2px solid #fff'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: '0',
                                    marginTop: '8px',
                                    width: '360px',
                                    maxHeight: '450px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                    zIndex: 9999,
                                    overflow: 'hidden'
                                }}>
                                    {/* Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                                                {t('notifications')}
                                            </h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#007bff',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {t('markAllAsRead')}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Notification List */}
                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{
                                                padding: '40px 20px',
                                                textAlign: 'center',
                                                color: '#9ca3af'
                                            }}>
                                                <BellIcon />
                                                <p style={{ margin: '12px 0 0' }}>{t('noNotifications')}</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif, index) => (
                                                <div
                                                    key={notif.id || index}
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        setShowNotifications(false);
                                                        // นำไปหน้านัดหมายถ้าเป็นแจ้งเตือนนัดหมาย
                                                        if (notif.type === 'appointment') {
                                                            navigate('/patient/appointments');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '14px 20px',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        cursor: 'pointer',
                                                        backgroundColor: notif.read ? 'white' : '#f0f9ff',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'white' : '#f0f9ff'}
                                                >
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            backgroundColor: notif.type === 'appointment' ? '#dbeafe' : '#fef3c7',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '16px',
                                                            flexShrink: 0
                                                        }}>
                                                            {notif.type === 'appointment' ? '📅' : '🔔'}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                margin: 0,
                                                                fontSize: '14px',
                                                                color: '#1e293b',
                                                                fontWeight: notif.read ? '400' : '500',
                                                                lineHeight: '1.4',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {notif.message}
                                                            </p>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#9ca3af',
                                                                marginTop: '4px',
                                                                display: 'block'
                                                            }}>
                                                                {notif.timestamp ? new Date(notif.timestamp).toLocaleString('th-TH', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) : ''}
                                                            </span>
                                                        </div>
                                                        {!notif.read && (
                                                            <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#3b82f6',
                                                                flexShrink: 0
                                                            }}></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    {/* Footer - View All */}
                                    <div style={{
                                        padding: '12px 20px',
                                        borderTop: '1px solid #e5e7eb',
                                        textAlign: 'center'
                                    }}>
                                            <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                navigate('/patient/notifications');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#007bff',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            >
                                            {t('viewAll')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Profile Icon for Patient - ข้างขวาของแจ้งเตือน */}
                    {isPatient && (
                        <NavLink 
                            to="/patient/profile" 
                            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                color: '#64748b',
                                gap: '4px'
                            }}
                        >
                            <ProfileIcon />
                            <span style={{ fontSize: '12px', fontWeight: '500' }}></span>
                        </NavLink>
                    )}
                    {/* Move language selector to after profile */}
                    <div ref={langRef} style={{ display: 'flex', alignItems: 'center', marginLeft: 8, position: 'relative' }}>
                        <style>{`
                            .lang-btn { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:20px; border:1px solid #eef2ff; background: linear-gradient(180deg,#ffffff,#f8fafc); box-shadow:0 6px 18px rgba(30,64,175,0.06); cursor:pointer; color:#1f2937; font-weight:600; }
                            .lang-btn:hover { transform: translateY(-1px); box-shadow:0 10px 30px rgba(30,64,175,0.12); }
                            .lang-flag { font-size:18px; }
                            .lang-label { font-size:13px; display:inline-block; min-width:36px; text-align:left; }
                            .lang-caret { margin-left:4px; color:#64748b; font-size:12px; }
                            .lang-menu { position:absolute; right:0; margin-top:8px; background: white; border-radius:12px; box-shadow:0 12px 40px rgba(2,6,23,0.12); min-width:160px; overflow:hidden; border:1px solid #eef2ff; z-index:1200; }
                            .lang-menu button { width:100%; display:flex; gap:8px; align-items:center; padding:10px 12px; background:transparent; border:none; cursor:pointer; text-align:left; color:#334155; font-weight:600; }
                            .lang-menu button:hover { background:#f8fafc; color:#0b5cff; }
                            .lang-menu .selected { background:#eff6ff; color:#0b5cff; }
                        `}</style>
                        <button
                            className="lang-btn"
                            aria-label={t('language')}
                            title={t('language')}
                            onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                        >
                            <span className="lang-label">{language === 'th' ? 'TH' : 'EN'}</span>
                            <span className="lang-caret">▾</span>
                        </button>

                        {showLangMenu && (
                            <div className="lang-menu" role="menu" aria-hidden={!showLangMenu}>
                                <button
                                    className={language === 'th' ? 'selected' : ''}
                                    onClick={() => { setLanguage('th'); setShowLangMenu(false); }}
                                >
                                    <span style={{fontWeight:700}}>TH</span>
                                </button>
                                <button
                                    className={language === 'en' ? 'selected' : ''}
                                    onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                                >
                                    <span style={{fontWeight:700}}>EN</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isAdmin && (
                        /* Render admin inline menu inside header-right */
                        <NavbarAdmin inline={true} />
                    )}
                </div>
            </header>

            {/* Spacer to push content down */}
            <div style={{ height: 'var(--header-h)' }}></div>
        </>
    );
}

export default Header;