import React, { useState, useEffect, useRef } from 'react';
import Icon from '../components/ui/Icon.jsx';

// Dummy data to show the layout before APIs are connected
const MOCK_CONVERSATIONS = [
  { id: '1', phone: '+234 801 234 5678', name: 'Aisha Bello', lastMessage: 'Is the loft available next Saturday?', time: '10:42 AM', unread: 2, status: 'active' },
  { id: '2', phone: '+234 902 345 6789', name: 'Chinedu Eze', lastMessage: 'Thank you! See you tomorrow.', time: 'Yesterday', unread: 0, status: 'resolved' },
  { id: '3', phone: '+234 703 456 7890', name: 'Unknown Number', lastMessage: 'How much is a day pass?', time: 'Tuesday', unread: 1, status: 'active' },
];

const MOCK_MESSAGES = [
  { id: 'm1', text: 'Hi Aora House! I was wondering if the loft is available for a private birthday dinner next Saturday?', sender: 'customer', time: '10:30 AM' },
  { id: 'm2', text: 'Hello Aisha! Thank you for reaching out. Let me quickly check the calendar for next Saturday. How many guests are you expecting?', sender: 'agent', time: '10:35 AM' },
  { id: 'm3', text: 'About 15 people.', sender: 'customer', time: '10:40 AM' },
  { id: 'm4', text: 'Perfect. Yes, the Loft is currently available for next Saturday evening. Would you like me to send over the booking link and catering menu?', sender: 'agent', time: '10:42 AM' },
];

export default function WhatsAppInbox() {
  const [activeChat, setActiveChat] = useState(MOCK_CONVERSATIONS[0].id);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'agent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const currentChatDetails = MOCK_CONVERSATIONS.find(c => c.id === activeChat);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* ── LEFT PANE: CONVERSATION LIST ── */}
      <div style={{ width: '320px', borderRight: '1px solid rgba(227, 211, 184, 0.5)', background: '#FFFDF9', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header & Search */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '22px', color: 'var(--cocoa-deep)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B3318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Live Inbox
          </h1>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button style={{ flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 600, background: 'var(--cocoa-deep)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Active</button>
            <button style={{ flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 600, background: 'transparent', color: 'var(--taupe)', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '4px', cursor: 'pointer' }}>Resolved</button>
          </div>
          <input 
            type="text" 
            placeholder="Search conversations..." 
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.6)', fontSize: '13px', background: '#FAF6EF' }}
          />
        </div>

        {/* Chat List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {MOCK_CONVERSATIONS.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(227, 211, 184, 0.3)',
                background: activeChat === chat.id ? 'rgba(227, 211, 184, 0.15)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderLeft: activeChat === chat.id ? '3px solid #8B3318' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--cocoa-deep)', fontSize: '14px' }}>{chat.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--taupe)' }}>{chat.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--taupe)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                  {chat.lastMessage}
                </span>
                {chat.unread > 0 && (
                  <span style={{ background: '#8B3318', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANE: CHAT WINDOW ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF6EF' }}>
        
        {/* Chat Header */}
        <div style={{ padding: '20px 32px', background: '#FFFDF9', borderBottom: '1px solid rgba(227, 211, 184, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600 }}>
              {currentChatDetails?.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)', fontSize: '16px' }}>{currentChatDetails?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>{currentChatDetails?.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              View Profile
            </button>
            <button style={{ padding: '8px 16px', background: 'var(--rust)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Mark Resolved
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{ 
          flex: 1, 
          padding: '32px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          backgroundColor: '#FAF6EF',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e3d3b8' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M15 20c-1.5 0-2.5 1-2.5 2.5S13.5 25 15 25s2.5-1 2.5-2.5S16.5 20 15 20zm0 1c.83 0 1.5.67 1.5 1.5S15.83 24 15 24s-1.5-.67-1.5-1.5S14.17 21 15 21z'/%3E%3Cpath d='M40 80c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z'/%3E%3Cpath d='M100 30l-3 3-1-1-1 1 3 3 5-5z'/%3E%3Cpath d='M80 90a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-8a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'/%3E%3Cpath d='M10 100c-2 0-4 1-4 3 0 3 4 5 4 5s4-2 4-5c0-2-2-3-4-3zm0 2c1 0 2 1 2 2 0 1-1.5 2.5-2 3-.5-.5-2-2-2-3 0-1 1-2 2-2z'/%3E%3Cpath d='M50 15l2-2 4 4-2 2z'/%3E%3Cpath d='M105 70l2-2 4 4-2 2z'/%3E%3Cpath d='M30 40a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-14a6 6 0 1 1 0 12 6 6 0 0 1 0-12z'/%3E%3Cpath d='M90 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'/%3E%3Cpath d='M60 55l-2-2h-3v-3l-2-2 2-2v-3h3l2-2 2 2h3v3l2 2-2 2v3h-3z'/%3E%3Cpath d='M15 65l-2-2v-2l-2-2 2-2v-2l2-2 2 2v2l2 2-2 2v2z'/%3E%3Cpath d='M75 35l-1-1v-2l-1-1 1-1v-2l1-1 1 1v2l1 1-1 1v2z'/%3E%3Cpath d='M40 105l-1-1h-2l-1-1 1-1h2l1-1 1 1h2l1 1-1 1h-2z'/%3E%3C/g%3E%3C/svg%3E")`
        }}>
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <span style={{ background: 'rgba(227, 211, 184, 0.4)', color: 'var(--cocoa-deep)', fontSize: '11px', padding: '4px 12px', borderRadius: '12px', fontWeight: 500 }}>
              Today
            </span>
          </div>

          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '65%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  borderTopLeftRadius: !isAgent ? '2px' : '12px',
                  borderTopRightRadius: isAgent ? '2px' : '12px',
                  background: isAgent ? '#8B3318' : '#FFFFFF',
                  color: isAgent ? '#FFFFFF' : 'var(--cocoa-deep)',
                  border: isAgent ? 'none' : '1px solid rgba(227, 211, 184, 0.6)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {msg.time} {isAgent && <Icon name="check" size={12} color="#8B3318" />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px 32px', background: '#FFFDF9', borderTop: '1px solid rgba(227, 211, 184, 0.4)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message to reply on WhatsApp..."
                style={{ 
                  display: 'block',
                  boxSizing: 'border-box',
                  width: '100%', 
                  padding: '16px', 
                  paddingRight: '48px',
                  borderRadius: '8px', 
                  border: '1px solid rgba(227, 211, 184, 0.6)', 
                  fontSize: '14px', 
                  fontFamily: 'inherit',
                  background: '#FAF6EF',
                  resize: 'none',
                  minHeight: '56px',
                  height: '56px',
                  maxHeight: '150px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button 
                type="button"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--taupe)' }}
              >
                {/* Paperclip icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
            </div>
            <button 
              type="submit"
              disabled={!inputText.trim()}
              style={{ 
                background: inputText.trim() ? '#8B3318' : 'rgba(139, 51, 24, 0.5)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                width: '56px',
                height: '56px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: inputText.trim() ? 'pointer' : 'default',
                transition: 'background 0.2s',
                flexShrink: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <div style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '8px', textAlign: 'center' }}>
            Replies will be sent directly to the customer's WhatsApp app via Aora House Official. Press Enter to send.
          </div>
        </div>

      </div>
    </div>
  );
}
