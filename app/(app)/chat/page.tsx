"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChatMessage,
  fetchMessages,
  getMessageCharacterLimit,
  sendMessage,
  subscribeToMessages,
  supabaseClient,
  validateMessage,
} from "../../../lib/chat";

const CHANNELS = [
  { id: "general", label: "General Chat", description: "Hang out and say hi." },
  { id: "matchmaking", label: "Matchmaking", description: "Find your next co-op partner." },
  { id: "off-topic", label: "Off Topic", description: "Memes, music, and everything else." },
];

const emptyState: ChatMessage[] = [];

export default function ChatPage() {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [displayName, setDisplayName] = useState("Anonymous");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const storedName = window.localStorage.getItem("vibematch-display-name");
    if (storedName) {
      setDisplayName(storedName);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("vibematch-display-name", displayName);
  }, [displayName]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchMessages(activeChannel)
      .then((data) => {
        if (isMounted) {
          setMessages(data);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message);
          setMessages(emptyState);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeChannel]);

  useEffect(() => {
    if (!supabaseClient) {
      setError("Supabase client is not configured. Add env vars to enable chat.");
      return;
    }

    const unsubscribe = subscribeToMessages(activeChannel, (message) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeChannel]);

  const characterLimit = getMessageCharacterLimit();
  const validationError = useMemo(() => validateMessage(composerText), [composerText]);
  const remainingCharacters = characterLimit - composerText.length;

  const handleSendMessage = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!supabaseClient) {
      setError("Supabase client is not configured. Add env vars to enable chat.");
      return;
    }

    setError(null);
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      channel: activeChannel,
      content: composerText,
      created_at: new Date().toISOString(),
      username: displayName || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setComposerText("");

    try {
      const savedMessage = await sendMessage({
        channel: activeChannel,
        content: optimisticMessage.content,
        username: optimisticMessage.username,
      });

      setMessages((prev) =>
        prev.map((message) => (message.id === optimisticMessage.id ? savedMessage : message))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
      setError((err as Error).message);
      setComposerText(optimisticMessage.content);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: "280px",
          background: "#12121a",
          borderRight: "1px solid #232334",
          padding: "24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px" }}>Vibematch Chat</h1>
        <p style={{ color: "#b7b7c5", fontSize: "14px" }}>
          Jump into a channel and start a conversation.
        </p>
        <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
          {CHANNELS.map((channel) => {
            const isActive = channel.id === activeChannel;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRadius: "12px",
                  border: isActive ? "1px solid #7c5cff" : "1px solid #2a2a3d",
                  background: isActive ? "rgba(124, 92, 255, 0.2)" : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{channel.label}</div>
                <div style={{ fontSize: "13px", color: "#9a9ab2" }}>{channel.description}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid #232334",
            background: "#0f0f16",
          }}
        >
          <h2 style={{ margin: 0 }}>{CHANNELS.find((channel) => channel.id === activeChannel)?.label}</h2>
          <p style={{ margin: "6px 0 0", color: "#9a9ab2" }}>
            {CHANNELS.find((channel) => channel.id === activeChannel)?.description}
          </p>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "grid", gap: "16px" }}>
          {isLoading && <div>Loading messages…</div>}
          {!isLoading && messages.length === 0 && (
            <div style={{ color: "#9a9ab2" }}>
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#151522",
                border: "1px solid #222235",
              }}
            >
              <div style={{ fontSize: "13px", color: "#9a9ab2" }}>
                {message.username ?? "Anonymous"} · {new Date(message.created_at).toLocaleTimeString()}
              </div>
              <div style={{ marginTop: "6px" }}>{message.content}</div>
            </div>
          ))}
        </div>

        <footer
          style={{
            borderTop: "1px solid #232334",
            padding: "20px 32px",
            background: "#0f0f16",
            display: "grid",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ fontSize: "13px", color: "#9a9ab2" }}>Display name</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #2a2a3d",
                background: "#12121a",
                color: "inherit",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              placeholder="Write a message..."
              rows={3}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #2a2a3d",
                background: "#12121a",
                color: "inherit",
                resize: "vertical",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={Boolean(validationError) || isSending}
              style={{
                width: "140px",
                borderRadius: "12px",
                border: "none",
                background: validationError ? "#2a2a3d" : "#7c5cff",
                color: "white",
                fontWeight: 600,
                cursor: validationError ? "not-allowed" : "pointer",
              }}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9a9ab2" }}>
            <span>{validationError ?? "Keep it friendly and on-topic."}</span>
            <span>{remainingCharacters} characters left</span>
          </div>
          {error && <div style={{ color: "#ff8b8b" }}>{error}</div>}
        </footer>
      </section>
    </main>
  );
}
