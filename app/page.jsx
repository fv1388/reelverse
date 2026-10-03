'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDB } from '../lib/firebase';

export default function HomePage() {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    if (!db) { setLoading(false); return; }
    (async () => {
      try {
        const q = query(collection(db, 'reelverse_dramas'), where('status', '==', 'published'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setDramas(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>ReelVerse 短剧</h1>
      <p className="muted" style={{ marginBottom: 24 }}>免费看前几集，一次付款解锁全集。</p>

      {loading ? (
        <div className="center muted">加载中…</div>
      ) : dramas.length === 0 ? (
        <div className="panel center muted" style={{ padding: 60 }}>
          暂时还没有上架短剧
        </div>
      ) : (
        <div className="grid">
          {dramas.map((d) => (
            <a className="card" key={d.id} href={`/drama/${d.id}`}>
              <img
                className="cover"
                src={d.coverImage}
                alt={d.title}
                onError={(e) => { e.target.style.background = '#1b1f2c'; e.target.style.visibility = 'hidden'; }}
              />
              <div className="body">
                <h3>{d.title}</h3>
                <div className="meta" style={{ marginBottom: 8 }}>
                  {d.totalEpisodes || (d.episodes?.length || 0)} 集
                </div>
                <span className="badge badge-paid">
                  🔓 ${d.price || '0.00'} 解锁全集
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
