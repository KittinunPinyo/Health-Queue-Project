import React, { useState, useEffect, useRef } from 'react';

// --- SVG Icons ---
const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const ChatBubbleIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const StaffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const generateId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    // ดึงข้อมูล User ปัจจุบัน
    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user) setCurrentUser(user);
    }, []);

    // โหลดข้อความเก่า และคอยเช็คข้อความใหม่
    useEffect(() => {
        if (!currentUser) return;

        const loadMessages = () => {
            const allChats = JSON.parse(localStorage.getItem('chat_sessions')) || {};
            const myChat = allChats[currentUser.id] || { messages: [] };
            
            if (myChat.messages.length === 0) {
                const welcomeMsg = { 
                    id: generateId(), 
                    text: 'สวัสดีครับ ยินดีให้บริการ มีอะไรให้ช่วยเหลือไหมครับ?', 
                    sender: 'admin', 
                    timestamp: new Date().toISOString() 
                };
                setMessages([welcomeMsg]);
            } else {
                setMessages(myChat.messages);
            }
        };

        loadMessages();
        const interval = setInterval(loadMessages, 1000);
        return () => clearInterval(interval);
    }, [currentUser, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !currentUser) return;

        const newMessage = {
            id: generateId(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

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
        if (e.key === 'Enter') handleSendMessage();
    };

    // Don't show if not logged in or is admin
    if (!currentUser || currentUser.role === 'admin') return null;

    return (
        <>
            <style>{`
                .chat-widget-container {
                    position: fixed;
                    bottom: 30px;
                    right: 20px;
                    z-index: 9999;
                    font-family: 'Noto Sans Thai', sans-serif;
                }

                .chat-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                }

                .chat-toggle-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5);
                }

                .chat-window {
                    position: absolute;
                    bottom: 75px;
                    right: 0;
                    width: 380px;
                    height: 500px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-header {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    color: white;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .chat-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chat-avatar {
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chat-close-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .chat-close-btn:hover {
                    background: rgba(255,255,255,0.3);
                }

                .chat-messages {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #f8fafc;
                }

                .message-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                }

                .message-user {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message-admin {
                    align-self: flex-start;
                    background: white;
                    color: #1e293b;
                    border: 1px solid #e2e8f0;
                    border-bottom-left-radius: 4px;
                }

                .message-time {
                    font-size: 11px;
                    color: #94a3b8;
                    margin-top: 4px;
                }

                .chat-input-area {
                    padding: 12px 16px;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .chat-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    outline: none;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .chat-input:focus {
                    border-color: #3b82f6;
                }

                .chat-send-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: none;
                    background: #3b82f6;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .chat-send-btn:hover {
                    background: #2563eb;
                    transform: scale(1.05);
                }

                .chat-send-btn:disabled {
                    background: #e2e8f0;
                    cursor: not-allowed;
                }

                @media (max-width: 480px) {
                    .chat-window {
                        width: calc(100vw - 40px);
                        height: 400px;
                    }
                }
            `}</style>

            <div className="chat-widget-container">
                {/* Chat Window */}
                {isOpen && (
                    <div className="chat-window">
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    <StaffIcon />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>แชทกับเจ้าหน้าที่</div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>● ออนไลน์</div>
                                </div>
                            </div>
                            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div className={`message-bubble ${msg.sender === 'user' ? 'message-user' : 'message-admin'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="message-time" style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="ตั้งคำถาม..."
                            />
                            <button 
                                className="chat-send-btn" 
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                )}

                {/* Toggle Button */}
                <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <CloseIcon /> : <ChatBubbleIcon />}
                </button>
            </div>
        </>
    );
}

export default ChatWidget;
