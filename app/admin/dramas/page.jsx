'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { upload } from '@vercel/blob/client';
import AdminGuard from '../../../components/AdminGuard';
import AdminNav from '../../../components/AdminNav';
import { getDB } from '../../../lib/firebase';

const empty = { title: '', description: '', price: '9.99', freeEpisodes: 1, coverImage: '', status: 'published', episodes: [] };

export default function DramasPage() {
  return (
    <AdminGuard>
      <AdminNav />
      <DramasBody />
    </AdminGuard>
  );
}

function DramasBody() {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  async function load() {
    const db = getDB();
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, 'reelverse_dramas'));
      const arr = [];
      snap.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
      setDramas(arr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startNew() { setEditId(null); setForm(empty); setShowForm(true); }
  function startEdit(d) {
    setEditId(d.id);
    setForm({
      title: d.title || '',
      description: d.description || '',
      price: d.price || '9.99',
      freeEpisodes: d.freeEpisodes || 1,
      coverImage: d.coverImage || '',
      status: d.status || 'published',
      episodes: (d.episodes || []).slice(),
    });
    setShowForm(true);
  }

  async function uploadFile(file) {
    return upload(`rv/${Date.now()}_${file.name}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
    });
  }

  function setEp(i, key, val) {
    const eps = form.episodes.slice();
    eps[i] = { ...eps[i], [key]: val };
    setForm({ ...form, episodes: eps });
  }

  async function save() {
    if (!form.title) { alert('请填写短剧标题'); return; }
    setBusy(true);
    const db = getDB();
    try {
      const data = {
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        freeEpisodes: Number(form.freeEpisodes || 0),
        coverImage: form.coverImage,
        status: form.status,
        episodes: form.episodes.filter((e) => e.title || e.videoUrl),
        totalEpisodes: form.episodes.filter((e) => e.title || e.videoUrl).length,
        updatedAt: serverTimestamp(),
      };
      if (editId) {
        await updateDoc(doc(db, 'reelverse_dramas', editId), data);
      } else {
        await addDoc(collection(db, 'reelverse_dramas'), { ...data, createdAt: serverTimestamp() });
      }
      setShowForm(false); setEditId(null); setForm(empty);
      load();
    } catch (e) { alert('保存失败: ' + e.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('确定删除这部短剧？')) return;
    const db = getDB();
    await deleteDoc(doc(db, 'reelverse_dramas', id));
    load();
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>短剧管理</h1>
        <button className="btn" onClick={startNew}>+ 添加短剧</button>
      </div>

      {loading ? (
        <div className="center muted">加载中…</div>
      ) : dramas.length === 0 ? (
        <div className="panel center muted" style={{ padding: 50 }}>还没有短剧，点右上角添加</div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>封面</th><th>标题</th><th>价格</th><th>集数</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {dramas.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.coverImage
                      ? <img src={d.coverImage} alt="" style={{ width: 34, aspectRatio: '9/16', objectFit: 'cover', borderRadius: 6 }} />
                      : <span className="muted">—</span>}
                  </td>
                  <td>{d.title}</td>
                  <td>${d.price || 0}</td>
                  <td>{d.totalEpisodes || d.episodes?.length || 0}</td>
                  <td><span className={d.status === 'published' ? 'badge badge-free' : 'badge badge-paid'}>{d.status}</span></td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <a className="btn ghost" href={`/drama/${d.id}`}>查看</a>
                      <button className="btn ghost" onClick={() => startEdit(d)}>编辑</button>
                      <button className="btn danger" onClick={() => remove(d.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ width: 'min(720px, 94vw)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{editId ? '编辑短剧' : '添加短剧'}</h3>

            <label>标题（英文）</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如 Undercover CEO" />

            <label>简介</label>
            <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <div className="row">
              <div style={{ flex: 1 }}>
                <label>解锁价格 (USD)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>免费集数</label>
                <input className="input" type="number" min="0" value={form.freeEpisodes} onChange={(e) => setForm({ ...form, freeEpisodes: e.target.value })} />
              </div>
            </div>

            <label>状态</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="published">published（前台可见）</option>
              <option value="draft">draft（草稿）</option>
            </select>

            <label>封面图片（可上传）</label>
            <div className="row">
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const blob = await uploadFile(f);
                setForm({ ...form, coverImage: blob.url });
              }} />
              {form.coverImage && <img src={form.coverImage} alt="" style={{ width: 40, aspectRatio: '9/16', objectFit: 'cover', borderRadius: 6 }} />}
            </div>

            <h4 style={{ margin: '16px 0 8px', fontWeight: 700 }}>剧集（每集一个视频）</h4>
            {form.episodes.map((ep, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div className="row">
                  <input className="input" style={{ flex: 1, marginBottom: 0 }} placeholder={`第 ${i + 1} 集标题`} value={ep.title || ''} onChange={(e) => setEp(i, 'title', e.target.value)} />
                  <button className="btn ghost" onClick={() => setForm({ ...form, episodes: form.episodes.filter((_, x) => x !== i) })}>移除</button>
                </div>
                <div className="row mt">
                  <input type="file" accept="video/*" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setEp(i, 'uploading', true);
                    const blob = await uploadFile(f);
                    setEp(i, 'videoUrl', blob.url); setEp(i, 'uploading', false);
                  }} />
                  {ep.videoUrl ? <span className="badge badge-free">✅ 已上传</span> : (ep.uploading ? <span className="spin" /> : null)}
                </div>
                <input className="input mt" value={ep.videoUrl || ''} onChange={(e) => setEp(i, 'videoUrl', e.target.value)} placeholder="或直接粘贴视频 URL" />
              </div>
            ))}
            <button className="btn ghost" onClick={() => setForm({ ...form, episodes: [...form.episodes, { title: '', videoUrl: '', order: form.episodes.length + 1 }] })}>
              + 添加一集
            </button>

            <div className="row mt" style={{ justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn gold" onClick={save} disabled={busy}>
                {busy ? <span className="spin" /> : null} 保存短剧
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
