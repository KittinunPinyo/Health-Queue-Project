import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function updateNotificationBadgeOnLoad() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) return;
        const badge = document.getElementById('patient-notification-badge');
        if (badge) badge.style.display = 'none';
    } catch (e) {}
}

// ── config per notification type ──────────────────────────────────────────────
const TYPE_CONFIG = {
    system: {
        gradient: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
        lightBg:  'linear-gradient(135deg,rgba(219,234,254,0.7) 0%,rgba(224,242,254,0.5) 100%)',
        border:   'rgba(59,130,246,0.25)',
        iconBg:   'linear-gradient(135deg,#3b82f6,#2563eb)',
        icon:     '📢',
        tag:      { bg: '#dbeafe', color: '#1e40af', label: 'ข่าวสารอัพเดท' },
    },
    confirmed: {
        gradient: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)',
        lightBg:  'linear-gradient(135deg,rgba(220,252,231,0.7) 0%,rgba(187,247,208,0.4) 100%)',
        border:   'rgba(34,197,94,0.25)',
        iconBg:   'linear-gradient(135deg,#22c55e,#16a34a)',
        icon:     '✅',
        tag:      { bg: '#dcfce7', color: '#15803d', label: 'ยืนยันนัดหมาย' },
    },
    rejected: {
        gradient: 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)',
        lightBg:  'linear-gradient(135deg,rgba(254,226,226,0.7) 0%,rgba(254,202,202,0.4) 100%)',
        border:   'rgba(239,68,68,0.25)',
        iconBg:   'linear-gradient(135deg,#ef4444,#dc2626)',
        icon:     '❌',
        tag:      { bg: '#fee2e2', color: '#b91c1c', label: 'ปฏิเสธนัดหมาย' },
    },
    default: {
        gradient: 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)',
        lightBg:  'linear-gradient(135deg,rgba(237,233,254,0.7) 0%,rgba(221,214,254,0.4) 100%)',
        border:   'rgba(139,92,246,0.25)',
        iconBg:   'linear-gradient(135deg,#8b5cf6,#7c3aed)',
        icon:     'ℹ️',
        tag:      { bg: '#ede9fe', color: '#6d28d9', label: 'การแจ้งเตือน' },
    },
};

function Notifications() {
    const { t, language } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser]     = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        setCurrentUser(user);
        let allNotifs = JSON.parse(localStorage.getItem('notifications')) || [];
        let changed = false;
        allNotifs.forEach(n => {
            if ((n.patientId === user?.id || n.patientId === 'all') && !n.read) {
                n.read = true; changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('notifications', JSON.stringify(allNotifs));
            updateNotificationBadgeOnLoad();
            try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'marked-as-read' } })); } catch(e) {}
        }
        setNotifications(allNotifs);
    }, []);

    const myNotifications = useMemo(() => {
        if (!currentUser) return [];
        return notifications
            .filter(n => n.patientId === currentUser.id || n.patientId === 'all')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [notifications, currentUser]);

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        const locale = language === 'th' ? 'th-TH' : 'en-US';
        return {
            dateStr: d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
            timeStr: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const renderCard = (n) => {
        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
        const { dateStr, timeStr } = formatDate(n.timestamp);

        return (
            <div key={n.id} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: cfg.lightBg,
                border: `1px solid ${cfg.border}`,
                borderRadius: '18px',
                padding: '20px 22px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.18s, box-shadow 0.18s',
                cursor: 'default',
            }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'; }}
            >
                {/* Icon circle */}
                <div style={{
                    flexShrink: 0, width: '48px', height: '48px', borderRadius: '14px',
                    background: cfg.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                    {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tag + time row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: cfg.tag.bg, color: cfg.tag.color,
                            fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em',
                            padding: '3px 10px', borderRadius: '999px',
                        }}>
                            {cfg.tag.label}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            🕐 {timeStr} · {dateStr}
                        </span>
                    </div>

                    {/* Message */}
                    <p style={{
                        margin: 0, fontSize: '14px', lineHeight: '1.65',
                        color: '#1e293b', fontFamily: "'Sarabun','Prompt',sans-serif",
                    }}>
                        {n.type === 'system'
                            ? <><span style={{ fontWeight: '600' }}>{t('updateMessage') || 'อัพเดท'}:</span>{' '}&ldquo;{n.message}&rdquo;</>
                            : n.message
                        }
                    </p>
                </div>

                {/* Accent bar on right edge */}
                <div style={{
                    flexShrink: 0, width: '4px', borderRadius: '99px',
                    background: cfg.gradient, alignSelf: 'stretch', minHeight: '40px',
                }} />
            </div>
        );
    };

    return (
        <div id="page-notifications" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0f7ff 0%,#e8f4fd 50%,#f5f0ff 100%)', fontFamily: "'Sarabun','Prompt',sans-serif" }}>

            {/* ── Hero Header ───────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg,#1e40af 0%,#2563eb 60%,#4f46e5 100%)',
                padding: '120px 24px 72px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* decorative blobs */}
                <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'260px', height:'260px', borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:'-40px', left:'10%', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

                <div style={{ position:'relative', zIndex:1, maxWidth:'680px', margin:'0 auto', textAlign:'center' }}>
                    <div style={{
                        display:'inline-flex', alignItems:'center', gap:'8px',
                        background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                        borderRadius:'999px', padding:'6px 18px', marginBottom:'18px',
                    }}>
                        <span style={{ fontSize:'16px' }}>🔔</span>
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'rgba(255,255,255,0.9)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Notifications</span>
                    </div>
                    <h1 style={{ margin:'0 0 10px', fontSize:'clamp(22px,4vw,32px)', fontWeight:'800', color:'white', letterSpacing:'-0.02em' }}>
                        {t('notificationList') || 'รายการแจ้งเตือนล่าสุด'}
                    </h1>
                    <p style={{ margin:0, color:'rgba(191,219,254,0.9)', fontSize:'15px' }}>
                        {myNotifications.length > 0 ? `${myNotifications.length} รายการ` : 'ไม่มีการแจ้งเตือนขณะนี้'}
                    </p>
                </div>
            </div>

            {/* ── Card List ─────────────────────────────────────────────── */}
            <main style={{ maxWidth: '700px', margin: '-40px auto 60px', padding: '0 20px', position: 'relative', zIndex: 1 }}>

                {myNotifications.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
                        borderRadius: '24px', border: '1px solid rgba(147,197,253,0.3)',
                        boxShadow: '0 8px 32px rgba(30,64,175,0.10)',
                        padding: '64px 32px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.35 }}>📭</div>
                        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: '700', fontSize: '18px' }}>ยังไม่มีการแจ้งเตือน</h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>การนัดหมายและข่าวสารจะปรากฏที่นี่</p>
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
                        borderRadius: '24px', border: '1px solid rgba(147,197,253,0.3)',
                        boxShadow: '0 8px 32px rgba(30,64,175,0.10)',
                        overflow: 'hidden',
                    }}>
                        {/* list header */}
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: '1px solid rgba(226,232,240,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>
                                {t('notificationList') || 'รายการแจ้งเตือน'}
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                                color: 'white', fontSize: '12px', fontWeight: '700',
                                padding: '3px 12px', borderRadius: '999px',
                            }}>
                                {myNotifications.length} รายการ
                            </span>
                        </div>

                        {/* cards */}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {myNotifications.map(renderCard)}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Notifications;