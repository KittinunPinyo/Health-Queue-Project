import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

function Profile() {
    // --- State ---
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user: currentUser, updateUser, logout, changePassword, deleteAccount } = useAuth();

    const [view, setView] = useState('display'); 
    const [showIdCard, setShowIdCard] = useState(false);
    const [formData, setFormData] = useState({
        name: '', idCard: '', dob: '', age: '', gender: '', height: '',
        weight: '', conditions: '', allergies: ''
    });

    const normalizeErrorMessage = (message) => {
        const raw = String(message || '').trim();
        const lower = raw.toLowerCase();

        if (lower === 'invalid password' || lower === 'current password is incorrect') {
            return 'รหัสผ่านไม่ถูกต้อง';
        }
        if (lower === 'new password must be at least 8 characters') {
            return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
        }
        if (lower === 'access token required' || lower === 'invalid or expired token') {
            return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
        }
        return raw || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    };

    const showAlert = async ({ icon = 'info', text = '', title = 'แจ้งเตือน' }) => {
        return Swal.fire({
            icon,
            title,
            text,
            confirmButtonText: 'ตกลง',
            allowOutsideClick: false,
            customClass: {
                popup: 'profile-alert-popup',
                title: 'profile-alert-title',
                htmlContainer: 'profile-alert-text',
                confirmButton: 'profile-alert-confirm',
                icon: 'profile-alert-icon',
            },
            buttonsStyling: false,
        });
    };

    // --- Helper: Calculate Age ---
    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // --- Effect ---
    useEffect(() => {
        const user = currentUser;
        const profile = user?.healthProfile || {};
        setFormData({
            name: user?.name || '',
            idCard: user?.idCard || '', 
            dob: profile.dob || '',
            age: profile.age || '',
            gender: profile.gender || '',
            height: profile.height || '',
            weight: profile.weight || '',
            conditions: profile.conditions || '',
            allergies: profile.allergies || '',
        });
    }, [currentUser]);

    // --- Handlers ---
    const handleFormChange = (e) => {
        const { id, value } = e.target;
        let key = id;
        if (id.startsWith('profile-')) key = id.replace('profile-', '');

        if (key === 'dob') {
            const newAge = calculateAge(value);
            setFormData(prev => ({ ...prev, [key]: value, age: newAge }));
        } else {
            setFormData(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const payload = {
                name: formData.name,
                idCard: formData.idCard,
                dateOfBirth: formData.dob,
                age: formData.age,
                gender: formData.gender,
                height: formData.height,
                weight: formData.weight,
                medicalConditions: formData.conditions,
                allergies: formData.allergies,
            };

            const res = await axios.put('/api/user/profile', payload);
            const rawUser = res?.data?.user;

            if (rawUser) {
                const normalized = {
                    ...currentUser,
                    ...rawUser,
                    idCard: rawUser.id_card || rawUser.idCard || '',
                    healthProfile: {
                        dob: rawUser.date_of_birth || '',
                        age: rawUser.age || '',
                        gender: rawUser.gender || '',
                        height: rawUser.height || '',
                        weight: rawUser.weight || '',
                        conditions: rawUser.medical_conditions || '',
                        allergies: rawUser.allergies || '',
                    },
                };
                updateUser(normalized);
            }

            await showAlert({ icon: 'success', text: t('profileSaved') });
            setView('display');
        } catch (error) {
            const msg = normalizeErrorMessage(error?.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้');
            await showAlert({ icon: 'error', text: msg });
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'แจ้งเตือน',
            text: t('confirmLogout'),
            showCancelButton: true,
            confirmButtonText: t('logout'),
            cancelButtonText: t('cancel'),
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        await logout();
        navigate('/login', { replace: true });
    };
    
    const handleDeleteAccount = async () => {
        if (!currentUser) return;
        const confirmDelete = await Swal.fire({
            icon: 'warning',
            title: 'แจ้งเตือน',
            text: `${t('confirmDeleteAccount')}\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
            showCancelButton: true,
            confirmButtonText: t('deleteAccount'),
            cancelButtonText: t('cancel'),
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true,
        });
        if (!confirmDelete.isConfirmed) return;

        const result = await deleteAccount();
        if (!result.success) {
            await showAlert({ icon: 'error', text: normalizeErrorMessage(result.error || 'ลบบัญชีไม่สำเร็จ') });
            return;
        }

        // เคลียร์ข้อมูล local-only ที่ผูกกับผู้ใช้นี้
        let requests = JSON.parse(localStorage.getItem('requests')) || [];
        requests = requests.filter(r => r.patient?.id !== currentUser.id);
        localStorage.setItem('requests', JSON.stringify(requests));

        let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        notifications = notifications.filter(n => n.patientId !== currentUser.id);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'account-deleted' } })); } catch(e) {}

        await showAlert({ icon: 'success', text: t('accountDeleted') });
        navigate('/login', { replace: true });
    };

    const handleSettingsClick = async (feature) => {
        if (feature !== 'changePassword') {
            await showAlert({ icon: 'info', text: t('featureNotAvailable') });
            return;
        }

        const currentPasswordRes = await Swal.fire({
            title: 'กรอกรหัสผ่านปัจจุบัน',
            input: 'password',
            inputPlaceholder: 'Current password',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'ถัดไป',
            cancelButtonText: t('cancel'),
            reverseButtons: true,
        });
        if (!currentPasswordRes.isConfirmed) return;

        const newPasswordRes = await Swal.fire({
            title: 'กรอกรหัสผ่านใหม่',
            text: 'อย่างน้อย 8 ตัวอักษร',
            input: 'password',
            inputPlaceholder: 'New password',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'ถัดไป',
            cancelButtonText: t('cancel'),
            reverseButtons: true,
        });
        if (!newPasswordRes.isConfirmed) return;

        const confirmPasswordRes = await Swal.fire({
            title: 'ยืนยันรหัสผ่านใหม่',
            input: 'password',
            inputPlaceholder: 'Confirm new password',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: t('cancel'),
            reverseButtons: true,
        });
        if (!confirmPasswordRes.isConfirmed) return;

        const currentPassword = currentPasswordRes.value || '';
        const newPassword = newPasswordRes.value || '';
        const confirmPassword = confirmPasswordRes.value || '';

        if (newPassword !== confirmPassword) {
            await showAlert({ icon: 'error', text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' });
            return;
        }

        const result = await changePassword(currentPassword, newPassword);
        if (!result.success) {
            await showAlert({ icon: 'error', text: normalizeErrorMessage(result.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ') });
            return;
        }

        await showAlert({ icon: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
    };

    if (!currentUser) return null; 

    const profile = currentUser.healthProfile || {};

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getMaskedIdCard = (idCard) => {
        if (!idCard) return '-';
        const last4 = String(idCard).slice(-4);
        return `•••••••••${last4}`;
    };

    // --- CSS Styles ---
        // --- Inline Styles ---
    const styles = {
        pageWrapper: {
            background: 'transparent',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '0px',
            paddingBottom: '24px',
            position: 'relative',
            zIndex: 1
        },
        container: {
            width: '100%',
            maxWidth: '800px',
            padding: '0 20px',
        },
        card: {
            backgroundColor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(30,64,175,0.09), 0 1px 0 rgba(147,197,253,0.2)',
            padding: '28px',
            marginBottom: '16px',
            border: '1px solid rgba(219,234,254,0.7)'
        },
        headerSection: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
        },
        name: {
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1e3a8a',
            marginBottom: '6px',
            letterSpacing: '-0.01em'
        },
        email: {
            fontSize: '0.9rem',
            color: '#64748b',
            marginBottom: '3px'
        },
        editButton: {
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(30,64,175,0.28)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
        },
        sectionTitle: {
            fontSize: '1rem',
            fontWeight: '700',
            color: '#1e3a8a',
            marginBottom: '18px',
            borderLeft: '4px solid #3b82f6',
            paddingLeft: '12px'
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '10px'
        },
        infoItem: {
            display: 'flex',
            flexDirection: 'column'
        },
        infoLabel: {
            fontSize: '0.78rem',
            color: '#94a3b8',
            marginBottom: '4px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
        },
        infoValue: {
            fontSize: '0.97rem',
            fontWeight: '600',
            color: '#1e293b'
        },
        settingsGroup: {
            backgroundColor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(219,234,254,0.7)',
            boxShadow: '0 4px 16px rgba(30,64,175,0.06)',
            marginBottom: '12px'
        },
        settingItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(219,234,254,0.5)',
            cursor: 'pointer',
            color: '#334155',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'background 0.2s'
        },
        settingItemDanger: {
            color: '#ef4444'
        },
        inputGroup: {
            marginBottom: '14px'
        },
        inputLabel: {
            display: 'block',
            marginBottom: '6px',
            fontSize: '0.83rem',
            color: '#475569',
            fontWeight: '600',
            letterSpacing: '0.02em'
        },
        input: {
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            fontSize: '0.97rem',
            color: '#1e293b',
            backgroundColor: '#fafdff',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s'
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
        },
        cancelButton: {
            flex: 1,
            padding: '11px',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            backgroundColor: 'white',
            color: '#475569',
            fontSize: '0.97rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
        },
        saveButton: {
            flex: 1,
            padding: '11px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            color: 'white',
            fontSize: '0.97rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(30,64,175,0.25)',
            transition: 'all 0.2s'
        }
    };

    return (
        <div className="profile-page" style={{position: 'relative', minHeight: '100vh', background: 'transparent', paddingTop: '72px', paddingBottom: '88px'}}>
              <div style={styles.pageWrapper}>
                <main style={styles.container}>
                    
                    {view === 'display' && (
                        <>
                            {/* ส่วนแสดงข้อมูลโปรไฟล์ */}
                            <div style={styles.card}>
                                <div style={styles.headerSection}>
                                    <div>
                                        <div style={styles.name}>{currentUser.name}</div>
                                        <div style={styles.email}>{currentUser.email}</div>
                                        <div style={{ ...styles.email, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>เลขบัตรประชาชน: {showIdCard ? (currentUser.idCard || '-') : getMaskedIdCard(currentUser.idCard)}</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowIdCard(prev => !prev)}
                                                aria-label={showIdCard ? 'ซ่อนเลขบัตรประชาชน' : 'แสดงเลขบัตรประชาชน'}
                                                title={showIdCard ? 'ซ่อนเลขบัตรประชาชน' : 'แสดงเลขบัตรประชาชน'}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '999px',
                                                    border: '1px solid #cbd5e1',
                                                    background: '#ffffff',
                                                    color: '#334155',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    padding: 0
                                                }}
                                            >
                                                {showIdCard ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.92-2.17 2.45-4 4.35-5.35"></path>
                                                        <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83"></path>
                                                        <path d="M1 1l22 22"></path>
                                                        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.12 11.12 0 0 1-1.92 3.19"></path>
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        className="edit-btn"
                                        style={styles.editButton} 
                                        onClick={() => setView('edit')}
                                    >
                                        {t('editProfile')}
                                    </button>
                                </div>

                                <div style={{borderTop: '1px solid rgba(219,234,254,0.6)', margin: '18px 0'}}></div>

                                <div style={styles.sectionTitle}>{t('healthInfo')}</div>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('birthDate')}</span>
                                        <span style={styles.infoValue}>{formatDate(profile.dob)}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('age')}</span>
                                        <span style={styles.infoValue}>{profile.age ? `${profile.age} ปี` : '-'}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('gender')}</span>
                                        <span style={styles.infoValue}>{profile.gender || '-'}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('heightWeight')}</span>
                                        <span style={styles.infoValue}>
                                            {profile.height ? `${profile.height} ซม.` : '-'} / {profile.weight ? `${profile.weight} กก.` : '-'}
                                        </span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('chronicDiseases')}</span>
                                        <span style={styles.infoValue}>{profile.conditions || 'ไม่มี'}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>{t('drugAllergies')}</span>
                                        <span style={styles.infoValue}>{profile.allergies || 'ไม่มี'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ส่วนตั้งค่าบัญชี */}
                            <div style={{paddingLeft: '4px', marginBottom: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase'}}>{t('accountSettings')}</div>
                            <div style={styles.settingsGroup}>
                                <div className="setting-item" style={styles.settingItem} onClick={() => handleSettingsClick('changePassword')}>
                                    <span>{t('changePassword')}</span>
                                    <span style={{color: '#d1d5db'}}>›</span>
                                </div>
                                {/* language setting removed as requested */}
                            </div>

                            {/* ส่วนออกจากระบบ */}
                            <div style={{paddingLeft: '4px', marginBottom: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase'}}>{t('logout')}</div>
                            <div style={styles.settingsGroup}>
                                <div className="setting-item" style={{...styles.settingItem, ...styles.settingItemDanger}} onClick={handleLogout}>
                                    <span>{t('logout')}</span>
                                    <span style={{color: '#fca5a5'}}>›</span>
                                </div>
                                <div className="setting-item" style={{...styles.settingItem, ...styles.settingItemDanger, borderBottom: 'none'}} onClick={handleDeleteAccount}>
                                    <span>{t('deleteAccount')}</span>
                                    <span style={{color: '#fca5a5'}}>›</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ส่วนฟอร์มแก้ไขข้อมูล */}
                    {view === 'edit' && (
                        <div style={styles.card}>
                            <div style={{...styles.sectionTitle, marginBottom: '30px', borderLeft: 'none', paddingLeft: 0, textAlign: 'center', fontSize: '1.3rem'}}>
                                {t('editProfile')}
                            </div>
                            
                            <form onSubmit={handleSaveProfile}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel} htmlFor="profile-name">{t('name')}</label>
                                    <input type="text" id="profile-name" style={styles.input} required 
                                        value={formData.name} onChange={handleFormChange} />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel} htmlFor="profile-idCard">{t('idCard')}</label>
                                    <input type="text" id="profile-idCard" style={styles.input} 
                                        value={formData.idCard} onChange={handleFormChange} pattern="\d{13}" title="13 หลัก" />
                                </div>
                                
                                <div style={{borderTop: '1px solid rgba(219,234,254,0.6)', margin: '20px 0'}}></div>
                                <div style={{...styles.sectionTitle, fontSize: '0.95rem', marginBottom: '16px'}}>ข้อมูลสุขภาพ</div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel} htmlFor="profile-dob">วันเกิด</label>
                                    <input type="date" id="profile-dob" style={styles.input}
                                        value={formData.dob} onChange={handleFormChange} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.inputLabel} htmlFor="profile-age">{t('age')} (ปี)</label>
                                        <input type="number" id="profile-age" style={{...styles.input, backgroundColor: '#e5e7eb', cursor: 'not-allowed'}}
                                            value={formData.age} readOnly />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.inputLabel} htmlFor="profile-gender">{t('gender')}</label>
                                        <select id="profile-gender" style={styles.input}
                                            value={formData.gender} onChange={handleFormChange}>
                                            <option value="">-- {t('selectDoctorMethod') || t('gender')} --</option>
                                            <option value="ชาย">{t('male')}</option>
                                            <option value="หญิง">{t('female')}</option>
                                            <option value="อื่นๆ">{t('other')}</option>
                                            <option value="ไม่ระบุ">{t('notSpecified')}</option>
                                        </select>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.inputLabel} htmlFor="profile-height">{t('height')} (ซม.)</label>
                                        <input type="number" id="profile-height" style={styles.input}
                                            value={formData.height} onChange={handleFormChange} />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.inputLabel} htmlFor="profile-weight">{t('weight')} (กก.)</label>
                                        <input type="number" id="profile-weight" style={styles.input}
                                            value={formData.weight} onChange={handleFormChange} />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel} htmlFor="profile-conditions">{t('chronicDiseasesOptional') || t('chronicDiseases')}</label>
                                    <input type="text" id="profile-conditions" style={styles.input}
                                        value={formData.conditions} onChange={handleFormChange} />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel} htmlFor="profile-allergies">{t('drugAllergiesOptional') || t('drugAllergies')}</label>
                                    <input type="text" id="profile-allergies" style={styles.input}
                                        value={formData.allergies} onChange={handleFormChange} />
                                </div>

                                <div style={styles.buttonGroup}>
                                    <button type="button" onClick={() => setView('display')} className="cancel-btn" style={styles.cancelButton}>
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="save-btn" style={styles.saveButton}>
                                        {t('saveData')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Profile;