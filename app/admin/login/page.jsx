'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error('口令错误');
      localStorage.setItem('rv_admin', 'true');
      router.replace('/admin/dashboard');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container center" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="panel">
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>ReelVerse 管理后台</h1>
        <form onSubmit={submit}>
          <label>管理员口令</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入口令"
            required
          />
          {err && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? <span className="spin" /> : null} 登录
          </button>
        </form>
      </div>
    </div>
  );
}
