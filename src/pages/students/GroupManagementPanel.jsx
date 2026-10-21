import { useState, useEffect, useCallback } from "react";
import { apiError } from "../../utils/apiError";
import {
  getGroupById,
  lockGroup,
  unlockGroup,
  submitRoster,
  requestLeaveGroup,
  getGroupLeaveRequests,
  leaderDecisionLeaveRequest,
} from "../../services/groupService";

export default function GroupManagementPanel({
  groupData,
  isLeader,
  currentUserId,
  onGroupUpdated,
}) {
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dialogInput, setDialogInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [groupStatusNote, setGroupStatusNote] = useState({
    type: "unlocked",
    message: "Nhóm hiện chưa khóa.",
  });

  const [latestGroup, setLatestGroup] = useState(groupData);

  const isLocked = latestGroup?.locked === true;

  const rosterStatus = String(latestGroup?.rosterStatus || "").toUpperCase();

  const isFinalized = ["APPROVED"].includes(rosterStatus);

  const isPendingReview = ["SUBMITTED", "PENDING", "PENDING_REVIEW"].includes(
    rosterStatus,
  );

  const isRejected = ["REJECTED", "DECLINED"].includes(rosterStatus);

  const refreshGroupStatus = useCallback(async () => {
    if (!groupData?.id) return;

    try {
      const latest = await getGroupById(groupData.id);
      setLatestGroup(latest);
    } catch (err) {
      console.error("Không tải được trạng thái nhóm:", err);
    }
  }, [groupData?.id]);

  useEffect(() => {
    refreshGroupStatus();
  }, [refreshGroupStatus]);

  const hasPendingRequest = leaveRequests.some(
    (r) => r.status === "PENDING" && String(r.userId) === String(currentUserId),
  );

  const fetchLeaveRequests = useCallback(async () => {
    if (!groupData?.id) return;
    try {
      const res = await getGroupLeaveRequests(groupData.id);
      setLeaveRequests(res?.content || res || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không tải được yêu cầu rời nhóm.",
      );
    }
  }, [groupData]);

  useEffect(() => {
    const initial = setTimeout(fetchLeaveRequests, 0);
    const timer = setInterval(fetchLeaveRequests, 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [fetchLeaveRequests]);

  // Leader khóa nhóm (Locked)
  const handleLockGroup = () => {
    if (isFinalized) {
      setNotice({
        type: "error",
        message: "Nhóm đã chốt danh sách, không thể khóa nhóm nữa.",
      });
      return;
    }

    setDialog({
      title: "Xác nhận khóa nhóm",
      message:
        "Bạn có chắc chắn muốn khóa nhóm? Thành viên sẽ không thể tự ý rời nhóm nếu không được duyệt.",
      confirmText: "Khóa nhóm",
      danger: true,
      action: async () => {
        await lockGroup(groupData.id);
        await refreshGroupStatus();

        setGroupStatusNote({
          type: "locked",
          message: "Nhóm đã khóa.",
        });

        if (onGroupUpdated) await onGroupUpdated();

        setNotice({
          type: "success",
          message: "Đã khóa nhóm thành công!",
        });
      },
    });
  };

  // Leader mở khóa nhóm (Unlock)
  const handleUnlockGroup = () => {
    if (isFinalized) {
      setNotice({
        type: "error",
        message: "Nhóm đã chốt danh sách, không thể mở khóa nhóm nữa.",
      });
      return;
    }

    setDialog({
      title: "Xác nhận mở khóa nhóm",
      message: "Bạn có muốn mở khóa nhóm không?",
      confirmText: "Mở khóa",
      action: async () => {
        await unlockGroup(groupData.id);
        await refreshGroupStatus();

        setGroupStatusNote({
          type: "unlocked",
          message: "Nhóm hiện chưa khóa.",
        });

        if (onGroupUpdated) await onGroupUpdated();

        setNotice({
          type: "success",
          message: "Đã mở khóa nhóm thành công!",
        });
      },
    });
  };

  // Leader chốt danh sách nhóm
  const handleFinalizeGroup = () => {
    if (isFinalized) {
      setNotice({
        type: "error",
        message: "Danh sách đã được Admin duyệt chính thức.",
      });
      return;
    }

    if (isPendingReview) {
      setNotice({
        type: "error",
        message: "Danh sách đang chờ Admin duyệt.",
      });
      return;
    }

    setDialog({
      title: "Xác nhận chốt danh sách",
      message:
        "Bạn có chắc chắn muốn gửi danh sách thành viên lên Admin duyệt? Sau khi gửi, nhóm sẽ bị khóa trong thời gian chờ duyệt.",
      confirmText: "Chốt danh sách",
      danger: true,
      action: async () => {
        await submitRoster(groupData.id);
        await lockGroup(groupData.id);
        await refreshGroupStatus();

        if (onGroupUpdated) {
          await onGroupUpdated();
        }

        setNotice({
          type: "success",
          message: "Đã gửi danh sách lên Admin. Nhóm đang chờ duyệt.",
        });
      },
    });
  };

  // Thành viên gửi yêu cầu xin rời nhóm
  const handleRequestLeave = async (e) => {
    e.preventDefault();

    if (
      loading ||
      hasPendingRequest ||
      !groupData?.id ||
      (isLeader && !leaveReason.trim()) ||
      leaveReason.trim().length > 1000
    ) {
      return;
    }

    setLoading(true);

    try {
      await requestLeaveGroup(groupData.id, {
        reason: leaveReason.trim(),
      });

      setLeaveReason("");
      await fetchLeaveRequests();

      setNotice({
        type: "success",
        message: isLeader
          ? "Đã gửi yêu cầu tới Admin. Bạn vẫn là Leader trong lúc chờ duyệt."
          : "Đã gửi yêu cầu xin rời nhóm tới Trưởng nhóm thành công!",
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  // Leader duyệt đơn rời nhóm (dùng leaderDecisionLeaveRequest theo chuẩn Swagger)
  const handleApproveLeave = (requestId) => {
    setDialog({
      title: "Xác nhận cho phép rời nhóm",
      message: "Bạn có đồng ý cho phép thành viên này rời nhóm không?",
      confirmText: "Cho phép",
      action: async () => {
        await leaderDecisionLeaveRequest(requestId, {
          approved: true,
        });

        await fetchLeaveRequests();
        if (onGroupUpdated) await onGroupUpdated();

        setNotice({
          type: "success",
          message: "Đã chấp thuận cho thành viên rời nhóm.",
        });
      },
    });
  };

  // Leader từ chối đơn rời nhóm (dùng leaderDecisionLeaveRequest theo chuẩn Swagger)
  const handleRejectLeave = (requestId) => {
    setDialogInput("");

    setDialog({
      title: "Từ chối yêu cầu rời nhóm",
      message: "Vui lòng nhập lý do từ chối yêu cầu của thành viên.",
      confirmText: "Xác nhận từ chối",
      danger: true,
      input: true,
      action: async (reason) => {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
          throw new Error("Vui lòng nhập lý do từ chối.");
        }

        await leaderDecisionLeaveRequest(requestId, {
          approved: false,
          reason: trimmedReason,
        });

        await fetchLeaveRequests();

        setNotice({
          type: "success",
          message: "Đã từ chối đơn xin rời nhóm.",
        });
      },
    });
  };

  return (
    <div className="space-y-6 text-[#2C2825]">
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {hasPendingRequest && (
        <p role="status" className="text-amber-700">
          Bạn có yêu cầu rời nhóm đang chờ xử lý.
        </p>
      )}

      {/* 1. Khu vực điều khiển trạng thái dành cho Leader */}
      {isLeader && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Quản lý trạng thái nhóm
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleLockGroup}
              disabled={isFinalized || isPendingReview || isLocked}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔒 Khóa nhóm
            </button>
            <button
              type="button"
              onClick={handleUnlockGroup}
              disabled={isFinalized || isPendingReview || !isLocked}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#2C2825] text-xs font-bold rounded-xl cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔓 Mở khóa
            </button>
            <button
              type="button"
              onClick={handleFinalizeGroup}
              disabled={isFinalized || isPendingReview || isLocked}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🏁 Chốt danh sách
            </button>
          </div>
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              isFinalized
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : isLocked
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {isFinalized
              ? "🏁 Danh sách đã được Admin duyệt chính thức. Không thể khóa hoặc mở khóa nhóm nữa."
              : isPendingReview
                ? "⏳ Danh sách đang chờ Admin duyệt. Các thao tác khóa/mở khóa và chỉnh sửa danh sách tạm thời bị vô hiệu hóa."
                : isRejected
                  ? "⚠️ Danh sách bị từ chối. Nhóm đã được mở khóa để bổ sung thành viên và gửi duyệt lại."
                  : isLocked
                    ? "🔒 Nhóm đã khóa."
                    : "🔓 Nhóm hiện chưa khóa."}
          </div>
        </div>
      )}

      {/* Lịch sử yêu cầu rời nhóm */}
      {groupData?.id && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Lịch sử yêu cầu rời nhóm ({leaveRequests.length})
          </h3>

          {leaveRequests.length === 0 ? (
            <p className="text-sm text-[#8A8178]">
              Chưa có yêu cầu rời nhóm nào.
            </p>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req) => {
                const status = String(
                  req.status || req.state || "",
                ).toUpperCase();

                const isPending = ["PENDING", "WAITING", "SUBMITTED"].includes(
                  status,
                );

                const isApproved = ["APPROVED", "ACCEPTED"].includes(status);

                const isRejected = ["REJECTED", "DECLINED"].includes(status);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-[#E8E2D9] bg-[#FBF9F5] space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#2C2825]">
                          {req.userFullName ||
                            req.student?.fullName ||
                            req.studentId ||
                            "Sinh viên"}
                        </p>

                        <p className="text-xs text-[#6B635B]">
                          Lý do: {req.reason || "Không có lý do"}
                        </p>
                        <p className="text-xs">
                          {req.leaderRequest
                            ? "Yêu cầu của Leader — Admin xử lý"
                            : "Yêu cầu của thành viên"}
                        </p>

                        {req.createdAt && (
                          <p className="text-xs text-[#8A8178]">
                            Ngày gửi:{" "}
                            {new Date(req.createdAt).toLocaleString("vi-VN")}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          isPending
                            ? "bg-amber-100 text-amber-700"
                            : isApproved
                              ? "bg-emerald-100 text-emerald-700"
                              : isRejected
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isPending
                          ? "Đang chờ duyệt"
                          : isApproved
                            ? "Đã chấp nhận"
                            : isRejected
                              ? "Đã từ chối"
                              : status || "Chưa xác định"}
                      </span>
                    </div>

                    {isLeader && isPending && !req.leaderRequest && (
                      <div className="flex gap-2 border-t border-[#E8E2D9] pt-3">
                        <button
                          type="button"
                          onClick={() => handleApproveLeave(req.id)}
                          className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cho phép
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectLeave(req.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Form xin rời nhóm */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Gửi yêu cầu xin rời nhóm
          </h3>
          <p className="text-[11px] text-[#6B635B]">
            {isLeader
              ? "Yêu cầu của Leader được chuyển tới Admin. Bạn vẫn là Leader cho tới khi Admin duyệt yêu cầu."
              : "Yêu cầu rời nhóm được gửi tới Trưởng nhóm khi nhóm chưa khóa."}
          </p>
        </div>
        <form onSubmit={handleRequestLeave} className="space-y-3">
          <textarea
            rows={3}
            name="reason"
            aria-label="Lý do xin rời nhóm"
            maxLength={1000}
            disabled={loading || hasPendingRequest || !groupData?.id}
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="Nhập lý do bạn muốn rời nhóm..."
            className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            required={isLeader}
          />
          <button
            type="submit"
            disabled={
              loading ||
              hasPendingRequest ||
              !groupData?.id ||
              (isLeader && !leaveReason.trim())
            }
            className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi đơn xin rời nhóm"}
          </button>
        </form>

        {dialog && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-black text-[#2C2825]">
                  {dialog.title}
                </h3>

                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => {
                    setDialog(null);
                    setDialogInput("");
                  }}
                  className="text-2xl leading-none text-[#6B635B] hover:text-black"
                >
                  ×
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#6B635B]">
                {dialog.message}
              </p>

              {dialog.input && (
                <textarea
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Nhập lý do từ chối..."
                  className="mt-4 w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-3 text-sm outline-none focus:border-[#E65100]"
                />
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setDialog(null);
                    setDialogInput("");
                  }}
                  className="rounded-xl border border-[#E8E2D9] px-4 py-2.5 text-sm font-bold text-[#6B635B] hover:bg-[#F8F6F0]"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  disabled={processing || (dialog.input && !dialogInput.trim())}
                  onClick={async () => {
                    if (processing) return;

                    setProcessing(true);
                    try {
                      await dialog.action(dialogInput);
                      setDialog(null);
                      setDialogInput("");
                    } catch (err) {
                      setDialog(null);
                      setNotice({
                        type: "error",
                        message: apiError(err),
                      });
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                    dialog.danger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#E65100] hover:bg-[#D84315]"
                  }`}
                >
                  {processing
                    ? "Đang xử lý..."
                    : dialog.confirmText || "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4">
            <div
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-black text-[#2C2825]">
                  {notice.type === "success" ? "Thành công" : "Có lỗi xảy ra"}
                </h3>

                <button
                  type="button"
                  aria-label="Đóng thông báo"
                  onClick={() => setNotice(null)}
                  className="text-2xl leading-none text-[#6B635B] hover:text-black"
                >
                  ×
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#6B635B]">
                {notice.message}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-xl bg-[#E65100] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D84315]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}