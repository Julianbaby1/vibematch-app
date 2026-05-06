'use client';

/**
 * Chat page — real-time messaging via Supabase Realtime.
 *
 * Replaces Socket.io with:
 *   • postgres_changes  → new messages (INSERT on messages table)
 *   • Broadcast channel → ephemeral typing indicator
 *   • Presence channel  → online / offline status
 *
 * Message send still goes through Express (POST /api/chat/:matchId)
 * which inserts into Supabase → Realtime fires automatically.
 */
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { subscribeToChatChannel, broadcastTyping } from '../../lib/realtime';
import Navbar from '../../components/Navbar';

function ChatContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const matchId = params.get('id');

  const [user, setUser]           = useState(null);
  const [matches, setMatches]     = useState([]);
  const [messages, setMessages]   = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);  // Realtime channel cleanup
  const typingTimer    = useRef(null);

  // ── Bootstrap ───────────────────────────────────────────────
  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);
    api.get('/api/matches').then(setMatches).catch(() => {});

    // Listen for auth session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Open conversation when matchId changes ───────────────────
  useEffect(() => {
    if (matchId && matches.length > 0) {
      const m = matches.find((x) => x.match_id === matchId);
      if (m) loadConversation(m);
    }
  }, [matchId, matches]);

  // ── Scroll to bottom on new messages ────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversation(m) {
    setActiveMatch(m);
    setLoadingMsgs(true);

    // Tear down previous channel subscription
    if (unsubscribeRef.current) unsubscribeRef.current();

    try {
      const history = await api.get(`/api/chat/${m.match_id}`);
      setMessages(history);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }

    const cachedUser = getUser();

    // ── Subscribe to Supabase Realtime ─────────────────────────
    unsubscribeRef.current = subscribeToChatChannel(
      m.match_id,

      // onMessage: new message inserted → append to state
      (newMsg) => {
        setMessages((prev) => {
          // Deduplicate in case the sender receives their own echo
          if (prev.some((x) => x.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      },

      // onTyping: ephemeral broadcast from the other participant
      ({ userId, isTyping }) => {
        if (userId !== cachedUser?.id) setTyping(isTyping);
      },

      cachedUser?.id
    );
  }

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  // ── Send message ─────────────────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeMatch) return;

    const content = input.trim();
    setInput('');

    // Optimistic update — add to state immediately for snappy UX
    const tempId = `temp-${Date.now()}`;
    const cachedUser = getUser();
    setMessages((prev) => [
      ...prev,
      {
        id:           tempId,
        sender_id:    cachedUser?.id,
        content,
        message_type: 'text',
        created_at:   new Date().toISOString(),
        first_name:   cachedUser?.first_name,
      },
    ]);

    try {
      // POST to Express → inserts to Supabase → Realtime fires the real row
      await api.post(`/api/chat/${activeMatch.match_id}`, { content });
    } catch {
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  // ── Typing indicator ─────────────────────────────────────────
  function handleTyping(e) {
    setInput(e.target.value);
    if (!activeMatch || !user) return;

    broadcastTyping(activeMatch.match_id, user.id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      broadcastTyping(activeMatch.match_id, user.id, false);
    }, 1500);
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <>
      <Navbar user={user} />
      <div className="chat-layout">

        {/* ── Sidebar ── */}
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
            <button
              key={m.match_id}
              onClick={() => { router.push(`/chat?id=${m.match_id}`); loadConversation(m); }}
              className={`chat-match-item ${activeMatch?.match_id === m.match_id ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--surface-2)', width: 36, height: 36, fontSize: '.9rem', position: 'relative' }}>
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

        {/* ── Main chat ── */}
        <div className="chat-main">
          {!activeMatch ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💬</p>
              <p>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="avatar avatar-sm" style={{ width: 38, height: 38, fontSize: '.95rem', background: 'var(--surface-2)' }}>
                  {activeMatch.profile_photo_url
                    ? <img src={activeMatch.profile_photo_url} alt={activeMatch.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : activeMatch.first_name?.[0]}
                </div>
                <div>
                  <div className="chat-header-name">{activeMatch.first_name}</div>
                  <div className="chat-header-meta">
                    {[
                      activeMatch.city,
                      activeMatch.compatibility_score != null && `${activeMatch.compatibility_score}% match`,
                    ].filter(Boolean).join(' · ')}
                    {onlineUsers.has(activeMatch.id) && (
                      <span style={{ color: 'var(--success)', marginLeft: '.5rem', fontSize: '.8rem' }}>● online</span>
                    )}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Link href={`/profile/${activeMatch.id}`} className="btn btn-ghost btn-sm">View profile</Link>
                </div>
              </div>

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
                        <div className="message-time" style={{ textAlign: isSent ? 'right' : 'left' }}>
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
