import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './MyAppointments.css';

const normalizeSelectableText = (value, fallback = 'ไม่ได้เลือก') => {
    const text = String(value || '').trim();
    if (!text || text === '-' || text === 'ไม่ระบุ' || text.toLowerCase() === 'n/a') {
        return fallback;
    }
    return text;
};

const getRequestedTimeSlots = (appointment) => {
    const sourceSlots = Array.isArray(appointment?.appointments)
        ? appointment.appointments.slice(0, 3)
        : [];

    if (sourceSlots.length > 0) {
        return sourceSlots.map((apt) => ({
            date: apt?.date || '-',
            time: apt?.time || '-'
        }));
    }

    const fallbackFirst = {
        date: appointment?.date || '-',
        time: appointment?.time || '-'
    };

    return [
        fallbackFirst,
        { date: '-', time: '-' },
        { date: '-', time: '-' }
    ];
};

// (Component: Modal รายละเอียด)
function AppointmentDetailModal({ appointment, user, isOpen, onClose }) {
    const { t } = useLanguage();
    if (!isOpen || !appointment || !user) return null;

    const a = appointment; 
    const notSelected = 'ไม่ได้เลือก';
    const department = normalizeSelectableText(a.selectedSpecialtyDetail || a.selectedSpecialty || a.doctor?.specialty, notSelected);
    const doctorName = normalizeSelectableText(a.selectedDoctor || a.doctor?.name, notSelected);
    const requestedSlots = getRequestedTimeSlots(a);
    const isPending = a.status === 'new' || a.status === 'approved';

    let statusHtml = '';
    if (a.status === 'confirmed') {
        statusHtml = <h3 style={{ color: 'var(--success-color)' }}>{t('status')}: {t('confirmed')}</h3>;
    } else if (a.status === 'rejected') {
        statusHtml = <h3 style={{ color: 'var(--danger-color)' }}>{t('status')}: {t('rejected')}</h3>;
    } else {
        statusHtml = <h3 style={{ color: 'var(--secondary-color)' }}>{t('status')}: {t('pending')}</h3>;
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            id="appointment-detail-modal" 
            className="modal-overlay active"
            onClick={handleBackdropClick}
        >
            <div className="modal-content">
                <button id="close-appointment-modal-btn" className="modal-close-btn" onClick={onClose}>&times;</button>
                <div id="appointment-detail-content">
                    {statusHtml}
                    <hr />
                    <h4 className="appointment-detail-title">{t('appointmentInfo')}</h4>
                    <p className="appointment-detail-row"><strong>รหัสนัดหมาย:</strong> {a.id || '-'}</p>
                    <p className="appointment-detail-row"><strong>{t('doctor')}:</strong> {doctorName}</p>
                    <p className="appointment-detail-row"><strong>แผนก:</strong> {department}</p>
                    <p className="appointment-detail-row"><strong>{t('clinic')}:</strong> {a.clinic?.name || '-'}</p>
                    {isPending ? (
                        <div className="requested-slots-block">
                            <strong>เวลาจอง:</strong>
                            <div className="requested-slots-list">
                                {requestedSlots.map((slot, index) => (
                                    <p key={`${slot.date}-${slot.time}-${index}`} className="requested-slot-item">
                                        <span className="requested-slot-index">ช่วงที่ {index + 1}</span>
                                        <span>{slot.date} {t('time')} {slot.time}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="appointment-detail-row"><strong>{t('dateTime')}:</strong> {a.date || '-'} {t('time')} {a.time || '-'}</p>
                    )}
                    <p className="appointment-detail-row"><strong>{t('adminReason')}:</strong> {a.rejectionReason || '-'}</p>
                </div>
            </div>
        </div>
    );
}

// (Component: หน้าหลักนัดหมาย)
function MyAppointments() {
    const { t } = useLanguage();
    // --- State ---
    const [allRequests, setAllRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [backendAvailable, setBackendAvailable] = useState(true);
    // (เราไม่ต้องการ useNavigate ที่นี่แล้ว เพราะ ProtectedRoute จัดการ)

    // --- Effect (เมื่อคอมโพเนนต์โหลด) ---
    useEffect(() => {
        // (หน้านี้ถูก ProtectedRoute คุ้มครองอยู่แล้ว)
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        setCurrentUser(user);

        // (อ่าน DB จาก localStorage เป็น fallback)
        const requests = JSON.parse(localStorage.getItem('requests')) || [];
        setAllRequests(requests);

        // ลองโหลดข้อมูลจาก backend API (ถ้ามี)
        if (user?.id) {
            fetch(`/api/appointments?userId=${encodeURIComponent(user.id)}`)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then((apiRequests) => {
                    if (Array.isArray(apiRequests) && apiRequests.length > 0) {
                        setAllRequests(apiRequests);
                    }
                    setBackendAvailable(true);
                })
                .catch((err) => {
                    console.warn('ไม่สามารถโหลดข้อมูลจาก API ได้:', err);
                    setBackendAvailable(false);
                });
        }
    }, []); // (ทำงานแค่ครั้งเดียว)

    // --- Memoized Data (กรองข้อมูล) ---
    const myAppointments = useMemo(() => {
        if (!currentUser) return [];
        return allRequests
            .filter(r => r.patient?.id === currentUser.id)
            .sort((a, b) => b.id - a.id); // (เรียงล่าสุดอยู่บน)
    }, [allRequests, currentUser]);

    const upcomingAppointments = useMemo(() => 
        myAppointments.filter(a => a.status === 'new' || a.status === 'approved')
    , [myAppointments]);
    
    const historyAppointments = useMemo(() => 
        myAppointments.filter(a => a.status === 'confirmed' || a.status === 'rejected')
    , [myAppointments]);

    // --- Handlers ---
    const handleViewDetail = (id) => {
        const appointment = allRequests.find(r => r.id === id);
        if (appointment) {
            setSelectedAppointment(appointment);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };

    const renderCard = (a) => {
        let statusText = '';
        let statusIcon = null;
        let cardClass = '';
        const notSelected = 'ไม่ได้เลือก';
        const department = normalizeSelectableText(a.selectedSpecialtyDetail || a.selectedSpecialty || a.doctor?.specialty, notSelected);
        const doctorName = normalizeSelectableText(a.selectedDoctor || a.doctor?.name, notSelected);
        const requestedSlots = getRequestedTimeSlots(a);
        const isPending = a.status === 'new' || a.status === 'approved';

        switch(a.status) {
            case 'confirmed':
                cardClass = 'status-confirmed';
                statusText = t('confirmed');
                statusIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
                break;
            case 'rejected':
                cardClass = 'status-rejected';
                statusText = t('rejected');
                statusIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
                break;
            default: // 'new' or 'approved'
                cardClass = 'status-pending';
                statusText = t('pending');
                statusIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
                break;
        }

        return (
            <div 
                key={a.id} 
                className={`card appointment-card ${cardClass}`} 
                onClick={() => handleViewDetail(a.id)}
                style={{cursor: 'pointer'}}
            >
                <div className="card-main">
                    <h3 className="card-title">{doctorName}</h3>
                    <p><strong>รหัสนัดหมาย:</strong> {a.id || '-'}</p>
                    <p><strong>{t('clinic')}:</strong> {a.clinic?.name || '-'}</p>
                    <p><strong>แผนก:</strong> {department}</p>
                    {isPending ? (
                        <div className="requested-slots-block">
                            <strong>เวลาจอง:</strong>
                            <div className="requested-slots-list">
                                {requestedSlots.map((slot, index) => (
                                    <p key={`${slot.date}-${slot.time}-${index}`} className="requested-slot-item">
                                        <span className="requested-slot-index">ช่วงที่ {index + 1}</span>
                                        <span>{slot.date} {t('time')} {slot.time}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p><strong>{t('dateTime')}:</strong> {a.date} {t('time')} {a.time}</p>
                    )}
                    {a.status === 'rejected' && (
                        <p><strong>{t('reason')}:</strong> {a.rejectionReason?.substring(0, 50) || '-'}...</p>
                    )}
                </div>
                <div className="card-status">
                    <span className="status-pill">{statusIcon}{statusText}</span>
                </div>
            </div>
        );
    };

    // --- Render ---
    return (
        <>
            {/* (Layout จะใส่ Header ให้) */}
            <div id="page-myappointments" className="page active myappointments-page" style={{ paddingTop: '72px', paddingBottom: '88px' }}>
                <main className="appointments-container" id="appointments-list">
                    <section className="appointments-hero">
                        <div className="hero-icon">🩺</div>
                        <div className="appointments-hero-content">
                            <div className="appointments-chip">{t('myAppointments')}</div>
                            <h2 className="appointments-hero-title">{t('myAppointments') || 'การนัดหมายของฉัน'}</h2>
                            <p className="appointments-hero-desc">ติดตามสถานะการนัดหมายของคุณ ดูการนัดหมายที่กำลังรอและประวัติการเข้ารับบริการในที่เดียว</p>
                            <div className="hero-stats">
                                <div className="stat-card">
                                    <strong>{upcomingAppointments.length}</strong>
                                    <span>{t('pendingAppointments') || 'นัดหมายรอดำเนินการ'}</span>
                                </div>
                                <div className="stat-card">
                                    <strong>{historyAppointments.length}</strong>
                                    <span>{t('appointmentHistory') || 'ประวัติการนัดหมาย'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="appointments-main-panel">
                        {!backendAvailable && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                marginBottom: '1rem',
                                borderRadius: '12px',
                                backgroundColor: '#fef3f3',
                                border: '1px solid #f4c7c3',
                                color: '#a61a1a'
                            }}>
                                {t('backendUnavailableNotice') || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ ระบบจะใช้ข้อมูลจากเครื่องเท่านั้น'}
                            </div>
                        )}

                        {myAppointments.length === 0 ? (
                            <div className="empty-state">
                                <strong>{t('noAppointments')}</strong>
                                <p>{t('appointmentsEmptyMessage') || 'ยังไม่มีการนัดหมายในระบบ คุณสามารถจองคิวได้จากหน้าคลินิก'}</p>
                            </div>
                        ) : (
                            <>
                                {upcomingAppointments.length > 0 && (
                                    <div className="pending-block">
                                        <section className="appointment-section">
                                            <h3 className="appointment-list-header">{t('pendingAppointments')}</h3>
                                            {upcomingAppointments.map(renderCard)}
                                        </section>
                                    </div>
                                )}

                                {historyAppointments.length > 0 && (
                                    <section className="appointment-section">
                                        <h3 className="appointment-list-header">{t('appointmentHistory')}</h3>
                                        {upcomingAppointments.length > 0 && <div className="appointment-divider"></div>}
                                        {historyAppointments.map(renderCard)}
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
            
            <AppointmentDetailModal 
                appointment={selectedAppointment}
                user={currentUser}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
}

export default MyAppointments;