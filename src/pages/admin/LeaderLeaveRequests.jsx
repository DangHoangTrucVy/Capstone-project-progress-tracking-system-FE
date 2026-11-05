import { useEffect, useState } from "react";
import {
  getSubjectComplaints,
  moderatorDecisionLeaveRequest,
  getGroupMembers,
} from "../../services/groupService";
import api from "../../services/api";
import { apiError } from "../../utils/apiError";

export default function LeaderLeaveRequests({ selectedId, onChanged }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(selectedId ? "" : "PENDING");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [newLeaderUserId, setNewLeaderUserId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const semRes = await api.get("/semesters", { params: { size: 1000 } });
        const semList = Array.isArray(semRes.data) ? semRes.data : semRes.data.content || [];
        const perSemester = await Promise.all(
          semList.map((sem) =>
            api
              .get(`/semesters/${sem.code}/subjects`)
              .then((res) => (Array.isArray(res.data) ? res.data : res.data.content || []))
              .catch(() => []),
          ),
        );
        if (cancelled) return;
        const list = perSemester.flat();
        setSubjects(list);
        setSubjectId(list.length > 0 ? list[0].id || list[0].subjectId : "");
      } catch {
        if (!cancelled) setSubjectId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;
    setLoading(true);

    getSubjectComplaints(subjectId, {
      status: status || undefined,
      page,
      size: 20,
    })
      .then((data) => {
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : data.content || []);
          setTotalPages(data.totalPages || 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(apiError(err));
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, status, page, reload]);

  useEffect(() => {
    if (selectedId && !loading)
      document
        .getElementById(`leave-${selectedId}`)
        ?.scrollIntoView({ block: "center" });
  }, [selectedId, loading, items]);

  const refresh = () => {
    setLoading(true);
    setReload((n) => n + 1);
    onChanged?.();
  };

  const openApprove = async (request) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (request.groupId) {
        const data = await getGroupMembers(request.groupId);
        const list = Array.isArray(data) ? data : data.content || [];
        setMembers(
          list.filter(
            (m) =>
              m.status === "ACTIVE" &&
              String(m.userId) !== String(request.userId),
          ),
        );
      }
      setNewLeaderUserId("");
      setSelected(request);
    } catch (err) {
      setError(apiError(err));
      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  const approve = async (event) => {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      await moderatorDecisionLeaveRequest(selected.id, {
        approved: true,
        newLeaderUserId: newLeaderUserId || null,
      });
      setSelected(null);
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const reject = async (request) => {
    const reason = window.prompt(`Nhập lý do từ chối yêu cầu của ${request.userFullName || "sinh viên"}?`);
    if (reason === null) return;

    setBusy(true);
    setError("");
    try {
      await moderatorDecisionLeaveRequest(request.id, {
        approved: false,
        reason: reason.trim(),
      });
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-h-full space-y-6 p-8 text-[#1A1816] animate-smooth-fade">
      {/* Khối CSS keyframes cho hiệu ứng hiển thị mượt mà kéo dài 1.55s */}
      <style>{`
        @keyframes smoothFadeIn {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-smooth-fade {
          animation: smoothFadeIn 1.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, transform;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#E65100]/90 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-lg shadow-black/5">
        <div>
          <span className="inline-flex rounded-md bg-orange-100 px-3 py-1 text-[11px] font-black text-[#E65100] border border-orange-200">
            QUẢN LÝ ĐIỀU PHÒI
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#fdfdfd] sm:text-2xl">
            Yêu cầu rời nhóm & Khiếu nại chờ xử lý
          </h1>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/90 px-4 py-3 text-xs font-bold shadow-sm transition hover:bg-orange-50 text-[#E65100] cursor-pointer"
        >
          <span>↻</span>
          Làm mới
        </button>
      </div>

      {/* Filter trạng thái */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white bg-white/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-[#1A1816]">Danh sách yêu cầu</h2>
          <p className="mt-1 text-xs text-[#554D44] font-semibold">Lọc yêu cầu theo trạng thái xử lý.</p>
        </div>

        <select
          aria-label="Lọc trạng thái yêu cầu"
          className="w-full rounded-xl border border-white bg-white px-4 py-3 text-xs font-bold text-[#1A1816] outline-none transition focus:border-[#E65100] sm:w-56 cursor-pointer shadow-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
            setLoading(true);
            setError("");
          }}
        >
          <option value="PENDING">Đang chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
          <option value="">Tất cả trạng thái</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-100 p-4 text-xs font-bold text-red-800 shadow-sm">
          <strong>Có lỗi xảy ra.</strong> {error}
        </div>
      )}

      {/* Request list */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-white bg-white/80 backdrop-blur-xl p-12 text-center shadow-lg shadow-black/5">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#E65100]" />
            <p className="text-xs font-bold text-[#554D44]">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white bg-white/80 backdrop-blur-xl px-5 py-14 text-center shadow-lg shadow-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
              📭
            </div>
            <h3 className="mt-4 font-black text-[#1A1816] text-sm">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-xs text-[#554D44] font-semibold">Không tìm thấy yêu cầu phù hợp.</p>
          </div>
        ) : (
          items.map((item) => {
            const isPending = item.status === "PENDING";
            return (
              <article key={item.id} className="rounded-2xl border bg-white/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 border-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-black text-[#E65100] border border-orange-200">
                      {item.groupCode || "Chưa có mã nhóm"}
                    </span>
                    <h2 className="mt-4 text-base font-black text-[#1A1816]">{item.userFullName || "Sinh viên"}</h2>
                    <p className="mt-1 text-xs text-[#554D44] font-semibold">MSSV: {item.studentCode || "Chưa có MSSV"}</p>
                    <div className="mt-4 rounded-xl bg-white/60 p-4 border border-white">
                      <p className="text-[11px] font-black uppercase tracking-wide text-[#554D44]">Lý do</p>
                      <p className="mt-2 text-xs leading-relaxed font-semibold text-[#1A1816]">{item.reason || "Không có lý do"}</p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                      <button
                        type="button"
                        onClick={() => openApprove(item)}
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-3 text-xs font-bold text-white cursor-pointer shadow-sm"
                      >
                        ✓ Duyệt & Xử lý
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(item)}
                        className="rounded-xl border border-red-200 bg-red-100 hover:bg-red-200 px-4 py-3 text-xs font-bold text-red-800 cursor-pointer shadow-sm"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal duyệt */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <form onSubmit={approve} className="w-full max-w-lg space-y-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white p-6 shadow-2xl text-xs animate-smooth-fade">
            <h2 className="text-base font-black text-[#1A1816]">Duyệt yêu cầu / khiếu nại</h2>
            <div>
              <label className="mb-2 block font-bold text-[#3A3530]">Chọn Leader mới (Nếu cần)</label>
              <select
                className="w-full rounded-xl border border-white bg-white p-3 font-semibold text-[#1A1816] outline-none cursor-pointer shadow-sm"
                value={newLeaderUserId}
                onChange={(e) => setNewLeaderUserId(e.target.value)}
              >
                <option value="">Giữ nguyên / Tự động chọn</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userFullName || m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/80">
              <button type="button" onClick={() => setSelected(null)} className="px-5 py-2.5 bg-white border border-white rounded-xl font-bold cursor-pointer shadow-sm hover:bg-orange-50">
                Hủy
              </button>
              <button type="submit" className="px-5 py-2.5 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer shadow-lg">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}