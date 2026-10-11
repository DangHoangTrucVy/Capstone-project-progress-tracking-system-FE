import { useEffect, useState } from 'react';
import { getGroupDocuments, submitDocumentLink, uploadDocument, downloadDocument } from '../../services/documentService';
import { apiError } from '../../utils/apiError';

export default function GroupDocuments({ groupId, isLeader }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!groupId) return;
    getGroupDocuments(groupId, { page, size: 20, sort: 'submittedAt,desc' })
      .then(data => { if (!cancelled) { setItems(data.content || []); setTotalPages(data.totalPages || 0); } })
      .catch(err => { if (!cancelled) { setError(apiError(err)); setItems([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId, page, reload]);

  const submit = async event => {
    event.preventDefault(); if (busy || !isLeader || !groupId || !title.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'file') {
        if (!file) throw new Error('Vui lòng chọn tài liệu.');
        const data = new FormData(); data.append('title', title.trim()); data.append('file', file);
        await uploadDocument(groupId, data);
      } else {
        const parsed = new URL(url.trim());
        if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Liên kết phải bắt đầu bằng http:// hoặc https://.');
        await submitDocumentLink(groupId, { title: title.trim(), fileUrl: parsed.href, fileType: 'LINK' });
      }
      setTitle(''); setUrl(''); setNotice('Đã nộp tài liệu thành công.');
      setLoading(true); setPage(0); setReload(n => n + 1);
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };
  const download = async item => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await downloadDocument(item.id);
      if (response.status !== 200 || /json|html/.test(response.headers['content-type'] || '')) {
        const data = await response.data.text().then(JSON.parse).catch(() => null);
        throw new Error(data?.message || 'Không thể tải tài liệu.');
      }
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = objectUrl; link.download = (item.originalFilename || item.title || 'document').split(/[\\/]/).pop();
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      const data = err.response?.data;
      const payload = data instanceof Blob ? await data.text().then(JSON.parse).catch(() => null) : null;
      setError(payload?.message || apiError(err));
    } finally { setBusy(false); }
  };

  return <section className="space-y-5"><h1 className="text-xl font-bold">Tài liệu nhóm</h1>
    {error && <p role="alert" className="bg-red-50 p-4 text-red-700">{error}</p>}{notice && <p role="status" className="text-green-700">{notice}</p>}
    {isLeader && <form onSubmit={submit} className="bg-white p-6 border rounded-2xl space-y-4"><h2 className="font-bold">Nộp tài liệu</h2><input aria-label="Tiêu đề tài liệu" className="border p-3 rounded-xl w-full" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Tiêu đề tài liệu" disabled={busy} /><select aria-label="Hình thức nộp" className="border p-3 rounded-xl" value={mode} onChange={e => setMode(e.target.value)} disabled={busy}><option value="file">Tải file lên</option><option value="link">Gửi liên kết</option></select>{mode === 'file' ? <input aria-label="File tài liệu" type="file" required disabled={busy} onChange={e => setFile(e.target.files[0])} /> : <input aria-label="Liên kết tài liệu" type="url" required className="border p-3 rounded-xl w-full" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} disabled={busy} />}<button disabled={busy || !title.trim()} className="block bg-[#E65100] text-white rounded-xl p-3">{busy ? 'Đang xử lý...' : 'Nộp tài liệu'}</button></form>}
    <button disabled={loading} onClick={() => { setError(''); setLoading(true); setReload(n => n + 1); }}>Làm mới</button>
    {loading ? <p>Đang tải...</p> : !items.length ? <p>Chưa có tài liệu.</p> : items.map(item => <article className="bg-white border rounded-2xl p-5 space-y-2" key={item.id}><h2 className="font-bold">{item.title}</h2><p>Phiên bản {item.version} · {item.status} · {item.submittedAt && new Date(item.submittedAt).toLocaleString('vi-VN')}</p>{item.feedback && <p>Phản hồi: {item.feedback}</p>}{item.sourceType === 'FILE' ? <button disabled={busy} className="text-orange-700 underline" onClick={() => download(item)}>Tải {item.originalFilename || 'tài liệu'}</button> : /^https?:\/\//i.test(item.fileUrl || '') && <a className="text-orange-700 underline" href={item.fileUrl} target="_blank" rel="noreferrer">Mở liên kết</a>}</article>)}
    <div className="flex gap-4"><button disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Trước</button><span>{page + 1} / {Math.max(1, totalPages)}</span><button disabled={loading || page + 1 >= totalPages} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Sau</button></div>
  </section>;
}
