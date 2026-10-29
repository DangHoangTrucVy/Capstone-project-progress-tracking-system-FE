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

  // 1. Lấy danh sách môn học (UUID subjectId) của mọi học kỳ đang có, không gắn cứng mã học kỳ
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

  // 2. Lấy danh sách khiếu nại/yêu cầu theo subjectId dạng UUID
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
    <section className="min-h-full space-y-6 bg-[#FBF9F5] p-5 text-[#2C2825] sm:p-8">
      {/* Header & Chọn Môn học (UUID) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
        <div>
          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-[#E65100]">
            QUẢN LÝ ĐIỀU PHÒI
          </span>
          <h1 className="mt-2 text-xl font-black sm:text-2xl">
            Yêu cầu rời nhóm & Khiếu nại chờ xử lý
          </h1>
        </div>

        {/* <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#6B635B]">Môn học:</span>
          {subjects.length > 0 ? (
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
            >
              {subjects.map((sub, idx) => {
                const id = sub.id || sub.subjectId;
                return (
                  <option key={idx} value={id}>
                    {sub.name || sub.code || id}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="Nhập Subject ID (UUID)..."
              className="w-64 p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-mono text-[#E65100] outline-none"
            />
          )}
        </div> */}

        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E2D9] bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-orange-300 hover:bg-orange-50 cursor-pointer"
        >
          <span>↻</span>
          Làm mới
        </button>
      </div>

      {/* Filter trạng thái */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black">Danh sách yêu cầu</h2>
          <p className="mt-1 text-xs text-[#8A8178]">Lọc yêu cầu theo trạng thái xử lý.</p>
        </div>

        <select
          aria-label="Lọc trạng thái yêu cầu"
          className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 text-sm outline-none transition focus:border-[#E65100] sm:w-56 cursor-pointer"
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
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Có lỗi xảy ra.</strong> {error}
        </div>
      )}

      {/* Request list */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#E8E2D9] bg-white p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#E65100]" />
            <p className="text-sm font-semibold text-[#8A8178]">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D0C6] bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
              📭
            </div>
            <h3 className="mt-4 font-bold">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-sm text-[#8A8178]">Không tìm thấy yêu cầu phù hợp.</p>
          </div>
        ) : (
          items.map((item) => {
            const isPending = item.status === "PENDING";
            return (
              <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm border-[#E8E2D9]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-black text-[#E65100]">
                      {item.groupCode || "Chưa có mã nhóm"}
                    </span>
                    <h2 className="mt-4 text-base font-black">{item.userFullName || "Sinh viên"}</h2>
                    <p className="mt-1 text-xs text-[#8A8178]">MSSV: {item.studentCode || "Chưa có MSSV"}</p>
                    <div className="mt-4 rounded-xl bg-[#FBF9F5] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8A8178]">Lý do</p>
                      <p className="mt-2 text-sm leading-6">{item.reason || "Không có lý do"}</p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                      <button
                        type="button"
                        onClick={() => openApprove(item)}
                        className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white cursor-pointer"
                      >
                        ✓ Duyệt & Xử lý
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(item)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 cursor-pointer"
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
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={approve} className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black">Duyệt yêu cầu / khiếu nại</h2>
            <div>
              <label className="mb-2 block text-sm font-bold">Chọn Leader mới (Nếu cần)</label>
              <select
                className="w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sm outline-none cursor-pointer"
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
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setSelected(null)} className="px-5 py-3 border rounded-xl font-bold cursor-pointer">
                Hủy
              </button>
              <button type="submit" className="px-5 py-3 bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}