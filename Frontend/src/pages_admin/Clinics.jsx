import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
// (CSS ถูก import ใน main.jsx แล้ว)

// (Component: Modal แก้ไขแพทย์)
function EditDoctorModal({ doctor, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({});
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (doctor) {
            setFormData({
                name: doctor.name || '',
                specialty: doctor.specialty || '',
                email: doctor.email || '',
                image: doctor.image || '',
            });
            setImagePreview(doctor.image || '');
        }
    }, [doctor]);

    if (!isOpen || !doctor) return null;

    const handleChange = (e) => {
        const { id, value } = e.target;
        const key = id.replace('edit-doctor-', '');
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
        setImagePreview('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(doctor.id, formData);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div id="edit-doctor-modal" className="modal-overlay active" onClick={handleBackdropClick}>
            <div className="modal-content">
                <button id="close-doctor-modal-btn" className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3>แก้ไขข้อมูลแพทย์</h3>
                <form id="edit-doctor-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>รูปภาพแพทย์</label>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem'}}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', 
                                backgroundColor: '#f0f0f0', overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #ddd'
                            }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                ) : (
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                )}
                            </div>
                            <div style={{flex: 1}}>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    style={{marginBottom: '0.5rem'}}
                                />
                                {imagePreview && (
                                    <button type="button" className="btn btn-danger" onClick={handleRemoveImage}
                                            style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>
                                        ลบรูป
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="edit-doctor-name">ชื่อแพทย์</label>
                        <input type="text" id="edit-doctor-name" className="input" required 
                               value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="edit-doctor-specialty">แผนก/ความเชี่ยวชาญ</label>
                        <input type="text" id="edit-doctor-specialty" className="input" required 
                               value={formData.specialty} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="edit-doctor-email">อีเมลแพทย์</label>
                        <input type="email" id="edit-doctor-email" className="input" required 
                               value={formData.email} onChange={handleChange} />
                    </div>
                    <hr />
                    <button type="submit" className="btn btn-success">บันทึกการเปลี่ยนแปลง</button>
                </form>
            </div>
        </div>
    );
}


// (Component: หน้าหลักจัดการคลินิก)
function Clinics() {
    const { t } = useLanguage();
    // --- State ---
    const [view, setView] = useState('master'); // 'master', 'detail'
    const [clinicsData, setClinicsData] = useState([]);
    const [currentEditingClinicId, setCurrentEditingClinicId] = useState(null);
    
    // (State สำหรับ Forms)
    const [addClinicName, setAddClinicName] = useState('');
    const [addClinicImage, setAddClinicImage] = useState('');
    const [editClinicName, setEditClinicName] = useState('');
    const [editClinicImage, setEditClinicImage] = useState('');
    const [addDoctorName, setAddDoctorName] = useState('');
    const [addDoctorSpecialty, setAddDoctorSpecialty] = useState('');
    const [addDoctorImage, setAddDoctorImage] = useState('');
    const [addDoctorImagePreview, setAddDoctorImagePreview] = useState('');
    const [addDoctorEmail, setAddDoctorEmail] = useState('');
    const [clinicSearchTerm, setClinicSearchTerm] = useState('');
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
    const [activeSpecialty, setActiveSpecialty] = useState('all');
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [currentEditingDoctor, setCurrentEditingDoctor] = useState(null);

    // --- Data Loading ---
    useEffect(() => {
        const loadClinics = async () => {
            try {
                const response = await axios.get('/api/hospitals');
                const hospitals = response.data.hospitals || [];
                const localClinics = JSON.parse(localStorage.getItem('clinicsData')) || [];

                const mergedClinics = hospitals.map((hospital) => {
                    const local = localClinics.find((c) => String(c.id) === String(hospital.id)) || {};
                    return {
                        id: hospital.id,
                        name: hospital.name,
                        address: hospital.address || '',
                        phone: hospital.phone || '',
                        email: hospital.email || '',
                        website: hospital.website || '',
                        logo: hospital.logo || hospital.image || '',
                        image: hospital.image || hospital.logo || local.image || hospital.logo || 'https://placehold.co/600x400/eeeeee/888888?text=No+Image',
                        doctors: local.doctors || [],
                    };
                });

                setClinicsData(mergedClinics);
                setClinicSearchTerm('');
                localStorage.setItem('clinicsData', JSON.stringify(mergedClinics));
            } catch (error) {
                const storedClinics = JSON.parse(localStorage.getItem('clinicsData')) || [];
                setClinicsData(storedClinics);
            }
        };
        loadClinics();
    }, []);

    // --- Helper Functions ---
    const saveClinicsData = (updatedData) => {
        setClinicsData(updatedData);
        localStorage.setItem('clinicsData', JSON.stringify(updatedData));
    };

    // 🔹 [FIXED] เปลี่ยนมาใช้ระบบ Broadcast แบบ 'all' (ส่งหาทุกคน) 🔹
    // (วิธีนี้จะทำงานได้แน่นอน 100% แม้ไม่มี User ในระบบ หรือ User ใหม่)
    const broadcastSystemNotification = (message) => {
        const currentNotifs = JSON.parse(localStorage.getItem('notifications')) || [];
        
        const newNotif = {
            id: Date.now(),
            patientId: 'all', // 👈 คีย์สำคัญ: ส่งให้ทุกคน (Notifications.jsx จะกรองเจอนี้)
            type: 'system', 
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        localStorage.setItem('notifications', JSON.stringify([newNotif, ...currentNotifs]));
        try {
            window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { id: newNotif.id, type: 'system' } }));
        } catch(e) {}
    };

    // --- Memoized Data (กรองข้อมูล) ---
    const filteredClinics = useMemo(() => {
        const term = clinicSearchTerm.toLowerCase();
        if (!term) return clinicsData;
        return clinicsData.filter(clinic => 
            clinic.name.toLowerCase().includes(term)
        );
    }, [clinicsData, clinicSearchTerm]);

    const selectedClinic = useMemo(() => {
        if (view !== 'detail' || !currentEditingClinicId) return null;
        return clinicsData.find(c => c.id === currentEditingClinicId);
    }, [clinicsData, currentEditingClinicId, view]);

    const specialties = useMemo(() => {
        if (!selectedClinic) return {};
        return selectedClinic.doctors.reduce((acc, doctor) => {
            const specialty = doctor.specialty || "ไม่มีแผนก";
            if (!acc[specialty]) acc[specialty] = 0;
            acc[specialty]++;
            return acc;
        }, {});
    }, [selectedClinic]);

    const filteredDoctors = useMemo(() => {
        if (!selectedClinic) return [];
        const term = doctorSearchTerm.toLowerCase();
        
        return selectedClinic.doctors.filter(d => {
            const nameMatch = d.name.toLowerCase().includes(term);
            if (term && !nameMatch) return false;
            
            const specialtyMatch = (activeSpecialty === 'all') || (d.specialty || "ไม่มีแผนก") === activeSpecialty;
            return specialtyMatch;
        });

    }, [selectedClinic, doctorSearchTerm, activeSpecialty]);


    // --- Event Handlers (Clinic Master) ---
    const handleAddClinic = async (e) => {
        e.preventDefault();
        try {
            const image = addClinicImage.trim() || `https://placehold.co/600x400/008080/FFFFFF?text=${encodeURIComponent(addClinicName)}`;

            const response = await axios.post('/api/hospitals', {
                name: addClinicName,
                address: '',
                phone: '',
                email: '',
                website: '',
                logo: image,
            });

            const hospital = response.data.hospital;
            const newClinic = {
                id: hospital.id,
                name: hospital.name,
                image: hospital.image || hospital.logo || image,
                doctors: [],
            };

            const updated = [...clinicsData, newClinic];
            saveClinicsData(updated);
            broadcastSystemNotification(`🎉 โรงพยาบาลใหม่! "${addClinicName}" เปิดให้บริการจองคิวแล้ว`);

            setAddClinicName('');
            setAddClinicImage('');
            alert('เพิ่มโรงพยาบาล/คลินิกใหม่ และแจ้งเตือนคนไข้เรียบร้อยแล้ว');
        } catch (error) {
            console.error('Add clinic error:', error);
            alert('ไม่สามารถเพิ่มโรงพยาบาลได้ ขณะนี้กรุณาลองใหม่อีกครั้ง');
        }
    };

    const handleOpenClinicDetail = (id) => {
        const clinic = clinicsData.find(c => c.id === id);
        if (!clinic) return;
        setCurrentEditingClinicId(id);
        setEditClinicName(clinic.name);
        setEditClinicImage(clinic.image);
        setDoctorSearchTerm('');
        setActiveSpecialty('all');
        setView('detail');
        window.scrollTo(0, 0);
    };
    
    // --- Event Handlers (Clinic Detail) ---
    const handleBackToMaster = () => {
        setCurrentEditingClinicId(null);
        setView('master');
        window.scrollTo(0, 0);
    };

    const handleEditClinic = async (e) => {
        e.preventDefault();
        if (!selectedClinic) return;

        try {
            const image = editClinicImage.trim() || `https://placehold.co/600x400/008080/FFFFFF?text=${encodeURIComponent(editClinicName)}`;
            await axios.put(`/api/hospitals/${selectedClinic.id}`, {
                name: editClinicName,
                logo: image,
            });

            const updatedData = clinicsData.map(c => {
                if (c.id === selectedClinic.id) {
                    return { ...c, name: editClinicName, image: image };
                }
                return c;
            });

            saveClinicsData(updatedData);
            alert('แก้ไขข้อมูลโรงพยาบาล/คลินิกเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Edit clinic error:', error);
            alert('ไม่สามารถแก้ไขข้อมูลโรงพยาบาลได้ ขณะนี้กรุณาลองใหม่อีกครั้ง');
        }
    };

    const handleDeleteClinic = async () => {
        if (!selectedClinic) return;
        if (window.confirm(`คุณต้องการลบโรงพยาบาล/คลินิก "${selectedClinic.name}" ใช่หรือไม่? \n(การกระทำนี้จะลบแพทย์ทั้งหมดในคลินิกนี้ด้วย!)`)) {
            try {
                await axios.delete(`/api/hospitals/${selectedClinic.id}`);
                const updatedData = clinicsData.filter(c => c.id !== selectedClinic.id);
                saveClinicsData(updatedData);
                alert('ลบโรงพยาบาล/คลินิกเรียบร้อยแล้ว');
                handleBackToMaster();
            } catch (error) {
                console.error('Delete clinic error:', error);
                alert('ไม่สามารถลบโรงพยาบาลได้ในขณะนี้ กรุณาลองอีกครั้ง');
            }
        }
    };

    // --- Event Handlers (Doctor Management) ---
    const handleAddDoctorImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAddDoctorImage(reader.result);
                setAddDoctorImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAddDoctorImage = () => {
        setAddDoctorImage('');
        setAddDoctorImagePreview('');
    };

    const handleAddDoctor = (e) => {
        e.preventDefault();
        if (!selectedClinic) return;

        const newDoctor = {
            id: Date.now(), name: addDoctorName,
            specialty: addDoctorSpecialty || "ไม่มีแผนก",
            email: addDoctorEmail, 
            image: addDoctorImage,
            packages: []
        };
        const updatedData = clinicsData.map(c => {
            if (c.id === selectedClinic.id) {
                return { ...c, doctors: [...c.doctors, newDoctor] };
            }
            return c;
        });
        saveClinicsData(updatedData);
        
        // 🔹 แจ้งเตือนคนไข้ทุกคน 🔹
        broadcastSystemNotification(`👨‍⚕️ แพทย์ท่านใหม่! ${newDoctor.name} (${newDoctor.specialty}) ประจำ${selectedClinic.name} พร้อมให้บริการ`);

        setAddDoctorName('');
        setAddDoctorSpecialty('');
        setAddDoctorEmail('');
        setAddDoctorImage('');
        setAddDoctorImagePreview('');
        alert('เพิ่มแพทย์ใหม่ และแจ้งเตือนคนไข้เรียบร้อยแล้ว');
    };

    const handleDeleteDoctor = (doctorId) => {
        if (!selectedClinic) return;
        const doctor = selectedClinic.doctors.find(d => d.id === doctorId);
        if (!doctor) return;
        if (window.confirm(`คุณต้องการลบแพทย์ "${doctor.name}" ใช่หรือไม่?`)) {
            const updatedDoctors = selectedClinic.doctors.filter(d => d.id !== doctorId);
            const updatedData = clinicsData.map(c => {
                if (c.id === selectedClinic.id) {
                    return { ...c, doctors: updatedDoctors };
                }
                return c;
            });
            saveClinicsData(updatedData);
            alert('ลบแพทย์เรียบร้อยแล้ว');
        }
    };
    
    // --- Event Handlers (Doctor Modal) ---
    const handleOpenDoctorModal = (doctorId) => {
        if (!selectedClinic) return;
        const doctor = selectedClinic.doctors.find(d => d.id === doctorId);
        if (doctor) {
            setCurrentEditingDoctor(doctor);
            setIsDoctorModalOpen(true);
        }
    };
    
    const handleCloseDoctorModal = () => {
        setIsDoctorModalOpen(false);
        setCurrentEditingDoctor(null);
    };

    const handleSaveDoctorEdit = (doctorId, updatedDoctorData) => {
        if (!selectedClinic) return;
        const updatedDoctors = selectedClinic.doctors.map(d => {
            if (d.id === doctorId) {
                return { ...d, ...updatedDoctorData };
            }
            return d;
        });
        const updatedClinicsData = clinicsData.map(c => {
             if (c.id === selectedClinic.id) {
                return { ...c, doctors: updatedDoctors };
            }
            return c;
        });
        saveClinicsData(updatedClinicsData);
        alert('แก้ไขข้อมูลแพทย์เรียบร้อยแล้ว');
    };

    // --- Render Functions ---

    // (View: หน้า Master)
    if (view === 'master') {
        return (
            // (ลบ Header ออกแล้ว)
            <div id="page-manage-clinics" className="page active">
                <main className="container" style={{maxWidth: '100%', padding: '0.5rem'}}>
                    {/* ฟอร์มเพิ่มคลินิกใหม่ */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                        border: '1px solid #e5e7eb',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 600, color: '#1f2937'}}>
                            เพิ่ม (โรงพยาบาล/คลินิก) ใหม่
                        </h3>
                        <form id="add-clinic-form" onSubmit={handleAddClinic}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 500, color: '#374151'}}>ชื่อคลินิก</label>
                                    <input type="text" className="input" required 
                                           placeholder="เช่น รพ.สมิติเวช สุขุมวิท"
                                           value={addClinicName} onChange={(e) => setAddClinicName(e.target.value)}
                                           style={{width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem'}} />
                                </div>
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 500, color: '#374151'}}>URL รูปภาพ (ไม่บังคับ)</label>
                                    <input type="url" className="input" 
                                           placeholder="https://example.com/image.jpg"
                                           value={addClinicImage} onChange={(e) => setAddClinicImage(e.target.value)}
                                           style={{width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem'}} />
                                </div>
                            </div>
                            <button type="submit" style={{
                                width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem'
                            }}>เพิ่ม (โรงพยาบาล/คลินิก) ใหม่</button>
                        </form>
                    </div>
                    
                    {/* รายชื่อคลินิก */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                        <h4 style={{margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#1f2937'}}>รายชื่อโรงพยาบาล/คลินิกที่มีอยู่</h4>
                        <input type="search" placeholder={t('searchPlaceholderClinics')}
                               value={clinicSearchTerm} onChange={(e) => setClinicSearchTerm(e.target.value)}
                               style={{padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', width: '250px'}} />
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {filteredClinics.length === 0 ? (
                            <div style={{textAlign: 'center', padding: '3rem', color: '#9ca3af', background: 'white', borderRadius: '16px'}}>
                                {clinicSearchTerm ? t('noClinicsMatch') : t('noClinicsInSystem')}
                            </div>
                        ) : (
                            filteredClinics.map(clinic => (
                                <div key={clinic.id} style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                    border: '1px solid #e5e7eb',
                                    borderLeft: '4px solid #4f46e5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                        <img src={clinic.image} alt={clinic.name}
                                             onError={(e) => e.target.src='https://placehold.co/80x60/eeeeee/999999?text=Img'}
                                             style={{width: '80px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e5e7eb'}}
                                        />
                                        <div>
                                            <h4 style={{margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 600, color: '#1f2937'}}>{clinic.name}</h4>
                                            <p style={{margin: 0, fontSize: '0.9rem', color: '#6b7280'}}>
                                                ID: {clinic.id} | มีแพทย์ {clinic.doctors.length} คน
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenClinicDetail(clinic.id)} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <line x1="12" y1="8" x2="12" y2="16"/>
                                            <line x1="8" y1="12" x2="16" y2="12"/>
                                        </svg>
                                        จัดการ
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // (View: หน้า Detail)
    if (view === 'detail' && selectedClinic) {
        return (
            // (ลบ Header ออกแล้ว)
            <div id="page-manage-clinic-detail" className="page active">
                <main className="container" style={{maxWidth: '100%', paddingLeft: '0.5rem', paddingRight: '0.5rem'}}>
                    <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); handleBackToMaster(); }}
                       style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 500}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        กลับไปหน้าจัดการโรงพยาบาล/คลินิก
                    </a>
                    
                    {/* Header ชื่อคลินิก */}
                    <div style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: '16px',
                        padding: '1.5rem 2rem',
                        marginTop: '1rem',
                        marginBottom: '1.5rem',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
                    }}>
                        <h2 style={{margin: 0, fontSize: '1.5rem', fontWeight: 600}}>{selectedClinic.name}</h2>
                        <p style={{margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem'}}>
                            👨‍⚕️ มีแพทย์ทั้งหมด {selectedClinic.doctors.length} คน
                        </p>
                    </div>
                    
                    {/* Layout 2 คอลัมน์ */}
                    <div style={{display: 'grid', gridTemplateColumns: '480px 1fr', gap: '1.5rem', alignItems: 'start'}}>
                        
                        {/* คอลัมน์ซ้าย - แก้ไขคลินิก + เพิ่มแพทย์ */}
                        <div>
                            <div style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '2rem',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h4 style={{margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                    <span style={{background: '#dbeafe', padding: '0.5rem', borderRadius: '10px', display: 'flex'}}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </span>
                                    แก้ไขข้อมูลโรงพยาบาล/คลินิก
                                </h4>
                                <form id="edit-clinic-form" onSubmit={handleEditClinic}>
                                    <div style={{marginBottom: '1.25rem'}}>
                                        <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>ชื่อคลินิก</label>
                                        <input type="text" className="input" required 
                                               value={editClinicName} onChange={(e) => setEditClinicName(e.target.value)}
                                               style={{width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.1rem'}} />
                                    </div>
                                    <div style={{marginBottom: '1.25rem'}}>
                                        <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>URL รูปภาพ</label>
                                        <input type="url" className="input" 
                                               value={editClinicImage} onChange={(e) => setEditClinicImage(e.target.value)}
                                               style={{width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.1rem'}} />
                                    </div>
                                    <button type="submit" style={{
                                        width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem'
                                    }}>💾 บันทึกการเปลี่ยนแปลง</button>
                                </form>
                                <hr style={{margin: '1.5rem 0', borderColor: '#e5e7eb'}} />
                                <button onClick={handleDeleteClinic} style={{
                                    width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem'
                                }}>🗑️ ลบโรงพยาบาล/คลินิกนี้</button>
                            </div>
                            
                            <div style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '2rem',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                border: '1px solid #e5e7eb',
                                marginTop: '1.5rem'
                            }}>
                                <h4 style={{margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                    <span style={{background: '#dcfce7', padding: '0.5rem', borderRadius: '10px', display: 'flex'}}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                            <circle cx="8.5" cy="7" r="4"/>
                                            <line x1="20" y1="8" x2="20" y2="14"/>
                                            <line x1="23" y1="11" x2="17" y2="11"/>
                                        </svg>
                                    </span>
                                    เพิ่มแพทย์ใหม่
                                </h4>
                                <form id="add-doctor-form" onSubmit={handleAddDoctor}>
                                    {/* รูปภาพแพทย์ */}
                                    <div style={{marginBottom: '1.25rem'}}>
                                        <label style={{display: 'block', marginBottom: '0.6rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>รูปภาพแพทย์</label>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '1.25rem'}}>
                                            <div style={{
                                                width: '90px', height: '90px', borderRadius: '50%', 
                                                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '3px solid #e5e7eb', flexShrink: 0
                                            }}>
                                                {addDoctorImagePreview ? (
                                                    <img src={addDoctorImagePreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                ) : (
                                                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                )}
                                            </div>
                                            <div style={{flex: 1}}>
                                                <input type="file" accept="image/*" onChange={handleAddDoctorImageUpload}
                                                       style={{fontSize: '1rem', marginBottom: '0.35rem'}} />
                                                <div style={{fontSize: '0.9rem', color: '#9ca3af'}}>ขนาดไฟล์ไม่เกิน 2MB</div>
                                                {addDoctorImagePreview && (
                                                    <button type="button" onClick={handleRemoveAddDoctorImage}
                                                            style={{padding: '0.4rem 0.75rem', fontSize: '0.9rem', marginTop: '0.35rem', 
                                                                    background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
                                                        ลบรูป
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem'}}>
                                        <div>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>ชื่อแพทย์</label>
                                            <input type="text" className="input" required placeholder="นพ. สมชาย ใจดี"
                                                   value={addDoctorName} onChange={(e) => setAddDoctorName(e.target.value)}
                                                   style={{width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.05rem'}} />
                                        </div>
                                        <div>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>แผนก</label>
                                            <input type="text" className="input" required placeholder="อายุรศาสตร์"
                                                   value={addDoctorSpecialty} onChange={(e) => setAddDoctorSpecialty(e.target.value)}
                                                   style={{width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.05rem'}} />
                                        </div>
                                    </div>
                                    <div style={{marginBottom: '1.25rem'}}>
                                        <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 500, color: '#374151'}}>อีเมลแพทย์</label>
                                        <input type="email" className="input" required placeholder="doctor@example.com"
                                               value={addDoctorEmail} onChange={(e) => setAddDoctorEmail(e.target.value)}
                                               style={{width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1.05rem'}} />
                                    </div>
                                    <button type="submit" style={{
                                        width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem'
                                    }}>➕ เพิ่มแพทย์ใหม่</button>
                                </form>
                            </div>
                        </div>
                        
                        {/* คอลัมน์ขวา - รายชื่อแพทย์ */}
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '2rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem'}}>
                                <h4 style={{margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                    <span style={{background: '#fef3c7', padding: '0.5rem', borderRadius: '10px', display: 'flex'}}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                            <circle cx="9" cy="7" r="4"/>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                        </svg>
                                    </span>
                                    รายชื่อแพทย์ในโรงพยาบาล/คลินิกนี้
                                </h4>
                                <div style={{position: 'relative'}}>
                                    <input type="search" placeholder={t('searchPlaceholderDoctors')}
                                           value={doctorSearchTerm} onChange={(e) => setDoctorSearchTerm(e.target.value)}
                                           style={{padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', width: '220px'}} />
                                </div>
                            </div>
                        
                            {!doctorSearchTerm && (
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem'}}>
                                    <button 
                                        onClick={() => setActiveSpecialty('all')}
                                        style={{
                                            padding: '0.6rem 1.25rem', borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
                                            background: activeSpecialty === 'all' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#f3f4f6',
                                            color: activeSpecialty === 'all' ? 'white' : '#4b5563'
                                        }}
                                    >
                                        ทั้งหมด ({selectedClinic.doctors.length})
                                    </button>
                                    {Object.keys(specialties).sort().map(name => (
                                        <button 
                                            key={name}
                                            onClick={() => setActiveSpecialty(name)}
                                            style={{
                                                padding: '0.6rem 1.25rem', borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
                                                background: activeSpecialty === name ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#f3f4f6',
                                                color: activeSpecialty === name ? 'white' : '#4b5563'
                                            }}
                                        >
                                            {name} ({specialties[name]})
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxHeight: '700px', overflowY: 'auto', padding: '0.75rem'}}>
                                {filteredDoctors.length === 0 ? (
                                    <div style={{textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af', gridColumn: 'span 2', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '20px'}}>
                                        <div style={{width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                        </div>
                                        <p style={{margin: 0, fontSize: '1.1rem', fontWeight: 500, color: '#64748b'}}>ยังไม่มีข้อมูลแพทย์</p>
                                        <p style={{margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#94a3b8'}}>เพิ่มแพทย์ใหม่จากแบบฟอร์มด้านซ้าย</p>
                                    </div>
                                ) : (
                                    filteredDoctors.map(doctor => (
                                        <div key={doctor.id} 
                                             className="doctor-card-item"
                                             style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1.5rem',
                                                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '24px', 
                                                border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden',
                                                transition: 'all 0.3s ease', textAlign: 'center', 
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)'
                                            }}>
                                            {/* Decorative top gradient bar */}
                                            <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'}}></div>
                                            
                                            {/* Profile Image */}
                                            <div style={{
                                                width: '120px', height: '120px', borderRadius: '50%', 
                                                background: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)', overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '4px solid white', flexShrink: 0,
                                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)'
                                            }}>
                                                {doctor.image ? (
                                                    <img src={doctor.image} alt={doctor.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                ) : (
                                                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                )}
                                            </div>
                                            
                                            {/* Doctor Info */}
                                            <div style={{width: '100%'}}>
                                                <h4 style={{margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b'}}>{doctor.name}</h4>
                                                <p style={{margin: '0 0 0.6rem 0'}}>
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', 
                                                        color: '#4338ca', padding: '0.5rem 1.25rem', borderRadius: '20px', 
                                                        fontSize: '0.95rem', fontWeight: 600, display: 'inline-block',
                                                        boxShadow: '0 2px 8px rgba(67, 56, 202, 0.15)'
                                                    }}>
                                                        {doctor.specialty || 'ไม่ระบุ'}
                                                    </span>
                                                </p>
                                                <p style={{margin: 0, fontSize: '0.9rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'}}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                        <polyline points="22,6 12,13 2,6"></polyline>
                                                    </svg>
                                                    {doctor.email || 'ไม่มีอีเมล'}
                                                </p>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.75rem', width: '100%', justifyContent: 'center'}}>
                                                <button onClick={() => handleOpenDoctorModal(doctor.id)} 
                                                        className="btn-edit-doctor"
                                                        style={{
                                                            padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: 600,
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                                                            color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                                            transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    แก้ไข
                                                </button>
                                                <button onClick={() => handleDeleteDoctor(doctor.id)} 
                                                        className="btn-delete-doctor"
                                                        style={{
                                                            padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: 600,
                                                            background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)', 
                                                            color: '#b91c1c', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                    ลบ
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* CSS for hover effects */}
                            <style>{`
                                .doctor-card-item:hover {
                                    transform: translateY(-5px);
                                    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(0,0,0,0.1) !important;
                                    border-color: #c7d2fe !important;
                                }
                                .btn-edit-doctor:hover {
                                    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
                                    transform: translateY(-2px);
                                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4) !important;
                                }
                                .btn-delete-doctor:hover {
                                    background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%) !important;
                                    transform: translateY(-2px);
                                    color: #991b1b !important;
                                }
                            `}</style>
                        </div>
                        
                    </div>
                    
                </main>
                
                <EditDoctorModal 
                    doctor={currentEditingDoctor}
                    isOpen={isDoctorModalOpen}
                    onClose={handleCloseDoctorModal}
                    onSave={handleSaveDoctorEdit}
                />
            </div>
        );
    }
    return null;
}

export default Clinics;