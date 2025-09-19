"use client";
import React, { useState } from 'react';

export default function ForumGeneralClient() {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState('');

  const send = () => {
    const t = (text || '').trim();
    if (!t) return;
    setMessages(prev => [...prev, t.slice(0, 300)]);
    setText('');
  };

  return (
    <main>
      <div className="nx-chat">
        <div className="nx-chat-window" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className="nx-chat-msg"><div className="nx-chat-text">{m}</div></div>
          ))}
        </div>

        <div className="nx-chat-input">
          <input value={text} onChange={e => setText(e.target.value)} maxLength={300} placeholder="Type a message" />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </main>
  );
}