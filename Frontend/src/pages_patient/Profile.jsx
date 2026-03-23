import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
    // --- State ---
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user: currentUser, updateUser, logout } = useAuth();

    const [view, setView] = useState('display'); 
    const [formData, setFormData] = useState({
        name: '', idCard: '', dob: '', age: '', gender: '', height: '',
        weight: '', conditions: '', allergies: ''
    });

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

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const updatedUser = {
            ...currentUser,
            name: formData.name,
            idCard: formData.idCard,
            healthProfile: {
                dob: formData.dob,
                age: formData.age,
                gender: formData.gender,
                height: formData.height,
                weight: formData.weight,
                conditions: formData.conditions,
                allergies: formData.allergies,
            }
        };

        updateUser(updatedUser);
        alert(t('profileSaved'));
        setView('display');
    };

    const handleLogout = async () => {
        if (window.confirm(t('confirmLogout'))) {
            await logout();
            navigate('/login', { replace: true });
        }
    };
    
    const handleDeleteAccount = async () => {
        if (!currentUser) return;
        if (window.confirm(t('confirmDeleteAccount'))) {
            let users = JSON.parse(sessionStorage.getItem('users') || localStorage.getItem('users') || '[]');
            users = users.filter(u => u.id !== currentUser.id);
            sessionStorage.setItem('users', JSON.stringify(users));
            localStorage.removeItem('users');
            
            let requests = JSON.parse(localStorage.getItem('requests')) || [];
            requests = requests.filter(r => r.patient?.id !== currentUser.id);
            localStorage.setItem('requests', JSON.stringify(requests));
            
            let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
            notifications = notifications.filter(n => n.patientId !== currentUser.id);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            try { window.dispatchEvent(new CustomEvent('notifications-changed', { detail: { reason: 'account-deleted' } })); } catch(e) {}

            await logout();
            alert(t('accountDeleted'));
            navigate('/login', { replace: true });
        }
    };

    const handleSettingsClick = (feature) => {
        alert(t('featureNotAvailable'));
    };

    if (!currentUser) return null; 

    const profile = currentUser.healthProfile || {};

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- CSS for Background Shape (เหมือนหน้า Home) ---
    const cssStyles = `
        /* --- Background Curve Styles --- */
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
            top: 50%; /* เริ่มต้นที่กลางจอลงมา */
            left: -10%;
            width: 120%;
            height: 60%;
            background: #f4f9ff; /* สีฟ้าอ่อนมาก */
            border-top-left-radius: 50% 150px;
            border-top-right-radius: 50% 150px;
            transform: rotate(-2deg); /* เอียงเล็กน้อย */
            z-index: -1;
        }
    `;

    // --- Inline Styles ---
    const styles = {
        pageWrapper: {
            // backgroundColor: '#f9fafb',  <-- ลบสีพื้นหลังทึบออกเพื่อให้เห็น Shape
            background: 'transparent', 
            minHeight: '100vh', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start', 
            paddingTop: '40px',
            paddingBottom: '40px',
            fontFamily: "'Prompt', sans-serif",
            position: 'relative',
            zIndex: 1
        },
        container: {
            width: '100%',
            maxWidth: '800px',
            padding: '0 20px',
        },
        card: {
            backgroundColor: '#fff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            padding: '30px',
            marginBottom: '20px',
            border: '1px solid #f3f4f6'
        },
        headerSection: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
        },
        name: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
        },
        email: {
            fontSize: '0.95rem',
            color: '#6b7280',
            marginBottom: '4px'
        },
        editButton: {
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s'
        },
        sectionTitle: {
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '20px',
            borderLeft: '4px solid #3b82f6',
            paddingLeft: '12px'
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            marginBottom: '10px'
        },
        infoItem: {
            display: 'flex',
            flexDirection: 'column'
        },
        infoLabel: {
            fontSize: '0.85rem',
            color: '#9ca3af',
            marginBottom: '6px'
        },
        infoValue: {
            fontSize: '1rem',
            fontWeight: '500',
            color: '#374151'
        },
        settingsGroup: {
            backgroundColor: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
        },
        settingItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer',
            color: '#4b5563',
            fontSize: '1rem',
            transition: 'background 0.2s'
        },
        settingItemDanger: {
            color: '#ef4444'
        },
        inputGroup: {
            marginBottom: '16px'
        },
        inputLabel: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.9rem',
            color: '#4b5563',
            fontWeight: '500'
        },
        input: {
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            color: '#1f2937',
            backgroundColor: '#f9fafb',
            boxSizing: 'border-box'
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: '30px'
        },
        cancelButton: {
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            color: '#4b5563',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
        },
        saveButton: {
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
        }
    };

    return (
        <div style={{position: 'relative', minHeight: '100vh', backgroundColor: '#ffffff'}}>
            {/* Inject CSS Styles */}
            <style>{cssStyles}</style>
            
            {/* --- Background Decoration (ส่วนโค้งพื้นหลัง) --- */}
            <div className="bg-curve-container">
                <div className="curve-shape"></div>
            </div>

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
                                        <div style={styles.email}>เลขบัตรประชาชน: {currentUser.idCard || '-'}</div>
                                    </div>
                                    <button 
                                        style={styles.editButton} 
                                        onClick={() => setView('edit')}
                                    >
                                        {t('editProfile')}
                                    </button>
                                </div>

                                <div style={{borderTop: '1px solid #f3f4f6', margin: '20px 0'}}></div>

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
                            <div style={{paddingLeft: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#6b7280', fontWeight: '500'}}>{t('accountSettings')}</div>
                            <div style={styles.settingsGroup}>
                                <div style={styles.settingItem} onClick={() => handleSettingsClick('changePassword')}>
                                    <span>{t('changePassword')}</span>
                                    <span style={{color: '#d1d5db'}}>›</span>
                                </div>
                                {/* language setting removed as requested */}
                            </div>

                            {/* ส่วนออกจากระบบ */}
                            <div style={{paddingLeft: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#6b7280', fontWeight: '500'}}>{t('logout')}</div>
                            <div style={styles.settingsGroup}>
                                <div style={{...styles.settingItem, ...styles.settingItemDanger}} onClick={handleLogout}>
                                    <span>{t('logout')}</span>
                                    <span style={{color: '#d1d5db'}}>›</span>
                                </div>
                                <div style={{...styles.settingItem, ...styles.settingItemDanger, borderBottom: 'none'}} onClick={handleDeleteAccount}>
                                    <span>{t('deleteAccount')}</span>
                                    <span style={{color: '#d1d5db'}}>›</span>
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
                                
                                <div style={{borderTop: '1px solid #f3f4f6', margin: '24px 0'}}></div>
                                <div style={{...styles.sectionTitle, fontSize: '1rem', marginBottom: '20px'}}>ข้อมูลสุขภาพ</div>

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
                                    <button type="button" onClick={() => setView('display')} style={styles.cancelButton}>
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" style={styles.saveButton}>
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