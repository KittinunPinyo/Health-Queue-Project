import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
const SendIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="22" y1="2" x2="11" y2="13"></line> <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon> </svg> );
const BackIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M19 12H5"></path> <path d="M12 19l-7-7 7-7"></path> </svg> );
const UserAvatar = () => ( <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> </div> );

export default function AdminChat() {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [chatSessions, setChatSessions] = useState({});
  const messagesEndRef = useRef(null);

  // โหลดข้อมูลแชททั้งหมด
  const loadChats = () => {
    const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
    setChatSessions(allChats);
  };

  // Polling ข้อมูลทุก 1 วินาที เพื่อให้เห็นข้อความใหม่จากคนไข้ทันที
  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
    // เมื่อกดอ่าน ให้เคลียร์ Unread count ใน DB
    const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
    if (allChats[id]) {
      allChats[id].unread = 0; // เคลียร์จำนวนที่ยังไม่ได้อ่าน
      localStorage.setItem('chat_sessions', JSON.stringify(allChats));
      setChatSessions(allChats);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedPatientId) return;

    const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
    const currentSession = allChats[selectedPatientId];

    if (currentSession) {
      const newMessage = {
        id: Date.now(),
        sender: 'admin',
        text: inputValue,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      };

      currentSession.messages.push(newMessage);
      currentSession.lastUpdated = new Date().toISOString();
      
      localStorage.setItem('chat_sessions', JSON.stringify(allChats));
      setChatSessions(allChats); // อัปเดตหน้าจอ
      setInputValue('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSessions, selectedPatientId]);

  // --- Styles ---
  const containerStyle = {
    display: 'flex',
    height: 'calc(100vh - 155px)', 
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    margin: '10px'
  };

  const isDesktop = window.innerWidth > 768;
  const sidebarStyle = {
    width: isDesktop ? '350px' : (selectedPatientId ? '0' : '100%'),
    minWidth: isDesktop ? '300px' : '0',
    borderRight: '1px solid #eee',
    display: isDesktop || !selectedPatientId ? 'flex' : 'none',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    zIndex: 2
  };

  const chatWindowStyle = {
    flex: 1,
    display: isDesktop || selectedPatientId ? 'flex' : 'none',
    flexDirection: 'column',
    backgroundColor: '#fff',
    zIndex: 1
  };

  const patientList = Object.values(chatSessions).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  const currentPatient = chatSessions[selectedPatientId];

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>กล่องข้อความ</h3>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {patientList.length === 0 && <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>ไม่มีข้อความ</div>}
          {patientList.map(patient => (
            <div 
              key={patient.patientId} 
              onClick={() => handleSelectPatient(patient.patientId)}
              style={{
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: selectedPatientId === patient.patientId ? '#e7f1ff' : 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <UserAvatar />
                {patient.unread > 0 && (
                  <span style={{ 
                    position: 'absolute', top: -2, right: -2, 
                    background: '#ff4757', color: 'white', borderRadius: '50%', 
                    width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white'
                  }}>
                    {patient.unread}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>{patient.patientName}</span>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    {new Date(patient.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patient.messages[patient.messages.length - 1]?.text || '...'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div style={chatWindowStyle}>
        {currentPatient ? (
          <>
            <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff' }}>
              {!isDesktop && (
                <button onClick={() => setSelectedPatientId(null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}>
                  <BackIcon />
                </button>
              )}
              <UserAvatar />
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>{currentPatient.patientName}</h4>
              </div>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentPatient.messages.map((msg, index) => (
                <div key={index} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'admin' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    padding: '10px 14px', 
                    borderRadius: '16px', 
                    backgroundColor: msg.sender === 'admin' ? '#007bff' : '#ffffff',
                    color: msg.sender === 'admin' ? '#fff' : '#333',
                    borderBottomRightRadius: msg.sender === 'admin' ? '4px' : '16px',
                    borderTopLeftRadius: msg.sender !== 'admin' ? '4px' : '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: '#fff' }}>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับ..."
                style={{ flex: 1, padding: '10px 15px', borderRadius: '24px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#f8f9fa' }}
              />
              <button type="submit" disabled={!inputValue.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: inputValue.trim() ? '#007bff' : '#e9ecef', color: inputValue.trim() ? '#fff' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <SendIcon />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999', backgroundColor: '#f8f9fa' }}>
            <p>เลือกคนไข้จากรายการด้านซ้ายเพื่อเริ่มสนทนา</p>
          </div>
        )}
      </div>
    </div>
  );
}