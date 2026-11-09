import { useEffect, useState } from "react";
import api from "../../services/api";

export default function LeaderLeaveRequests({ selectedId, onChanged }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [items, setItems] = useState([]);
  
  // Trạng thái lọc chuẩn theo Swagger backend: PENDING, APPROVED, REJECTED hoặc ALL
  const [status, setStatus] = useState(selectedId ? "" : "PENDING");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [newLeaderUserId, setNewLeaderUserId] = useState("");
  const [busy, setBusy] = useState(false);

  // 1. Tải danh sách Học kỳ
  useEffect(() => {
    api.get("/semesters", { params: { size: 1000 } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setSemesters(list);
        if (list.length > 0) {
          const firstCode = list[0].code || list[0].name || list[0];
          setSelectedSemester(firstCode);
        }
      })
      .catch(() => setSemesters([]));
  }, []);

  // 2. Tải danh sách khiếu nại / rời room chuẩn API: GET /api/v1/semesters/{semester}/complaints
  useEffect(() => {
    if (!selectedSemester) return;
    loadComplaints(selectedSemester, status);
  }, [selectedSemester, status]);

  const loadComplaints = async (semCode, currentStatus) => {
    setLoading(true);
    setError("");
    try {
      // Đã đổi sang chuẩn Swagger API: GET /semesters/{semester}/complaints
      const res = await api.get(`/semesters/${semCode}/complaints`, {
        params: { status: currentStatus || undefined }
      }).catch(() => 
        // Fallback cho backend dùng endpoint leave-requests cũ
        api.get(`/semesters/${semCode}/leave-requests`, {
          params: { status: currentStatus || undefined }
        })
      );

      const list = Array.isArray(res.data) 
        ? res.data 
        : res.data?.content || res.data?.items || [];
      
      setItems(list);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách khiếu nại.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (selectedSemester) {
      loadComplaints(selectedSemester, status);
      onChanged?.();
    }
  };

  // Mở Modal phê duyệt & tải thành viên room để chọn Trưởng nhóm mới nếu cần
  const openApprove = async (request) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const roomId = request.roomId || request.groupId;
      if (roomId) {
        const membersRes = await api.get(`/rooms/${roomId}`).catch(() => null);
        const memberList = membersRes?.data?.members || [];
        setMembers(
          memberList.filter(
            (m) => String(m.userId || m.id) !== String(request.userId || request.studentId)
          )
        );
      }
      setNewLeaderUserId("");
      setSelected(request);
    } catch {
      setSelected(request);
    } finally {
      setBusy(false);
    }
  };

  // Duyệt yêu cầu (Chấp nhận cho rời Room)
  const approve = async (event) => {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      const requestId = selected.id || selected.requestId;
      // Chuẩn Swagger API: POST /api/v1/leave-requests/{requestId}/moderator-decision
      await api.post(`/leave-requests/${requestId}/moderator-decision`, {
        approve: true,
        approved: true,
        newLeaderUserId: newLeaderUserId || null,
        note: "Đã chấp nhận cho rời nhóm"
      });
      setSelected(null);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Xử lý duyệt thất bại.");
    } finally {
      setBusy(false);
    }
  };

  // Từ chối yêu cầu rời nhóm
  const reject = async (request) => {
    const reason = window.prompt(
      `Nhập lý do từ chối yêu cầu của ${request.studentName || request.userFullName || "sinh viên"}?`
    );
    if (reason === null) return;

    setBusy(true);
    setError("");
    try {
      const requestId = request.id || request.requestId;
      // Chuẩn Swagger API: POST /api/v1/leave-requests/{requestId}/moderator-decision
      await api.post(`/leave-requests/${requestId}/moderator-decision`, {
        approve: false,
        approved: false,
        note: reason.trim(),
        reason: reason.trim()
      });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Từ chối yêu cầu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const getStatusBadge = (itemStatus) => {
    switch (itemStatus) {
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] border border-emerald-200">
            ✓ Đã duyệt rời nhóm
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-lg text-[10px] border border-red-200">
            ✕ Đã từ chối
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[10px] border border-amber-200">
            ⏳ Đang chờ xử lý
          </span>
        );
    }
  };

  return (
    <section className="min-h-full space-y-6 p-8 text-[#1A1816] animate-smooth-fade">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#E65100]/90 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-lg shadow-black/5">
        <div>
          <span className="inline-flex rounded-md bg-orange-100 px-3 py-1 text-[11px] font-black text-[#E65100] border border-orange-200">
            QUẢN TRỊ ĐIỀU PHỐI HỆ THỐNG
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#fdfdfd]">
            Xử lý yêu cầu rời nhóm & khiếu nại
          </h1>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/90 px-4 py-3 text-xs font-bold shadow-sm transition hover:bg-orange-50 text-[#E65100] cursor-pointer"
        >
          <span>↻</span> Làm mới
        </button>
      </div>

      {/* Thanh chọn Học kỳ & Bộ lọc Trạng thái */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white bg-white/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#554D44]">Học kỳ:</span>
          <select
            className="rounded-xl border border-white bg-white px-3 py-2 text-xs font-bold text-[#E65100] outline-none shadow-sm cursor-pointer"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            {semesters.map((sem, idx) => {
              const code = sem.code || sem;
              return (
                <option key={idx} value={code}>
                  Kỳ {code}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#554D44]">Trạng thái:</span>
          <select
            className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-xs font-bold text-[#E65100] outline-none transition focus:border-[#E65100] sm:w-60 cursor-pointer shadow-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="PENDING">⏳ Đang chờ duyệt (Pending)</option>
            <option value="APPROVED">✓ Đã chấp nhận (Approved)</option>
            <option value="REJECTED">✕ Đã từ chối (Rejected)</option>
            <option value="">📋 Tất cả trạng thái</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-100 p-4 text-xs font-bold text-red-800 shadow-sm">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      {/* Danh sách yêu cầu */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-white bg-white/80 backdrop-blur-xl p-12 text-center shadow-lg shadow-black/5">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#E65100]" />
            <p className="text-xs font-bold text-[#554D44]">Đang tải danh sách khiếu nại...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white bg-white/80 backdrop-blur-xl px-5 py-14 text-center shadow-lg shadow-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
              📭
            </div>
            <h3 className="mt-4 font-black text-[#1A1816] text-sm">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-xs text-[#554D44] font-semibold">
              Không tìm thấy khiếu nại hay yêu cầu rời Room nào phù hợp.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isPending = item.status === "PENDING" || !item.status;
            return (
              <article
                key={item.id || item.requestId}
                className="rounded-2xl border bg-white/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 border-white transition hover:border-[#E65100]/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-black text-[#E65100] border border-orange-200">
                        {item.roomName || item.groupCode || "Chưa có mã nhóm"}
                      </span>
                      {getStatusBadge(item.status || "PENDING")}
                    </div>

                    <div>
                      <h2 className="text-base font-black text-[#1A1816]">
                        {item.studentName || item.userFullName || item.fullName || "Sinh viên"}
                      </h2>
                      <p className="text-xs text-[#554D44] font-semibold mt-0.5">
                        MSSV: <span className="font-mono text-[#E65100] font-black">{item.studentCode || item.mssv || "Chưa cập nhật"}</span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/60 p-4 border border-white space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#554D44]">
                        Lý do / Nội dung khiếu nại:
                      </p>
                      <p className="text-xs leading-relaxed font-semibold text-[#1A1816]">
                        {item.reason || item.content || "Không có lý do cụ thể."}
                      </p>
                    </div>
                  </div>

                  {isPending ? (
                    <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                      <button
                        type="button"
                        onClick={() => openApprove(item)}
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-3 text-xs font-bold text-white cursor-pointer shadow-sm transition"
                      >
                        ✓ Duyệt cho rời
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(item)}
                        className="rounded-xl border border-red-200 bg-red-100 hover:bg-red-200 px-4 py-3 text-xs font-bold text-red-800 cursor-pointer shadow-sm transition"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-[11px] font-semibold text-[#7A7065]">
                      Đã xử lý
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal Duyệt & Phân công Trưởng nhóm mới */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <form
            onSubmit={approve}
            className="w-full max-w-lg space-y-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white p-6 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-[#1A1816]">
                Xác nhận chấp nhận cho rời Room
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[#554D44] font-semibold">
              Sinh viên <strong>{selected.studentName || selected.userFullName || selected.fullName}</strong> sẽ được phép rời nhóm.
            </p>

            {members.length > 0 && (
              <div className="space-y-1.5">
                <label className="block font-bold text-[#3A3530]">
                  Chỉ định Trưởng nhóm mới (Nếu sinh viên rời nhóm là Leader):
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 font-semibold text-[#1A1816] outline-none cursor-pointer focus:border-[#E65100] shadow-sm"
                  value={newLeaderUserId}
                  onChange={(e) => setNewLeaderUserId(e.target.value)}
                >
                  <option value="">-- Tự động chuyển quyền --</option>
                  {members.map((m) => (
                    <option key={m.userId || m.id} value={m.userId || m.id}>
                      {m.fullName || m.name} ({m.studentCode || m.mssv || "TV"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold cursor-pointer shadow-sm hover:bg-orange-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer shadow-lg disabled:opacity-50"
              >
                {busy ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}