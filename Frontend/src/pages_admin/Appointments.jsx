import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

// --- Component: Stat Card ---
const StatCard = ({ title, value, icon: Icon, color1, color2 }) => {
    return (
        <div style={{
            background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '120px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ zIndex: 2 }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>{value}</h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '8px', fontWeight: '500' }}>{title}</p>
            </div>
            {/* Background Icon Decoration */}
            <div style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                opacity: 0.2,
                transform: 'scale(3)',
                color: 'white'
            }}>
                <Icon />
            </div>
            {/* Small Icon Badge */}
            <div style={{
                position: 'absolute',
                right: '15px',
                bottom: '15px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}>
                <Icon />
            </div>
        </div>
    );
};

// --- Component: Modal แก้ไขคนไข้ ---
function EditPatientModal({ user, requests, isOpen, onClose, onSave }) {
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

    // (กรองประวัติการนัดหมาย)
    const patientHistory = useMemo(() => {
        if (!user) return [];
        return requests
            .filter(r => r.patient?.id === user.id)
            .sort((a, b) => b.id - a.id);
    }, [user, requests]);

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

// --- Main Component: Appointments (Patient Management) ---
function Appointments() { 
    const { t } = useLanguage();
    // --- State ---
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // --- Data Loading ---
    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const storedRequests = JSON.parse(localStorage.getItem('requests')) || [];
        setUsers(storedUsers);
        setRequests(storedRequests);
    }, []); 

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
        if (!term) return users;
        return users.filter(user => 
            user.name.toLowerCase().includes(term) ||
            (user.idCard && user.idCard.includes(term))
        );
    }, [users, searchTerm]);

    const handleOpenModal = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) { setCurrentUser(user); setIsModalOpen(true); }
    };

    const handleSaveUser = (userId, updatedData) => {
        const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updatedData } : u);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        // alert('แก้ไขข้อมูลคนไข้เรียบร้อยแล้ว');
    };

    const handleDeletePatient = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user && window.confirm(`คุณต้องการลบคนไข้ "${user.name}" ออกจากระบบใช่หรือไม่?`)) {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
    };

    // --- Styles ---
    const styles = {
        page: { padding: '20px', background: '#f9fafb', minHeight: '100vh', fontFamily: "'Prompt', sans-serif" },
        header: { marginBottom: '24px' },
        title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
        banner: {
            background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
            borderRadius: '16px',
            padding: '24px 30px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)'
        },
        bannerIcon: {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
        },
        filters: {
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center'
        },
        searchBox: {
            flex: 1,
            minWidth: '300px',
            position: 'relative'
        },
        searchInput: {
            width: '100%',
            padding: '12px 12px 12px 40px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
        },
        tableContainer: {
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            border: '1px solid #f1f5f9'
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
            backgroundColor: '#f8fafc'
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
            {/* Blue Banner */}
            <div style={styles.banner}>
                <div style={styles.bannerIcon}>
                    <UsersIcon />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>จัดการข้อมูลคนไข้</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>ดูแลและจัดการรายชื่อผู้ใช้ทั้งหมดในระบบ</p>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div style={styles.statsGrid}>
                <StatCard title="คนไข้ทั้งหมด" value={stats.total} icon={UsersIcon} color1="#8b5cf6" color2="#7c3aed" />
                <StatCard title="เพศชาย" value={stats.male} icon={MaleIcon} color1="#3b82f6" color2="#2563eb" />
                <StatCard title="เพศหญิง" value={stats.female} icon={FemaleIcon} color1="#ec4899" color2="#db2777" />
                <StatCard title="มีโรคประจำตัว" value={stats.risk} icon={ActivityIcon} color1="#f59e0b" color2="#d97706" />
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                <div style={styles.searchBox}>
                    <div style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }}>
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
            </div>

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
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
                                const profile = user.healthProfile || {};
                                return (
                                    <tr key={user.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', alignItems: 'center'}}>
                                                <div style={styles.avatarCircle}>{user.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{fontWeight: '600'}}>{user.name}</div>
                                                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>{user.id}</div>
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
                                                <div style={{marginTop: '4px', color: '#64748b'}}>โรค: {profile.conditions || '-'}</div>
                                            </div>
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right'}}>
                                            <button 
                                                onClick={() => handleOpenModal(user.id)}
                                                style={{...styles.actionBtn, background: '#eff6ff', color: '#3b82f6'}}
                                            >
                                                <EditIcon /> แก้ไข
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePatient(user.id)}
                                                style={{...styles.actionBtn, background: '#fef2f2', color: '#ef4444'}}
                                            >
                                                <TrashIcon /> ลบ
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
                requests={requests}
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveUser} 
            />
        </div>
    );
}

export default Appointments;