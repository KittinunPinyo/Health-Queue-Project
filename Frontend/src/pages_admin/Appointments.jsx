import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// --- Icons (SVG) ---
const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const MaleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> 
);
const FemaleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
);
const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

// --- Component: Stat Card ---
const StatCard = ({ title, value, icon: Icon, color1, color2, onClick, isActive }) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardLift = isHovered ? -7 : (isActive ? -2 : 0);

    return (
        <div style={{
            background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
            borderRadius: '18px',
            padding: '18px 20px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '128px',
            border: isActive ? '2px solid rgba(255,255,255,0.45)' : '2px solid rgba(255,255,255,0.14)',
            boxShadow: isHovered
                ? '0 16px 34px rgba(15,23,42,0.26)'
                : isActive
                ? '0 0 0 4px rgba(59, 130, 246, 0.32), 0 14px 30px rgba(15,23,42,0.22)'
                : '0 10px 22px rgba(15,23,42,0.16)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: `translateY(${cardLift}px) scale(${isHovered ? 1.01 : 1})`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
            }
        }}>
            <div style={{ zIndex: 2 }}>
                <h2 style={{ fontSize: '2.7rem', fontWeight: '800', margin: 0, lineHeight: 1 }}>{value}</h2>
                <p style={{ fontSize: '1rem', opacity: 0.95, marginTop: '8px', fontWeight: '700' }}>{title}</p>
            </div>
            {/* Background Icon Decoration */}
            <div style={{
                position: 'absolute',
                right: '-12px',
                bottom: '-16px',
                opacity: 0.14,
                transform: 'scale(3.4)',
                color: 'white'
            }}>
                <Icon />
            </div>
            <div style={{
                position: 'absolute',
                top: '-24px',
                right: '-24px',
                width: '94px',
                height: '94px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)'
            }} />
            {/* Small Icon Badge */}
            <div style={{
                position: 'absolute',
                right: '14px',
                bottom: '12px',
                background: 'rgba(255,255,255,0.24)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}>
                <div style={{ transform: 'scale(0.72)' }}>
                    <Icon />
                </div>
            </div>
        </div>
    );
};

// --- Component: Modal แก้ไขคนไข้ ---
function EditPatientModal({ user, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({});
    const [healthData, setHealthData] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                id: user.id || '',
                name: user.name || '',
                email: user.email || '',
                idCard: user.idCard || '',
            });
            setHealthData(user.healthProfile || {});
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleChange = (e) => {
        const key = e.target.name; 
        setFormData(prev => ({ ...prev, [key]: e.target.value }));
    };
    const handleHealthChange = (e) => {
        const key = e.target.name;
        setHealthData(prev => ({ ...prev, [key]: e.target.value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, { ...formData, healthProfile: healthData });
        onClose();
    };

    // Modal Styles
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)'
    };
    const modalContentStyle = {
        background: 'white', padding: '25px', borderRadius: '16px',
        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    };
    const inputStyle = {
        width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0',
        marginBottom: '10px', fontSize: '0.95rem', boxSizing: 'border-box'
    };
    const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#475569', fontWeight: '500' };

    return (
        <div style={modalOverlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modalContentStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h3 style={{margin: 0, fontSize: '1.25rem', color: '#1e293b'}}>แก้ไขข้อมูลคนไข้</h3>
                    <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <h4 style={{fontSize: '1rem', color: '#3b82f6', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px'}}>ข้อมูลส่วนตัว</h4>
                    <div>
                        <label style={labelStyle}>ชื่อ-นามสกุล</label>
                        <input type="text" name="name" style={inputStyle} required value={formData.name} onChange={handleChange} />
                    </div>
                    <div>
                        <label style={labelStyle}>อีเมล</label>
                        <input type="email" name="email" style={inputStyle} required value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label style={labelStyle}>เลขบัตรประชาชน</label>
                        <input 
                            type="text" 
                            name="idCard" 
                            style={{...inputStyle, backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b'}} 
                            value={formData.idCard} 
                            readOnly 
                        />
                    </div>
                    
                    <h4 style={{fontSize: '1rem', color: '#3b82f6', marginBottom: '10px', marginTop: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px'}}>ข้อมูลสุขภาพ</h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                        <div>
                            <label style={labelStyle}>อายุ</label>
                            <input type="number" name="age" style={inputStyle} value={healthData.age || ''} onChange={handleHealthChange} />
                        </div>
                        <div>
                            <label style={labelStyle}>เพศ</label>
                            <select name="gender" style={inputStyle} value={healthData.gender || ''} onChange={handleHealthChange}>
                                <option value="">-- เลือก --</option>
                                <option value="ชาย">ชาย</option>
                                <option value="หญิง">หญิง</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>ส่วนสูง (ซม.)</label>
                            <input type="number" name="height" style={inputStyle} value={healthData.height || ''} onChange={handleHealthChange} placeholder="เช่น 170" />
                        </div>
                        <div>
                            <label style={labelStyle}>น้ำหนัก (กก.)</label>
                            <input type="number" name="weight" style={inputStyle} value={healthData.weight || ''} onChange={handleHealthChange} placeholder="เช่น 60" />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>โรคประจำตัว</label>
                        <input type="text" name="conditions" style={inputStyle} value={healthData.conditions || ''} onChange={handleHealthChange} />
                    </div>
                    <div>
                        <label style={labelStyle}>ประวัติแพ้ยา</label>
                        <input type="text" name="allergies" style={inputStyle} value={healthData.allergies || ''} onChange={handleHealthChange} />
                    </div>

                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                        <button type="button" onClick={onClose} style={{padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer'}}>ยกเลิก</button>
                        <button type="submit" style={{padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer'}}>บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AppointmentHistoryModal({ isOpen, onClose, user, loading, error, appointments }) {
    if (!isOpen || !user) return null;

    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)'
    };
    const modalContentStyle = {
        background: 'white', padding: '25px', borderRadius: '16px',
        width: '90%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    };

    return (
        <div style={modalOverlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modalContentStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <div>
                        <h3 style={{margin: 0, fontSize: '1.25rem', color: '#1e293b'}}>ประวัติการนัดหมาย</h3>
                        <p style={{margin: '4px 0 0 0', color: '#64748b'}}>คนไข้: {user.name || '-'}</p>
                    </div>
                    <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}>&times;</button>
                </div>

                {loading ? (
                    <div style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>กำลังโหลดประวัติการนัดหมาย...</div>
                ) : error ? (
                    <div style={{padding: '12px 16px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b'}}>{error}</div>
                ) : appointments.length === 0 ? (
                    <div style={{padding: '24px', textAlign: 'center', color: '#94a3b8'}}>ไม่พบประวัติการนัดหมาย</div>
                ) : (
                    <div style={{display: 'grid', gap: '10px'}}>
                        {appointments.map((item) => (
                            <div key={item.id} style={{border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                                    <div style={{fontWeight: '600', color: '#1e293b'}}>{item.clinic?.name || item.clinicName || 'ไม่ระบุคลินิก'}</div>
                                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>สถานะ: {item.status || '-'}</div>
                                </div>
                                <div style={{marginTop: '6px', color: '#334155', fontSize: '0.9rem'}}>
                                    วันที่: {item.date || '-'} เวลา: {item.time || '-'}
                                </div>
                                <div style={{marginTop: '4px', color: '#64748b', fontSize: '0.85rem'}}>
                                    แพทย์: {item.selectedDoctor || item.doctorName || 'ไม่ระบุ'}
                                </div>
                                {item.symptoms ? (
                                    <div style={{marginTop: '4px', color: '#64748b', fontSize: '0.85rem'}}>อาการ: {item.symptoms}</div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Component: Appointments (Patient Management) ---
function Appointments() { 
    const { t } = useLanguage();
    const { fetchAdminUserList } = useAuth();
    // --- State ---
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [cardFilter, setCardFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [historyUser, setHistoryUser] = useState(null);
    const [historyAppointments, setHistoryAppointments] = useState([]);

    const normalizeUser = (rawUser) => ({
        ...rawUser,
        idCard: rawUser.id_card || rawUser.idCard || '',
        healthProfile: {
            age: rawUser.age || '',
            gender: rawUser.gender || '',
            height: rawUser.height || '',
            weight: rawUser.weight || '',
            conditions: rawUser.medical_conditions || '',
            allergies: rawUser.allergies || '',
        },
    });

    const loadPatientUsers = async (condition = '') => {
        setLoading(true);
        setError('');

        try {
            const conditionText = String(condition || '').trim();

            if (conditionText) {
                try {
                    const response = await axios.get(`/api/user/search-by-condition?condition=${encodeURIComponent(conditionText)}`);
                    const usersFromCondition = Array.isArray(response.data?.users) ? response.data.users : [];
                    const patientUsers = usersFromCondition
                        .filter((user) => String(user.role || '').toLowerCase() === 'patient')
                        .map(normalizeUser);
                    setUsers(patientUsers);
                    return;
                } catch (conditionApiError) {
                    // Fallback: keep feature usable even if condition API fails.
                    const response = await fetchAdminUserList();
                    if (response.success) {
                        const lowerCondition = conditionText.toLowerCase();
                        const patientUsers = (response.users || [])
                            .filter((user) => String(user.role || '').toLowerCase() === 'patient')
                            .map(normalizeUser)
                            .filter((user) => String(user.healthProfile?.conditions || '').toLowerCase().includes(lowerCondition));
                        setUsers(patientUsers);
                        setError('');
                        return;
                    }

                    throw conditionApiError;
                }
            }

            const response = await fetchAdminUserList();
            if (response.success) {
                const patientUsers = (response.users || [])
                    .filter((user) => String(user.role || '').toLowerCase() === 'patient')
                    .map(normalizeUser);
                setUsers(patientUsers);
            } else {
                setUsers([]);
                setError(response.error || 'ไม่สามารถโหลดข้อมูลคนไข้ได้ในขณะนี้');
            }
        } catch (err) {
            setUsers([]);
            setError(err.response?.data?.error || 'ไม่สามารถค้นหาคนไข้ด้วยโรคประจำตัวได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPatientUsers(conditionFilter);
        }, 300);

        return () => clearTimeout(timer);
    }, [conditionFilter, fetchAdminUserList]);

    // --- Helper to update navbar badge ---
    useEffect(() => {
        try {
            const patientCountBadge = document.getElementById('patient-count-badge');
            if (patientCountBadge) patientCountBadge.textContent = users.length || '0';
        } catch(e) {}
    }, [users]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        return {
            total: users.length,
            male: users.filter(u => u.healthProfile?.gender === 'ชาย').length,
            female: users.filter(u => u.healthProfile?.gender === 'หญิง').length,
            risk: users.filter(u => u.healthProfile?.conditions && u.healthProfile?.conditions !== 'ไม่มี' && u.healthProfile?.conditions !== '-').length
        };
    }, [users]);

    // --- Filter Users ---
    const filteredUsers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const usersByCard = users.filter((user) => {
            const gender = String(user.healthProfile?.gender || '').trim();
            const conditions = String(user.healthProfile?.conditions || '').trim();

            if (cardFilter === 'male') return gender === 'ชาย';
            if (cardFilter === 'female') return gender === 'หญิง';
            if (cardFilter === 'risk') return Boolean(conditions) && conditions !== 'ไม่มี' && conditions !== '-';
            return true;
        });

        if (!term) return usersByCard;
        return usersByCard.filter(user => 
            String(user.name || '').toLowerCase().includes(term) ||
            String(user.email || '').toLowerCase().includes(term) ||
            (user.idCard && user.idCard.includes(term))
        );
    }, [users, searchTerm, cardFilter]);

    const handleOpenModal = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) { setCurrentUser(user); setIsModalOpen(true); }
    };

    const handleSaveUser = (userId, updatedData) => {
        const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updatedData } : u);
        setUsers(updatedUsers);
        // alert('แก้ไขข้อมูลคนไข้เรียบร้อยแล้ว');
    };

    const handleOpenHistory = async (user) => {
        if (!user?.id) return;

        setHistoryUser(user);
        setHistoryAppointments([]);
        setHistoryError('');
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);

        try {
            const response = await axios.get(`/api/appointments?userId=${encodeURIComponent(user.id)}`);
            const items = Array.isArray(response.data) ? response.data : [];
            setHistoryAppointments(items);
        } catch (err) {
            setHistoryError(err.response?.data?.error || 'ไม่สามารถโหลดประวัติการนัดหมายได้');
        } finally {
            setHistoryLoading(false);
        }
    };

    // --- Styles ---
    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 55%, #ffffff 100%)',
            padding: '0.5rem 0.4rem 2.2rem',
            fontFamily: "'Prompt', sans-serif"
        },
        container: { maxWidth: '1400px', margin: '0 auto' },
        banner: {
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            borderRadius: '24px',
            padding: '24px 28px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 24px 60px rgba(59, 130, 246, 0.18)',
            position: 'relative',
            overflow: 'hidden'
        },
        bannerOrbRight: {
            position: 'absolute', right: '-64px', top: '-64px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)'
        },
        bannerOrbLeft: {
            position: 'absolute', left: '-40px', bottom: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
        },
        bannerIcon: {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '18px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '18px',
            zIndex: 1
        },
        bannerContent: {
            position: 'relative',
            zIndex: 1
        },
        bannerChip: {
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '999px', padding: '6px 16px', marginBottom: '10px',
            fontSize: '12px', fontWeight: 700
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        },
        filters: {
            background: 'rgba(255,255,255,0.86)',
            padding: '12px',
            borderRadius: '20px',
            marginBottom: '24px',
            boxShadow: '0 14px 38px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        searchBox: {
            flex: 1,
            minWidth: '250px',
            maxWidth: '500px',
            position: 'relative'
        },
        conditionBox: {
            flex: 1,
            minWidth: '260px',
            position: 'relative'
        },
        filterSelect: {
            padding: '10px 36px 10px 14px',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            minWidth: '170px',
            cursor: 'pointer',
            backgroundColor: '#f9fafb',
            color: '#374151',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center'
        },
        searchInput: {
            width: '100%',
            padding: '10px 14px 10px 40px',
            borderRadius: '10px',
            border: '1.5px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s',
            backgroundColor: '#f9fafb',
            boxSizing: 'border-box'
        },
        tableContainer: {
            background: 'rgba(255,255,255,0.88)',
            borderRadius: '20px',
            boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse'
        },
        th: {
            textAlign: 'left',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            color: '#64748b',
            fontWeight: '600',
            fontSize: '0.85rem',
            backgroundColor: '#f8fbff'
        },
        td: {
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            color: '#334155',
            fontSize: '0.95rem',
            verticalAlign: 'middle'
        },
        avatarCircle: {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#e0e7ff',
            color: '#4338ca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            marginRight: '12px'
        },
        actionBtn: {
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem'
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
            {/* Blue Banner */}
            <div style={styles.banner}>
                <div style={styles.bannerOrbRight} />
                <div style={styles.bannerOrbLeft} />
                <div style={styles.bannerIcon}>
                    <UsersIcon />
                </div>
                <div style={styles.bannerContent}>
                    <div style={styles.bannerChip}>แดชบอร์ด</div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>จัดการข้อมูลคนไข้</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.94rem' }}>ดูแลและจัดการรายชื่อผู้ใช้ทั้งหมดในระบบ</p>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div style={styles.statsGrid}>
                <StatCard
                    title="คนไข้ทั้งหมด"
                    value={stats.total}
                    icon={UsersIcon}
                    color1="#8b5cf6"
                    color2="#7c3aed"
                    onClick={() => setCardFilter('all')}
                    isActive={cardFilter === 'all'}
                />
                <StatCard
                    title="เพศชาย"
                    value={stats.male}
                    icon={MaleIcon}
                    color1="#3b82f6"
                    color2="#2563eb"
                    onClick={() => setCardFilter('male')}
                    isActive={cardFilter === 'male'}
                />
                <StatCard
                    title="เพศหญิง"
                    value={stats.female}
                    icon={FemaleIcon}
                    color1="#ec4899"
                    color2="#db2777"
                    onClick={() => setCardFilter('female')}
                    isActive={cardFilter === 'female'}
                />
                <StatCard
                    title="มีโรคประจำตัว"
                    value={stats.risk}
                    icon={ActivityIcon}
                    color1="#f59e0b"
                    color2="#d97706"
                    onClick={() => setCardFilter('risk')}
                    isActive={cardFilter === 'risk'}
                />
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                <div style={styles.searchBox}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <SearchIcon />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('searchPlaceholderPatient')} 
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={styles.conditionBox}>
                    <input 
                        type="text"
                        placeholder="กรองโรคประจำตัว เช่น เบาหวาน"
                        style={{...styles.searchInput, padding: '10px 14px'}}
                        value={conditionFilter}
                        onChange={(e) => setConditionFilter(e.target.value)}
                    />
                </div>

                {(searchTerm || conditionFilter || cardFilter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setConditionFilter('');
                            setCardFilter('all');
                        }}
                        style={{
                            padding: '10px 16px',
                            background: '#eef2ff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#4338ca',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                        onMouseLeave={(e) => e.target.style.background = '#eef2ff'}
                    >
                        <span>✕</span> ล้าง
                    </button>
                )}
            </div>

            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b' }}>
                    {error}
                </div>
            )}

            {/* User Table */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ชื่อ - นามสกุล</th>
                            <th style={styles.th}>ข้อมูลติดต่อ</th>
                            <th style={styles.th}>ข้อมูลสุขภาพ (เบื้องต้น)</th>
                            <th style={{...styles.th, textAlign: 'right'}}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                                    กำลังโหลดข้อมูลคนไข้...
                                </td>
                            </tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
                                const profile = user.healthProfile || {};
                                return (
                                    <tr key={user.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', alignItems: 'center'}}>
                                                <div style={styles.avatarCircle}>{String(user.name || '?').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{fontWeight: '600'}}>{user.name || '-'}</div>
                                                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>{user.idCard || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{color: '#334155'}}>{user.email}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{fontSize: '0.85rem'}}>
                                                <span style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginRight: '5px'}}>อายุ: {profile.age || '-'}</span>
                                                <span style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>เพศ: {profile.gender || '-'}</span>
                                                <div style={{marginTop: '4px', color: '#64748b'}}>
                                                    โรคประจำตัว: {profile.conditions || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right'}}>
                                            <button 
                                                onClick={() => handleOpenHistory(user)}
                                                style={{...styles.actionBtn, background: '#eef2ff', color: '#4338ca'}}
                                            >
                                                ประวัติ
                                            </button>
                                            <button 
                                                onClick={() => handleOpenModal(user.id)}
                                                style={{...styles.actionBtn, background: '#eff6ff', color: '#3b82f6'}}
                                            >
                                                <EditIcon /> แก้ไข
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
                                    ไม่พบรายชื่อคนไข้
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={{padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem'}}>
                    <span>ทั้งหมด {filteredUsers.length} รายชื่อ</span>
                </div>
            </div>

            {/* Modal Component */}
            <EditPatientModal 
                user={currentUser} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveUser} 
            />

            <AppointmentHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                user={historyUser}
                loading={historyLoading}
                error={historyError}
                appointments={historyAppointments}
            />
            </div>
        </div>
    );
}

export default Appointments;