import { useEffect, useState } from 'react';
import { importEligibilityJson, importEligibilityFile, getImportedStudents, updateStudentEligibility } from '../../services/eligibilityService';
import { apiError } from '../../utils/apiError';

const example = JSON.stringify({ students: [{ email: 'se170001@fpt.edu.vn', fullName: 'Nguyễn Văn A', studentCode: 'SE170001', eligible: false, reason: 'Nợ học phí' }] }, null, 2);
const input = 'rounded-xl border border-[#E8E2D9] p-3 text-sm bg-white';

function StudentTable({ students }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['MSSV', 'Họ tên', 'Email', 'Điều kiện', 'Lý do', 'Kết quả / Ngày import'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{students.map(s => <tr key={s.userId || s.id || s.email} className="border-t"><td className="p-3">{s.studentCode || '—'}</td><td className="p-3">{s.fullName}</td><td className="p-3">{s.email}</td><td className="p-3">{s.eligible ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}</td><td className="p-3">{s.ineligibleReason || '—'}</td><td className="p-3">{s.action || (s.importedAt ? new Date(s.importedAt).toLocaleString('vi-VN') : '—')}</td></tr>)}</tbody></table>{!students.length && <p className="p-3">Không có sinh viên.</p>}</div>;
}

export default function EligibilityPanel({ onChanged }) {
  const [json, setJson] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [eligible, setEligible] = useState('');
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [userId, setUserId] = useState('');
  const [flag, setFlag] = useState('true');

  useEffect(() => {
    let cancelled = false;
    getImportedStudents({ page, size: 20, q: q || undefined, eligible: eligible === '' ? undefined : eligible === 'true' })
      .then(data => { if (!cancelled) { setItems(data.content || []); setTotalPages(data.totalPages || 0); } })
      .catch(err => { if (!cancelled) { setError(apiError(err)); setItems([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, q, eligible, reload]);

  const refresh = () => { setLoading(true); setReload(n => n + 1); onChanged?.(); };
  const submit = async (event, kind) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      let response;
      if (kind === 'file') {
        if (!file) throw new Error('Vui lòng chọn file.');
        const data = new FormData(); data.append('file', file);
        response = await importEligibilityFile(data);
      } else {
        let data;
        try { data = JSON.parse(json); } catch { throw new Error('JSON không hợp lệ. Vui lòng kiểm tra cú pháp.'); }
        response = await importEligibilityJson(Array.isArray(data) ? { students: data } : data);
      }
      setResult(response); refresh();
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };
  const update = async event => {
    event.preventDefault(); if (busy || !userId.trim()) return;
    setBusy(true); setError('');
    try { await updateStudentEligibility(userId.trim(), { eligible: flag === 'true' }); refresh(); }
    catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };

  return <section className="p-8 space-y-6 text-[#2C2825]">
    <h1 className="text-xl font-bold">Import & danh sách điều kiện sinh viên</h1>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <form onSubmit={e => submit(e, 'file')} className="bg-white p-6 rounded-2xl space-y-3 border">
      <label className="block font-bold" htmlFor="eligibility-file">Import CSV / Excel (.csv, .xlsx, .xls)</label>
      <input id="eligibility-file" type="file" accept=".csv,.xlsx,.xls" required disabled={busy} onChange={e => setFile(e.target.files[0])} />
      <p className="text-sm">Cột: email, ho_ten, mssv, du_dieu_kien, ly_do. Chỉ dùng MSSV khi sinh viên đã có tài khoản.</p>
      <button disabled={busy || !file} className={input}>{busy ? 'Đang xử lý...' : 'Tải lên danh sách'}</button>
    </form>
    <form onSubmit={e => submit(e, 'json')} className="bg-white p-6 rounded-2xl space-y-3 border">
      <label htmlFor="eligibility-json" className="block font-bold">Import JSON</label>
      <textarea id="eligibility-json" className={`${input} w-full font-mono`} rows={8} placeholder={example} value={json} onChange={e => setJson(e.target.value)} required disabled={busy} />
      <button disabled={busy || !json.trim()} className={input}>{busy ? 'Đang xử lý...' : 'Import JSON'}</button>
    </form>
    {result && <div className="bg-white rounded-2xl border p-6 space-y-3"><h2 className="font-bold">Kết quả import</h2><p>Tạo: {result.created || 0} · Cập nhật: {result.updated || 0} · Gắn cờ: {result.flagged || 0} · Gỡ cờ: {result.cleared || 0}</p><StudentTable students={result.students || []} />{!!result.invalid?.length && <div role="alert" className="text-red-700"><h3>Dòng không hợp lệ</h3><ul>{result.invalid.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}</div>}
    <form onSubmit={update} className="bg-white p-6 rounded-2xl border flex flex-wrap gap-3"><input aria-label="User ID sinh viên" className={input} value={userId} onChange={e => setUserId(e.target.value)} placeholder="User ID sinh viên" required /><select aria-label="Điều kiện mới" className={input} value={flag} onChange={e => setFlag(e.target.value)}><option value="true">Đủ điều kiện</option><option value="false">Chưa đủ điều kiện</option></select><button className={input} disabled={busy}>Cập nhật điều kiện</button></form>
    <div className="bg-white p-6 rounded-2xl border space-y-4"><h2 className="font-bold">Sinh viên đã import</h2>
      <form className="flex flex-wrap gap-3" onSubmit={e => { e.preventDefault(); setError(''); setLoading(true); setPage(0); setQ(query.trim()); setReload(n => n + 1); }}><input className={input} aria-label="Tìm sinh viên" placeholder="Tên, email hoặc MSSV" value={query} onChange={e => setQuery(e.target.value)} /><select className={input} aria-label="Lọc điều kiện" value={eligible} onChange={e => { setError(''); setLoading(true); setEligible(e.target.value); setPage(0); }}><option value="">Tất cả điều kiện</option><option value="true">Đủ điều kiện</option><option value="false">Chưa đủ điều kiện</option></select><button className={input}>Tìm kiếm</button></form>
      {loading ? <p>Đang tải...</p> : <StudentTable students={items} />}
      <div className="flex gap-3 items-center"><button className={input} disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Trước</button><span>Trang {page + 1} / {Math.max(totalPages, 1)}</span><button className={input} disabled={loading || page + 1 >= totalPages} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Sau</button></div>
    </div>
  </section>;
}
