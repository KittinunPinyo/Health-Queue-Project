import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function UsersAdmin() {
  const { user: currentUser, fetchAdminUserList, updateUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetchAdminUserList();
      if (response.success) {
        setUsers(response.users);
      } else {
        setError(response.error || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้ในขณะนี้');
      }

      setLoading(false);
    };

    loadUsers();
  }, [fetchAdminUserList]);

  const handleChangeRole = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'patient' : 'admin';

    if (userId === currentUser?.id && targetRole !== 'admin') {
      const confirmed = window.confirm(`คุณกำลังลดสิทธิ์ผู้ดูแลระบบของตัวเองเป็นผู้ใช้ปกติ หากดำเนินการนี้คุณจะไม่สามารถเข้าถึงหน้าแอดมินได้อีกต่อไป\n\nต้องการดำเนินการต่อหรือไม่?`);
      if (!confirmed) return;
    }

    setBusyIds((prev) => ({ ...prev, [userId]: true }));
    setError('');
    setMessage('');

    const result = await updateUserRole(userId, targetRole);
    setBusyIds((prev) => ({ ...prev, [userId]: false }));

    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)));
      setMessage(`ปรับบทบาทของผู้ใช้เรียบร้อยแล้ว: ${targetRole === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}`);
    } else {
      setError(result.error || 'ไม่สามารถเปลี่ยนบทบาทได้ตอนนี้');
    }
  };

  const renderRoleLabel = (role) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 12px',
          borderRadius: '999px',
          background: 'rgba(79, 70, 229, 0.15)',
          color: '#4338ca',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          แอดมิน
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#047857',
        fontWeight: 600,
        fontSize: '0.9rem',
      }}>
        ผู้ใช้
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f8fafc' }}>
      <div style={{
        marginBottom: '24px',
        padding: '26px 28px',
        borderRadius: '22px',
        background: 'linear-gradient(135deg, #4338ca, #6366f1)',
        color: 'white',
        boxShadow: '0 18px 40px rgba(67, 56, 202, 0.18)'
      }}>
        <p style={{ margin: 0, opacity: 0.85, letterSpacing: '0.04em' }}>แดชบอร์ดผู้ดูแลระบบ</p>
        <h1 style={{ margin: '12px 0 8px', fontSize: '2rem' }}>จัดการบัญชีผู้ใช้</h1>
        <p style={{ margin: 0, maxWidth: '740px', color: 'rgba(255,255,255,0.9)' }}>
          ดูรายชื่อผู้ใช้ทั้งหมดในระบบและเปลี่ยนบทบาทผู้ใช้งานเป็นผู้ดูแลระบบหรือผู้ใช้ทั่วไปได้ทันที
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '18px', background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '18px', background: '#d1fae5', color: '#065f46' }}>
          {message}
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: '24px', background: 'white', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '20px 18px', color: '#475569', fontSize: '0.95rem', fontWeight: 700 }}>ชื่อ-นามสกุล</th>
              <th style={{ textAlign: 'left', padding: '20px 18px', color: '#475569', fontSize: '0.95rem', fontWeight: 700 }}>อีเมล</th>
              <th style={{ textAlign: 'left', padding: '20px 18px', color: '#475569', fontSize: '0.95rem', fontWeight: 700 }}>หมายเลขประจำตัว</th>
              <th style={{ textAlign: 'center', padding: '20px 18px', color: '#475569', fontSize: '0.95rem', fontWeight: 700 }}>บทบาท</th>
              <th style={{ textAlign: 'center', padding: '20px 18px', color: '#475569', fontSize: '0.95rem', fontWeight: 700 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px 18px', textAlign: 'center', color: '#64748b' }}>
                  กำลังโหลดข้อมูลผู้ใช้...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px 18px', textAlign: 'center', color: '#64748b' }}>
                  ไม่พบข้อมูลผู้ใช้ในระบบ
                </td>
              </tr>
            ) : users.map((u) => {
              const isCurrent = u.id === currentUser?.id;
              const currentRole = (u.role || 'patient').toLowerCase();
              const buttonLabel = currentRole === 'admin' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน';
              const disabled = busyIds[u.id] || (isCurrent && currentRole === 'admin' && false);

              return (
                <tr key={u.id} style={{ borderTop: '1px solid #eff2f7' }}>
                  <td style={{ padding: '18px', verticalAlign: 'middle', color: '#0f172a' }}>
                    <div style={{ fontWeight: 600 }}>{u.name || '-'}</div>
                    <div style={{ marginTop: '4px', color: '#64748b', fontSize: '0.9rem' }}>{u.username || ''}</div>
                  </td>
                  <td style={{ padding: '18px', verticalAlign: 'middle', color: '#0f172a' }}>{u.email || '-'}</td>
                  <td style={{ padding: '18px', verticalAlign: 'middle', color: '#0f172a' }}>{u.idCard || u.id_card || '-'}</td>
                  <td style={{ padding: '18px', verticalAlign: 'middle', textAlign: 'center' }}>{renderRoleLabel(currentRole)}</td>
                  <td style={{ padding: '18px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <button
                      onClick={() => handleChangeRole(u.id, currentRole)}
                      disabled={disabled}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: '#ffffff',
                        background: currentRole === 'admin' ? '#ef4444' : '#2563eb',
                        opacity: disabled ? 0.6 : 1,
                      }}
                    >
                      {busyIds[u.id] ? 'กำลังอัปเดต...' : buttonLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersAdmin;
