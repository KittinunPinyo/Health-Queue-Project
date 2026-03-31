import React from 'react';
import { Link } from 'react-router-dom';

// --- Icons (SVG) ---
const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const FacebookIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
);

const InstagramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const LineIcon = () => ( // Mockup Icon for LINE using MessageCircle
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

function Footer() {
    // --- Styles ---
    const styles = {
        footer: {
            background: 'radial-gradient(circle at 15% 20%, rgba(59,130,246,0.24) 0%, transparent 28%), radial-gradient(circle at 85% 25%, rgba(37,99,235,0.22) 0%, transparent 32%), linear-gradient(135deg, #0b1635 0%, #1e3a8a 55%, #1d4ed8 100%)',
            color: 'white',
            padding: '34px 0 0',
            fontFamily: "'Prompt', sans-serif",
            marginTop: 'auto',
            borderTop: '1px solid rgba(147,197,253,0.45)',
            boxShadow: '0 -10px 42px rgba(15,23,42,0.35)'
        },
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '28px',
            marginBottom: '26px'
        },
        column: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        },
        title: {
            fontSize: '0.8rem',
            fontWeight: '700',
            marginBottom: '12px',
            position: 'relative',
            color: '#dbeafe',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
        },
        text: {
            fontSize: '0.9rem',
            lineHeight: '1.75',
            color: '#cbd5e1',
            margin: 0,
            maxWidth: '320px'
        },
        linkList: {
            listStyle: 'none',
            padding: 0,
            margin: 0
        },
        linkItem: {
            marginBottom: '8px'
        },
        link: {
            color: '#cbd5e1',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'color 0.2s, padding-left 0.2s',
            display: 'inline-block'
        },
        contactItem: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
            color: '#cbd5e1',
            fontSize: '0.9rem'
        },
        socialContainer: {
            display: 'flex',
            gap: '12px'
        },
        socialIcon: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(147,197,253,0.4)',
            color: '#dbeafe',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(15,23,42,0.25)'
        },
        copyright: {
            textAlign: 'center',
            padding: '16px',
            marginTop: '0',
            borderTop: '1px solid rgba(147,197,253,0.2)',
            fontSize: '0.82rem',
            color: '#93c5fd',
            background: 'rgba(2,6,23,0.28)'
        }
    };

    const handleMouseEnter = (e) => {
        e.target.style.color = '#f8fafc';
        e.target.style.paddingLeft = '6px';
    };
    const handleMouseLeave = (e) => {
        e.target.style.color = '#cbd5e1';
        e.target.style.paddingLeft = '0';
    };

    const handleSocialEnter = (e) => {
        e.currentTarget.style.background = 'rgba(147,197,253,0.28)';
        e.currentTarget.style.borderColor = 'rgba(191,219,254,0.8)';
        e.currentTarget.style.color = '#ffffff';
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
    };
    const handleSocialLeave = (e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.borderColor = 'rgba(147,197,253,0.4)';
        e.currentTarget.style.color = '#dbeafe';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
    };

    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                
                {/* Column 1: เกี่ยวกับเรา */}
                <div style={styles.column}>
                    <h3 style={styles.title}>เกี่ยวกับเรา</h3>
                    <p style={styles.text}>
                        เว็บไซต์ Health Queue เป็นระบบช่วยเหลือด้านสุขภาพออนไลน์ 
                        ที่ช่วยให้คุณสามารถนัดหมายและพูดคุยกับแพทย์ได้สะดวกรวดเร็วทุกที่ทุกเวลา 
                        เพื่อให้การดูแลสุขภาพเป็นเรื่องง่ายสำหรับทุกคน
                    </p>
                </div>

                {/* Column 2: ลิงก์ด่วน */}
                <div style={styles.column}>
                    <h3 style={styles.title}>ลิงค์ด่วน</h3>
                    <ul style={styles.linkList}>
                        <li style={styles.linkItem}>
                            <Link to="/patient/home" style={styles.link} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>หน้าหลัก</Link>
                        </li>
                        <li style={styles.linkItem}>
                            <Link to="/patient/my-appointments" style={styles.link} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>นัดหมาย</Link>
                        </li>
                        <li style={styles.linkItem}>
                            <Link to="/patient/clinics" style={styles.link} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>แชทและสอบถาม</Link>
                        </li>
                        <li style={styles.linkItem}>
                            <Link to="/patient/history" style={styles.link} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>ประวัติการนัดหมาย</Link>
                        </li>
                    </ul>
                </div>

                {/* Column 3: ติดต่อเรา */}
                <div style={styles.column}>
                    <h3 style={styles.title}>ติดต่อเรา</h3>
                    <div style={styles.contactItem}>
                        <MailIcon />
                        <span>healthqueue21@gmail.com</span>
                    </div>
                </div>

                {/* Column 4: ติดตามเรา */}
                <div style={styles.column}>
                    <h3 style={styles.title}>ติดตามเรา</h3>
                    <div style={styles.socialContainer}>
                        <a href="#" style={styles.socialIcon} aria-label="Facebook"
                            onMouseEnter={handleSocialEnter} onMouseLeave={handleSocialLeave}>
                            <FacebookIcon />
                        </a>
                        <a href="#" style={styles.socialIcon} aria-label="Instagram"
                            onMouseEnter={handleSocialEnter} onMouseLeave={handleSocialLeave}>
                            <InstagramIcon />
                        </a>
                        <a href="#" style={styles.socialIcon} aria-label="Line"
                            onMouseEnter={handleSocialEnter} onMouseLeave={handleSocialLeave}>
                            <LineIcon />
                        </a>
                    </div>
                </div>

            </div>

            {/* Copyright Section */}
            <div style={styles.copyright}>
                &copy; {new Date().getFullYear()} Health Queue | สงวนลิขสิทธิ์ทั้งหมด
            </div>
        </footer>
    );
}

export default Footer;