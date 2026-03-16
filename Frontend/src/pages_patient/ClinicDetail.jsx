import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import emailjs from '@emailjs/browser';
import { useLanguage } from '../contexts/LanguageContext';

const EMAILJS_CONFIG = {
    PUBLIC_KEY: "QWWAWjIdVvqW0oQSn",
    SERVICE_ID: "service_bp7mvo8",
    TEMPLATE_ID_AUTO_REPLY: "template_gqj3s6f"
};

// Icon Components
const IconStethoscope = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
        <circle cx="20" cy="10" r="2" />
    </svg>
);

const IconCalendar = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconSyringe = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
    </svg>
);

const IconCheckCircle = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{margin: '0 auto'}}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);

const IconUser = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconUserGroup = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconHeart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const IconBrain = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
);

function ClinicDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();

    const [currentStep, setCurrentStep] = useState(1);
    const [clinicsData, setClinicsData] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    
    const [step1Data, setStep1Data] = useState({ 
        appointmentType: '',
        doctorSelectionType: '', // 'bySpecialty' หรือ 'selectOwn'
        selectedDoctor: null,
        selectedSpecialty: '',
        selectedSpecialtyDetail: '' // เก็บสาขาความชำนาญที่เลือก
    });
    const [step2Data, setStep2Data] = useState({ 
        date: '', 
        time: '',
        selectedMonth: null,
        selectedYear: null,
        symptoms: '',
        attachedFiles: [],
        // รอบนัดหมาย 3 รอบ
        appointments: [
            { date: '', time: '' },
            { date: '', time: '' },
            { date: '', time: '' }
        ],
        activeAppointmentSlot: 0 // 0, 1, 2 สำหรับรอบที่ 1, 2, 3
    });
    const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [doctorModalStep, setDoctorModalStep] = useState(1); // 1 = เลือกหมวด, 2 = แสดงแพทย์
    const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('');
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const [step3Data, setStep3Data] = useState({ 
        relationship: '',
        gender: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        phone: '',
        nationality: '',
        idCard: '', 
        email: '',
        name: '', 
        symptoms: '' 
    });

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user) {
            setCurrentUser(user);
            const profile = user.healthProfile || {};
            setStep3Data(prev => ({
                ...prev,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phone || '',
                idCard: user.idCard || '',
                gender: profile.gender === 'ชาย' ? 'male' : profile.gender === 'หญิง' ? 'female' : '',
                nationality: 'thai',
                relationship: 'self',
                birthDate: '',
                name: user.name || ''
            }));
        } else {
            setCurrentUser(null);
        }

        const clinics = JSON.parse(localStorage.getItem('clinicsData')) || [];
        const clinicId = localStorage.getItem('selectedClinicId');
        
        if (!clinicId) {
            navigate('/patient/home', { replace: true }); 
            return;
        }

        setClinicsData(clinics);
        setSelectedClinicId(clinicId);
        
        // ตรวจสอบว่ามีหมอที่เลือกมาจากหน้า Home หรือไม่
        const selectedDoctorData = localStorage.getItem('selectedDoctorData');
        if (selectedDoctorData) {
            try {
                const doctor = JSON.parse(selectedDoctorData);
                setStep1Data(prev => ({
                    ...prev,
                    appointmentType: 'doctorAppointment',
                    doctorSelectionType: 'selectOwn',
                    selectedDoctor: doctor
                }));
                // ล้างข้อมูลหลังจากใช้แล้ว
                localStorage.removeItem('selectedDoctorData');
                localStorage.removeItem('selectedDoctorId');
            } catch (e) {
                console.error('Error parsing selected doctor data:', e);
            }
        }
        
        try {
            emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        } catch (e) {
            console.error("EmailJS init failed.", e);
        }
    }, [navigate]); 

    const clinic = useMemo(() => {
        if (!selectedClinicId) return null;
        return clinicsData.find(c => c.id == selectedClinicId);
    }, [clinicsData, selectedClinicId]);

    const handleNext = () => {
        if (currentStep === 1) {
            if (!step1Data.appointmentType) {
                alert(t('selectAppointmentType'));
                return;
            }
            if (step1Data.appointmentType === 'doctorAppointment') {
                if (!step1Data.doctorSelectionType) {
                    alert(t('pleaseSelectDoctorMethod'));
                    return;
                }
                if (step1Data.doctorSelectionType === 'bySpecialty') {
                    if (!step1Data.selectedSpecialty) {
                        alert(t('pleaseSelectSpecialty'));
                        return;
                    }
                    if (step1Data.selectedSpecialty === 'selectDoctorSpecialty' && !step1Data.selectedSpecialtyDetail) {
                        alert(t('pleaseSelectDoctorSpecialty'));
                        return;
                    }
                }
                if (step1Data.doctorSelectionType === 'selectOwn' && !step1Data.selectedDoctor) {
                    setShowDoctorModal(true);
                    return;
                }
            }
        }
        if (currentStep === 2 && (!step2Data.appointments[0].date || !step2Data.appointments[0].time)) {
            alert(t('pleaseSelectDateAndTime'));
            return;
        }
        if (currentStep === 3) {
            const fullName = `${step3Data.firstName || ''} ${step3Data.lastName || ''}`.trim();
            if (!step3Data.firstName || !step3Data.lastName || !step3Data.phone) {
                alert(t('pleaseFillAllInfo'));
                return;
            }
            // Update name field with combined first and last name
            setStep3Data(prev => ({ ...prev, name: fullName }));
            handleSubmit();
            return;
        }
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('/patient/home');
        }
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            alert(t('pleaseLogin'));
            navigate('/login', { state: { from: location.pathname } }); 
            return;
        }

        if (currentUser.role === 'admin') {
            alert(t('adminCannotBook'));
            return;
        }

        if (!clinic) {
            alert(t('clinicNotFound'));
            return;
        }

        const doctorName = step1Data.selectedDoctor 
            ? (typeof step1Data.selectedDoctor === 'string' ? step1Data.selectedDoctor : step1Data.selectedDoctor.name)
            : null;

        // Generate full name from firstName and lastName
        const fullName = `${step3Data.firstName || ''} ${step3Data.lastName || ''}`.trim();

        // รวบรวม appointments ที่มีข้อมูลครบ (กรองเฉพาะรอบที่กรอก)
        const validAppointments = step2Data.appointments.filter(apt => apt.date && apt.time);

        const newRequest = { 
            id: Date.now(), 
            status: "new",
            patient: { 
                id: currentUser.id, 
                name: fullName || step3Data.name, 
                email: step3Data.email,
                phone: step3Data.phone,
                idCard: step3Data.idCard
            },
            clinic: { id: clinic.id, name: clinic.name },
            appointmentType: step1Data.appointmentType,
            doctorSelectionType: step1Data.doctorSelectionType,
            selectedSpecialty: step1Data.selectedSpecialty,
            selectedSpecialtyDetail: step1Data.selectedSpecialtyDetail,
            selectedDoctor: doctorName,
            // ส่ง appointments ทั้งหมดไปให้ Admin เลือก
            appointments: validAppointments,
            date: validAppointments[0]?.date || step2Data.date,
            time: validAppointments[0]?.time || step2Data.time,
            symptoms: step2Data.symptoms || step3Data.symptoms,
            attachedFiles: step2Data.attachedFiles.map(f => f.name),
            relationship: step3Data.relationship
        };

        const profile = currentUser.healthProfile || {};
        const genderDisplay = profile.gender ? (profile.gender === 'ชาย' ? t('male') : profile.gender === 'หญิง' ? t('female') : profile.gender) : 'N/A';
        const healthDataString = `${t('age')}: ${profile.age || 'N/A'} ${t('years')}, ${t('gender')}: ${genderDisplay}\n${t('weight')}: ${profile.weight || 'N/A'} ${t('kg')}, ${t('height')}: ${profile.height || 'N/A'} ${t('cm')}\n${t('chronicDiseases')}: ${profile.conditions || t('none')}\n${t('drugAllergies')}: ${profile.allergies || t('none')}`;

        try {
            console.log("Sending email with data:", {
                patient_name: newRequest.patient.name,
                patient_email: newRequest.patient.email,
                appointment_date: newRequest.date,
                appointment_time: newRequest.time,
                doctor_name: doctorName,
                clinic_name: clinic.name
            });
            
            const result = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_AUTO_REPLY, {
                name: "Admin Health Queue",
                patient_name: newRequest.patient.name,
                patient_email: newRequest.patient.email,
                appointment_date: newRequest.date,
                appointment_time: newRequest.time,
                patient_id: newRequest.patient.id,
                symptoms: newRequest.symptoms || 'ไม่ได้ระบุอาการ',
                health_data: healthDataString,
                doctor_name: doctorName || 'ไม่ได้ระบุ',
                clinic_name: clinic.name
            });
            
            console.log("Email sent successfully:", result);
        } catch (err) {
            console.error("Email sending failed:", err);
            console.error("Error details:", err.text || err.message);
            // Don't block the booking process, just log the error
            console.warn("การจองสำเร็จแล้ว แต่ไม่สามารถส่งอีเมลได้ กรุณาตั้งค่า EmailJS Service ID ที่ถูกต้อง");
        }
        
        const requests = JSON.parse(localStorage.getItem('requests')) || [];
        requests.push(newRequest);
        localStorage.setItem('requests', JSON.stringify(requests));
        
        setCurrentStep(4);
    };

    if (!clinic) {
        return <div className="page active"><main className="container"><p>{t('loading')}</p></main></div>;
    }

    const styles = {
        container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
        header: { textAlign: 'center', marginBottom: '2rem' },
        title: { fontSize: '2rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.5rem', borderBottom: '3px solid #1e40af', display: 'inline-block', paddingBottom: '0.25rem' },
        subtitle: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.5rem 1rem', borderRadius: '20px', display: 'inline-block', marginTop: '1rem', fontSize: '0.95rem', textAlign: 'center', marginBottom: '2rem' },
        progressContainer: { display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' },
        progressLine: { position: 'absolute', top: '20px', left: '12.5%', right: '12.5%', height: '2px', backgroundColor: '#e5e7eb', zIndex: 0 },
        step: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 },
        stepCircle: (active) => ({ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: active ? '#1e40af' : '#e5e7eb', color: active ? 'white' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }),
        stepLabel: (active) => ({ fontSize: '0.85rem', color: active ? '#1e40af' : '#9ca3af', fontWeight: active ? '600' : '400' }),
        card: { backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
        optionCard: (selected) => ({ border: selected ? '2px solid #1e40af' : '2px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', cursor: 'pointer', backgroundColor: selected ? '#f0f9ff' : 'white', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }),
        iconWrapper: { width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' },
        buttonContainer: { display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' },
        button: (primary) => ({ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', backgroundColor: primary ? '#1e40af' : '#f3f4f6', color: primary ? 'white' : '#4b5563', flex: primary ? 1 : 'none' }),
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', marginBottom: '1rem' },
        label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }
    };

    const renderStep1 = () => (
        <>
            <div style={{...styles.card, padding: '1.5rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                    {[
                        { id: 'doctorAppointment', label: t('doctorAppointment'), icon: <IconStethoscope /> },
                        { id: 'healthCheck', label: t('healthCheck'), icon: <IconCalendar /> },
                        { id: 'newTreatment', label: t('newTreatment'), icon: <IconSyringe /> }
                    ].map(option => (
                        <div 
                            key={option.id}
                            style={{
                                border: step1Data.appointmentType === option.id ? '2px solid #1e40af' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                backgroundColor: step1Data.appointmentType === option.id ? '#f0f9ff' : 'white',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem'
                            }}
                            onClick={() => setStep1Data({ appointmentType: option.id, doctorSelectionType: '', selectedDoctor: null, selectedSpecialty: '' })}
                        >
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <input 
                                    type="radio" 
                                    checked={step1Data.appointmentType === option.id}
                                    onChange={() => {}}
                                    style={{width: '18px', height: '18px'}}
                                />
                                <span style={{fontSize: '0.95rem', fontWeight: '500', color: '#374151'}}>{option.label}</span>
                            </div>
                            <div style={{color: '#1e40af'}}>{option.icon}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {step1Data.appointmentType === 'doctorAppointment' && (
                <div style={{...styles.card, marginTop: '1.5rem'}}>
                    <h3 style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                        {t('selectDoctor')}
                    </h3>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                        <div 
                            style={{
                                border: step1Data.doctorSelectionType === 'bySpecialty' ? '2px solid #1e40af' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                backgroundColor: step1Data.doctorSelectionType === 'bySpecialty' ? '#f0f9ff' : 'white',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                            onClick={() => setStep1Data(prev => ({ ...prev, doctorSelectionType: 'bySpecialty', selectedDoctor: null }))}
                        >
                            <input 
                                type="radio" 
                                checked={step1Data.doctorSelectionType === 'bySpecialty'}
                                onChange={() => {}}
                                style={{width: '18px', height: '18px'}}
                            />
                            <div style={{color: '#1e40af'}}>
                                <IconUserGroup />
                            </div>
                            <span style={{fontSize: '0.95rem', fontWeight: '500'}}>{t('autoSelectDoctor')}</span>
                        </div>
                        
                        <div 
                            style={{
                                border: step1Data.doctorSelectionType === 'selectOwn' ? '2px solid #1e40af' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                backgroundColor: step1Data.doctorSelectionType === 'selectOwn' ? '#f0f9ff' : 'white',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                            onClick={() => {
                                setStep1Data(prev => ({ ...prev, doctorSelectionType: 'selectOwn', selectedSpecialty: '' }));
                                setShowDoctorModal(true);
                            }}
                        >
                            <input 
                                type="radio" 
                                checked={step1Data.doctorSelectionType === 'selectOwn'}
                                onChange={() => {}}
                                style={{width: '18px', height: '18px'}}
                            />
                            <div style={{color: '#1e40af'}}>
                                <IconUser />
                            </div>
                            <span style={{fontSize: '0.95rem', fontWeight: '500'}}>{t('selectOwnDoctor')}</span>
                        </div>
                    </div>
                    
                    {step1Data.doctorSelectionType === 'bySpecialty' && (
                        <div style={{marginTop: '1.5rem'}}>
                            <h4 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                                {t('specialty')}
                            </h4>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
                                {[
                                    { id: 'selectDoctorSpecialty', label: t('selectDoctorSpecialty') },
                                    { id: 'aiRecommend', label: t('aiRecommend') },
                                    { id: 'notSure', label: t('notSure') }
                                ].map((specialty, index) => (
                                    <div 
                                        key={index}
                                        style={{
                                            border: step1Data.selectedSpecialty === specialty.id ? '2px solid #1e40af' : '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            backgroundColor: step1Data.selectedSpecialty === specialty.id ? '#f0f9ff' : 'white',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            minHeight: '60px'
                                        }}
                                        onClick={() => setStep1Data(prev => ({ ...prev, selectedSpecialty: specialty.id, selectedSpecialtyDetail: '' }))}
                                    >
                                        <input 
                                            type="radio" 
                                            checked={step1Data.selectedSpecialty === specialty.id}
                                            onChange={() => {}}
                                            style={{width: '18px', height: '18px'}}
                                        />
                                        <span style={{fontSize: '0.9rem', fontWeight: '500', flex: 1}}>{specialty.label}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {step1Data.selectedSpecialty === 'selectDoctorSpecialty' && (
                                <div style={{marginTop: '1.5rem'}}>
                                    <button
                                        onClick={() => setShowSpecialtyModal(true)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: '#1e40af',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {step1Data.selectedSpecialtyDetail ? `${t('selected')}: ${t(step1Data.selectedSpecialtyDetail)}` : t('clickToSelectSpecialty')}
                                    </button>
                                    
                                    {showSpecialtyModal && (
                                        <div style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 9999
                                        }}>
                                            <div style={{
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                padding: '2rem',
                                                maxWidth: '900px',
                                                width: '90%',
                                                maxHeight: '80vh',
                                                overflowY: 'auto',
                                                position: 'relative',
                                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                                            }}>
                                                <button
                                                    onClick={() => setShowSpecialtyModal(false)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '1rem',
                                                        right: '1rem',
                                                        backgroundColor: '#f3f4f6',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '32px',
                                                        height: '32px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.25rem',
                                                        color: '#6b7280'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                                
                                                <h3 style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: '700',
                                                    color: '#1e40af',
                                                    marginBottom: '1.5rem',
                                                    textAlign: 'center'
                                                }}>
                                                    {t('selectDoctorSpecialty')}
                                                </h3>
                                                
                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                                        {[
                                            { id: 'heart', label: t('heart'), icon: '❤️' },
                                            { id: 'cancer', label: t('cancer'), icon: '🎗️' },
                                            { id: 'bone', label: t('bone'), icon: '🦴' },
                                            { id: 'eyeEar', label: t('eyeEar'), icon: '👁️' },
                                            { id: 'skin', label: t('skin'), icon: '🧴' },
                                            { id: 'generalCheckup', label: t('generalCheckup'), icon: '📋' },
                                            { id: 'surgery', label: t('surgery'), icon: '✂️' },
                                            { id: 'dental', label: t('dental'), icon: '🦷' },
                                            { id: 'womenElderly', label: t('womenElderly'), icon: '👶' },
                                            { id: 'noseSmell', label: t('noseSmell'), icon: '👃' },
                                            { id: 'beauty', label: t('beauty'), icon: '💄' },
                                            { id: 'hearing', label: t('hearing'), icon: '👂' },
                                            { id: 'rehabilitation', label: t('rehabilitation'), icon: '♿' },
                                            { id: 'digestiveLiver', label: t('digestiveLiver'), icon: '🫁' },
                                            { id: 'neurologyBrain', label: t('neurologyBrain'), icon: '🧠' },
                                            { id: 'pediatrics', label: t('pediatrics'), icon: '👶' },
                                            { id: 'familyMedicine', label: t('familyMedicine'), icon: '👨‍👩‍👧' },
                                            { id: 'elderlyPathology', label: t('elderlyPathology'), icon: '👴' },
                                            { id: 'respiratoryMedicine', label: t('respiratoryMedicine'), icon: '🫁' },
                                            { id: 'others', label: t('others'), icon: '➕' }
                                        ].map((specialty) => (
                                            <div 
                                                key={specialty.id}
                                                style={{
                                                    border: step1Data.selectedSpecialtyDetail === specialty.id ? '2px solid #1e40af' : '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    padding: '0.75rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: step1Data.selectedSpecialtyDetail === specialty.id ? '#f0f9ff' : 'white',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    textAlign: 'center',
                                                    minHeight: '80px',
                                                    justifyContent: 'center'
                                                }}
                                                    onClick={() => {
                                                    setStep1Data(prev => ({ ...prev, selectedSpecialtyDetail: specialty.id }));
                                                    setShowSpecialtyModal(false);
                                                }}
                                            >
                                                <span style={{fontSize: '1.5rem'}}>{specialty.icon}</span>
                                                <span style={{fontSize: '0.75rem', fontWeight: '500', color: '#374151', lineHeight: '1.2'}}>{specialty.label}</span>
                                            </div>
                                        ))}
                                                </div>
                                                
                                                <button
                                                    onClick={() => setShowSpecialtyModal(false)}
                                                    style={{
                                                        marginTop: '1.5rem',
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        backgroundColor: '#f3f4f6',
                                                        color: '#374151',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('notSure')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {step1Data.doctorSelectionType === 'selectOwn' && step1Data.selectedDoctor && (
                        <div style={{marginTop: '1.5rem'}}>
                            <h4 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                                {t('selectDoctor')}
                            </h4>
                            
                            {/* แสดงแพทย์ที่เลือกแล้ว */}
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                                <div 
                                    style={{
                                        border: '2px solid #1e40af',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        backgroundColor: '#f0f9ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <input type="radio" checked readOnly style={{width: '18px', height: '18px'}} />
                                    <div style={{color: '#1e40af'}}><IconUser /></div>
                                    <div>
                                        <div style={{fontWeight: '600', fontSize: '0.95rem', color: '#1e293b'}}>{step1Data.selectedDoctor.name}</div>
                                        <div style={{fontSize: '0.85rem', color: '#64748b'}}>{step1Data.selectedDoctor.specialty}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDoctorModal(true)}
                                    style={{
                                        border: '2px dashed #1e40af',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        color: '#1e40af',
                                        fontWeight: '500'
                                    }}
                                >
                                    <span style={{fontSize: '1.25rem'}}>🔍</span>
                                    {t('changeDoctor')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Doctor Search Modal */}
                    {showDoctorModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '2rem',
                                maxWidth: '1100px',
                                width: '95%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                position: 'relative',
                                boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
                            }}>
                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setShowDoctorModal(false);
                                        setDoctorModalStep(1);
                                        setSelectedDoctorCategory('');
                                        setDoctorSearchQuery('');
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        backgroundColor: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        cursor: 'pointer',
                                        fontSize: '1.5rem',
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                                
                                {/* Step 1: เลือกหมวด */}
                                {doctorModalStep === 1 && (
                                    <>
                                        <h3 style={{
                                            fontSize: '1.75rem',
                                            fontWeight: '700',
                                            color: '#1e293b',
                                            marginBottom: '2rem',
                                            textAlign: 'center'
                                        }}>
                                            {t('searchDoctor')}
                                        </h3>
                                        
                                        {/* Specialty Grid */}
                                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                                            {[
                                                { id: 'heart', label: t('heart'), icon: '❤️', bgColor: '#fef2f2' },
                                                { id: 'cancer', label: t('cancer'), icon: '🎗️', bgColor: '#fef9c3' },
                                                { id: 'bone', label: t('bone'), icon: '🦴', bgColor: '#ecfdf5' },
                                                { id: 'neurologyBrain', label: t('neurologyBrain'), icon: '🧠', bgColor: '#fce7f3' },
                                                { id: 'emergency', label: t('emergency'), icon: '🚑', bgColor: '#fef2f2' },
                                                { id: 'generalCheckup', label: t('generalCheckup'), icon: '📋', bgColor: '#eff6ff' },
                                                { id: 'surgery', label: t('surgery'), icon: '🩺', bgColor: '#f0fdf4' },
                                                { id: 'dental', label: t('dental'), icon: '🦷', bgColor: '#f0f9ff' },
                                                { id: 'womenElderly', label: t('womenElderly'), icon: '👩', bgColor: '#fdf4ff' },
                                                { id: 'menHealth', label: t('menHealth'), icon: '👨', bgColor: '#eff6ff' },
                                                { id: 'pediatrics', label: t('pediatrics'), icon: '👶', bgColor: '#fff7ed' },
                                                { id: 'motherAndChild', label: t('motherAndChild'), icon: '🤱', bgColor: '#fdf2f8' },
                                                { id: 'beauty', label: t('beauty'), icon: '💄', bgColor: '#fdf4ff' },
                                                { id: 'eyeEar', label: t('eyeEar'), icon: '👁️', bgColor: '#f0fdfa' },
                                                { id: 'internalMedicine', label: t('internalMedicine'), icon: '💊', bgColor: '#fef3c7' },
                                                { id: 'foreignPatientServices', label: t('foreignPatientServices'), icon: '🌍', bgColor: '#dbeafe' },
                                                { id: 'rehabilitation', label: t('rehabilitation'), icon: '🏃', bgColor: '#dcfce7' },
                                                { id: 'digestiveLiver', label: t('digestiveLiver'), icon: '🫁', bgColor: '#fef9c3' },
                                                { id: 'elderlyPathology', label: t('elderlyPathology'), icon: '👴', bgColor: '#fff1f2' },
                                                { id: 'respiratoryMedicine', label: t('respiratoryMedicine'), icon: '🫁', bgColor: '#e0f2fe' },
                                                { id: 'others', label: t('others'), icon: '•••', bgColor: '#f1f5f9' },
                                                { id: 'allDoctors', label: t('allDoctors'), icon: '📋', bgColor: '#eff6ff' }
                                            ].map((specialty) => (
                                                <div 
                                                    key={specialty.id}
                                                    style={{
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '16px',
                                                        padding: '1rem 1.25rem',
                                                        cursor: 'pointer',
                                                        backgroundColor: 'white',
                                                        transition: 'all 0.3s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedDoctorCategory(specialty.id);
                                                        setDoctorModalStep(2);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = specialty.bgColor;
                                                        e.currentTarget.style.borderColor = '#1e40af';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        borderRadius: '12px',
                                                        backgroundColor: specialty.bgColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.5rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {specialty.icon}
                                                    </div>
                                                    <span style={{fontSize: '0.95rem', fontWeight: '600', color: '#1e40af'}}>{specialty.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Step 2: แสดงรายชื่อแพทย์ในหมวด */}
                                {doctorModalStep === 2 && (
                                    <>
                                        {/* Search Bar */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            marginBottom: '1.5rem',
                                            padding: '1rem 1.5rem',
                                            backgroundColor: 'white',
                                            borderRadius: '50px',
                                            border: '2px solid #e2e8f0',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                        }}>
                                            <span style={{fontSize: '1.25rem', fontWeight: '700', color: '#1e40af'}}>{t('searchDoctor')}</span>
                                            <div style={{flex: 1, borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem'}}>
                                                <input
                                                    type="text"
                                                    placeholder={t('searchPlaceholderDoctors')}
                                                    value={doctorSearchQuery}
                                                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        fontSize: '1rem',
                                                        color: '#374151'
                                                    }}
                                                />
                                            </div>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: '#fef3c7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem'
                                            }}>
                                                🔍
                                            </div>
                                            <button style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: '#1e40af',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '25px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 2px 8px rgba(30, 64, 175, 0.3)'
                                            }}>
                                                {t('filter')} ▼
                                            </button>
                                        </div>

                                        {/* Filter Tags */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            marginBottom: '1.5rem',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{
                                                padding: '0.6rem 1.25rem',
                                                backgroundColor: '#dbeafe',
                                                color: '#1e40af',
                                                borderRadius: '25px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                border: '1px solid #93c5fd'
                                            }}>
                                                {selectedDoctorCategory ? t(selectedDoctorCategory) : ''}
                                            </span>
                                            <span style={{
                                                padding: '0.6rem 1.25rem',
                                                backgroundColor: '#dbeafe',
                                                color: '#1e40af',
                                                borderRadius: '25px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                border: '1px solid #93c5fd'
                                            }}>
                                                {clinic.name}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setDoctorModalStep(1);
                                                    setSelectedDoctorCategory('');
                                                }}
                                                style={{
                                                    padding: '0.6rem 1.25rem',
                                                    backgroundColor: '#1e40af',
                                                    color: 'white',
                                                    borderRadius: '25px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    boxShadow: '0 2px 6px rgba(30, 64, 175, 0.3)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {t('reset')} ×
                                            </button>
                                        </div>

                                        {/* Checkbox for available doctors */}
                                        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                                            <label style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem 1.5rem',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '0.95rem',
                                                color: '#374151',
                                                backgroundColor: 'white',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                            }}>
                                                <input type="checkbox" style={{width: '18px', height: '18px', accentColor: '#1e40af'}} />
                                                {t('doctorsAvailable')}
                                            </label>
                                        </div>

                                        {/* Doctors Grid */}
                                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem'}}>
                                            {/* ใช้ข้อมูลแพทย์จากคลินิก */}
                                            {(clinic.doctors || [])
                                            .filter(doc => {
                                                // กรองตามหมวดที่เลือก
                                                if (selectedDoctorCategory && selectedDoctorCategory !== 'allDoctors') {
                                                    const catCode = selectedDoctorCategory.toLowerCase();
                                                    const catLabel = t(selectedDoctorCategory).toLowerCase();
                                                    const categoryMatch = (doc.specialty && (doc.specialty.toLowerCase().includes(catCode) || doc.specialty.toLowerCase().includes(catLabel))) ||
                                                                         (doc.subSpecialty && (doc.subSpecialty.toLowerCase().includes(catCode) || doc.subSpecialty.toLowerCase().includes(catLabel)));
                                                    if (!categoryMatch) return false;
                                                }
                                                // กรองตามคำค้นหา
                                                if (doctorSearchQuery) {
                                                    return doc.name?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                                                           doc.specialty?.toLowerCase().includes(doctorSearchQuery.toLowerCase());
                                                }
                                                return true;
                                            })
                                            .map((doctor) => (
                                                <div 
                                                    key={doctor.id}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: '20px',
                                                        padding: '2rem 1.5rem',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                                        border: '1px solid #e5e7eb',
                                                        textAlign: 'center',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 64, 175, 0.15)';
                                                        e.currentTarget.style.borderColor = '#93c5fd';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                    }}
                                                >
                                                    {/* Doctor Avatar */}
                                                    <div style={{
                                                        width: '110px',
                                                        height: '110px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                                                        margin: '0 auto 1.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '4px solid #1e40af',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)'
                                                    }}>
                                                        {doctor.image ? (
                                                            <img src={doctor.image} alt={doctor.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                        ) : (
                                                            <IconUser style={{width: '50px', height: '50px', color: '#1e40af'}} />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Doctor Info */}
                                                    <h4 style={{fontSize: '1.1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.5rem'}}>
                                                        {doctor.name}
                                                    </h4>
                                                    <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem'}}>
                                                        {doctor.specialty}
                                                    </p>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.4rem 1rem',
                                                        backgroundColor: '#dbeafe',
                                                        color: '#1e40af',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        marginBottom: '1.25rem'
                                                    }}>
                                                        {doctor.subSpecialty || 'อายุรศาสตร์โรคหัวใจ'}
                                                    </span>
                                                    
                                                    {/* Action Buttons */}
                                                    <div style={{
                                                        display: 'flex', 
                                                        justifyContent: 'center', 
                                                        gap: '0.5rem', 
                                                        marginTop: '1rem',
                                                        borderTop: '1px solid #f1f5f9',
                                                        paddingTop: '1rem'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                setStep1Data(prev => ({ ...prev, selectedDoctor: doctor, selectedSpecialtyDetail: selectedDoctorCategory }));
                                                                setShowDoctorModal(false);
                                                                setDoctorModalStep(1);
                                                                setSelectedDoctorCategory('');
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                padding: '0.6rem 1rem',
                                                                backgroundColor: '#eff6ff',
                                                                color: '#1e40af',
                                                                border: '1px solid #bfdbfe',
                                                                borderRadius: '10px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#1e40af';
                                                                e.currentTarget.style.color = 'white';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                                                e.currentTarget.style.color = '#1e40af';
                                                            }}
                                                        >
                                                            <span>📅 {t('bookAppointment')}</span>
                                                        </button>
                                                        <button 
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                padding: '0.6rem 1rem',
                                                                backgroundColor: '#f8fafc',
                                                                color: '#64748b',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '10px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                                            }}
                                                        >
                                                            <span>ℹ️ {t('details')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Empty State */}
                                        {(clinic.doctors || []).filter(doc => {
                                            if (selectedDoctorCategory && selectedDoctorCategory !== 'allDoctors') {
                                                const catCode = selectedDoctorCategory.toLowerCase();
                                                const catLabel = t(selectedDoctorCategory).toLowerCase();
                                                const categoryMatch = (doc.specialty && (doc.specialty.toLowerCase().includes(catCode) || doc.specialty.toLowerCase().includes(catLabel))) ||
                                                                     (doc.subSpecialty && (doc.subSpecialty.toLowerCase().includes(catCode) || doc.subSpecialty.toLowerCase().includes(catLabel)));
                                                if (!categoryMatch) return false;
                                            }
                                            if (doctorSearchQuery) {
                                                return doc.name?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                                                       doc.specialty?.toLowerCase().includes(doctorSearchQuery.toLowerCase());
                                            }
                                            return true;
                                        }).length === 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '3rem',
                                                color: '#64748b'
                                            }}>
                                                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🔍</div>
                                                <h4 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151'}}>
                                                    {t('noDoctorInCategory')}
                                                </h4>
                                                <p style={{fontSize: '0.95rem'}}>
                                                    {t('tryOtherCategory')}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );

    const renderStep2 = () => {
        const today = new Date();
        const currentMonth = step2Data.selectedMonth || today.getMonth();
        const currentYear = step2Data.selectedYear || today.getFullYear();
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        
        const monthNames = t('monthNames');
        const dayNames = t('dayNames');
        
        const timeSlots = {
            morning: ['9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            afternoon: ['13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00']
        };
        
        const handleMonthChange = (direction) => {
            let newMonth = currentMonth;
            let newYear = currentYear;
            
            if (direction === 'prev') {
                newMonth = currentMonth - 1;
                if (newMonth < 0) {
                    newMonth = 11;
                    newYear = currentYear - 1;
                }
            } else {
                newMonth = currentMonth + 1;
                if (newMonth > 11) {
                    newMonth = 0;
                    newYear = currentYear + 1;
                }
            }
            
            setStep2Data(prev => ({ ...prev, selectedMonth: newMonth, selectedYear: newYear }));
        };
        
        const renderCalendar = () => {
            const days = [];
            const calendarDayNames = t('dayNames');
            const activeSlot = step2Data.activeAppointmentSlot;
            const currentAppointment = step2Data.appointments[activeSlot];
            
            // Day headers
            calendarDayNames.forEach((day, index) => {
                days.push(
                    <div key={`header-${index}`} style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        fontSize: '0.9rem'
                    }}>
                        {day}
                    </div>
                );
            });
            
            // Empty cells for first week
            for (let i = 0; i < firstDayOfMonth; i++) {
                days.push(<div key={`empty-${i}`} />);
            }
            
            // Days
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = currentAppointment.date === dateStr;
                const isPast = new Date(dateStr) < new Date(today.toDateString());
                // เช็คว่าวันนี้ถูกเลือกในรอบอื่นหรือไม่
                const isSelectedInOtherSlot = step2Data.appointments.some((apt, idx) => idx !== activeSlot && apt.date === dateStr);
                
                days.push(
                    <div
                        key={day}
                        onClick={() => {
                            if (!isPast) {
                                const newAppointments = [...step2Data.appointments];
                                newAppointments[activeSlot] = { ...newAppointments[activeSlot], date: dateStr };
                                setStep2Data(prev => ({ ...prev, appointments: newAppointments, date: dateStr }));
                            }
                        }}
                        style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? '#1e40af' : isSelectedInOtherSlot ? '#dbeafe' : 'transparent',
                            color: isPast ? '#d1d5db' : isSelected ? 'white' : isSelectedInOtherSlot ? '#1e40af' : '#374151',
                            fontWeight: isSelected || isSelectedInOtherSlot ? '600' : '400',
                            transition: 'all 0.2s',
                            opacity: isPast ? 0.5 : 1,
                            border: isSelectedInOtherSlot ? '2px dashed #1e40af' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!isPast && !isSelected) {
                                e.currentTarget.style.backgroundColor = isSelectedInOtherSlot ? '#dbeafe' : '#f3f4f6';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) {
                                e.currentTarget.style.backgroundColor = isSelectedInOtherSlot ? '#dbeafe' : 'transparent';
                            }
                        }}
                    >
                        {day}
                    </div>
                );
            }
            
            return days;
        };
        
        const activeSlot = step2Data.activeAppointmentSlot;
        const currentAppointment = step2Data.appointments[activeSlot];
        
        return (
            <div style={styles.card}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '2rem'}}>
                    {/* Calendar Section */}
                    <div style={{flex: 1}}>
                        <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                            {t('desiredDateTime')}
                        </h3>
                        
                        {/* Month Selector */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                            padding: '0.5rem'
                        }}>
                            <button
                                onClick={() => handleMonthChange('prev')}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                ‹
                            </button>
                            <span style={{
                                fontWeight: '600',
                                color: '#1e40af',
                                fontSize: '1rem'
                            }}>
                                {monthNames[currentMonth]} {language === 'th' ? currentYear + 543 : currentYear}
                            </span>
                            <button
                                onClick={() => handleMonthChange('next')}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                ›
                            </button>
                        </div>
                        
                        {/* Calendar Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '0.25rem'
                        }}>
                            {renderCalendar()}
                        </div>
                    </div>
                    
                    {/* Time Slots Section */}
                    <div style={{flex: 1}}>
                        <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                            {t('timeSlot')}
                        </h3>
                        
                        {/* Morning Slots */}
                        <div style={{marginBottom: '1.5rem'}}>
                            <h4 style={{fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#6b7280'}}>
                                {t('morning')}
                            </h4>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem'}}>
                                {timeSlots.morning.map(slot => {
                                    const isSelected = currentAppointment.time === slot;
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => {
                                                const newAppointments = [...step2Data.appointments];
                                                newAppointments[activeSlot] = { ...newAppointments[activeSlot], time: slot };
                                                setStep2Data(prev => ({ ...prev, appointments: newAppointments, time: slot }));
                                            }}
                                            style={{
                                                padding: '0.75rem',
                                                backgroundColor: isSelected ? '#1e40af' : 'white',
                                                color: isSelected ? 'white' : '#374151',
                                                border: isSelected ? '2px solid #1e40af' : '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: isSelected ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Afternoon Slots */}
                        <div>
                            <h4 style={{fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#6b7280'}}>
                                {t('afternoon')}
                            </h4>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem'}}>
                                {timeSlots.afternoon.map(slot => {
                                    const isSelected = currentAppointment.time === slot;
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => {
                                                const newAppointments = [...step2Data.appointments];
                                                newAppointments[activeSlot] = { ...newAppointments[activeSlot], time: slot };
                                                setStep2Data(prev => ({ ...prev, appointments: newAppointments, time: slot }));
                                            }}
                                            style={{
                                                padding: '0.75rem',
                                                backgroundColor: isSelected ? '#1e40af' : 'white',
                                                color: isSelected ? 'white' : '#374151',
                                                border: isSelected ? '2px solid #1e40af' : '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: isSelected ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Appointment Slot Tabs - ย้ายมาอยู่ข้างบน Symptoms */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    marginBottom: '1.5rem'
                }}>
                    {[0, 1, 2].map((slotIndex) => {
                        const slot = step2Data.appointments[slotIndex];
                        const isActive = activeSlot === slotIndex;
                        const hasData = slot.date && slot.time;
                        
                        return (
                            <button
                                key={slotIndex}
                                onClick={() => setStep2Data(prev => ({ ...prev, activeAppointmentSlot: slotIndex }))}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    backgroundColor: isActive ? '#1e40af' : hasData ? '#dbeafe' : '#f8fafc',
                                    color: isActive ? 'white' : hasData ? '#1e40af' : '#64748b',
                                    border: isActive ? '2px solid #1e40af' : hasData ? '2px solid #93c5fd' : '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem'}}>
                                    {`${t('round')} ${slotIndex + 1}`}
                                    {slotIndex === 0 && <span style={{color: isActive ? '#fbbf24' : '#ef4444'}}> *</span>}
                                </div>
                                {hasData ? (
                                    <div style={{fontSize: '0.85rem', opacity: 0.9}}>
                                        {new Date(slot.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })} | {slot.time}
                                    </div>
                                ) : (
                                    <div style={{fontSize: '0.85rem', opacity: 0.7}}>
                                        {t('notSelected')}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Symptoms and File Upload Section */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#374151',
                        fontSize: '0.95rem'
                    }}>
                        {t('symptomsAndHealth')}
                    </label>
                    <textarea
                        value={step2Data.symptoms}
                        onChange={(e) => setStep2Data(prev => ({ ...prev, symptoms: e.target.value }))}
                        placeholder={t('symptomsAndHealth')}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.95rem',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                    
                    {/* File Upload Button */}
                    <div style={{marginTop: '1rem'}}>
                        <label
                            htmlFor="file-upload"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'white',
                                color: '#1e40af',
                                border: '2px dashed #1e40af',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f9ff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            <span style={{fontSize: '1.5rem'}}>+</span>
                            <div>
                                <div>{t('attachFile')}</div>
                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                                    {t('fileLimit')}
                                </div>
                            </div>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                const validFiles = files.filter(file => {
                                    const maxSize = 3 * 1024 * 1024; // 3MB
                                    if (file.size > maxSize) {
                                        // fileTooLarge uses a simple placeholder {name}
                                        alert(t('fileTooLarge').replace('{name}', file.name));
                                        return false;
                                    }
                                    return true;
                                });
                                setStep2Data(prev => ({ 
                                    ...prev, 
                                    attachedFiles: [...prev.attachedFiles, ...validFiles] 
                                }));
                            }}
                            style={{display: 'none'}}
                        />
                    </div>
                    
                    {/* Display uploaded files */}
                    {step2Data.attachedFiles.length > 0 && (
                        <div style={{marginTop: '1rem'}}>
                            <div style={{fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem'}}>
                                {t('attachedFiles')} ({step2Data.attachedFiles.length})
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {step2Data.attachedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <span style={{color: '#374151'}}>
                                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                        <button
                                            onClick={() => {
                                                setStep2Data(prev => ({
                                                    ...prev,
                                                    attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
                                                }));
                                            }}
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '1.25rem',
                                                padding: '0',
                                                lineHeight: 1
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        const inputStyle = {
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.95rem',
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            outline: 'none',
            boxSizing: 'border-box'
        };

        const selectStyle = {
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem'
        };
        
        const labelStyle = {
            display: 'block',
            color: '#1e40af',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '0.5rem'
        };

        const fieldGroupStyle = {
            marginBottom: '1.25rem'
        };

        return (
            <div style={{
                ...styles.card,
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
                {/* Header */}
                <h3 style={{
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e40af', 
                    marginBottom: '2rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '3px solid #1e40af',
                    display: 'inline-block'
                }}>
                    {t('patientData')}
                </h3>

                {/* Row 1: คำนำหน้า, ชื่อ, นามสกุล */}
                <div style={{display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '1.25rem', ...fieldGroupStyle}}>
                    <div>
                        <label style={labelStyle}>{t('title')}</label>
                        <select 
                            style={selectStyle}
                            value={step3Data.title || 'นาย'}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, title: e.target.value }))}
                        >
                            <option value="นาย">{t('mr')}</option>
                            <option value="นาง">{t('mrs')}</option>
                            <option value="นางสาว">{t('miss')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('firstName')}</label>
                        <input 
                            type="text"
                            style={inputStyle}
                            value={step3Data.firstName || ''}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder=""
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('lastName')}</label>
                        <input 
                            type="text"
                            style={inputStyle}
                            value={step3Data.lastName || ''}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder=""
                        />
                    </div>
                </div>

                {/* Row 2: เพศ, วันเกิด */}
                <div style={{display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.25rem', ...fieldGroupStyle}}>
                    <div>
                        <label style={labelStyle}>{t('gender')}</label>
                        <select 
                            style={selectStyle}
                            value={step3Data.gender || 'male'}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, gender: e.target.value }))}
                        >
                            <option value="male">{t('male')}</option>
                            <option value="female">{t('female')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('birthDate')}</label>
                        <input 
                            type="date"
                            style={inputStyle}
                            value={step3Data.birthDate || ''}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, birthDate: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Row 3: สัญชาติ, เลขบัตรประชาชน, เบอร์โทรศัพท์ */}
                <div style={{display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1.25rem', ...fieldGroupStyle}}>
                    <div>
                        <label style={labelStyle}>{t('nationality')}</label>
                        <select 
                            style={selectStyle}
                            value={step3Data.nationality || 'thai'}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, nationality: e.target.value }))}
                        >
                            <option value="thai">THAI ({t('thai')})</option>
                            <option value="other">{t('other')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('idCard')}</label>
                        <input 
                            type="text"
                            style={inputStyle}
                            value={step3Data.idCard}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, idCard: e.target.value }))}
                            placeholder=""
                            maxLength="13"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('phone')}</label>
                        <input 
                            type="tel"
                            style={inputStyle}
                            value={step3Data.phone}
                            onChange={(e) => setStep3Data(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder=""
                        />
                    </div>
                </div>

                {/* Row 4: อีเมล */}
                <div style={{...fieldGroupStyle, marginBottom: '2rem'}}>
                    <label style={labelStyle}>{t('email')}</label>
                    <input 
                        type="email"
                        style={{...inputStyle, maxWidth: '400px'}}
                        value={step3Data.email}
                        onChange={(e) => setStep3Data(prev => ({ ...prev, email: e.target.value }))}
                        placeholder=""
                    />
                </div>

                {/* Terms */}
                <div style={{
                    backgroundColor: '#eff6ff',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.7',
                    color: '#1e40af',
                    border: '1px solid #dbeafe'
                }}>
                    ข้าพเจ้ายอมรับและให้ความยินยอมตามข้อกำหนดการเข้าใช้บริการ ข้อปฏิบัติและนโยบายความเป็นส่วนตัว รวมถึงยอมรับว่าโรงพยาบาลหรือผู้มีอำนาจหน้าที่จะเป็นผู้ยืนยัน ตรวจสอบและกำหนดเงื่อนไขสำหรับการจองนัดหมาย
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        // Format date to Thai
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                              'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const day = date.getDate();
            const month = thaiMonths[date.getMonth()];
            const year = date.getFullYear() + 543;
            return `วันที่ ${day} ${month} ${year}`;
        };

        return (
            <div style={{...styles.card, textAlign: 'center'}}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#d1fae5',
                    borderRadius: '50%'
                }}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                
                <h2 style={{
                    fontSize: '1.5rem',
                    color: '#10b981',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                }}>
                    {t('confirmSuccess')}
                </h2>
                
                <p style={{
                    color: '#6b7280',
                    fontSize: '0.9rem',
                    marginBottom: '2rem',
                    lineHeight: '1.6'
                }}>
                    {t('confirmMessage')}
                </p>

                <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        color: '#166534',
                        marginBottom: '1rem',
                        fontWeight: '600'
                    }}>
                        {t('appointmentSummary')}
                    </h3>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <div style={{flex: 1}}>
                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('bookerName')}</div>
                                <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '500'}}>
                                    {step3Data.firstName} {step3Data.lastName}
                                </div>
                            </div>
                        </div>

                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            <div style={{flex: 1}}>
                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('contactPhone')}</div>
                                <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '500'}}>
                                    {step3Data.phone}
                                </div>
                            </div>
                        </div>

                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <div style={{flex: 1}}>
                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('dateTime')}</div>
                                <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '500'}}>
                                    {formatDate(step2Data.appointments[0]?.date)} {t('time')} {step2Data.appointments[0]?.time}
                                </div>
                            </div>
                        </div>

                        {/* แสดงรอบนัดหมายทั้งหมด */}
                        {step2Data.appointments && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1.25rem',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                border: '2px solid #10b981',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.95rem',
                                    color: '#166534',
                                    fontWeight: '700',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid #d1fae5'
                                }}>
                                    <span style={{fontSize: '1.25rem'}}>📅</span>
                                    {t('selectedAppointmentRounds')}
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                                    {step2Data.appointments.map((apt, index) => (
                                        apt.date && apt.time && (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.875rem 1rem',
                                                backgroundColor: index === 0 ? '#ecfdf5' : '#f0fdf4',
                                                borderRadius: '10px',
                                                border: index === 0 ? '2px solid #10b981' : '1px solid #bbf7d0',
                                                transition: 'all 0.2s'
                                            }}>
                                                <span style={{
                                                    backgroundColor: index === 0 ? '#10b981' : index === 1 ? '#34d399' : '#6ee7b7',
                                                    color: 'white',
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    minWidth: '60px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                                                }}>
                                                    {t('round')} {index + 1}{index === 0 ? ' ★' : ''}
                                                </span>
                                                <div style={{flex: 1}}>
                                                    <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '600'}}>
                                                        {formatDate(apt.date)}
                                                    </div>
                                                    <div style={{fontSize: '0.85rem', color: '#10b981', fontWeight: '500', marginTop: '0.25rem'}}>
                                                        ⏰ {t('time')} {apt.time}
                                                    </div>
                                                </div>
                                                {index === 0 && (
                                                    <span style={{
                                                        backgroundColor: '#fef3c7',
                                                        color: '#d97706',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {t('primary')}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <div style={{flex: 1}}>
                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('appointmentData')}</div>
                                    <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '500'}}>
                                    {t(step1Data.appointmentType)}
                                </div>
                            </div>
                        </div>

                        {step1Data.selectedDoctor && (
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <div style={{flex: 1}}>
                                    <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('doctor')}</div>
                                    <div style={{fontSize: '0.95rem', color: '#1f2937', fontWeight: '500'}}>
                                        {typeof step1Data.selectedDoctor === 'string' ? step1Data.selectedDoctor : step1Data.selectedDoctor.name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        backgroundColor: '#1e40af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e3a8a';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e40af';
                    }}
                    onClick={() => navigate('/patient/appointments')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    {t('backToHome')}
                </button>
            </div>
        );
    };

    return (
        <div className="page active">
            <main style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>{t('makeAppointment')}</h1>
                </div>
                <div style={{textAlign: 'center'}}>
                    <div style={styles.subtitle}>{t('hospital')} {clinic.name}</div>
                </div>

                <div style={styles.progressContainer}>
                    <div style={styles.progressLine}></div>
                    {[t('start'), t('appointmentData'), t('patientData'), t('waitConfirm')].map((label, index) => {
                        const stepNum = index + 1;
                        return (
                            <div key={stepNum} style={styles.step}>
                                <div style={styles.stepCircle(currentStep >= stepNum)}>{stepNum}</div>
                                <span style={styles.stepLabel(currentStep >= stepNum)}>{label}</span>
                            </div>
                        );
                    })}
                </div>

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                {currentStep < 4 && (
                    <div style={styles.buttonContainer}>
                        <button style={styles.button(false)} onClick={handleBack}>
                            ← {currentStep === 1 ? t('back') : t('previous')}
                        </button>
                        <button style={styles.button(true)} onClick={handleNext}>
                            {currentStep === 3 ? t('confirm') : t('next')} →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ClinicDetail;