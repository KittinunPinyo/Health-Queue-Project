import React, { useState, useEffect, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import axios from 'axios';
// (CSS ถูก import ใน main.jsx แล้ว)

// (Config EmailJS)
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "QWWAWjIdVvqW0oQSn",
    SERVICE_ID: "service_gbcxqzd",
    TEMPLATE_ID_NOTIFY_DOCTOR: "template_qje00uc" 
};

const generateId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function HomeAdmin() {
    // --- State ---
    const [view, setView] = useState('home'); // 'home', 'new', 'history'
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState({});
    
    // State สำหรับข้อความ
    const [rejectionMessages, setRejectionMessages] = useState({});
    const [adminMessages, setAdminMessages] = useState({});
    
    // State สำหรับเลือกรอบนัดหมายที่จะอนุมัติ
    const [selectedAppointmentRounds, setSelectedAppointmentRounds] = useState({});

    // --- Data Loading ---
    useEffect(() => {
        const storedRequests = JSON.parse(localStorage.getItem('requests')) || [];
        const storedUsers = JSON.parse(sessionStorage.getItem('users') || localStorage.getItem('users') || '[]');
        const storedNotifications = JSON.parse(localStorage.getItem('notifications')) || [];

        // Keep patient list in session storage only; remove old persistent copy.
        sessionStorage.setItem('users', JSON.stringify(storedUsers));
        localStorage.removeItem('users');
        
        setRequests(storedRequests);
        setUsers(storedUsers);
        setNotifications(storedNotifications);

        try {
            emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        } catch (e) {
            console.error("EmailJS SDK init failed.", e);
        }
    }, []);

    // --- Helpers ---
    const saveRequestsData = (updatedRequests) => {
        setRequests(updatedRequests);
        localStorage.setItem('requests', JSON.stringify(updatedRequests));
    };
    const saveNotifications = (updatedNotifications) => {
        setNotifications(updatedNotifications);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    };

    // --- Memoized Data ---
    const newRequests = useMemo(() => 
        requests.filter(r => r && r.status === 'new')
    , [requests]);

    // 🔹 [ADDED] ดึงข้อมูลประวัติ (ยืนยันแล้ว / ปฏิเสธแล้ว) 🔹
    const historyRequests = useMemo(() => 
        requests.filter(r => r && (r.status === 'confirmed' || r.status === 'rejected'))
                .sort((a, b) => b.id - a.id) // เรียงล่าสุดก่อน
    , [requests]);

    // --- Badge Update ---
    useEffect(() => {
        try {
            const badge = document.getElementById('admin-appointment-badge');
            if (badge) {
                const count = newRequests.length;
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        } catch (e) {
            console.error("Failed to update badge:", e);
        }
    }, [newRequests]);


    // --- Core Logic ---
    const createNotification = (patientId, type, message) => {
        const newNotification = {
            id: generateId(), patientId: patientId, type: type,
            message: message, timestamp: new Date().toISOString(), read: false
        };
        const updatedNotifications = [newNotification, ...notifications];
        saveNotifications(updatedNotifications);
        // Broadcast a small event so other components (Header) can refresh immediately
        try {
            window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { id: newNotification.id, type } }));
        } catch(e) { /* ignore if not supported */ }
    };

    const updateRequestStatus = (id, newStatus, extraData = {}) => {
        const updatedRequests = requests.map(r => {
            if (r.id === id) return { ...r, status: newStatus, ...extraData };
            return r;
        });
        saveRequestsData(updatedRequests);
    };

    const createAppointmentInApi = async (request) => {
        const response = await axios.post('/api/appointments', {
            ...request,
            status: request?.status || 'new',
        });
        return response?.data?.appointment || null;
    };

    const syncRequestStatusToApi = async (request, payload) => {
        const localId = request?.id;
        if (!localId) return null;

        try {
            const response = await axios.patch(`/api/appointments/${encodeURIComponent(localId)}/status`, payload);
            return response?.data?.appointment || null;
        } catch (error) {
            if (error?.response?.status === 404) {
                try {
                    const created = await createAppointmentInApi(request);
                    if (!created?.id) return null;

                    const retry = await axios.patch(
                        `/api/appointments/${encodeURIComponent(created.id)}/status`,
                        payload
                    );
                    return retry?.data?.appointment || created;
                } catch (retryError) {
                    console.error('Sync status to API failed after create fallback:', retryError);
                    return null;
                }
            }

            console.error('Sync status to API failed:', error);
            return null;
        }
    };

    // --- Handlers (Send Email / Confirm / Reject) ---

    const handleSendToDoctor = async (id) => {
        const request = requests.find(r => r.id === id);
        if (!request) { alert('ไม่พบคำขอ'); return; }

        setLoading(prev => ({ ...prev, [id]: true })); 

        const clinicName = request.clinic?.name || 'ไม่ระบุคลินิก';
        const packageName = request.package || 'นัดหมายทั่วไป';
        const symptoms = request.symptoms || 'ไม่มี';
        const patient = users.find(u => u.id === request.patient?.id);
        const targetEmail = request.patient?.email || patient?.email;
        const adminNote = adminMessages[id] || '-';

        // ดึงรอบนัดหมายที่ Admin เลือก (default = รอบแรก)
        const selectedRoundIndex = selectedAppointmentRounds[id] ?? 0;
        let appointmentDate = request.date;
        let appointmentTime = request.time;
        
        // ถ้ามี appointments array ให้ใช้รอบที่เลือก
        if (request.appointments && request.appointments.length > 0) {
            const selectedRound = request.appointments[selectedRoundIndex];
            if (selectedRound) {
                appointmentDate = selectedRound.date;
                appointmentTime = selectedRound.time;
            }
        }

        if (!targetEmail) {
            alert('ไม่พบอีเมลของคนไข้!');
            setLoading(prev => ({ ...prev, [id]: false }));
            return;
        }

        try {
            const doctorName = request.selectedDoctor || request.doctor?.name || 'แพทย์ที่เลือก';
            
            await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_NOTIFY_DOCTOR, {
                email: targetEmail, 
                status_text: "ยืนยันการนัดหมายเรียบร้อยแล้ว", 
                doctor_name: doctorName,
                clinic_name: clinicName,
                appointment_date: appointmentDate, 
                appointment_time: appointmentTime,
                package_name: packageName,
                symptoms: symptoms,
                patient_name: request.patient.name,
                admin_message: adminNote 
            });
            
            const message = `นัดหมายของคุณกับ ${doctorName} ได้รับการ "ยืนยัน" แล้ว วันที่ ${appointmentDate} เวลา ${appointmentTime} (ดูรายละเอียดในอีเมล)`;
            createNotification(request.patient.id, 'confirmed', message);
            
            // อัพเดท request ด้วยรอบที่เลือก (sync ไป API ก่อน)
            const syncedAppointment = await syncRequestStatusToApi(request, {
                status: 'confirmed',
                date: appointmentDate,
                time: appointmentTime,
                confirmedRound: selectedRoundIndex + 1,
            });

            updateRequestStatusWithRound(id, 'confirmed', appointmentDate, appointmentTime, selectedRoundIndex, syncedAppointment);

            if (!syncedAppointment) {
                alert('ยืนยันแล้วในหน้าจอ แต่บันทึกสถานะบนเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
            }
            
            alert(`ยืนยันนัดหมายและส่งเมลให้คุณ ${request.patient.name} เรียบร้อยแล้ว\nรอบที่เลือก: ${appointmentDate} เวลา ${appointmentTime}`);

        } catch (err) {
            alert('ส่งอีเมลล้มเหลว! กรุณาตรวจสอบ Console');
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, [id]: false }));
        }
    };
    
    // อัพเดท status พร้อมรอบที่เลือก
    const updateRequestStatusWithRound = (id, newStatus, confirmedDate, confirmedTime, selectedRoundIndex, syncedAppointment = null) => {
        const updated = requests.map(r => {
            if (r.id === id) {
                return { 
                    ...r, 
                    id: syncedAppointment?.id || r.id,
                    status: newStatus,
                    date: confirmedDate,
                    time: confirmedTime,
                    confirmedRound: syncedAppointment?.confirmedRound || (selectedRoundIndex + 1)  // บันทึกว่าเลือกรอบไหน (1-indexed)
                };
            }
            return r;
        });
        saveRequestsData(updated);
    };

    const handleRejectSpam = async (id) => {
        if (!window.confirm('คุณต้องการปฏิเสธคำขอนี้ ใช่หรือไม่?')) return;

        const req = requests.find(r => r.id === id);
        if (!req) { alert('ไม่พบคำขอ'); return; }

        // Use admin-provided rejection message if available
        const reason = (rejectionMessages[id] || 'คำขอของคุณถูกปฏิเสธโดยผู้ดูแลระบบ').trim();

        const syncedAppointment = await syncRequestStatusToApi(req, {
            status: 'rejected',
            rejectionReason: reason,
        });

        // Update request status to 'rejected' and keep record
        const updatedRequests = requests.map(r => {
            if (r.id === id) {
                return { 
                    ...r, 
                    id: syncedAppointment?.id || r.id,
                    status: 'rejected',
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: syncedAppointment?.rejectionReason || reason
                };
            }
            return r;
        });
        saveRequestsData(updatedRequests);

        if (!syncedAppointment) {
            alert('ปฏิเสธแล้วในหน้าจอ แต่บันทึกสถานะบนเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }

        // Notify the patient via app notifications
        const patientId = req.patient?.id || req.patientId || null;
        if (patientId) {
            const notiMsg = `คำขอของคุณถูกปฏิเสธ: ${reason}`;
            createNotification(patientId, 'rejected', notiMsg);
        }

        alert('ปฏิเสธรายการเรียบร้อยแล้ว และระบบได้แจ้งคนไข้แล้ว'); 
    };
    
    const handleRejectionMessageChange = (id, value) => {
        setRejectionMessages(prev => ({ ...prev, [id]: value }));
    };

    const handleAdminMessageChange = (id, value) => {
        setAdminMessages(prev => ({ ...prev, [id]: value }));
    };


    // --- Render Functions ---

    // แสดงรายการนัดหมายใหม่โดยตรง
    return (
        <div id="page-home-new" className="page active" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', minHeight: '100vh' }}>
            <main className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Page Header */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '2rem',
                    padding: '1.5rem 2rem',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'rgba(255,255,255,0.2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>รายการนัดหมายใหม่</h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                            {newRequests.length > 0 ? `มี ${newRequests.length} รายการรอดำเนินการ` : 'ไม่มีรายการรอดำเนินการ'}
                        </p>
                    </div>
                </div>

                <div id="new-requests-list">
                    {newRequests.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '4rem 2rem',
                            background: 'white', borderRadius: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', margin: '0 auto 1.5rem',
                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                    <path d="M9 16l2 2 4-4"></path>
                                </svg>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>ไม่มีรายการนัดหมายใหม่</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>รายการนัดหมายใหม่จะปรากฏที่นี่</p>
                        </div>
                    ) : (
                        newRequests.map(r => {
                            const patient = users.find(u => u.id === r.patient?.id);
                                const patientEmail = r.patient?.email || patient?.email || 'ไม่ระบุ';
                                
                                let healthInfoHtml;
                                if (patient) {
                                    const p = patient.healthProfile || {};
                                    healthInfoHtml = (
                                        <div style={{ 
                                            marginTop: '0.75rem',
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            color: '#475569'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <span>อายุ: <strong>{p.age || '-'} ปี</strong></span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span>เพศ: <strong>{p.gender || '-'}</strong></span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>แพ้ยา: <strong>{p.allergies || 'ไม่มี'}</strong></div>
                                            <div style={{ marginTop: '0.25rem' }}>โรคประจำตัว: <strong>{p.conditions || 'ไม่มี'}</strong></div>
                                        </div>
                                    );
                                } else {
                                    healthInfoHtml = (
                                        <p style={{fontStyle:'italic', color:'#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.9rem'}}>
                                            ไม่พบข้อมูลสุขภาพ
                                        </p>
                                    );
                                }

                                return (
                                    <div key={r.id} style={{ 
                                        background: 'white',
                                        borderRadius: '24px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                        marginBottom: '1.5rem',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {/* Patient Header */}
                                        <div style={{
                                            padding: '1.5rem 2rem',
                                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                            borderBottom: '1px solid #bae6fd'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                <div style={{
                                                    width: '50px', height: '50px', borderRadius: '14px',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                                }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>คนไข้:</span>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                            {r.patient?.name || 'N/A'}
                                                        </span>
                                                        <span style={{
                                                            background: '#e0e7ff', color: '#4338ca',
                                                            padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                            fontSize: '0.75rem', fontWeight: 600
                                                        }}>
                                                            ID: {r.patient?.id}
                                                        </span>
                                                    </div>
                                                    <div style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        marginTop: '0.4rem', color: '#3b82f6', fontSize: '0.9rem'
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                            <polyline points="22,6 12,13 2,6"></polyline>
                                                        </svg>
                                                        <a href={`mailto:${patientEmail}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                            {patientEmail}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Doctor Info */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                marginTop: '1rem', padding: '0.75rem 1rem',
                                                background: 'white', borderRadius: '12px',
                                                border: '1px solid #e0e7ff'
                                            }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>แพทย์:</div>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {r.selectedDoctor || r.doctor?.name || 'ไม่ระบุ'}
                                                        <span style={{ color: '#8b5cf6', marginLeft: '0.5rem', fontWeight: 500 }}>
                                                            ({r.clinic?.name})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div style={{ padding: '1.5rem 2rem' }}>
                                            {/* แสดงรอบนัดหมายทั้งหมดให้ Admin เลือก */}
                                            {(() => {
                                                // ถ้าไม่มี appointments ให้สร้างจาก date/time เดิม
                                                const appointmentsList = (r.appointments && r.appointments.length > 0) 
                                                    ? r.appointments 
                                                    : (r.date && r.time ? [{ date: r.date, time: r.time }] : []);
                                                
                                                return appointmentsList.length > 0 ? (
                                                <div style={{ 
                                                    padding: '1.25rem',
                                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                                    borderRadius: '16px',
                                                    border: '2px solid #3b82f6'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.95rem',
                                                        color: '#1e40af',
                                                        fontWeight: '700',
                                                        marginBottom: '1rem',
                                                        paddingBottom: '0.75rem',
                                                        borderBottom: '1px solid #bfdbfe'
                                                    }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                        {appointmentsList.length > 1 ? 'รอบนัดหมายที่คนไข้เลือกมา (เลือกรอบที่จะอนุมัติ)' : 'วัน-เวลานัดหมาย'}
                                                    </div>
                                                    {appointmentsList.map((apt, index) => (
                                                        apt.date && apt.time && (
                                                            <div 
                                                                key={index} 
                                                                onClick={() => setSelectedAppointmentRounds(prev => ({...prev, [r.id]: index}))}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '1rem',
                                                                    padding: '1rem 1.25rem',
                                                                    backgroundColor: (selectedAppointmentRounds[r.id] ?? 0) === index ? '#dbeafe' : '#fff',
                                                                    borderRadius: '12px',
                                                                    marginBottom: index < appointmentsList.length - 1 ? '0.75rem' : 0,
                                                                    border: (selectedAppointmentRounds[r.id] ?? 0) === index ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                                    cursor: appointmentsList.length > 1 ? 'pointer' : 'default',
                                                                    transition: 'all 0.2s',
                                                                    boxShadow: (selectedAppointmentRounds[r.id] ?? 0) === index ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                                                                }}
                                                            >
                                                                {appointmentsList.length > 1 && (
                                                                    <input 
                                                                        type="radio" 
                                                                        name={`appointment-round-${r.id}`}
                                                                        checked={(selectedAppointmentRounds[r.id] ?? 0) === index}
                                                                        onChange={() => setSelectedAppointmentRounds(prev => ({...prev, [r.id]: index}))}
                                                                        style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                                                                    />
                                                                )}
                                                                <span style={{
                                                                    background: index === 0 ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 
                                                                               index === 1 ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : 
                                                                               'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)',
                                                                    color: 'white',
                                                                    padding: '0.4rem 0.75rem',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: '700',
                                                                    minWidth: '65px',
                                                                    textAlign: 'center',
                                                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                                                }}>
                                                                    {appointmentsList.length > 1 ? `รอบ ${index + 1}${index === 0 ? ' ★' : ''}` : '📅'}
                                                                </span>
                                                                <div style={{flex: 1}}>
                                                                    <div style={{fontSize: '1rem', color: '#1e293b', fontWeight: '700'}}>
                                                                        {apt.date}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600',
                                                                        display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem'
                                                                    }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <circle cx="12" cy="12" r="10"></circle>
                                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                                        </svg>
                                                                        เวลา {apt.time}
                                                                    </div>
                                                                </div>
                                                                {appointmentsList.length > 1 && index === 0 && (
                                                                    <span style={{
                                                                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                                                        color: '#b45309',
                                                                        padding: '0.3rem 0.6rem',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '700'
                                                                    }}>
                                                                        ตัวเลือกหลัก
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ 
                                                    padding: '1rem', background: '#f8fafc', borderRadius: '12px',
                                                    color: '#64748b', textAlign: 'center'
                                                }}>
                                                    <strong>วัน-เวลา:</strong> ไม่ระบุ
                                                </div>
                                            );
                                            })()}
                                            
                                            {/* Symptoms */}
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <div style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    color: '#475569', fontWeight: 600, marginBottom: '0.5rem'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    </svg>
                                                    อาการ:
                                                </div>
                                                <div style={{ 
                                                    background: '#f8fafc', padding: '1rem', borderRadius: '12px',
                                                    color: '#334155', lineHeight: 1.6, border: '1px solid #e2e8f0'
                                                }}>
                                                    {r.symptoms || '-'}
                                                </div>
                                            </div>
                                            
                                            {/* Health Info */}
                                            <div style={{ marginTop: '1.25rem' }}>
                                                <div style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    color: '#475569', fontWeight: 600, marginBottom: '0.5rem'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                                    </svg>
                                                    ข้อมูลสุขภาพ:
                                                </div>
                                                {healthInfoHtml}
                                            </div>
                                            
                                            {/* Admin Message */}
                                            <div style={{ 
                                                marginTop: '1.5rem', paddingTop: '1.5rem',
                                                borderTop: '2px dashed #e2e8f0'
                                            }}>
                                                <label style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    marginBottom: '0.75rem', fontWeight: 700, color: '#475569'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                    แจ้งรายละเอียดคนไข้:
                                                </label>
                                                <textarea 
                                                    placeholder="เขียนข้อความถึงคนไข้ เช่น แจ้งเตือนการเตรียมตัวก่อนมาพบแพทย์ หรือข้อมูลสำคัญอื่นๆ..." 
                                                    rows="3"
                                                    value={adminMessages[r.id] || ''}
                                                    onChange={(e) => handleAdminMessageChange(r.id, e.target.value)}
                                                    style={{ 
                                                        width: '100%', fontSize: '0.95rem', padding: '1rem',
                                                        border: '2px solid #e2e8f0', borderRadius: '12px',
                                                        resize: 'vertical', outline: 'none',
                                                        transition: 'border-color 0.2s',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                                ></textarea>
                                            </div>

                                            {/* Rejection Message (shown when admin wants to reject) */}
                                            <div style={{ marginTop: '1rem' }}>
                                                <label style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    marginBottom: '0.5rem', fontWeight: 700, color: '#475569'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M10 14l2-2 2 2 4-4"></path>
                                                    </svg>
                                                    ข้อความเมื่อปฏิเสธ (จะแจ้งคนไข้):
                                                </label>
                                                <textarea
                                                    placeholder="เขียนข้อความเตือน/เหตุผลที่ปฏิเสธคำขอ..."
                                                    rows="2"
                                                    value={rejectionMessages[r.id] || ''}
                                                    onChange={(e) => handleRejectionMessageChange(r.id, e.target.value)}
                                                    style={{
                                                        width: '100%', fontSize: '0.95rem', padding: '0.75rem',
                                                        border: '1px solid #e2e8f0', borderRadius: '10px',
                                                        resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                                ></textarea>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ 
                                            padding: '1.25rem 2rem', 
                                            background: '#f8fafc',
                                            borderTop: '1px solid #e2e8f0',
                                            display: 'flex', 
                                            flexDirection: 'row',
                                            flexWrap: 'nowrap',
                                            gap: '1rem'
                                        }}>
                                            <button 
                                                onClick={() => handleSendToDoctor(r.id)} 
                                                disabled={loading[r.id]}
                                                style={{
                                                    flex: 1,
                                                    padding: '1rem 0.5rem',
                                                    background: loading[r.id] ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    color: 'white', border: 'none', borderRadius: '14px',
                                                    fontSize: '0.9rem', fontWeight: 700, cursor: loading[r.id] ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    boxShadow: loading[r.id] ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)',
                                                    transition: 'all 0.2s',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                                {loading[r.id] ? 'กำลังส่ง...' : 'ยืนยันการนัดหมาย'}
                                            </button>
                                            <button 
                                                onClick={() => handleRejectSpam(r.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '1rem 0.5rem',
                                                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                                    color: '#dc2626', border: 'none', borderRadius: '14px',
                                                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    transition: 'all 0.2s',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                                ปฏิเสธ
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        );
}

export default HomeAdmin;