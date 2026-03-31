import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

// --- Internal Header Component (Updated Style with Image Logo) ---
const Header = ({ title, onBack }) => {
    return (
        <header style={{
            height: '4.5rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(239,246,255,0.78) 60%, rgba(219,234,254,0.72) 100%)',
            backdropFilter: 'blur(20px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
            boxShadow: '0 1px 0 rgba(59,130,246,0.14), 0 4px 24px rgba(30,64,175,0.07)',
            borderBottom: '1.5px solid rgba(147,197,253,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
            boxSizing: 'border-box',
            fontFamily: "'Sarabun', 'Prompt', sans-serif"
        }}>
            {/* Left Side: Logo & Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                {onBack && (
                    <button 
                        onClick={onBack}
                        style={{
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            color: '#1e40af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.22)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                )}
                
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/public/healthqueue.png" 
                        alt="Health Queue Logo" 
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23007bff\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial,Helvetica,sans-serif\'%3EH%3C/text%3E%3C/svg%3E';
                        }}
                        style={{ 
                            width: '100px', 
                            height: '100px', 
                            objectFit: 'contain',
                        }} 
                    />
                </div>
            </div>

            {/* Center: Title */}
            <h1 style={{ 
                margin: 0, 
                fontSize: '1.15rem', 
                color: '#1e3a5f',
                fontWeight: '700',
                letterSpacing: '0.01em',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                zIndex: 1,
                fontFamily: "'Sarabun', 'Prompt', sans-serif"
            }}>
                {title}
            </h1>

            {/* Right Side: Empty */}
            <div style={{ width: '40px' }}></div> 
        </header>
    );
};

// --- Custom Alert Component ---
const CustomAlert = ({ isOpen, message, type, onClose }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const mainColor = isSuccess ? '#10b981' : '#ef4444';
    const bgColor = isSuccess ? '#ecfdf5' : '#fef2f2';
    
    const icon = isSuccess ? (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={mainColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    ) : (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={mainColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white', borderRadius: '20px', padding: '2rem',
                width: '90%', maxWidth: '380px', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                transform: 'scale(1)', animation: 'scaleIn 0.2s ease-out',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', backgroundColor: bgColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                }}>
                    {icon}
                </div>

                <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '1.25rem', fontWeight: '700' }}>
                    {isSuccess ? 'เรียบร้อย' : 'แจ้งเตือน'}
                </h3>
                <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {message}
                </p>

                <button 
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none',
                        backgroundColor: mainColor,
                        color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                        transition: 'transform 0.1s, opacity 0.2s',
                        boxShadow: `0 4px 12px ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}
                    onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.target.style.transform = 'scale(1)'}
                >
                    ตกลง
                </button>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

const authContainerStyle = {
  minHeight: '100vh', 
  paddingTop: '5.5rem',
  paddingBottom: '2rem',
  display: 'flex',
  alignItems: 'center',    
  justifyContent: 'center', 
  paddingLeft: '1rem',
  paddingRight: '1rem',
  boxSizing: 'border-box',
  position: 'relative',
  zIndex: 1,
};

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    const [view, setView] = useState(location.state?.view === 'register' ? 'register' : 'login');
    const [regStep, setRegStep] = useState(1); 
    const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'error' });
    
    const fromPath = location.state?.from?.pathname; 
    let fromPatient = "/patient/home";
    let fromAdmin = "/admin/home";

    if (fromPath && fromPath.startsWith('/admin')) {
        fromAdmin = fromPath;
    } else if (fromPath && fromPath.startsWith('/patient')) {
        fromPatient = fromPath;
    }

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regIdCard, setRegIdCard] = useState('');

    const [regDob, setRegDob] = useState(''); 
    const [regAge, setRegAge] = useState('');
    const [regGender, setRegGender] = useState('ไม่ระบุ');
    const [regHeight, setRegHeight] = useState('');
    const [regWeight, setRegWeight] = useState('');
    const [regConditions, setRegConditions] = useState(''); 
    const [regAllergies, setRegAllergies] = useState('');   

    const showAlert = (message, type = 'error') => {
        setAlertState({ isOpen: true, message, type });
    };

    const closeAlert = () => {
        setAlertState({ ...alertState, isOpen: false });
    };

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

    const handleDobChange = (e) => {
        const dob = e.target.value;
        setRegDob(dob);
        setRegAge(calculateAge(dob)); 
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = loginEmail.trim();
        const result = await login(email, loginPassword);
        if (result.success) {
            const role = String(result.user?.role || '').toLowerCase();
            if (role === 'admin') {
                navigate(fromAdmin, { replace: true });
            } else {
                navigate(fromPatient, { replace: true });
            }
        } else {
            showAlert(result.error);
        }
    };

    const handleNextStep = () => {
        if (!regName || !regEmail || !regIdCard || !regPassword) {
            showAlert("กรุณากรอกข้อมูลบัญชีให้ครบทุกช่อง");
            return;
        }
        
        if (regIdCard.length !== 13) {
            showAlert("เลขบัตรประชาชนต้องมี 13 หลัก");
            return;
        }
        if (regPassword.length < 6) {
            showAlert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        setRegStep(2);
    };

    const handlePrevStep = () => {
        setRegStep(1);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        const userData = {
            name: regName,
            email: regEmail,
            password: regPassword,
            idCard: regIdCard,
            dateOfBirth: regDob,
            age: parseInt(regAge),
            gender: regGender,
            height: parseFloat(regHeight),
            weight: parseFloat(regWeight),
            medicalConditions: regConditions || null,
            allergies: regAllergies || null
        };

        const result = await register(userData);
        if (result.success) {
            showAlert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", "success");
            
            // Reset form
            setRegName(''); setRegEmail(''); setRegPassword(''); setRegIdCard('');
            setRegDob(''); setRegAge(''); setRegGender('ไม่ระบุ'); setRegHeight(''); setRegWeight('');
            setRegConditions(''); setRegAllergies('');
            setRegStep(1); 
            setView('login');
        } else {
            const normalized = (result.error || '').toLowerCase();
            if (normalized.includes('already exists')) {
                showAlert('อีเมลหรือเลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือใช้ข้อมูลใหม่');
            } else {
                showAlert(result.error);
            }
        }
    };

    return (
        <div style={{ background: '#f0f7ff', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
                {/* ── Decorative background blobs ── */}
                <div className="login-blob-top-right" />
                <div className="login-blob-bottom-left" />
                <div className="login-blob-mid-right" />

            <CustomAlert 
                isOpen={alertState.isOpen} 
                message={alertState.message} 
                type={alertState.type}
                onClose={closeAlert}
            />

            <Header 
                title={view === 'login' ? 'เข้าสู่ระบบ Health Queue' : 'สมัครสมาชิกใหม่'} 
                onBack={view === 'register' ? () => { setView('login'); setRegStep(1); } : null}
            />

            <div id="auth-container" style={authContainerStyle}>

                <div 
                    id="page-login" 
                    style={{ display: view === 'login' ? 'block' : 'none', width: '100%', maxWidth: '450px' }}
                >
                    <div className="container" style={{padding: 0}}>
                        <div className="card">
                            <h2 style={{
                                textAlign: 'center',
                                marginBottom: '8px',
                                fontSize: '2rem',
                                fontWeight: '800',
                                color: '#1e3a8a',
                                letterSpacing: '-0.02em'
                            }}>ยินดีต้อนรับ</h2>
                            <p style={{
                                fontSize: '0.92rem',
                                color: '#64748b',
                                textAlign: 'center',
                                marginBottom: '28px',
                                lineHeight: '1.7'
                            }}>
                                โปรดเข้าสู่ระบบด้วยบัญชีที่คุณได้เคยสมัครไว้บนเว็บไซต์ ถ้าคุณยังไม่มีบัญชีให้สมัครสมาชิกด้านล่าง
                            </p>
                            
                            <form id="login-form" onSubmit={handleLogin}>
                                <div className="input-group">
                                    <label htmlFor="email">อีเมล</label>
                                    <input 
                                        type="email" id="email" className="input" required 
                                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="user@gmail.com"
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="password">รหัสผ่าน</label>
                                    <input 
                                        type="password" id="password" className="input" required 
                                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="กรอกรหัสผ่าน"
                                    />
                                </div>
                                <button type="submit" className="btn">เข้าสู่ระบบ</button>
                            </form>
                            <p className="text-center" style={{marginTop: '1.5rem', marginBottom: 0}}>
                                ยังไม่มีบัญชี? 
                                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setView('register'); }} style={{marginLeft: '5px'}}>
                                    สมัครสมาชิกที่นี่
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div 
                    id="page-register" 
                    style={{ display: view === 'register' ? 'block' : 'none', width: '100%', maxWidth: '600px' }}
                >
                    <div className="container" style={{padding: 0}}>
                        <div className="card">
                            <h2 style={{
                                textAlign: 'center',
                                marginBottom: '4px',
                                fontSize: '1.8rem',
                                fontWeight: '800',
                                color: '#1e3a8a',
                                letterSpacing: '-0.02em'
                            }}>สมัครสมาชิก</h2>
                            <p style={{
                                textAlign: 'center',
                                marginBottom: '12px',
                                color: '#64748b',
                                fontSize: '0.88rem',
                                fontWeight: '500'
                            }}>
                                {regStep === 1 ? 'ขั้นตอนที่ 1: ข้อมูลบัญชี' : 'ขั้นตอนที่ 2: ข้อมูลสุขภาพ'}
                            </p>
                            
                            <div style={{display: 'flex', gap: '6px', marginBottom: '16px', justifyContent: 'center'}}>
                                <div style={{height: '5px', width: '40px', background: '#2563eb', borderRadius: '3px'}}></div>
                                <div style={{height: '5px', width: '40px', background: regStep === 2 ? '#2563eb' : '#dbeafe', borderRadius: '3px', transition: 'background 0.3s'}}></div>
                            </div>

                            <form id="register-form" onSubmit={handleRegister}>
                                
                                {regStep === 1 && (
                                    <div className="step-1-content">
                                            <h4 style={{
                                                marginTop: '0',
                                                marginBottom: '12px',
                                                borderBottom: '1.5px solid #dbeafe',
                                                paddingBottom: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                color: '#2563eb',
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase'
                                            }}>1. ข้อมูลบัญชี</h4>
                                            <div className="input-group">
                                                <label htmlFor="name-register">ชื่อ-นามสกุล</label>
                                                <input 
                                                    type="text" id="name-register" className="input" required={regStep === 1}
                                                    value={regName} onChange={(e) => setRegName(e.target.value)}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="email-register">อีเมล (@gmail.com เท่านั้น)</label>
                                                <input 
                                                    type="email" id="email-register" className="input" required={regStep === 1}
                                                    value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                                                    placeholder="user@gmail.com"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="idCard">เลขบัตรประชาชน (13 หลัก)</label>
                                                <input 
                                                    type="text" id="idCard" className="input" required={regStep === 1}
                                                    pattern="\d{13}" title="กรุณากรอกเลขบัตรประชาชน 13 หลัก"
                                                    value={regIdCard} onChange={(e) => setRegIdCard(e.target.value)}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="password-register">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
                                                <input 
                                                    type="password" id="password-register" className="input" required={regStep === 1} minLength="6"
                                                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                                                />
                                            </div>
                                            
                                            <button type="button" className="btn" style={{marginTop: '1rem'}} onClick={handleNextStep}>
                                                ถัดไป
                                            </button>
                                    </div>
                                )}

                                {regStep === 2 && (
                                    <div className="step-2-content">
                                            <h4 style={{
                                                marginTop: '0',
                                                marginBottom: '12px',
                                                borderBottom: '1.5px solid #dbeafe',
                                                paddingBottom: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                color: '#2563eb',
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase'
                                            }}>2. ข้อมูลสุขภาพ</h4>
                                            <div className="input-group">
                                                <label htmlFor="reg-dob">วันเกิด</label>
                                                <input 
                                                    type="date" id="reg-dob" className="input" required={regStep === 2}
                                                    value={regDob} onChange={handleDobChange}
                                                />
                                            </div>

                                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                                <div className="input-group">
                                                    <label htmlFor="reg-age">อายุ</label>
                                                    <input 
                                                        type="number" id="reg-age" className="input" required={regStep === 2}
                                                        value={regAge} 
                                                        readOnly 
                                                        style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label htmlFor="reg-gender">เพศ</label>
                                                    <select 
                                                        id="reg-gender" className="input" required={regStep === 2}
                                                        value={regGender} onChange={(e) => setRegGender(e.target.value)}
                                                    >
                                                        <option value="ชาย">ชาย</option>
                                                        <option value="หญิง">หญิง</option>
                                                        <option value="อื่นๆ">อื่นๆ</option>
                                                    </select>
                                                </div>
                                                <div className="input-group">
                                                    <label htmlFor="reg-height">ส่วนสูง (ซม.)</label>
                                                    <input 
                                                        type="number" id="reg-height" className="input" required={regStep === 2}
                                                        value={regHeight} onChange={(e) => setRegHeight(e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label htmlFor="reg-weight">น้ำหนัก (กก.)</label>
                                                    <input 
                                                        type="number" id="reg-weight" className="input" required={regStep === 2}
                                                        value={regWeight} onChange={(e) => setRegWeight(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="reg-conditions">โรคประจำตัว (ถ้าไม่มีให้เว้นว่าง)</label>
                                                <input 
                                                    type="text" id="reg-conditions" className="input" 
                                                    value={regConditions} onChange={(e) => setRegConditions(e.target.value)}
                                                    placeholder="เช่น ความดัน, เบาหวาน"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="reg-allergies">ประวัติการแพ้ยา (ถ้าไม่มีให้เว้นว่าง)</label>
                                                <input 
                                                    type="text" id="reg-allergies" className="input" 
                                                    value={regAllergies} onChange={(e) => setRegAllergies(e.target.value)}
                                                    placeholder="เช่น แพ้อาหารทะเล"
                                                />
                                            </div>

                                            <div style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                                                <button type="button" className="btn" style={{backgroundColor: '#6c757d'}} onClick={handlePrevStep}>
                                                    ย้อนกลับ
                                                </button>
                                                <button type="submit" className="btn">
                                                    สมัครสมาชิก
                                                </button>
                                            </div>
                                    </div>
                                )}

                            </form>
                            <p className="text-center" style={{marginTop: '1.5rem', marginBottom: 0}}>
                                มีบัญชีอยู่แล้ว? 
                                <a 
                                    href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setView('login'); setRegStep(1); }}
                                    style={{marginLeft: '5px'}}
                                >
                                    เข้าสู่ระบบที่นี่
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}

export default Login;