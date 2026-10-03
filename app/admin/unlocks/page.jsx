'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import AdminGuard from '../../../components/AdminGuard';
import AdminNav from '../../../components/AdminNav';
import { getDB } from '../../../lib/firebase';

export default function UnlocksPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <UnlocksBody />
    </AdminGuard>
  );
}

function UnlocksBody() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const db = getDB();
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, 'reelverse_transactions'));
      const arr = [];
      snap.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
      arr.sort((a, b) => (a.createdAt?.toMillis ? b.createdAt.toMillis() - a.createdAt.toMillis() : 0));
      setList(arr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function markRefund(id) {
    const db = getDB();
    if (!db) return;
    if (!confirm('确认给这笔交易退款？')) return;
    await updateDoc(doc(db, 'reelverse_transactions', id), { status: 'refunded' });
    load();
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>解锁 / 退款管理</h1>
      {loading ? (
        <div className="center muted">加载中…</div>
      ) : list.length === 0 ? (
        <div className="panel center muted" style={{ padding: 50 }}>暂无交易</div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>短剧</th><th>金额</th><th>付款邮箱</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.dramaTitle || t.dramaId}</td>
                  <td>${Number(t.amount || 0).toFixed(2)}</td>
                  <td className="muted">{t.email || '—'}</td>
                  <td><span className={t.status === 'refunded' ? 'badge badge-paid' : 'badge badge-free'}>{t.status}</span></td>
                  <td>
                    {t.status === 'completed' ? (
                      <button className="btn ghost" onClick={() => markRefund(t.id)}>标记退款</button>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
