import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import './Home.css';

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
    const { isAuthenticated } = useAuth();
    
    // Mock Data (Fallback if LocalStorage is empty)
    
    // --- State ---
    const [clinicsData, setClinicsData] = useState([]);
    const [filteredClinics, setFilteredClinics] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([t('all')]); 
    const [activeLocation, setActiveLocation] = useState(t('all'));
    const [activeDeptTab, setActiveDeptTab] = useState(t('all'));
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
                const [hospitalsRes, doctorsRes] = await Promise.all([
                    axios.get('/api/hospitals'),
                    axios.get('/api/doctors?sort=popular'),
                ]);
                const hospitals = hospitalsRes.data.hospitals || [];
                const doctors = doctorsRes.data.doctors || [];

                const doctorsByHospital = doctors.reduce((acc, doctor) => {
                    const key = String(doctor.hospitalId || '');
                    if (!key) return acc;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push({
                        id: doctor.id,
                        name: doctor.name || '',
                        specialty: doctor.specialty || '',
                        email: doctor.email || '',
                        image: doctor.image || '',
                        appointmentCount: Number(doctor.appointmentCount ?? doctor.appointment_count ?? 0),
                    });
                    return acc;
                }, {});

                const combined = hospitals.map((h) => ({
                    id: h.id,
                    name: h.name,
                    image: h.image || h.logo || 'https://placehold.co/600x400/eeeeee/888888?text=No+Image',
                    doctors: doctorsByHospital[String(h.id)] || [],
                    ...h
                }));

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

                doctorsList.sort((a, b) => (b.appointmentCount || 0) - (a.appointmentCount || 0));

                setAllDoctors(doctorsList);
                const dynamicDepartments = Array.from(activeSpecialties).map((specialty, index) => ({
                    id: `dept-${index}`, name: specialty, icon: DEPARTMENT_ICONS[specialty] || DEFAULT_ICON
                }));
                setDepartments(dynamicDepartments);
            } catch (error) {
                console.error('Load hospitals/doctors error:', error);
                setClinicsData([]);
                setFilteredClinics([]);
                setLocations([t('all')]);
                setAllDoctors([]);
                setDepartments([]);
            }
        };

        loadData();
    }, [location.pathname, t]);

    // ดึงรายชื่อโปรดของผู้ใช้
    useEffect(() => {
        if (currentUser?.id) {
            axios.get(`/api/users/${currentUser.id}/favorites`)
                .then(res => {
                    const favoriteIds = (res.data.favorites || []).map(h => h.id);
                    setFavorites(favoriteIds);
                })
                .catch(err => console.log('Cannot fetch favorites:', err.message));
        }
    }, [currentUser?.id]);

    // --- Filter Logic (เฉพาะการเลือกโรงพยาบาล/ทำเล) ---
    useEffect(() => {
        let results = clinicsData;
        if (activeLocation !== t('all')) {
            results = results.filter(c => c.name === activeLocation);
        }
        setFilteredClinics(results);
    }, [activeLocation, clinicsData, t]);



    // --- Handlers ---
    const toggleFavorite = async (hospitalId, e) => {
        e?.stopPropagation();
        if (!currentUser?.id) {
            alert(t('pleaseLoginFirst') || 'กรุณาเข้าสู่ระบบก่อน');
            return;
        }

        try {
            if (favorites.includes(hospitalId)) {
                // ลบออกจากโปรด
                await axios.delete(`/api/hospitals/${hospitalId}/favorite`, {
                    data: { userId: currentUser.id }
                });
                setFavorites(favorites.filter(id => id !== hospitalId));
            } else {
                // เพิ่มเข้าโปรด
                await axios.post(`/api/hospitals/${hospitalId}/favorite`, {
                    userId: currentUser.id
                });
                setFavorites([...favorites, hospitalId]);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert(t('error') || 'เกิดข้อผิดพลาด');
        }
    };

    const handleSelectClinic = (id) => {
        if (!isAuthenticated) {
            localStorage.setItem('selectedClinicId', id);
            navigate('/login', {
                state: {
                    from: { pathname: '/patient/clinic-detail' },
                },
            });
            return;
        }

        localStorage.setItem('selectedClinicId', id);
        navigate('/patient/clinic-detail'); 
    };

    const handleSelectDepartment = (deptName) => {
        setActiveLocation(deptName);
        document.getElementById('clinic-results')?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Filtered departments based on selected tab ---
    const filteredDepartments = useMemo(() => {
        if (activeDeptTab === t('all')) return departments;
        const specialtiesInTab = new Set(
            allDoctors
                .filter(doc => doc.clinicName === activeDeptTab)
                .map(doc => doc.specialty)
        );
        return departments.filter(dept => specialtiesInTab.has(dept.name));
    }, [activeDeptTab, departments, allDoctors, t]);

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
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } });
            return;
        }
        localStorage.setItem('selectedClinicId', doctor.clinicId);
        localStorage.setItem('selectedDoctorId', doctor.id);
        localStorage.setItem('selectedDoctorData', JSON.stringify(doctor));
        navigate('/patient/clinic-detail');
    };
    
    const welcomeName = currentUser ? currentUser.name : 'คุณผู้ใช้';
    const displayedDoctors = showAllDoctors ? allDoctors : allDoctors.slice(0, 4);

    return (
        <div style={{position: 'relative', minHeight: '100vh', background: '#f0f7ff', paddingTop: '72px', paddingBottom: '88px'}}>
              {/* ── Decorative background blobs ── */}
            {/* บน-ขวา : ฟ้าใหญ่ */}
            <div style={{
                position:'fixed', top:'-180px', right:'-180px',
                width:'620px', height:'620px', borderRadius:'50%',
                background:'radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(147,197,253,0.28) 50%, transparent 75%)',
                filter:'blur(45px)', pointerEvents:'none', zIndex:0
            }} />
            {/* ล่าง-ซ้าย : เขียวใหญ่ */}
            <div style={{
                position:'fixed', bottom:'-180px', left:'-150px',
                width:'680px', height:'680px', borderRadius:'50%',
                background:'radial-gradient(circle, rgba(74,222,128,0.42) 0%, rgba(134,239,172,0.22) 50%, transparent 75%)',
                filter:'blur(50px)', pointerEvents:'none', zIndex:0
            }} />
            {/* กลาง-ขวา : ฟ้าเล็ก */}
            <div style={{
                position:'fixed', top:'42%', right:'-80px',
                width:'340px', height:'340px', borderRadius:'50%',
                background:'radial-gradient(circle, rgba(147,197,253,0.38) 0%, transparent 70%)',
                filter:'blur(32px)', pointerEvents:'none', zIndex:0
            }} />

            {/* --- Background Decoration (ส่วนโค้งพื้นหลัง) --- */}
            <div className="bg-curve-container">
                <div className="curve-shape"></div>
            </div>

            <div id="page-home" className="page active" style={{ position: 'relative', width: '100%', maxWidth: '1440px', minHeight: '100vh', margin: '0 auto', paddingBottom: '50px', background: 'transparent' }}>
                <main className="container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
                    
                    {/* Modal */}
                    {showDoctorModal && selectedDoctor && (
                        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}>
                            <div className="home-card-font" style={{backgroundColor: 'white', borderRadius: '24px', padding: '0', maxWidth: '500px', width: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.3)'}}>
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
                    
                    {/* ──────────── GUEST HERO BANNER ──────────── */}
                    {!isAuthenticated && (
                      <div className="guest-hero">
                        <div className="hero-glow hero-glow-topright" />
                        <div className="hero-glow hero-glow-bottomleft" />
                        <div className="hero-glow hero-glow-center" />

                        <div className="hero-headline">
                          <div className="hero-badge">
                            <span>✨</span>
                            <span>ระบบนัดหมอออนไลน์ครบวงจร</span>
                          </div>

                          <h1>
                            จัดการสุขภาพของคุณ<br />
                            <span className="accent-text">ได้ทุกที่ ทุกเวลา</span>
                          </h1>
                          <p className="hero-subtitle">
                            เลื่อนดูหมอและคลินิกได้เลย — เมื่อพร้อมแล้ว
                            <strong> เข้าสู่ระบบเพื่อจองนัด</strong> ดูประวัติ และรับการแจ้งเตือน
                          </p>

                          <div className="hero-actions">
                            <button className="hero-cta-btn primary" onClick={() => navigate('/login')}>
                              🔑 เข้าสู่ระบบ
                            </button>
                            <button className="hero-cta-btn secondary" onClick={() => navigate('/login', { state: { view: 'register' } })}>
                              📝 สมัครสมาชิกฟรี
                            </button>
                          </div>

                          <div className="hero-feature-grid">
                            {[
                              { icon: '📅', title: 'จองนัดออนไลน์', desc: 'เลือกวันและหมอตามใจ' },
                              { icon: '🔔', title: 'รับแจ้งเตือน', desc: 'อัพเดทสถานะนัดทันที' },
                              { icon: '📋', title: 'ดูประวัตินัด', desc: 'ตรวจสอบย้อนหลังได้' },
                            ].map((f, i) => (
                              <div key={i} className="hero-feature-card home-card-font">
                                <div className="hero-feature-icon">{f.icon}</div>
                                <div className="hero-feature-title">{f.title}</div>
                                <div className="hero-feature-desc">{f.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. Hero Section (Slider + Search) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '50px', marginTop: '30px' }}>
                        <div style={{ flex: '1 1 400px' }}>
                            {/* Hero Heading */}
                            <div style={{ marginBottom: '28px' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    background: 'linear-gradient(135deg, rgba(219,234,254,0.9) 0%, rgba(224,242,254,0.85) 100%)',
                                    border: '1px solid rgba(147,197,253,0.5)',
                                    borderRadius: '999px',
                                    padding: '5px 14px',
                                    marginBottom: '14px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>🩺</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Health Queue</span>
                                </div>
                                <h1 style={{ margin: 0, lineHeight: '1.2', fontFamily: "'Sarabun', 'Prompt', sans-serif" }}>
                                    <span style={{
                                        display: 'block',
                                        fontSize: 'clamp(28px, 4vw, 40px)',
                                        fontWeight: '800',
                                        color: '#0f172a',
                                        letterSpacing: '-0.02em',
                                        marginBottom: '4px'
                                    }}>
                                        นัดหมอ <span style={{
                                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text'
                                        }}>ออนไลน์</span>
                                    </span>
                                    <span style={{
                                        display: 'block',
                                        fontSize: 'clamp(20px, 3vw, 28px)',
                                        fontWeight: '600',
                                        color: '#475569',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        ไม่ต้องรอนาน ✨
                                    </span>
                                </h1>
                            </div>
                            <div
                                className="home-card-font"
                                style={{
                                    background: 'linear-gradient(145deg, #ffffff 0%, #edf4ff 100%)',
                                    padding: '30px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    boxShadow: '0 14px 34px rgba(30,64,175,0.14), inset 0 1px 0 rgba(255,255,255,0.85)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #c7d2fe', boxShadow: '0 4px 14px rgba(59,130,246,0.08)' }}>
                                        <div style={{ paddingLeft: '15px', display: 'flex' }}><SearchIcon /></div>
                                        <input type="text" placeholder={t('searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ width: '100%', padding: '14px 15px', border: 'none', outline: 'none', fontSize: '16px', color: '#1f2937', background: 'transparent' }} />
                                    </div>
                                    <button onClick={handleSearch} style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '16px', padding: '0 30px', fontSize: '16px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)', transition: 'all 0.2s' }}>{t('search')}</button>
                                </div>
                                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{t('searchHint')}</p>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                            {/* Slider wrapper — glass border + layered shadow */}
                            <div style={{
                                width: '100%',
                                maxWidth: '520px',
                                height: '320px',
                                borderRadius: '28px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1.5px solid rgba(147,197,253,0.55)',
                                boxShadow: '0 28px 60px rgba(30,64,175,0.18), 0 8px 20px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.45)',
                                background: '#e8f1ff'
                            }}>
                                {/* Slides */}
                                {HERO_IMAGES.map((imgUrl, index) => (
                                    <img
                                        key={index}
                                        src={imgUrl}
                                        alt={`Hero Slide ${index + 1}`}
                                        className="slide-image"
                                        style={{
                                            width: '100%', height: '100%', objectFit: 'cover',
                                            position: 'absolute', top: 0, left: 0,
                                            opacity: currentImageIndex === index ? 1 : 0,
                                            transition: 'opacity 1s ease-in-out'
                                        }}
                                    />
                                ))}

                                {/* Bottom gradient overlay */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    height: '80px',
                                    background: 'linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 100%)',
                                    pointerEvents: 'none',
                                    zIndex: 5
                                }} />

                                {/* Dot indicators */}
                                <div style={{
                                    position: 'absolute', bottom: '18px', left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex', gap: '7px', zIndex: 10,
                                    background: 'rgba(0,0,0,0.22)',
                                    backdropFilter: 'blur(6px)',
                                    borderRadius: '999px',
                                    padding: '5px 10px'
                                }}>
                                    {HERO_IMAGES.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            style={{
                                                width: currentImageIndex === index ? '22px' : '7px',
                                                height: '7px',
                                                borderRadius: '4px',
                                                backgroundColor: currentImageIndex === index ? '#ffffff' : 'rgba(255,255,255,0.45)',
                                                cursor: 'pointer',
                                                transition: 'all 0.35s ease',
                                                boxShadow: currentImageIndex === index ? '0 0 6px rgba(255,255,255,0.7)' : 'none'
                                            }}
                                        />
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
                    <div id="clinic-results" className="hospital-header" style={{ marginBottom: '30px' }}>
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
                                <div key={c.id} className="card-clinic hospital-card" onClick={() => handleSelectClinic(c.id)}>
                                    <div className="hospital-card-image-wrap" style={{ overflow: 'hidden', height: '220px', position: 'relative' }}>
                                        <img src={c.image} alt={c.name} onError={(e) => e.target.src='https://placehold.co/600x400/eeeeee/cccccc?text=No+Image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '20px', boxSizing: 'border-box'}}>
                                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{c.name}</h3>
                                        </div>
                                    </div>
                                    <div className="hospital-card-footer" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="hospital-doctor-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: '500' }}>
                                            <span>👨‍⚕️</span> <span style={{ fontSize: '14px' }}>{c.doctors?.length || 0} {t('allDoctors')}</span>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFavorite(c.id, e)}
                                            style={{
                                                padding: '0.5rem',
                                                backgroundColor: 'transparent',
                                                color: favorites.includes(c.id) ? '#ff6b6b' : '#ddd',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {favorites.includes(c.id) ? '❤️' : '🤍'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    </>

                    {/* ──── Mid-page Login CTA (guest) ──── */}
                    {!isAuthenticated && (
                      <div className="guest-cta-card home-card-font">
                        <div>
                          <p className="guest-cta-card-subtitle">พร้อมจองแล้วใช่ไหม?</p>
                          <h3 className="guest-cta-card-title">เข้าสู่ระบบเพื่อจองนัดหมาย 🏥</h3>
                          <p className="guest-cta-card-subtitle">สมัครฟรี ใช้งานได้ทันที ไม่มีค่าใช้จ่ายใดๆ</p>
                          <div className="guest-cta-actions">
                            <button className="guest-cta-action primary" onClick={() => navigate('/login')}>
                              🔑 เข้าสู่ระบบ
                            </button>
                            <button className="guest-cta-action secondary" onClick={() => navigate('/login', { state: { view: 'register' } })}>
                              📝 สมัครสมาชิกฟรี
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Departments */}
                    <div className="department-section">
                        <h2 className="department-title" style={{ fontSize: '24px', color: '#1f2937', marginBottom: '24px', fontWeight: '700', textAlign: 'center' }}>{t('departmentsAndHospitals')}</h2>
                        <div className="location-tabs">
                            {locations.map((loc) => (
                                <button key={loc} className={`tab-button ${activeDeptTab === loc ? 'active' : ''}`} onClick={() => setActiveDeptTab(loc)}>
                                    {loc}
                                </button>
                            ))}
                        </div>
                        <div className="department-grid">
                            {filteredDepartments.map((dept) => (
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