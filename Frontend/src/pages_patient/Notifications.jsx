import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// (CSS ถูก import ใน main.jsx แล้ว)

/**
 * (Helper: สั่งซ่อน Badge ที่ Navbar ทันทีเมื่อเปิดหน้านี้)
 */
function updateNotificationBadgeOnLoad() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) return; 

        const badge = document.getElementById('patient-notification-badge');
        if (badge) {
            badge.style.display = 'none'; // (บังคับซ่อนทันที)
        }
    } catch (e) {
        console.error("Failed to update notification badge:", e);
    }
}


function Notifications() {
    const { t, language } = useLanguage();
    // --- State ---
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // --- Effect (เมื่อคอมโพเนนต์โหลด) ---
    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        setCurrentUser(user);
        
        let allNotifs = JSON.parse(localStorage.getItem('notifications')) || [];
        
        // (Logic: Mark as read)
        // ตรวจสอบว่ามีการแจ้งเตือนไหนบ้างที่เป็นของเรา (หรือของส่วนกลาง) ที่ยังไม่อ่าน
        let markedAsRead = false;
        allNotifs.forEach(n => {
            if ((n.patientId === user.id || n.patientId === 'all') && !n.read) {
                n.read = true;
                markedAsRead = true;
            }
        });
        
        // (ถ้ามีการเปลี่ยนแปลง ให้บันทึกกลับลง LocalStorage)
        if (markedAsRead) {
            localStorage.setItem('notifications', JSON.stringify(allNotifs));
            // (สั่งอัปเดต UI ที่ Navbar ทันที)
            updateNotificationBadgeOnLoad();
            try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'marked-as-read' } })); } catch(e) {}
        }

        setNotifications(allNotifs);

    }, []); // (ทำงานแค่ครั้งเดียวตอนโหลดหน้า)

    // --- Memoized Data (กรองและเรียงข้อมูล) ---
    const myNotifications = useMemo(() => {
        if (!currentUser) return [];
        return notifications
            // กรองเอาเฉพาะของ: ตัวเอง (patientId ตรงกัน) หรือ ข่าวสารส่วนกลาง (all)
            .filter(n => n.patientId === currentUser.id || n.patientId === 'all')
            // เรียงวันที่ล่าสุดขึ้นก่อน (descending)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [notifications, currentUser]);
    
    // --- Helper: แปลงวันที่เป็นภาษาไทย ---
    const formatDate = (isoString) => {
        const dateObj = new Date(isoString);
        const locale = language === 'th' ? 'th-TH' : 'en-US';
        const dateStr = dateObj.toLocaleDateString(locale, { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = dateObj.toLocaleTimeString(locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return { dateStr, timeStr };
    };

    // --- Handlers (Render Card) ---
    const renderNotificationCard = (n) => {
        
        // 🔹 กรณีที่ 1: ข่าวสารระบบ (เพิ่มรพ./หมอ) 🔹
        if (n.type === 'system') {
            const { dateStr, timeStr } = formatDate(n.timestamp);
            
            return (
                <div 
                    key={n.id} 
                    className="card appointment-card status-system read" 
                    style={{ 
                        borderLeft: '5px solid #007bff', 
                        backgroundColor: '#f0f8ff', 
                        marginBottom: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    <div className="notification-item">
                        <p style={{ color: '#007bff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                            <strong>📢 {t('systemUpdate')}</strong>
                        </p>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                            {t('atDateTime')} {dateStr} {t('time')} {timeStr} {t('updateMessage')}: <br/>
                            <span style={{ fontWeight: '500', color: '#333', display:'block', marginTop:'5px' }}>
                                "{n.message}"
                            </span>
                        </p>
                    </div>
                </div>
            );
        }

        // 🔹 กรณีที่ 2: แจ้งเตือนนัดหมาย (ส่วนตัว) 🔹
        let icon, cardClass, title;
        switch (n.type) {
            case 'confirmed':
                icon = '✅';
                title = t('appointmentConfirmed');
                cardClass = 'status-confirmed';
                break;
            case 'rejected':
                icon = '❌';
                title = t('appointmentRejected');
                cardClass = 'status-rejected';
                break;
            default:
                icon = 'ℹ️';
                title = t('notification');
                cardClass = '';
        }

        const { dateStr, timeStr } = formatDate(n.timestamp);

        return (
            <div key={n.id} className={`card appointment-card ${cardClass} read`}>
                <div className="notification-item">
                    <p style={{ fontSize: '1.05rem' }}><strong>{icon} {title}</strong></p>
                    <p style={{ margin: '0.5rem 0' }}>{n.message}</p>
                    <small style={{ color: '#888' }}>
                        {dateStr} {t('time')} {timeStr}
                    </small>
                </div>
            </div>
        );
    };

    // --- Render ---
    return (
        // (Layout จะใส่ Header ให้)
        <div id="page-notifications" className="page active">
            <main className="container" id="notifications-list">
                
                {myNotifications.length === 0 ? (
                    <div className="text-center" style={{ marginTop: '3rem', color: '#888' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📭</div>
                        <p>{t('noNotifications')}</p>
                    </div>
                ) : (
                    <>
                        <h3 className="notification-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            {t('notificationList')}
                        </h3>
                        <div style={{ marginTop: '1rem' }}>
                            {myNotifications.map(renderNotificationCard)}
                        </div>
                    </>
                )}
                
            </main>
        </div>
    );
}

export default Notifications;