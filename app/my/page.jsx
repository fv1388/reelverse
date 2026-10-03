'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDB } from '../../lib/firebase';

export default function MyPage() {
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    if (!db) { setLoading(false); return; }
    (async () => {
      try {
        // 从 localStorage 找出已解锁的剧
        const unlockedIds = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('rv_unlocked_') && localStorage.getItem(k) === 'true') {
            unlockedIds.push(k.replace('rv_unlocked_', ''));
          }
        }
        if (unlockedIds.length === 0) { setPurchased([]); setLoading(false); return; }

        const snap = await getDocs(collection(db, 'reelverse_dramas'));
        const list = [];
        snap.forEach((doc) => {
          if (unlockedIds.includes(doc.id)) list.push({ id: doc.id, ...doc.data() });
        });
        setPurchased(list);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>我的已购</h1>
      {loading ? (
        <div className="center muted">加载中…</div>
      ) : purchased.length === 0 ? (
        <div className="panel center muted" style={{ padding: 60 }}>
          你还没有解锁任何短剧，去首页挑一部吧。
        </div>
      ) : (
        <div className="grid">
          {purchased.map((d) => (
            <a className="card" key={d.id} href={`/drama/${d.id}`}>
              <img className="cover" src={d.coverImage} alt={d.title} />
              <div className="body">
                <h3>{d.title}</h3>
                <span className="badge badge-free">✅ 已解锁</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
