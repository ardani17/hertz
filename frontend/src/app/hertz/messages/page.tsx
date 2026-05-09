'use client';

import { useEffect, useState } from 'react';
import { SignalLeftRail } from '@/components/feed/SignalLeftRail';
import styles from './page.module.css';

export default function HertzMessagesPage() {
  const [conversations, setConversations] = useState<Array<{ id: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; body: string | null; sender_id: string }>>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function loadInbox() {
    const response = await fetch('/api/hertz/messages/inbox', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setConversations(payload.data.conversations);
    else setStatus(payload?.error?.message ?? 'Login member diperlukan.');
  }

  async function loadThread(id: string) {
    const response = await fetch(`/api/hertz/messages/conversations/${id}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setMessages(payload.data.messages);
  }

  async function send() {
    if (!activeId || !body.trim()) return;
    await fetch(`/api/hertz/messages/conversations/${activeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBody('');
    await loadThread(activeId);
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    void loadThread(activeId);
    const timer = window.setInterval(() => void loadThread(activeId), 7000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  return (
    <main className={styles.main}>
      <SignalLeftRail currentUser={null} active="messages" />
      <aside className={styles.sidebar}>
        <h1>Direct Message</h1>
        {status ? <p>{status}</p> : null}
        <div className={styles.list}>
          {conversations.map((item) => (
            <button className={styles.item} type="button" key={item.id} onClick={() => setActiveId(item.id)}>
              Conversation {item.id.slice(0, 8)}
            </button>
          ))}
        </div>
      </aside>
      <section className={styles.thread}>
        <div className={styles.messages}>
          {messages.map((item) => <div className={styles.bubble} key={item.id}>{item.body}</div>)}
        </div>
        <div className={styles.composer}>
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pesan..." />
          <button type="button" onClick={send}>Send</button>
        </div>
      </section>
    </main>
  );
}
