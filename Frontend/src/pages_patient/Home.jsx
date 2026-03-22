import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext.jsx';

// --- CSS Styles (รวม CSS ทั้งหมด) ---
const styles = `
    body {
        font-family: 'Prompt', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        overflow-x: hidden;
    }

    /* --- Background Curve Styles (ส่วนโค้งพื้นหลัง) --- */
    .bg-curve-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .curve-shape {
        position: absolute;
        top: 50%;
        left: -10%;
        width: 120%;
        height: 60%;
        background: #f4f9ff; /* สีฟ้าอ่อนมาก */
        border-top-left-radius: 50% 150px;
        border-top-right-radius: 50% 150px;
        transform: rotate(-2deg);
        z-index: -1;
    }

    /* Card Styles */
    .card-clinic {
        cursor: pointer;
        border: 1px solid #f0f0f0;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
        background: #fff;
    }
    .card-clinic:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
        border-color: #bfdbfe;
    }

    /* Department Grid */
    .department-section {
        margin-bottom: 40px;
        padding: 30px;
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        border: 1px solid #f0f0f0;
        position: relative;
        z-index: 2;
    }

    /* Tabs */
    .location-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .tab-button {
        padding: 10px 24px;
        border: 1px solid #edf2f7;
        background-color: #fff;
        border-radius: 30px;
        cursor: pointer;
        font-size: 14px;
        color: #718096;
        transition: all 0.3s;
        font-weight: 500;
    }

    .tab-button.active {
        border-color: #3b82f6;
        background-color: #eff6ff;
        color: #1e40af;
        font-weight: 600;
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
    }

    .tab-button:hover:not(.active) {
        background-color: #f7fafc;
        color: #4a5568;
    }

    /* Grid & Icons */
    .department-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 24px;
        justify-content: center;
    }

    .department-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .department-card:hover {
        transform: translateY(-5px);
    }

    .icon-circle {
        width: 70px;
        height: 70px;
        border-radius: 24px;
        background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
        border: 1px solid #e0f2fe;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
        transition: all 0.3s ease;
    }

    .department-card:hover .icon-circle {
        border-color: #3b82f6;
        background: #fff;
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
        transform: scale(1.05);
    }

    .dept-emoji { font-size: 32px; }
    .dept-img { width: 55%; height: 55%; object-fit: contain; }
    .dept-name { font-size: 13px; color: #4b5563; font-weight: 500; line-height: 1.4; }
    
    /* Animation for Slider */
    @keyframes fade-in {
        from { opacity: 0.5; }
        to { opacity: 1; }
    }
    .slide-image {
        animation: fade-in 0.5s ease-in-out;
    }
`;

// --- Configuration Data ---
const DEPARTMENT_ICONS = {
    'หู คอ จมูก': '👂', 'วัคซีน': '💉', 'ส่งเสริมสุขภาพ': '🩺', 'ทันตกรรม': '🦷',
    'สุขภาพสตรี': '👩', 'แพทย์แผนจีน': '🧧', 'ระบบทางเดินอาหาร': '🤢', 'ผิวหนัง': '🧴',
    'ทางเดินหายใจ': '👃', 'กระดูกและข้อ': '🦴', 'รังสีวินิจฉัย X-Ray': '☢️', 'ฉุกเฉิน': '🚑',
    'อายุรกรรม': '💊', 'กุมารเวช': '👶', 'หัวใจ': '❤️', 'ตา': '👁️'
};

const DEFAULT_ICON = '🏥';

const HERO_IMAGES = [
    "https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg",
    "https://img.freepik.com/free-photo/medical-banner-with-doctor-working-laptop_23-2149611238.jpg",
    "https://img.freepik.com/free-photo/doctor-offering-medical-advice-virtual-consultation_23-2149611211.jpg"
];

// --- Icon Components ---
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

function Home() {
    const { t } = useLanguage();
    
    // Mock Data (Fallback if LocalStorage is empty)
    
    // --- State ---
    const [clinicsData, setClinicsData] = useState([]);
    const [filteredClinics, setFilteredClinics] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([t('all')]); 
    const [activeLocation, setActiveLocation] = useState(t('all'));
    const [allDoctors, setAllDoctors] = useState([]);
    const [showAllDoctors, setShowAllDoctors] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    // --- Effect: Auto Slide Images ---
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => 
                prevIndex === HERO_IMAGES.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000); 
        return () => clearInterval(slideInterval); 
    }, []);

    // --- Effect: Load Data ---
    useEffect(() => {
        const loadData = async () => {
            const user = JSON.parse(sessionStorage.getItem('currentUser'));
            setCurrentUser(user || { name: t('defaultUserName') });

            try {
                const response = await axios.get('/api/hospitals');
                const hospitals = response.data.hospitals || [];
                const storedLocal = JSON.parse(localStorage.getItem('clinicsData')) || [];

                const combined = hospitals.map((h) => {
                    const local = storedLocal.find((c) => String(c.id) === String(h.id)) || {};
                    return {
                        id: h.id,
                        name: h.name,
                        image: h.image || h.logo || local.image || 'https://placehold.co/600x400/eeeeee/888888?text=No+Image',
                        doctors: local.doctors || [],
                        ...h
                    };
                });

                setClinicsData(combined);
                setFilteredClinics(combined);
                localStorage.setItem('clinicsData', JSON.stringify(combined));
                setLocations([t('all'), ...combined.map(c => c.name)]);

                const activeSpecialties = new Set();
                const doctorsList = [];
                combined.forEach(clinic => {
                    (clinic.doctors || []).forEach(doc => {
                        doctorsList.push({ ...doc, clinicId: clinic.id, clinicName: clinic.name, clinicImage: clinic.image });
                        if (doc.specialty) activeSpecialties.add(doc.specialty.trim());
                    });
                });

                setAllDoctors(doctorsList);
                const dynamicDepartments = Array.from(activeSpecialties).map((specialty, index) => ({
                    id: `dept-${index}`, name: specialty, icon: DEPARTMENT_ICONS[specialty] || DEFAULT_ICON
                }));
                setDepartments(dynamicDepartments);
            } catch (error) {
                const storedClinics = JSON.parse(localStorage.getItem('clinicsData')) || [];
                setClinicsData(storedClinics);
                setFilteredClinics(storedClinics);

                if (storedClinics.length > 0) {
                    setLocations([t('all'), ...storedClinics.map(c => c.name)]);
                }

                const activeSpecialties = new Set();
                const doctorsList = [];
                storedClinics.forEach(clinic => {
                    (clinic.doctors || []).forEach(doc => {
                        doctorsList.push({ ...doc, clinicId: clinic.id, clinicName: clinic.name, clinicImage: clinic.image });
                        if (doc.specialty) activeSpecialties.add(doc.specialty.trim());
                    });
                });
                setAllDoctors(doctorsList);
                const dynamicDepartments = Array.from(activeSpecialties).map((specialty, index) => ({
                    id: `dept-${index}`, name: specialty, icon: DEPARTMENT_ICONS[specialty] || DEFAULT_ICON
                }));
                setDepartments(dynamicDepartments);
            }
        };

        loadData();
    }, [location.pathname, t]);


    // --- Filter Logic (เฉพาะการเลือกโรงพยาบาล/ทำเล) ---
    useEffect(() => {
        let results = clinicsData;
        if (activeLocation !== t('all')) {
            results = results.filter(c => c.name === activeLocation);
        }
        setFilteredClinics(results);
    }, [activeLocation, clinicsData, t]);



    // --- Handlers ---
    const handleSelectClinic = (id) => {
        localStorage.setItem('selectedClinicId', id);
        navigate('/patient/clinic-detail'); 
    };

    const handleSelectDepartment = (deptName) => {
        setActiveLocation(deptName);
        document.getElementById('clinic-results')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSearch = () => {
        const query = searchInput.trim();
        if (!query) return;
        navigate(`/patient/search?q=${encodeURIComponent(query)}`);
    };
    
    const handleViewDoctorProfile = (doctor) => {
        setSelectedDoctor(doctor);
        setShowDoctorModal(true);
    };
    
    const handleBookDoctor = (doctor) => {
        localStorage.setItem('selectedClinicId', doctor.clinicId);
        localStorage.setItem('selectedDoctorId', doctor.id);
        localStorage.setItem('selectedDoctorData', JSON.stringify(doctor));
        navigate('/patient/clinic-detail');
    };
    
    const welcomeName = currentUser ? currentUser.name : 'คุณผู้ใช้';
    const displayedDoctors = showAllDoctors ? allDoctors : allDoctors.slice(0, 8);

    return (
        <div style={{position: 'relative', minHeight: '100vh', backgroundColor: '#ffffff'}}>
            <style>{styles}</style>
            
            {/* --- Background Decoration (ส่วนโค้งพื้นหลัง) --- */}
            <div className="bg-curve-container">
                <div className="curve-shape"></div>
            </div>

            <div id="page-home" className="page active" style={{ position: 'relative', width: '100%', maxWidth: '1440px', minHeight: '100vh', margin: '0 auto', paddingBottom: '50px', background: 'transparent' }}>
                <main className="container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
                    
                    {/* Modal */}
                    {showDoctorModal && selectedDoctor && (
                        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}>
                            <div style={{backgroundColor: 'white', borderRadius: '24px', padding: '0', maxWidth: '500px', width: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.3)'}}>
                                <div style={{background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '2rem', borderRadius: '24px 24px 0 0', textAlign: 'center', position: 'relative'}}>
                                    <button onClick={() => setShowDoctorModal(false)} style={{position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: 'white', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>×</button>
                                    <div style={{width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.2)'}}>
                                        {selectedDoctor.image ? <img src={selectedDoctor.image} alt={selectedDoctor.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span style={{fontSize: '3rem'}}>👨‍⚕️</span>}
                                    </div>
                                    <h2 style={{color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem'}}>{selectedDoctor.name}</h2>
                                    <span style={{display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500'}}>{selectedDoctor.specialty}</span>
                                </div>
                                <div style={{padding: '1.5rem 2rem'}}>
                                    <div style={{display: 'grid', gap: '1rem', marginBottom: '1.5rem'}}>
                                        {selectedDoctor.subSpecialty && (
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bfdbfe'}}>
                                                <span style={{fontSize: '1.5rem'}}>🎓</span>
                                                <div>
                                                    <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('specialty')}</div>
                                                    <div style={{fontSize: '0.95rem', color: '#1e40af', fontWeight: '600'}}>{selectedDoctor.subSpecialty}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0'}}>
                                            <span style={{fontSize: '1.5rem'}}>🏥</span>
                                            <div>
                                                <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{t('hospital')}</div>
                                                <div style={{fontSize: '0.95rem', color: '#166534', fontWeight: '600'}}>{selectedDoctor.clinicName}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{display: 'flex', gap: '0.75rem'}}>
                                        <button onClick={() => { setShowDoctorModal(false); handleBookDoctor(selectedDoctor); }} style={{flex: 1, padding: '1rem', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'}}><span>📅</span> {t('bookAppointment')}</button>
                                        <button onClick={() => setShowDoctorModal(false)} style={{padding: '1rem 1.5rem', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '500', cursor: 'pointer'}}>{t('close')}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 1. Hero Section (Slider + Search) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '50px', marginTop: '30px' }}>
                        <div style={{ flex: '1 1 400px' }}>
                            <h1 style={{ fontSize: '36px', color: '#111827', marginBottom: '25px', lineHeight: '1.2', fontWeight: '700' }}>{t('bookOnline')}</h1>
                            <div style={{ backgroundColor: '#eef6ff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.1)' }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <div style={{ paddingLeft: '15px', display: 'flex' }}><SearchIcon /></div>
                                        <input type="text" placeholder={t('searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ width: '100%', padding: '14px 15px', border: 'none', outline: 'none', fontSize: '16px', color: '#374151' }} />
                                    </div>
                                    <button onClick={handleSearch} style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '16px', padding: '0 30px', fontSize: '16px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)', transition: 'all 0.2s' }}>{t('search')}</button>
                                </div>
                                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>{t('searchHint')}</p>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '100%', maxWidth: '500px', height: '320px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', border: '8px solid #ffffff' }}>
                                {HERO_IMAGES.map((imgUrl, index) => (
                                    <img key={index} src={imgUrl} alt={`Hero Slide ${index + 1}`} className="slide-image" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, opacity: currentImageIndex === index ? 1 : 0, transition: 'opacity 1s ease-in-out' }} />
                                ))}
                                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                                    {HERO_IMAGES.map((_, index) => (
                                        <div key={index} onClick={() => setCurrentImageIndex(index)} style={{ width: currentImageIndex === index ? '24px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: currentImageIndex === index ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Recommended Doctors */}
                    {allDoctors.length > 0 && (
                        <div style={{ marginTop: '60px', marginBottom: '60px' }}>
                            <h2 style={{ fontSize: '26px', color: '#1e40af', marginBottom: '30px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {t('recommendedDoctors')} <span style={{fontSize: '14px', fontWeight: '400', color: '#6b7280', marginLeft: 'auto', cursor: 'pointer'}} onClick={() => setShowAllDoctors(!showAllDoctors)}>{showAllDoctors ? t('viewLess') : t('viewAll')}</span>
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {displayedDoctors.map((doctor, index) => (
                                    <div key={`${doctor.id}-${index}`} className="card-clinic" onClick={() => handleViewDoctorProfile(doctor)} style={{position: 'relative'}}>
                                        {/* --- ส่วนที่แก้ไข: ลบป้ายสีเหลือง (Instant Booking) ออก --- */}
                                        
                                        <div style={{background: 'linear-gradient(180deg, #eef6ff 0%, #f8fafc 50%, #ffffff 100%)', padding: '50px 20px 20px 20px', textAlign: 'center'}}>
                                            <div style={{width: '110px', height: '110px', borderRadius: '50%', background: 'white', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #3b82f6', overflow: 'hidden', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.15)'}}>
                                                {doctor.image ? <img src={doctor.image} alt={doctor.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span style={{fontSize: '3rem'}}>👨‍⚕️</span>}
                                            </div>
                                            <h4 style={{fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', marginBottom: '6px'}}>{doctor.name}</h4>
                                            <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '12px'}}>{doctor.specialty}</p>
                                            
                                            {/* --- ส่วนที่แก้ไข: เปลี่ยนแถบสีฟ้าเป็นชื่อโรงพยาบาล --- */}
                                            <span style={{display: 'inline-block', padding: '6px 14px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600'}}>
                                                {doctor.clinicName}
                                            </span>
                                        </div>
                                        <div style={{display: 'flex', borderTop: '1px solid #f3f4f6'}}>
                                            <button onClick={(e) => { e.stopPropagation(); handleBookDoctor(doctor); }} style={{flex: 1, padding: '14px', backgroundColor: 'white', color: '#1e40af', border: 'none', borderRight: '1px solid #f3f4f6', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s'}}>
                                                <span style={{fontSize: '1.1rem'}}>📅</span> {t('bookAppointment')}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleViewDoctorProfile(doctor); }} style={{flex: 1, padding: '14px', backgroundColor: 'white', color: '#6b7280', border: 'none', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s'}}>
                                                <span style={{fontSize: '1.1rem'}}>📄</span> {t('details')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Clinic List */}
                    <>
                    <div id="clinic-results" style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '26px', color: '#111827', fontWeight: '700', marginBottom: '8px' }}>{t('welcomeMessage')}, <span style={{color: '#3b82f6'}}>{welcomeName}</span></h2>
                        <p style={{ color: '#6b7280' }}>{activeLocation !== t('all') ? `${t('selectedHospital')}: ${activeLocation}` : t('selectHospital')}</p>
                    </div>

                    <div id="clinic-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '60px' }}>
                        {filteredClinics.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
                                <p style={{fontSize: '18px', fontWeight: '500', marginBottom: '8px'}}>{t('noClinicFound')}</p>
                                <p style={{fontSize: '14px'}}>{t('trySelectAll')}</p>
                            </div>
                        ) : (
                            filteredClinics.map(c => (
                                <div key={c.id} className="card-clinic" onClick={() => handleSelectClinic(c.id)} style={{border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
                                    <div style={{ overflow: 'hidden', height: '220px', position: 'relative' }}>
                                        <img src={c.image} alt={c.name} onError={(e) => e.target.src='https://placehold.co/600x400/eeeeee/cccccc?text=No+Image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '20px', boxSizing: 'border-box'}}>
                                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{c.name}</h3>
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: '500' }}>
                                            <span>👨‍⚕️</span> <span style={{ fontSize: '14px' }}>{c.doctors?.length || 0} {t('allDoctors')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    </>

                    {/* 5. Departments */}
                    <div className="department-section">
                        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '24px', fontWeight: '700', textAlign: 'center' }}>{t('departmentsAndHospitals')}</h2>
                        <div className="location-tabs">
                            {locations.map((loc) => (
                                <button key={loc} className={`tab-button ${activeLocation === loc ? 'active' : ''}`} onClick={() => setActiveLocation(loc)}>
                                    {loc}
                                </button>
                            ))}
                        </div>
                        <div className="department-grid">
                            {departments.map((dept) => (
                                <div key={dept.id} className="department-card" onClick={() => handleSelectDepartment(dept.name)}>
                                    <div className="icon-circle">
                                        {dept.icon.includes('http') || dept.icon.includes('data:image') ? <img src={dept.icon} alt={dept.name} className="dept-img" /> : <span className="dept-emoji">{dept.icon}</span>}
                                    </div>
                                    <p className="dept-name">{dept.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}

export default Home;