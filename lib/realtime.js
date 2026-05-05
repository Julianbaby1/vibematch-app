'use client';

/**
 * Supabase Realtime helpers.
 *
 * Replaces lib/socket.js (Socket.io).
 *
 * Architecture:
 *   • DM chat:     postgres_changes on messages table, filtered by match_id
 *   • Typing:      Broadcast channel (no DB write, ephemeral)
 *   • Presence:    Presence channel (shows who is online in a match room)
 *   • Circle chat: postgres_changes on circle_messages, filtered by circle_id
 */
import { supabase } from './supabase';

// ── DM chat subscription ───────────────────────────────────────
/**
 * Subscribe to new messages in a match.
 * Returns an unsubscribe function.
 *
 * @param {string}   matchId
 * @param {Function} onMessage   callback(newMessage: object)
 * @param {Function} onTyping    callback({ userId, isTyping })
 * @param {string}   currentUserId  — used to track presence
 */
export function subscribeToChatChannel(matchId, onMessage, onTyping, currentUserId) {
  const channel = supabase
    .channel(`match:${matchId}`, {
      config: { presence: { key: currentUserId } },
    })
    // ── New messages (INSERT on messages table) ────────────────
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        onMessage(payload.new);
      }
    )
    // ── Typing indicator (Broadcast — no DB write) ─────────────
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (onTyping) onTyping(payload);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Send a typing indicator broadcast.
 * This does NOT write to the DB — it's a one-shot broadcast.
 */
export function broadcastTyping(matchId, userId, isTyping) {
  supabase.channel(`match:${matchId}`).send({
    type:    'broadcast',
    event:   'typing',
    payload: { userId, isTyping },
  });
}

// ── Circle chat subscription ───────────────────────────────────
/**
 * Subscribe to new messages in an Interest Circle.
 * Returns an unsubscribe function.
 */
export function subscribeToCircleChannel(circleId, onMessage) {
  const channel = supabase
    .channel(`circle:${circleId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'circle_messages',
        filter: `circle_id=eq.${circleId}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Presence (online / offline) ────────────────────────────────
/**
 * Track the current user's presence in a match room.
 * Returns { presenceState(), unsubscribe() }.
 *
 * Usage:
 *   const { presenceState, unsubscribe } = trackPresence(matchId, userId);
 *   // presenceState() → { [userId]: [{ online_at }] }
 */
export function trackPresence(matchId, userId) {
  const channel = supabase
    .channel(`presence:match:${matchId}`)
    .on('presence', { event: 'sync' }, () => {
      // state updated — caller can call channel.presenceState()
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId, online_at: new Date().toISOString() });
      }
    });

  return {
    presenceState: () => channel.presenceState(),
    unsubscribe:   () => supabase.removeChannel(channel),
  };
}
