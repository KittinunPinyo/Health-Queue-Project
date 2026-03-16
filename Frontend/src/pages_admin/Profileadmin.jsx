import React from 'react';
import { useNavigate } from 'react-router-dom';
// (CSS ถูก import ใน main.jsx แล้ว)

function ProfileAdmin() {
    const navigate = useNavigate();

    // --- Event Handlers ---
    const handleAddAdmin = (e) => {
        e.preventDefault();
        alert('ฟังก์ชันเพิ่มแอดมิน ยังไม่เปิดใช้งาน');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        alert('ฟังก์ชันเปลี่ยนรหัสผ่าน ยังไม่เปิดใช้งาน');
    };

    const handleLogout = () => {
        if (window.confirm('คุณต้องการออกจากระบบ Admin ใช่หรือไม่?')) {
            // 🔹 [FIX] 🔹
            sessionStorage.removeItem('currentUser');
            navigate('/login');
        }
    };

    return (
        // (Layout จะใส่ Header ให้)
        <div id="page-settings" className="page active">
            <main className="container">
                
                <div className="card patient-profile-card" style={{ background: 'var(--dark-color)', color: 'white' }}>
                    <div className="patient-card-header">
                        <div>
                            {/* (ในอนาคต ควรอ่านจาก currentUser) */}
                            <h3 id="admin-card-name">Admin User</h3>
                            <p id="admin-card-email" style={{color: '#ccc'}}>admin@admin.com</p>
                        </div>
                    </div>
                    <hr />
                    <div className="profile-info-grid">
                        <div>
                            <small style={{color: '#ccc'}}>ตำแหน่ง</small>
                            <p>ผู้ดูแลระบบ</p>
                        </div>
                        <div>
                            <small style={{color: '#ccc'}}>สถานะ</small>
                            <p>Active</p>
                        </div>
                    </div>
                </div>

                <h3 className="settings-header">การจัดการระบบ</h3>
                <div className="settings-list">
                    <a href="#" id="settings-add-admin" className="settings-item" onClick={handleAddAdmin}>
                        <span>เพิ่มผู้ดูแลระบบใหม่</span>
                        <span>&rsaquo;</span>
                    </a>
                    <a href="#" id="settings-change-password" className="settings-item" onClick={handleChangePassword}>
                        <span>เปลี่ยนรหัสผ่าน</span>
                        <span>&rsaquo;</span>
                    </a>
                </div>

                <h3 className="settings-header">ออกจากระบบ</h3>
                <div className="settings-list">
                    <a href="#" id="logout-btn" className="settings-item danger" onClick={handleLogout}>
                        <span>ออกจากระบบ</span>
                        <span>&rsaquo;</span>
                    </a>
                </div>

            </main>
        </div>
    );
}

export default ProfileAdmin;