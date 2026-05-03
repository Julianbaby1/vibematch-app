'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Navbar from '../../components/Navbar';

function ChatContent() {
  const router = useRouter();
  const params = useSearchParams();
  const matchId = params.get('id');

  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);

    const token = localStorage.getItem('sw_token');
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', ({ isTyping }) => {
      setTyping(isTyping);
    });

    api.get('/api/matches').then(setMatches).catch(() => {});

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const m = matches.find((x) => x.match_id === matchId);
      if (m) loadConversation(m);
    }
  }, [matchId, matches]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversation(m) {
    setActiveMatch(m);
    setLoadingMsgs(true);
    try {
      const data = await api.get(`/api/chat/${m.match_id}`);
      setMessages(data);
      socketRef.current?.emit('join_match', { matchId: m.match_id });
    } catch {}
    setLoadingMsgs(false);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeMatch) return;
    const content = input.trim();
    setInput('');

    socketRef.current?.emit('send_message', {
      matchId: activeMatch.match_id,
      content,
      messageType: 'text',
    });
  }

  function handleTyping(e) {
    setInput(e.target.value);
    if (!activeMatch) return;
    socketRef.current?.emit('typing', { matchId: activeMatch.match_id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { matchId: activeMatch.match_id, isTyping: false });
    }, 1500);
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <>
      <Navbar user={user} />
      <div className="chat-layout">
        {/* ── Sidebar: match list ── */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">Messages</div>
          {matches.length === 0 && (
            <div style={{ padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '.9rem' }}>
              No connections yet.<br />
              <Link href="/dashboard" style={{ marginTop: '.5rem', display: 'inline-block' }}>
                View daily profiles →
              </Link>
            </div>
          )}
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => { router.push(`/chat?id=${m.match_id}`); loadConversation(m); }}
              className={`chat-match-item ${activeMatch?.match_id === m.match_id ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--surface-2)', width: 36, height: 36, fontSize: '.9rem' }}>
                {m.profile_photo_url
                  ? <img src={m.profile_photo_url} alt={m.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : m.first_name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chat-match-name">{m.first_name}</div>
                <div className="chat-match-preview">{m.last_message || 'No messages yet'}</div>
              </div>
              {m.unread_count > 0 && <span className="unread-dot" />}
            </button>
          ))}
        </aside>

        {/* ── Main chat area ── */}
        <div className="chat-main">
          {!activeMatch ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💬</p>
              <p>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="avatar avatar-sm" style={{ width: 38, height: 38, fontSize: '.95rem', background: 'var(--surface-2)' }}>
                  {activeMatch.profile_photo_url
                    ? <img src={activeMatch.profile_photo_url} alt={activeMatch.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : activeMatch.first_name?.[0]}
                </div>
                <div>
                  <div className="chat-header-name">{activeMatch.first_name}</div>
                  <div className="chat-header-meta">{activeMatch.city} · {activeMatch.compatibility_score}% match</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Link href={`/profile/${activeMatch.id}`} className="btn btn-ghost btn-sm">View profile</Link>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {loadingMsgs && <div className="loading-center" style={{ padding: '2rem' }}><div className="spinner" /></div>}
                {messages.map((msg) => {
                  const isSent = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`message-row ${isSent ? 'sent' : ''}`}>
                      {!isSent && (
                        <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: '.75rem', background: 'var(--surface-2)', flexShrink: 0 }}>
                          {msg.first_name?.[0]}
                        </div>
                      )}
                      <div>
                        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                          {msg.content}
                        </div>
                        <div className={`message-time`} style={{ textAlign: isSent ? 'right' : 'left' }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="message-row">
                    <div className="message-bubble received" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '.85rem' }}>
                      typing…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-bar" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Write a message…"
                  value={input}
                  onChange={handleTyping}
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!input.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
