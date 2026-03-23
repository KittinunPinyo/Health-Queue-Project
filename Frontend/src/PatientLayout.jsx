import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import './components/Footer.css'; // เรียกใช้ CSS จัดหน้า Layout ที่เราสร้างใหม่

const getHeaderProps = (pathname, t) => {
    if (pathname.includes('/patient/home')) return { title: t('home'), onBack: null };
    if (pathname.includes('/patient/clinic-detail')) return { title: t('makeAppointment'), onBack: true };
    if (pathname.includes('/patient/appointments')) return { title: t('myAppointments'), onBack: null };
    if (pathname.includes('/patient/notifications')) return { title: t('notifications'), onBack: null };
    if (pathname.includes('/patient/chat')) return { title: t('chat'), onBack: null };
    if (pathname.includes('/patient/profile')) return { title: t('profile'), onBack: null };
    return { title: 'Health Queue', onBack: null };
};

function updateNotificationBadge() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || currentUser.role === 'admin') return; 

        const notifications = JSON.parse(localStorage.getItem('notifications')) || []; 
        const unreadCount = notifications.filter(n => 
            (n.patientId === currentUser.id || n.patientId === 'all') && !n.read
        ).length;
        
        const badge = document.getElementById('patient-notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'flex'; 
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        console.error("Failed to update notification badge:", e);
    }
}

function PatientLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const headerProps = getHeaderProps(location.pathname, t);
    const onBackClick = headerProps.onBack ? () => navigate(-1) : null; 

    useEffect(() => {
        updateNotificationBadge();
    }, [location.pathname]);

    return (
        // ใช้ class "page-container" จาก FooterLayout.css เพื่อทำ Flexbox แนวตั้ง
        <div className="page-container">
            
            <Header title={headerProps.title} onBack={onBackClick} />

            {/* ใช้ class "content-wrap" ครอบ Outlet เพื่อให้ส่วนนี้ขยายเต็มพื้นที่ว่าง 
                paddingTop: '72px' ใส่ที่นี่เพื่อให้เนื้อหาไม่โดน Header บัง
            */}
            <div className="content-wrap" style={{ paddingTop: '72px', paddingBottom: '88px' }}>
                <Outlet />
            </div>
            {/* Footer อยู่นอก content-wrap จะถูกดันไปล่างสุดเสมอ */}
            <Footer />

            {/* Chat widget สำหรับสอบถาม */}
            <ChatWidget />
            
        </div>
    );
}

export default PatientLayout;