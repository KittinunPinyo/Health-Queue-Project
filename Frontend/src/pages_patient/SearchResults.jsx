import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext.jsx';

function SearchResults() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search).get('q')?.trim() || '';
  const [searchTerm, setSearchTerm] = useState(query);

  const [clinicsData, setClinicsData] = useState([]);
  const [doctorResults, setDoctorResults] = useState([]);
  const [clinicResults, setClinicResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const runSearch = async () => {
      let clinics = [];
      try {
        const [hospitalsRes, doctorsRes] = await Promise.all([
          axios.get('/api/hospitals'),
          axios.get('/api/doctors'),
        ]);
        const hospitals = hospitalsRes.data.hospitals || [];
        const doctors = doctorsRes.data.doctors || [];

        const doctorsByHospital = doctors.reduce((acc, doctor) => {
          const key = String(doctor.hospitalId || '');
          if (!key) return acc;
          if (!acc[key]) acc[key] = [];
          acc[key].push({
            id: doctor.id,
            name: doctor.name || '',
            specialty: doctor.specialty || '',
            email: doctor.email || '',
            image: doctor.image || '',
          });
          return acc;
        }, {});

        clinics = hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          image: h.image || h.logo || 'https://placehold.co/600x400/eeeeee/888888?text=No+Image',
          doctors: doctorsByHospital[String(h.id)] || [],
          ...h,
        }));
      } catch (error) {
        console.error('Search load hospitals/doctors error:', error);
        clinics = [];
      }

      setClinicsData(clinics);

      if (!query) {
        setClinicResults([]);
        setDoctorResults([]);
        return;
      }

      const lowerQuery = query.toLowerCase();

      const matchedClinics = clinics.filter((clinic) => {
        if (clinic.name?.toLowerCase().includes(lowerQuery)) return true;
        if (clinic.doctors?.some((doc) =>
          doc.name?.toLowerCase().includes(lowerQuery) ||
          doc.specialty?.toLowerCase().includes(lowerQuery)
        )) return true;
        return false;
      });

      const matchedDoctors = [];
      clinics.forEach((clinic) => {
        (clinic.doctors || []).forEach((doc) => {
          if (
            doc.name?.toLowerCase().includes(lowerQuery) ||
            doc.specialty?.toLowerCase().includes(lowerQuery)
          ) {
            matchedDoctors.push({ ...doc, clinicId: clinic.id, clinicName: clinic.name, clinicImage: clinic.image });
          }
        });
      });

      setClinicResults(matchedClinics);
      setDoctorResults(matchedDoctors);
    };

    runSearch();
  }, [query]);

  const handleSearch = () => {
    const trimmed = searchTerm.trim();
    navigate(`/patient/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectClinic = (id) => {
    localStorage.setItem('selectedClinicId', id);
    navigate('/patient/clinic-detail');
  };

  const handleBookDoctor = (doctor) => {
    localStorage.setItem('selectedClinicId', doctor.clinicId);
    localStorage.setItem('selectedDoctorId', doctor.id);
    localStorage.setItem('selectedDoctorData', JSON.stringify(doctor));
    navigate('/patient/clinic-detail');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f9fc' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '30px 20px 60px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '10px 14px', border: '1px solid #d2d6dc', borderRadius: '10px', backgroundColor: '#fff', color: '#1f2937', cursor: 'pointer', fontWeight: '600', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.08)' }}>{t('back')}</button>

        <div style={{ marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            placeholder={t('searchPlaceholder') || 'พิมพ์คำค้นหา...'}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #d2d6dc',
              padding: '0 14px',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#1e40af',
              color: '#fff',
              padding: '0 18px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {t('search')}
          </button>
        </div>

        <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
          <h1 style={{ margin: 0, fontSize: '32px', lineHeight: '1.2', color: '#0f172a' }}>{t('searchResultsFor')} "{query}"</h1>
          <p style={{ margin: '10px 0 0', color: '#475569', fontSize: '16px' }}>{t('totalFound')}: <strong>{clinicResults.length}</strong> {t('hospitals')} + <strong>{doctorResults.length}</strong> {t('doctors')}</p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
            {['all', 'hospitals', 'doctors'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: activeTab === type ? '1px solid #1e40af' : '1px solid #d2d6dc',
                  background: activeTab === type ? '#e0e7ff' : '#ffffff',
                  color: activeTab === type ? '#1e40af' : '#475569',
                  cursor: 'pointer',
                  fontWeight: activeTab === type ? '700' : '600',
                  transition: 'all 0.2s',
                }}
              >
                {type === 'all' && t('all')}
                {type === 'hospitals' && t('hospitals')}
                {type === 'doctors' && t('doctors')}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'all' || activeTab === 'hospitals') && clinicResults.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '22px', color: '#1e40af', marginBottom: '14px', fontWeight: '700' }}>{t('matchingHospitals')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {clinicResults.map((clinic) => (
                <div key={clinic.id} style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => handleSelectClinic(clinic.id)}>
                  <div style={{ height: '170px', overflow: 'hidden' }}>
                    <img src={clinic.image} alt={clinic.name} style={{ width: '100%', height: '170px', objectFit: 'cover' }} onError={(e) => e.target.src='https://placehold.co/600x400/eeeeee/cccccc?text=No+Image'} />
                  </div>
                  <div style={{ padding: '16px 14px 18px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>{clinic.name}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#475569' }}>{clinic.doctors?.length || 0} {t('allDoctors')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'doctors') && doctorResults.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{t('matchingDoctors')}</h2>
              <span style={{ color: '#475569', fontSize: '14px' }}>{doctorResults.length} {t('resultFound')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
              {doctorResults.map((doctor) => (
                <div key={`${doctor.clinicId}-${doctor.id}`} style={{ borderRadius: '14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '700' }}>{doctor.name}</h3>
                    <p style={{ margin: '8px 0 4px', color: '#64748b', fontSize: '14px' }}>{doctor.specialty}</p>
                    <span style={{ fontSize: '13px', color: '#1e293b', background: '#eff6ff', borderRadius: '999px', padding: '4px 10px' }}>{doctor.clinicName}</span>
                  </div>
                  <button onClick={() => handleBookDoctor(doctor)} style={{ height: '38px', borderRadius: '10px', border: 'none', backgroundColor: '#1e40af', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>{t('bookNow')}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {clinicResults.length === 0 && doctorResults.length === 0 && (
          <div style={{ marginTop: '10px', padding: '26px', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)' }}>
            <p style={{ margin: 0, color: '#475569', fontSize: '16px' }}>{t('noResultsFor')} "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
