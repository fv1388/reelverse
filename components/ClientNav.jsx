'use client';

export default function ClientNav() {
  return (
    <nav className="topnav">
      <a className="brand" href="/">Reel<span>Verse</span></a>
      <a className="link" href="/">首页</a>
      <a className="link" href="/my">我的已购</a>
      <span className="spacer" />
      <a className="link" href="/admin">管理后台</a>
    </nav>
  );
}
