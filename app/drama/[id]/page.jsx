'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { getDB } from '../../../lib/firebase';

export default function DramaDetailPage() {
  const params = useParams();
  const id = params.id;
  const [drama, setDrama] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const orderIdRef = useRef(null);

  const loadDrama = useCallback(async () => {
    const db = getDB();
    if (!db) { setLoading(false); return; }
    try {
      const d = await getDoc(doc(db, 'reelverse_dramas', id));
      if (d.exists()) setDrama({ id: d.id, ...d.data() });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setUnlocked(localStorage.getItem(`rv_unlocked_${id}`) === 'true');
      } catch (e) {}
    }
    loadDrama();
  }, [id, loadDrama]);

  async function handleUnlock() {
    if (!drama) return;
    setPaying(true); setMsg('');
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: String(drama.price || 9.99),
          description: `ReelVerse - ${drama.title} 全剧解锁`,
        }),
      });
      const data = await res.json();
      if (!data.approvalUrl) throw new Error(data.error || '创建订单失败');

      orderIdRef.current = data.orderId;
      window.open(data.approvalUrl, '_blank');
      setShowModal(true);
      setMsg('已在新窗口打开 PayPal，付款完成后点击下方“我已付款”。');
    } catch (e) {
      setMsg('❌ ' + e.message);
    } finally {
      setPaying(false);
    }
  }

  async function confirmPaid() {
    const orderId = orderIdRef.current;
    if (!orderId) { setMsg('❌ 未找到订单，请重新解锁'); return; }
    setPaying(true); setMsg('正在确认付款…');
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error('付款尚未完成，请确认已在 PayPal 完成支付');

      // 解锁成功
      localStorage.setItem(`rv_unlocked_${id}`, 'true');
      setUnlocked(true);
      setShowModal(false);

      // 写交易记录到 Firestore（后台可见）
      const db = getDB();
      if (db) {
        await addDoc(collection(db, 'reelverse_transactions'), {
          dramaId: id,
          dramaTitle: drama.title,
          amount: Number(drama.price || 9.99),
          currency: 'USD',
          email: data.payerEmail || '',
          captureId: data.captureId || '',
          status: 'completed',
          createdAt: serverTimestamp(),
        });
      }
      setMsg('🎉 解锁成功！可以观看完整短剧了');
    } catch (e) {
      setMsg('❌ ' + e.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="container center muted">加载中…</div>;
  if (!drama) return <div className="container center muted">短剧不存在</div>;

  const episodes = (drama.episodes || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const freeCount = drama.freeEpisodes || 0;

  return (
    <div className="container">
      <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
        <img
          src={drama.coverImage}
          alt={drama.title}
          style={{ width: 200, aspectRatio: '9/16', objectFit: 'cover', borderRadius: 14, border: '1px solid var(--border)' }}
        />
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{drama.title}</h1>
          <p className="muted" style={{ marginBottom: 12 }}>{drama.description}</p>
          <p className="muted" style={{ marginBottom: 16 }}>共 {episodes.length} 集 · 前 {freeCount} 集免费</p>

          {unlocked ? (
            <span className="badge badge-free" style={{ fontSize: 14 }}>✅ 已解锁全集</span>
          ) : (
            <button className="btn gold" onClick={handleUnlock} disabled={paying}>
              {paying ? <span className="spin" /> : null}
              🔓 解锁全集 ${drama.price || '9.99'}
            </button>
          )}

          {msg && <p style={{ marginTop: 10, fontSize: 13 }}>{msg}</p>}
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>剧集列表</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {episodes.map((ep, i) => {
          const free = i < freeCount;
          const canWatch = free || unlocked;
          return (
            <a
              key={ep.order || i}
              href={canWatch ? `/watch/${id}?ep=${ep.order || i + 1}` : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10,
              }}
              onClick={(e) => { if (!canWatch) e.preventDefault(); }}
            >
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>EP {i + 1}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{ep.title}</span>
              {free ? (
                <span className="badge badge-free">免费</span>
              ) : unlocked ? (
                <span className="badge badge-free">✅ 可看</span>
              ) : (
                <span className="badge badge-paid">🔒 解锁后看</span>
              )}
            </a>
          );
        })}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10, fontWeight: 800 }}>PayPal 付款</h3>
            <p className="muted" style={{ marginBottom: 16 }}>{msg}</p>
            <button className="btn gold" style={{ width: '100%' }} onClick={() => confirmPaid()} disabled={paying}>
              {paying ? <span className="spin" /> : null}
              ✅ 我已付款，解锁短剧
            </button>
            <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowModal(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
