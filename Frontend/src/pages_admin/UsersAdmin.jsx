import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './UsersAdmin.css';

function UsersAdmin() {
  const { t } = useLanguage();
  const { user: currentUser, fetchAdminUserList, updateUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

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
        <span className="users-role users-role-admin">
          แอดมิน
        </span>
      );
    }

    return (
      <span className="users-role users-role-patient">
        ผู้ใช้
      </span>
    );
  };

  const normalizedUsers = useMemo(
    () => users.map((u) => ({
      ...u,
      role: String(u?.role || 'patient').toLowerCase(),
      gender: String(u?.gender || '').toLowerCase(),
      age: u?.age ?? '-',
      conditions: String(u?.medical_conditions || u?.medicalConditions || '').trim(),
    })),
    [users]
  );

  const stats = useMemo(() => {
    return normalizedUsers.reduce((acc, user) => {
      acc.total += 1;
      if (user.gender === 'male' || user.gender === 'ชาย') acc.male += 1;
      if (user.gender === 'female' || user.gender === 'หญิง') acc.female += 1;
      if (user.conditions && user.conditions !== '-') acc.chronic += 1;
      return acc;
    }, { total: 0, male: 0, female: 0, chronic: 0 });
  }, [normalizedUsers]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const condition = conditionFilter.trim().toLowerCase();

    return normalizedUsers.filter((user) => {
      const searchable = [
        String(user?.name || ''),
        String(user?.email || ''),
        String(user?.idCard || user?.id_card || ''),
      ].join(' ').toLowerCase();

      const userConditions = String(user?.conditions || '').toLowerCase();
      const matchesSearch = !search || searchable.includes(search);
      const matchesCondition = !condition || userConditions.includes(condition);
      return matchesSearch && matchesCondition;
    });
  }, [normalizedUsers, searchTerm, conditionFilter]);

  const renderHealthInfo = (user) => {
    const genderValue = user?.gender === 'male' || user?.gender === 'ชาย'
      ? 'ชาย'
      : user?.gender === 'female' || user?.gender === 'หญิง'
      ? 'หญิง'
      : 'ไม่ระบุ';
    const chronic = user?.conditions || '-';

    return (
      <div className="users-health-info">
        <div>
          <span>อายุ:</span> {user?.age || '-'}
        </div>
        <div>
          <span>เพศ:</span> {genderValue}
        </div>
        <div>
          <span>โรคประจำตัว:</span> {chronic}
        </div>
      </div>
    );
  };

  return (
    <div className="users-admin-page">
      <div className="users-admin-shell">
        <section className="users-admin-header">
          <div className="users-admin-header-orb users-admin-header-orb-right" />
          <div className="users-admin-header-orb users-admin-header-orb-left" />
          <div className="users-admin-header-icon">👥</div>
          <div className="users-admin-header-content">
            <h1>จัดการข้อมูลคนไข้</h1>
            <p>ดูแลและจัดการรายชื่อผู้ใช้ทั้งหมดในระบบ</p>
          </div>
        </section>

        <section className="users-admin-stats-grid">
          <article className="users-stat-card users-stat-total">
            <strong>{stats.total}</strong>
            <span>คนไข้ทั้งหมด</span>
            <i>👥</i>
          </article>
          <article className="users-stat-card users-stat-male">
            <strong>{stats.male}</strong>
            <span>เพศชาย</span>
            <i>ⓘ</i>
          </article>
          <article className="users-stat-card users-stat-female">
            <strong>{stats.female}</strong>
            <span>เพศหญิง</span>
            <i>ⓘ</i>
          </article>
          <article className="users-stat-card users-stat-chronic">
            <strong>{stats.chronic}</strong>
            <span>มีโรคประจำตัว</span>
            <i>∿</i>
          </article>
        </section>

        <section className="users-admin-toolbar">
          <div className="users-input-wrap">
            <span className="users-input-icon">⌕</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อคนไข้, อีเมล หรือเลขบัตร..."
            />
          </div>
          <div className="users-input-wrap">
            <input
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              placeholder="กรองโรคประจำตัว เช่น เบาหวาน"
            />
          </div>
        </section>

      {error && (
        <div className="users-alert users-alert-error">
          {error}
        </div>
      )}
      {message && (
        <div className="users-alert users-alert-success">
          {message}
        </div>
      )}

      <section className="users-table-panel">
        <div className="users-table-scroll">
        <table className="users-table">
          <thead>
            <tr>
              <th>ชื่อ - นามสกุล</th>
              <th>ข้อมูลติดต่อ</th>
              <th>ข้อมูลสุขภาพ (เบื้องต้น)</th>
              <th className="text-center">บทบาท</th>
              <th className="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="users-empty-row">
                  กำลังโหลดข้อมูลผู้ใช้...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="users-empty-row">
                  ไม่พบข้อมูลผู้ใช้ตามตัวกรองที่เลือก
                </td>
              </tr>
            ) : filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser?.id;
              const currentRole = (u.role || 'patient').toLowerCase();
              const buttonLabel = currentRole === 'admin' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน';
              const disabled = busyIds[u.id] || (isCurrent && currentRole === 'admin' && false);

              return (
                <tr key={u.id}>
                  <td>
                    <div className="users-name-cell">
                      <span className="users-avatar">{String(u.name || '?').trim().charAt(0).toUpperCase() || '?'}</span>
                      <div>
                        <div className="users-name">{u.name || '-'}</div>
                        <div className="users-sub">{u.idCard || u.id_card || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="users-contact-cell">{u.email || '-'}</div>
                  </td>
                  <td>{renderHealthInfo(u)}</td>
                  <td className="text-center">{renderRoleLabel(currentRole)}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleChangeRole(u.id, currentRole)}
                      disabled={disabled}
                      className={`users-action-btn ${currentRole === 'admin' ? 'danger' : 'primary'}`}
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
      </section>
      </div>
    </div>
  );
}

export default UsersAdmin;
