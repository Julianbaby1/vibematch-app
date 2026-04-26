"use client";

import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text) return;
    setMessages([...messages, text]);
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Chat</h1>
      <div style={{ minHeight: 200, border: "1px solid #ccc", marginBottom: 10 }}>
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}
