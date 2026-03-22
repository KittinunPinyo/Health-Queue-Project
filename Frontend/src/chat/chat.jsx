import React, { useState, useEffect, useRef } from 'react';

// --- SVG Icons ---
const SendIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="22" y1="2" x2="11" y2="13"></line> <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon> </svg> );

const generateId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function Chat() {
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ดึงข้อมูล User ปัจจุบัน
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) setCurrentUser(user);
  }, []);

  // โหลดข้อความเก่า และคอยเช็คข้อความใหม่ (Polling)
  useEffect(() => {
    if (!currentUser) return;

    const loadMessages = () => {
      const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
      const myChat = allChats[currentUser.id] || { messages: [] };
      
      // ถ้าไม่มีประวัติเลย ให้ใส่ข้อความต้อนรับ
      if (myChat.messages.length === 0) {
        const welcomeMsg = { 
          id: generateId(), 
          text: 'สวัสดีค่ะ! ยินดีให้บริการ มีอะไรให้ช่วยเหลือไหมคะ?', 
          sender: 'admin', 
          timestamp: new Date().toISOString() 
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(myChat.messages);
      }
    };

    loadMessages(); // โหลดครั้งแรก
    const interval = setInterval(loadMessages, 1000); // เช็คข้อความใหม่ทุก 1 วินาที

    return () => clearInterval(interval);
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text) => {
    if (!text.trim() || !currentUser) return;

    const newMessage = {
      id: generateId(),
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // อัปเดต State ทันที
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputValue('');

    // บันทึกลง LocalStorage (ส่งไปหาแอดมิน)
    const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
    allChats[currentUser.id] = {
      patientId: currentUser.id,
      patientName: currentUser.name || 'Guest User',
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
      unread: (allChats[currentUser.id]?.unread || 0) + 1
    };
    localStorage.setItem('chat_sessions', JSON.stringify(allChats));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage(inputValue);
  };

  // --- Styles ---
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 180px)', 
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    margin: '10px 20px',
    border: '1px solid #e2e8f0'
  };

  const bubbleStyle = (sender) => ({
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '18px',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
    background: sender === 'user' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#ffffff',
    color: sender === 'user' ? '#ffffff' : '#1e293b',
    borderBottomRightRadius: sender === 'user' ? '4px' : '18px',
    borderTopLeftRadius: sender !== 'user' ? '4px' : '18px',
    boxShadow: sender === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    whiteSpace: 'pre-line'
  });

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '16px 20px', 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
        gap: '12px' 
      }}>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>แชทกับเจ้าหน้าที่</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#4ade80', 
              borderRadius: '50%',
              boxShadow: '0 0 8px #4ade80'
            }}></span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>ออนไลน์</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
              maxWidth: '100%' 
            }}
          >
            {msg.sender !== 'user' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '6px' 
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>แชทกับเจ้าหน้าที่</span>
              </div>
            )}
            <div style={bubbleStyle(msg.sender)}>{msg.text}</div>
            <span style={{ 
              fontSize: '0.7rem', 
              color: '#94a3b8', 
              marginTop: '4px', 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
            }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        padding: '16px 20px', 
        backgroundColor: '#ffffff', 
        borderTop: '1px solid #e2e8f0', 
        display: 'flex', 
        gap: '12px' 
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ตั้งคำถาม..."
          style={{ 
            flex: 1, 
            padding: '12px 18px', 
            borderRadius: '24px', 
            border: '2px solid #e2e8f0', 
            outline: 'none', 
            fontSize: '0.95rem',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
        <button 
          onClick={() => handleSendMessage(inputValue)} 
          disabled={!inputValue.trim()} 
          style={{ 
            background: inputValue.trim() ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e2e8f0', 
            color: 'white', 
            border: 'none', 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            boxShadow: inputValue.trim() ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}