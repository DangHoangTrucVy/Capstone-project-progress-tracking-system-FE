import { useEffect, useState } from 'react';
import { getLeaveRequests, getGroupMembers, approveLeaveRequest, rejectLeaveRequest } from '../../services/groupService';
import { apiError } from '../../utils/apiError';

export default function LeaderLeaveRequests({ selectedId, onChanged }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(selectedId ? '' : 'PENDING');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [newLeaderUserId, setNewLeaderUserId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeaveRequests({ status: status || undefined, leaderOnly: true, page, size: 20 })
      .then(data => { if (!cancelled) { setItems(Array.isArray(data) ? data : data.content || []); setTotalPages(data.totalPages || 0); } })
      .catch(err => { if (!cancelled) { setError(apiError(err)); setItems([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, page, reload]);
  useEffect(() => {
    if (selectedId && !loading) document.getElementById(`leave-${selectedId}`)?.scrollIntoView({ block: 'center' });
  }, [selectedId, loading, items]);

  const refresh = () => { setLoading(true); setReload(n => n + 1); onChanged?.(); };
  const openApprove = async request => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const data = await getGroupMembers(request.groupId);
      const list = Array.isArray(data) ? data : data.content || [];
      setMembers(list.filter(m => m.status === 'ACTIVE' && String(m.userId) !== String(request.userId)));
      setNewLeaderUserId(''); setSelected(request);
    } catch (err) { setError(apiError(err)); setSelected(null); } finally { setBusy(false); }
  };
  const approve = async event => {
    event.preventDefault(); if (busy || !selected) return;
    setBusy(true); setError('');
    try {
      await approveLeaveRequest(selected.id, newLeaderUserId ? { newLeaderUserId } : {});
      setSelected(null); refresh();
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };
  const reject = async request => {
    if (busy || !window.confirm(`Từ chối yêu cầu của ${request.userFullName}?`)) return;
    setBusy(true); setError('');
    try { await rejectLeaveRequest(request.id); refresh(); }
    catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };

  return <section className="p-8 space-y-5">
    <h1 className="text-xl font-bold">Yêu cầu rời nhóm của Leader</h1>
    {selectedId && <p className="text-sm">Yêu cầu từ thông báo: {selectedId}. Chọn “Tất cả” và chuyển trang nếu yêu cầu đã được xử lý.</p>}
    <select aria-label="Lọc trạng thái yêu cầu" className="border rounded-xl p-3" value={status} onChange={e => { setStatus(e.target.value); setPage(0); setLoading(true); setError(''); }}><option value="PENDING">Đang chờ</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Đã từ chối</option><option value="">Tất cả</option></select>
    <button className="ml-3 border rounded-xl p-3" onClick={refresh} disabled={busy || loading}>Làm mới</button>
    {error && <p role="alert" className="bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p>Đang tải...</p> : !items.length ? <p>Không có yêu cầu.</p> : items.map(item => <article id={`leave-${item.id}`} key={item.id} className={`bg-white rounded-2xl border p-5 space-y-3 ${String(item.id) === String(selectedId) ? 'ring-2 ring-orange-500' : ''}`}>
      <h2 className="font-bold">{item.groupCode} · {item.userFullName} · {item.studentCode || 'Chưa có MSSV'}</h2><p>{item.reason}</p><p className="text-sm">Trạng thái: {item.status} · {item.createdAt && new Date(item.createdAt).toLocaleString('vi-VN')}</p>
      {item.status === 'PENDING' && <div className="flex gap-3"><button disabled={busy} className="rounded-xl bg-green-700 text-white p-3" onClick={() => openApprove(item)}>Duyệt & đổi Leader</button><button disabled={busy} className="rounded-xl bg-red-50 text-red-700 p-3" onClick={() => reject(item)}>Từ chối</button></div>}
    </article>)}
    <div className="flex gap-3 items-center"><button disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Trang trước</button><span>{page + 1} / {Math.max(totalPages, 1)}</span><button disabled={loading || page + 1 >= totalPages} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Trang sau</button></div>
    {selected && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={approve} className="bg-white rounded-2xl p-6 space-y-4 max-w-lg w-full">{error && <p role="alert" className="text-red-700">{error}</p>}<h2 className="font-bold">Duyệt yêu cầu của {selected.userFullName}</h2><p>Người gửi sẽ rời nhóm. Chọn Leader mới hoặc để hệ thống chọn thành viên vào nhóm sớm nhất.</p><select aria-label="Leader mới" className="border rounded-xl p-3 w-full" disabled={busy} value={newLeaderUserId} onChange={e => setNewLeaderUserId(e.target.value)}><option value="">Tự động chọn Leader mới</option>{members.map(m => <option key={m.userId} value={m.userId}>{m.userFullName || m.fullName || m.studentCode || m.userId}</option>)}</select><div className="flex gap-3"><button disabled={busy} className="bg-green-700 text-white p-3 rounded-xl">{busy ? 'Đang xử lý...' : 'Xác nhận duyệt'}</button><button type="button" disabled={busy} onClick={() => setSelected(null)} className="border p-3 rounded-xl">Hủy</button></div></form></div>}
  </section>;
}
