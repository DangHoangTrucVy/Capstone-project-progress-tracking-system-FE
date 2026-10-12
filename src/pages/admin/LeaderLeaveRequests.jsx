import { useEffect, useState } from "react";
import {
  getLeaveRequests,
  getGroupMembers,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../../services/groupService";
import { apiError } from "../../utils/apiError";

export default function LeaderLeaveRequests({ selectedId, onChanged }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(selectedId ? "" : "PENDING");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [newLeaderUserId, setNewLeaderUserId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeaveRequests({
      status: status || undefined,
      leaderOnly: true,
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
  }, [status, page, reload]);
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
      const data = await getGroupMembers(request.groupId);
      const list = Array.isArray(data) ? data : data.content || [];
      setMembers(
        list.filter(
          (m) =>
            m.status === "ACTIVE" &&
            String(m.userId) !== String(request.userId),
        ),
      );
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
      await approveLeaveRequest(
        selected.id,
        newLeaderUserId ? { newLeaderUserId } : {},
      );
      setSelected(null);
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  const reject = async (request) => {
    if (busy || !window.confirm(`Từ chối yêu cầu của ${request.userFullName}?`))
      return;
    setBusy(true);
    setError("");
    try {
      await rejectLeaveRequest(request.id);
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-h-full space-y-6 bg-[#FBF9F5] p-5 text-[#2C2825] sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-[#E65100]">
            QUẢN LÝ NHÓM
          </span>
          <h1 className="mt-2 text-xl font-black sm:text-2xl">
            Yêu cầu rời nhóm của Leader
          </h1>
          <p className="mt-1 text-sm text-[#8A8178]">
            Theo dõi và xử lý các yêu cầu xin rời nhóm từ trưởng nhóm.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8E2D9] bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>↻</span>
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black">Danh sách yêu cầu</h2>
          <p className="mt-1 text-xs text-[#8A8178]">
            Lọc yêu cầu theo trạng thái xử lý.
          </p>
        </div>

        <select
          aria-label="Lọc trạng thái yêu cầu"
          className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 text-sm outline-none transition focus:border-[#E65100] sm:w-56"
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

      {selectedId && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Thông báo:</strong> Yêu cầu được chọn từ thông báo. Hãy kiểm
          tra trạng thái và trang hiện tại nếu chưa thấy yêu cầu.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <strong>Có lỗi xảy ra.</strong> {error}
        </div>
      )}

      {/* Request list */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#E8E2D9] bg-white p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#E65100]" />
            <p className="text-sm font-semibold text-[#8A8178]">
              Đang tải danh sách yêu cầu...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D0C6] bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
              📭
            </div>
            <h3 className="mt-4 font-bold">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-sm text-[#8A8178]">
              Không tìm thấy yêu cầu phù hợp với trạng thái đã chọn.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isPending = item.status === "PENDING";
            const isApproved = item.status === "APPROVED";
            const isSelected = String(item.id) === String(selectedId);

            return (
              <article
                id={`leave-${item.id}`}
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 ${
                  isSelected
                    ? "border-orange-400 ring-2 ring-orange-100"
                    : "border-[#E8E2D9]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-black text-[#E65100]">
                        {item.groupCode || "Chưa có mã nhóm"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          isPending
                            ? "bg-amber-50 text-amber-700"
                            : isApproved
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isPending
                          ? "● Đang chờ duyệt"
                          : isApproved
                            ? "✓ Đã duyệt"
                            : item.status === "REJECTED"
                              ? "✕ Đã từ chối"
                              : item.status}
                      </span>
                    </div>

                    <h2 className="mt-4 text-base font-black">
                      {item.userFullName || "Sinh viên"}
                    </h2>

                    <p className="mt-1 text-xs text-[#8A8178]">
                      MSSV: {item.studentCode || "Chưa có MSSV"}
                    </p>

                    <div className="mt-4 rounded-xl bg-[#FBF9F5] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8A8178]">
                        Lý do xin rời nhóm
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {item.reason || "Không có lý do"}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-[#8A8178]">
                      Thời gian gửi:{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN")
                        : "Chưa có thông tin"}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openApprove(item)}
                        className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        ✓ Duyệt & đổi Leader
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => reject(item)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4">
        <p className="text-xs text-[#8A8178]">
          Trang <strong className="text-[#2C2825]">{page + 1}</strong>
          {" / "}
          <strong className="text-[#2C2825]">{Math.max(totalPages, 1)}</strong>
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || page === 0}
            onClick={() => {
              setLoading(true);
              setPage((p) => p - 1);
            }}
            className="rounded-xl border border-[#E8E2D9] px-4 py-2.5 text-sm font-bold transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Trang trước
          </button>
          <button
            type="button"
            disabled={loading || page + 1 >= totalPages}
            onClick={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
            className="rounded-xl border border-[#E8E2D9] px-4 py-2.5 text-sm font-bold transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trang sau →
          </button>
        </div>
      </div>

      {/* Approve modal */}
      {selected && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={approve}
            className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  XÁC NHẬN XỬ LÝ
                </span>
                <h2 className="mt-3 text-xl font-black">
                  Duyệt yêu cầu rời nhóm
                </h2>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
                aria-label="Đóng"
                className="rounded-full px-2 text-2xl text-[#8A8178] hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-4">
              <p className="text-xs text-[#8A8178]">Người gửi yêu cầu</p>
              <p className="mt-1 font-bold">{selected.userFullName}</p>
              <p className="mt-2 text-sm text-[#6B635B]">
                {selected.groupCode} · {selected.studentCode || "Chưa có MSSV"}
              </p>
            </div>

            <div>
              <label
                htmlFor="new-leader"
                className="mb-2 block text-sm font-bold"
              >
                Chọn Leader mới
              </label>
              <select
                id="new-leader"
                className="w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sm outline-none focus:border-[#E65100]"
                disabled={busy}
                value={newLeaderUserId}
                onChange={(e) => setNewLeaderUserId(e.target.value)}
              >
                <option value="">Để hệ thống tự chọn Leader mới</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userFullName || m.fullName || m.studentCode || m.userId}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-[#8A8178]">
                Người gửi sẽ rời nhóm sau khi yêu cầu được duyệt. Bạn có thể
                chọn Leader mới hoặc để hệ thống tự chọn.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#E8E2D9] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
                className="rounded-xl border border-[#E8E2D9] px-5 py-3 text-sm font-bold hover:bg-[#FBF9F5] disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
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
