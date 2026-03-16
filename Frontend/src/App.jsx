import React, { useEffect, useState } from 'react';
import AppRoutes from './AppRoutes';
import { useLanguage } from './contexts/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [backendHealthy, setBackendHealthy] = useState(null);

  useEffect(() => {
    // ตรวจสอบว่า backend เปิดอยู่หรือไม่
    fetch('/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));
  }, []);

  if (backendHealthy === null) {
    return (
      <div className="app-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (backendHealthy === false) {
    return (
      <div className="app-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('backendRequiredTitle') || 'Backend required'}</h2>
        <p>{t('backendRequiredMessage') || 'Please start the backend server before running the frontend.'}</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* AppRoutes จะเป็นตัวตัดสินใจว่า 
        URL นี้ควรจะแสดงหน้า Login, หน้า Home, หรือหน้า Admin 
      */}
      <AppRoutes />
    </div>
  );
}

export default App;