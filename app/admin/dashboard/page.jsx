'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import AdminGuard from '../../../components/AdminGuard';
import AdminNav from '../../../components/AdminNav';
import { getDB } from '../../../lib/firebase';

export default function DashboardPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <DashboardBody />
    </AdminGuard>
  );
}

function DashboardBody() {
  const [stats, setStats] = useState({ total: 0, count: 0, byDrama: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    if (!db) { setLoading(false); return; }
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'reelverse_transactions'));
        let total = 0, count = 0;
        const byDrama = {};
        snap.forEach((doc) => {
          const t = doc.data();
          if (t.status !== 'completed') return;
          const amt = Number(t.amount || 0);
          total += amt; count++;
          const k = t.dramaTitle || t.dramaId || '未知';
          byDrama[k] = (byDrama[k] || 0) + amt;
        });
        setStats({ total, count, byDrama });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>收入看板</h1>
      {loading ? (
        <div className="center muted">加载中…</div>
      ) : (
        <>
          <div className="row">
            <div className="panel" style={{ flex: 1, minWidth: 200 }}>
              <div className="muted" style={{ fontSize: 13 }}>总收入 (USD)</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent2)' }}>${stats.total.toFixed(2)}</div>
            </div>
            <div className="panel" style={{ flex: 1, minWidth: 200 }}>
              <div className="muted" style={{ fontSize: 13 }}>完成订单数</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.count}</div>
            </div>
          </div>

          <div className="panel mt">
            <h3 style={{ marginBottom: 12, fontWeight: 700 }}>各短剧收入</h3>
            {Object.keys(stats.byDrama).length === 0 ? (
              <div className="muted">暂无收入数据</div>
            ) : (
              <table>
                <thead>
                  <tr><th>短剧</th><th>收入 (USD)</th></tr>
                </thead>
                <tbody>
                  {Object.entries(stats.byDrama).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td>${v.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
