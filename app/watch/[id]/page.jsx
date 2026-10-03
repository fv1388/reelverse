'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import { getDB } from '../../../lib/firebase';

export default function WatchPage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = params.id;
  const ep = Number(sp.get('ep') || 1);

  const [drama, setDrama] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    if (!db) { setLoading(false); return; }
    (async () => {
      try {
        const d = await getDoc(doc(db, 'reelverse_dramas', id));
        if (d.exists()) setDrama({ id: d.id, ...d.data() });
      } catch (e) { console.error(e); }
      finally {
        if (typeof window !== 'undefined') {
          try { setUnlocked(localStorage.getItem(`rv_unlocked_${id}`) === 'true'); } catch (e) {}
        }
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="container center muted">加载中…</div>;
  if (!drama) return <div className="container center muted">短剧不存在</div>;

  const episodes = (drama.episodes || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const freeCount = drama.freeEpisodes || 0;
  const idx = ep - 1;
  const current = episodes[idx];
  const isFree = idx < freeCount;
  const allowed = isFree || unlocked;

  if (!current) return <div className="container center muted">剧集不存在</div>;
  if (!allowed) {
    return (
      <div className="container center panel" style={{ padding: 60 }}>
        <h2 style={{ marginBottom: 12 }}>🔒 该集需要解锁</h2>
        <p className="muted" style={{ marginBottom: 20 }}>解锁全集后可观看所有剧集。</p>
        <a className="btn gold" href={`/drama/${id}`}>解锁全集</a>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{drama.title}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>第 {idx + 1} 集 · {current.title}</p>
      <video
        controls
        autoPlay
        playsInline
        src={current.videoUrl}
        style={{ width: '100%', aspectRatio: '9/16', maxHeight: '72vh', background: '#000', borderRadius: 12 }}
      />
      <div className="row mt">
        {idx > 0 && <a className="btn ghost" href={`/watch/${id}?ep=${idx}`}>上一集</a>}
        {idx < episodes.length - 1 && <a className="btn" href={`/watch/${id}?ep=${idx + 2}`}>下一集</a>}
      </div>
    </div>
  );
}
