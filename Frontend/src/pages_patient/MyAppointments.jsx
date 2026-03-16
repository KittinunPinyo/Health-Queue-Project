import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// (CSS ถูก import ใน main.jsx แล้ว)

// (Component: Modal รายละเอียด)
function AppointmentDetailModal({ appointment, user, isOpen, onClose }) {
    const { t } = useLanguage();
    if (!isOpen || !appointment || !user) return null;

    const profile = user.healthProfile || {};
    const a = appointment; 

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
                    <h4>{t('appointmentInfo')}</h4>
                    <p><strong>{t('doctor')}:</strong> {a.selectedDoctor || a.doctor?.name || '-'}</p>
                    <p><strong>{t('clinic')}:</strong> {a.clinic?.name}</p>
                    <p><strong>{t('dateTime')}:</strong> {a.date} {t('time')} {a.time}</p>
                    <p><strong>{t('packageService')}:</strong> {a.appointmentType || a.package || '-'}</p>
                    
                    {/* แสดงรอบนัดหมายทั้งหมด */}
                    {a.appointments && a.appointments.length > 0 && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '12px',
                            border: '2px solid #3b82f6'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.95rem',
                                color: '#1e40af',
                                fontWeight: '700',
                                marginBottom: '0.75rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid #bfdbfe'
                            }}>
                                <span>📅</span>
                                {t('selectedAppointmentRounds')}
                            </div>
                            {a.appointments.map((apt, index) => (
                                apt.date && apt.time && (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        backgroundColor: index === 0 ? '#dbeafe' : '#eff6ff',
                                        borderRadius: '8px',
                                        marginBottom: index < a.appointments.length - 1 ? '0.5rem' : 0,
                                        border: index === 0 ? '2px solid #3b82f6' : '1px solid #bfdbfe'
                                    }}>
                                        <span style={{
                                            backgroundColor: index === 0 ? '#1e40af' : index === 1 ? '#3b82f6' : '#60a5fa',
                                            color: 'white',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            minWidth: '55px',
                                            textAlign: 'center'
                                        }}>
                                            {t('round')} {index + 1}{index === 0 ? ' ★' : ''}
                                        </span>
                                        <div style={{flex: 1}}>
                                            <div style={{fontSize: '0.9rem', color: '#1e293b', fontWeight: '600'}}>
                                                {apt.date}
                                            </div>
                                            <div style={{fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500'}}>
                                                ⏰ {t('atTime')} {apt.time}
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <span style={{
                                                backgroundColor: '#fef3c7',
                                                color: '#d97706',
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                fontWeight: '600'
                                            }}>
                                                {t('primary')}
                                            </span>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                    
                    {a.symptoms && (
                        <div className="symptom-box" style={{ marginTop: '1rem' }}>
                            <strong>{t('initialSymptoms')}:</strong>
                            <p>{a.symptoms}</p>
                        </div>
                    )}
                    
                    {a.status === 'rejected' && (
                        <div className="rejection-reason" style={{ marginTop: '1rem' }}>
                            <strong>{t('adminReason')}:</strong>
                            <p>{a.rejectionReason}</p>
                        </div>
                    )}

                    {a.status === 'confirmed' && (
                        <div className="patient-health-info" style={{ marginTop: '1rem', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <strong style={{ color: '#389e0d' }}>{t('advice')}:</strong>
                            <p>{t('arriveEarly')}</p>
                        </div>
                    )}
                    
                    <hr />
                    <h4>{t('yourHealthInfo')}</h4>
                    <p><strong>{t('ageGender')}:</strong> {profile.age || 'N/A'} {t('years')} / {profile.gender || 'N/A'}</p>
                    <p><strong>{t('heightWeight')}:</strong> {profile.height || 'N/A'} {t('cm')} / {profile.weight || 'N/A'} {t('kg')}</p>
                    <p><strong>{t('chronicDiseases')}:</strong> {profile.conditions || t('none')}</p>
                    <p><strong>{t('drugAllergies')}:</strong> {profile.allergies || t('none')}</p>
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
        let statusHtml = '';
        let cardClass = '';

        switch(a.status) {
            case 'confirmed':
                cardClass = 'status-confirmed';
                statusHtml = <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> {t('confirmed')}</h3>;
                break;
            case 'rejected':
                cardClass = 'status-rejected';
                statusHtml = <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> {t('rejected')}</h3>;
                break;
            default: // 'new' or 'approved'
                cardClass = 'status-pending';
                statusHtml = <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {t('pending')}</h3>;
                break;
        }

        return (
            <div 
                key={a.id} 
                className={`card appointment-card ${cardClass}`} 
                onClick={() => handleViewDetail(a.id)}
                style={{cursor: 'pointer'}}
            >
                {statusHtml}
                <p><strong>{t('doctor')}:</strong> {a.selectedDoctor || a.doctor?.name || '-'}</p>
                <p><strong>{t('clinic')}:</strong> {a.clinic?.name || '-'}</p>
                <p><strong>{t('dateTime')}:</strong> {a.date} {t('time')} {a.time}</p>
                {a.status === 'rejected' && (
                    <p><strong>{t('reason')}:</strong> {a.rejectionReason.substring(0, 50)}...</p>
                )}
            </div>
        );
    };

    // --- Render ---
    return (
        <>
            {/* (Layout จะใส่ Header ให้) */}
            <div id="page-myappointments" className="page active">
                <main className="container" id="appointments-list">
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
                        <p className="text-center">{t('noAppointments')}</p>
                    ) : (
                        <>
                            {upcomingAppointments.length > 0 && (
                                <>
                                    <h3 className="appointment-list-header">{t('pendingAppointments')}</h3>
                                    {upcomingAppointments.map(renderCard)}
                                </>
                            )}
                            
                            {historyAppointments.length > 0 && (
                                <>
                                    <h3 className="appointment-list-header">{t('appointmentHistory')}</h3>
                                    {upcomingAppointments.length > 0 && <div className="appointment-divider"></div>}
                                    {historyAppointments.map(renderCard)}
                                </>
                            )}
                        </>
                    )}
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