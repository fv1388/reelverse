'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import AdminGuard from '../../../components/AdminGuard';
import AdminNav from '../../../components/AdminNav';
import { getDB } from '../../../lib/firebase';

export default function TransactionsPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <TransactionsBody />
    </AdminGuard>
  );
}

function TransactionsBody() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const db = getDB();
    if (!db) return;
    try {
      const snap = await getDocs(query(collection(db, 'reelverse_transactions'), orderBy('createdAt', 'desc')));
      const arr = [];
      snap.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
      setList(arr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    const db = getDB();
    if (!db) return;
    if (!confirm('确定删除这条交易记录？')) return;
    await deleteDoc(doc(db, 'reelverse_transactions', id));
    load();
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>付费交易记录</h1>
      {loading ? (
        <div className="center muted">加载中…</div>
      ) : list.length === 0 ? (
        <div className="panel center muted" style={{ padding: 50 }}>暂无交易记录</div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>短剧</th><th>金额</th><th>付款邮箱</th><th>时间</th><th>状态</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.dramaTitle || t.dramaId}</td>
                  <td>${Number(t.amount || 0).toFixed(2)}</td>
                  <td className="muted">{t.email || '—'}</td>
                  <td className="muted">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : (t.createdAt || '—')}</td>
                  <td><span className="badge badge-free">{t.status}</span></td>
                  <td><button className="btn ghost" onClick={() => remove(t.id)}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
