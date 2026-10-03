'use client';

import { useRouter } from 'next/navigation';

export default function AdminNav() {
  const router = useRouter();
  return (
    <nav className="topnav">
      <span className="brand">Reel<span>Verse</span> 后台</span>
      <a className="link" href="/admin/dashboard">收入看板</a>
      <a className="link" href="/admin/dramas">短剧管理</a>
      <a className="link" href="/admin/transactions">交易记录</a>
      <a className="link" href="/admin/unlocks">解锁管理</a>
      <span className="spacer" />
      <a className="link" href="/">回前台</a>
      <button
        className="link"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--danger)' }}
        onClick={() => { localStorage.removeItem('rv_admin'); router.replace('/admin/login'); }}
      >
        退出
      </button>
    </nav>
  );
}
