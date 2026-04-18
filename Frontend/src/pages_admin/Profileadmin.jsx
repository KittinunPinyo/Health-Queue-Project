import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
// (CSS ถูก import ใน main.jsx แล้ว)

function ProfileAdmin() {
    const navigate = useNavigate();
    const { user, logout, changePassword } = useAuth();
    const isNarrow = typeof window !== 'undefined' ? window.innerWidth < 900 : false;

    const showToast = (icon, title) => Swal.fire({
        icon,
        title,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
    });

    // --- Event Handlers ---
    const handleAddAdmin = async (e) => {
        e.preventDefault();

        const result = await Swal.fire({
            title: 'เพิ่มผู้ดูแลระบบใหม่',
            html: `
                <input id="new-admin-name" class="swal2-input" placeholder="ชื่อผู้ใช้" />
                <input id="new-admin-email" class="swal2-input" placeholder="อีเมล" type="email" />
                <input id="new-admin-id-card" class="swal2-input" placeholder="เลขบัตรประชาชน" />
                <input id="new-admin-password" class="swal2-input" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)" type="password" />
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'สร้างบัญชี',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const name = document.getElementById('new-admin-name')?.value?.trim();
                const email = document.getElementById('new-admin-email')?.value?.trim();
                const idCard = document.getElementById('new-admin-id-card')?.value?.trim();
                const password = document.getElementById('new-admin-password')?.value || '';

                if (!name || !email || !idCard || !password) {
                    Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบทุกช่อง');
                    return null;
                }

                if (password.length < 8) {
                    Swal.showValidationMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
                    return null;
                }

                return { name, email, idCard, password };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        try {
            const { name, email, idCard, password } = result.value;

            const registerRes = await axios.post('/api/auth/register', {
                name,
                email,
                idCard,
                password,
            });

            const createdUserId = registerRes?.data?.user?.id;
            if (!createdUserId) {
                throw new Error('สร้างบัญชีสำเร็จ แต่ไม่พบข้อมูลผู้ใช้ใหม่');
            }

            await axios.put(`/api/user/${createdUserId}/role`, { role: 'admin' });
            await showToast('success', 'เพิ่มผู้ดูแลระบบสำเร็จ');
        } catch (error) {
            const message = error?.response?.data?.error || error?.message || 'ไม่สามารถเพิ่มผู้ดูแลระบบได้';
            await Swal.fire({ icon: 'error', title: 'เพิ่มผู้ดูแลระบบไม่สำเร็จ', text: message });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        const currentRes = await Swal.fire({
            title: 'กรอกรหัสผ่านปัจจุบัน',
            input: 'password',
            inputPlaceholder: 'Current password',
            showCancelButton: true,
            confirmButtonText: 'ถัดไป',
            cancelButtonText: 'ยกเลิก',
        });
        if (!currentRes.isConfirmed) return;

        const nextRes = await Swal.fire({
            title: 'กรอกรหัสผ่านใหม่',
            input: 'password',
            inputPlaceholder: 'New password',
            text: 'อย่างน้อย 8 ตัวอักษร',
            showCancelButton: true,
            confirmButtonText: 'ถัดไป',
            cancelButtonText: 'ยกเลิก',
        });
        if (!nextRes.isConfirmed) return;

        const confirmRes = await Swal.fire({
            title: 'ยืนยันรหัสผ่านใหม่',
            input: 'password',
            inputPlaceholder: 'Confirm new password',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
        });
        if (!confirmRes.isConfirmed) return;

        const currentPassword = currentRes.value || '';
        const newPassword = nextRes.value || '';
        const confirmPassword = confirmRes.value || '';

        if (newPassword !== confirmPassword) {
            await Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ตรงกัน', text: 'รหัสผ่านใหม่กับยืนยันรหัสผ่านต้องตรงกัน' });
            return;
        }

        const changed = await changePassword(currentPassword, newPassword);
        if (!changed.success) {
            await Swal.fire({ icon: 'error', title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', text: changed.error || 'กรุณาลองใหม่อีกครั้ง' });
            return;
        }

        await showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
    };

    const handleLogout = async () => {
        if (window.confirm('คุณต้องการออกจากระบบ Admin ใช่หรือไม่?')) {
            await logout();
            navigate('/login', { replace: true });
        }
    };

    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f0f6ff 0%, #f8fafc 55%, #ffffff 100%)',
            paddingBottom: '3rem',
        },
        wrapper: {
            maxWidth: '1020px',
            margin: '0 auto',
            padding: '0.9rem 1rem 0',
        },
        contentGrid: {
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr' : 'minmax(340px, 1.12fr) minmax(300px, 1fr)',
            gap: '1rem',
            alignItems: 'start',
        },
        rightStack: {
            display: 'grid',
            gap: '0.8rem',
        },
        accountCard: {
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.07)',
            padding: '1.2rem 1.25rem',
        },
        accountName: {
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
        },
        accountEmail: {
            margin: '0.35rem 0 0',
            color: '#64748b',
            fontSize: '0.95rem',
        },
        accountDivider: {
            border: 'none',
            borderTop: '1px solid #e2e8f0',
            margin: '0.95rem 0 0.8rem',
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.75rem',
        },
        infoLabel: {
            color: '#94a3b8',
            fontSize: '0.78rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.25rem',
            display: 'block',
        },
        infoValue: {
            margin: 0,
            color: '#0f172a',
            fontSize: '1.05rem',
            fontWeight: 700,
        },
        sectionTitle: {
            margin: '0 0 0.45rem 0.1rem',
            color: '#64748b',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
        },
        panel: {
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
            padding: '0.9rem',
        },
        dangerPanel: {
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(248, 113, 113, 0.25)',
            boxShadow: '0 8px 20px rgba(220, 38, 38, 0.07)',
            padding: '0.9rem',
        },
        list: {
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
        },
        actionBtn: {
            width: '100%',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 0.95rem',
            fontSize: '0.96rem',
            color: '#0f172a',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: '1px solid #f1f5f9',
        },
        actionBtnHover: {
            background: '#f8fafc',
        },
        actionBtnLast: {
            borderBottom: 'none',
        },
        actionArrow: {
            color: '#94a3b8',
            fontSize: '1.1rem',
            lineHeight: 1,
        },
        dangerBtn: {
            color: '#dc2626',
        },
        dangerArrow: {
            color: '#f87171',
            fontSize: '1.1rem',
            lineHeight: 1,
        },
    };

    return (
        <div id="page-settings" className="page active" style={styles.page}>
            <main style={styles.wrapper}>
                <section style={styles.contentGrid}>
                    <div style={styles.accountCard}>
                        <h3 id="admin-card-name" style={styles.accountName}>{user?.name || 'Admin User'}</h3>
                        <p id="admin-card-email" style={styles.accountEmail}>{user?.email || 'admin@admin.com'}</p>
                        <hr style={styles.accountDivider} />
                        <div style={styles.infoGrid}>
                            <div>
                                <small style={styles.infoLabel}>ตำแหน่ง</small>
                                <p style={styles.infoValue}>{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}</p>
                            </div>
                            <div>
                                <small style={styles.infoLabel}>สถานะ</small>
                                <p style={styles.infoValue}>Active</p>
                            </div>
                        </div>
                    </div>

                    <div style={styles.rightStack}>
                        <div style={styles.panel}>
                            <h3 style={styles.sectionTitle}>การจัดการระบบ</h3>
                            <div style={styles.list}>
                                <button
                                    type="button"
                                    id="settings-add-admin"
                                    onClick={handleAddAdmin}
                                    style={styles.actionBtn}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionBtnHover)}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>เพิ่มผู้ดูแลระบบใหม่</span>
                                    <span style={styles.actionArrow}>&rsaquo;</span>
                                </button>
                                <button
                                    type="button"
                                    id="settings-change-password"
                                    onClick={handleChangePassword}
                                    style={{ ...styles.actionBtn, ...styles.actionBtnLast }}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionBtnHover)}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>เปลี่ยนรหัสผ่าน</span>
                                    <span style={styles.actionArrow}>&rsaquo;</span>
                                </button>
                            </div>
                        </div>

                        <div style={styles.dangerPanel}>
                            <h3 style={styles.sectionTitle}>ออกจากระบบ</h3>
                            <div style={styles.list}>
                                <button
                                    type="button"
                                    id="logout-btn"
                                    onClick={handleLogout}
                                    style={{ ...styles.actionBtn, ...styles.actionBtnLast, ...styles.dangerBtn }}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionBtnHover)}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>ออกจากระบบ</span>
                                    <span style={styles.dangerArrow}>&rsaquo;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default ProfileAdmin;