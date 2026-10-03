'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let auth = false;
    try { auth = localStorage.getItem('rv_admin') === 'true'; } catch (e) {}
    if (!auth) {
      router.replace('/admin/login');
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) return <div className="container center muted">校验中…</div>;
  return children;
}
