import React, { useState, useEffect } from "react";
import { apiError } from "../../utils/apiError";
import {
  getGroupApplications,
  approveApplication,
  rejectApplication,
  getGroupInvites,
  inviteToGroup,
  revokeInvite,
} from "../../services/groupService";

export default function GroupApplications({ groupId }) {
  const [applications, setApplications] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [dialog, setDialog] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimerRef = React.useRef(null);

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  const fetchData = async () => {
    if (
      !groupId ||
      groupId === "leader-group" ||
      groupId === "temp-group-id" ||
      groupId === "leader-default-id"
    ) {
      setLoading(false);
      return;
    }
    try {
      const [appsRes, invitesRes] = await Promise.all([
        getGroupApplications(groupId).catch(() => []),
        getGroupInvites(groupId).catch(() => []),
      ]);
      const appList = appsRes?.content || appsRes || [];
      setApplications(
        appList.filter((app) => !app.status || app.status === "PENDING"),
      );
      setInvites(invitesRes?.content || invitesRes || []);
    } catch (err) {
      console.error("Lỗi tải danh sách apply và invite:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleApprove = (appId) => {
    setDialog({
      title: "Xác nhận duyệt đơn",
      message:
        "Bạn có chắc chắn muốn duyệt đơn và gửi lời mời tham gia nhóm cho sinh viên này không?",
      confirmText: "Duyệt đơn",
      action: async () => {
        const invite = await approveApplication(appId);

        setApplications((prev) => prev.filter((app) => app.id !== appId));

        if (invite?.id) {
          setInvites((prev) => [
            invite,
            ...prev.filter((item) => item.id !== invite.id),
          ]);
        }

        await fetchData();

        // setDialog({
        //   title: "Thành công",
        //   message:
        //     "Đã gửi lời mời. Sinh viên cần chấp nhận lời mời để vào nhóm.",
        //   confirmText: "OK",
        //   action: null,
        // });
        showToast(
          "Đã gửi lời mời. Sinh viên cần chấp nhận lời mời để vào nhóm.",
          "success",
        );
      },
    });
  };

  const getInviteStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Đang chờ phản hồi",
      ACCEPTED: "Đã chấp nhận",
      WITHDRAWN: "Đã thu hồi",
      REJECTED: "Đã từ chối",
    };

    return statusMap[status] || status || "Không xác định";
  };

  const formatInviteTime = (invite) => {
    const rawTime =
      invite.createdAt ??
      invite.invitedAt ??
      invite.createdDate ??
      invite.created_at;

    if (!rawTime) return "Chưa có thông tin thời gian";

    const date = new Date(rawTime);

    if (Number.isNaN(date.getTime())) {
      return "Chưa có thông tin thời gian";
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    if (!rejectReason.trim() || !rejectingApp) return;

    setProcessing(true);

    try {
      await rejectApplication(rejectingApp.id, {
        reason: rejectReason.trim(),
      });

      setRejectingApp(null);
      setRejectReason("");
      await fetchData();

      showToast("Đã từ chối đơn Apply.", "success");
    } catch (err) {
       showToast(apiError(err, "Từ chối đơn thất bại."), "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    if (inviting || !groupId || !inviteStudentId.trim()) return;

    setDialog({
      title: "Xác nhận gửi lời mời",
      message: `Bạn có muốn gửi lời mời đến sinh viên có MSSV ${inviteStudentId.trim().toUpperCase()} không?`,
      confirmText: "Gửi lời mời",
      action: async () => {
        setInviting(true);

        try {
          await inviteToGroup(groupId, {
            studentCode: inviteStudentId.trim().toUpperCase(),
          });

          setInviteStudentId("");
          await fetchData();

          showToast("Đã gửi lời mời thành công đến sinh viên!", "success");
       } catch (err) {
  showToast(apiError(err, "Gửi lời mời thất bại."), "error");
} finally {
  setInviting(false);
}
      },
    });
  };

  const handleRevokeInvite = (inviteId) => {
    setDialog({
      title: "Xác nhận thu hồi lời mời",
      message: "Bạn có chắc chắn muốn thu hồi lời mời này không?",
      confirmText: "Thu hồi",
      danger: true,
      action: async () => {
        await revokeInvite(inviteId);
        await fetchData();

        showToast("Đã thu hồi lời mời.", "success");
      },
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-xs text-[#6B635B]">
        Đang tải danh sách ứng tuyển...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {/* 1. Phần Trưởng nhóm gửi lời mời sinh viên vào nhóm */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Mời thành viên vào nhóm bằng MSSV
        </h3>
        <form onSubmit={handleInviteSubmit} className="flex gap-3">
          <input
            name="studentCode"
            aria-label="Mã số sinh viên được mời"
            disabled={inviting}
            type="text"
            value={inviteStudentId}
            onChange={(e) => setInviteStudentId(e.target.value)}
            placeholder="Vui lòng nhập MSSV"
            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            required
          />
          <button
            type="submit"
            disabled={inviting || !groupId || !inviteStudentId.trim()}
            className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315]"
          >
            {inviting ? "Đang gửi..." : "Gửi lời mời"}
          </button>
        </form>

        {invites.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-[#6B635B] mb-2">
              Các lời mời đã gửi:
            </p>
            <div className="space-y-2">
              {invites.map((inv) => {
                // Bóc tách linh hoạt các trường thông tin định danh từ backend
                const studentIdentifier =
                  inv.student?.studentCode ||
                  inv.studentCode ||
                  inv.email ||
                  inv.studentEmail ||
                  inv.userEmail ||
                  inv.userId ||
                  inv.student?.email ||
                  inv.student?.studentCode ||
                  "Không rõ MSSV";

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-4 text-xs transition hover:border-[#D9B59F] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#6B635B]">MSSV:</span>
                        <strong className="text-[#2C2825]">
                          {studentIdentifier}
                        </strong>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            inv.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : inv.status === "ACCEPTED"
                                ? "bg-emerald-50 text-emerald-700"
                                : inv.status === "WITHDRAWN"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-red-50 text-red-700"
                          }`}
                        >
                          {getInviteStatusLabel(inv.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[#81776E]">
                        <span>Thời gian gửi:</span>
                        <span className="font-medium text-[#514940]">
                          {formatInviteTime(inv)}
                        </span>
                      </div>
                    </div>

                    {inv.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="shrink-0 self-start rounded-lg border border-red-200 bg-white px-3 py-2 font-bold text-red-600 transition hover:bg-red-50 sm:self-center"
                      >
                        Thu hồi lời mời
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* 2. Danh sách đơn Apply chờ xét duyệt */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Danh sách đơn Apply chờ xét duyệt ({applications.length})
        </h3>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => {
              const studentInfo = app.student || app.user || app;
              const fullName =
                studentInfo.fullName ||
                studentInfo.name ||
                app.studentName ||
                "Sinh viên";
              const emailOrCode =
                studentInfo.email ||
                studentInfo.studentCode ||
                app.studentEmail ||
                app.userEmail ||
                app.userId;
              const skills =
                studentInfo.skills || app.skills || "Chưa cập nhật";

              return (
                <div
                  key={app.id}
                  className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-[#2C2825]">
                        {fullName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-orange-50 text-[#E65100] font-bold rounded-md text-[10px]">
                        MSSV/Email: {emailOrCode}
                      </span>
                    </div>
                    <div className="gap-2 pt-2 border-t border-[#E8E2D9]/60 text-[11px]">
                      <div>
                        <span className="font-bold text-[#6B635B]">
                          Kỹ năng:
                        </span>{" "}
                        <span className="text-[#2C2825]">{skills}</span>
                      </div>
                    </div>
                    {app.message && (
                      <p className="text-[11px] text-[#6B635B] italic">
                        Lời nhắn: "{app.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        handleApprove(app.id, app.student || app.user || app)
                      }
                      className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer hover:bg-emerald-700"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => setRejectingApp(app)}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl cursor-pointer hover:bg-red-100"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">
            Chưa có sinh viên nào nộp đơn apply vào nhóm.
          </p>
        )}
      </div>
      {/* Modal từ chối đơn */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div>
              <h3 className="text-sm font-black text-[#2C2825]">
                Từ chối đơn ứng tuyển
              </h3>
              <p className="text-xs text-[#6B635B]">
                Nhập lý do từ chối để sinh viên được biết.
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
              placeholder="VD: Nhóm đã đủ vị trí chuyên môn..."
              className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-3 text-xs outline-none focus:border-[#E65100]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 text-xs font-bold text-[#6B635B] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#2C2825]/45 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-black text-[#2C2825]">
                {dialog.title}
              </h3>

              <button
                type="button"
                aria-label="Đóng thông báo"
                disabled={processing}
                onClick={() => setDialog(null)}
                className="text-2xl leading-none text-[#6B635B] hover:text-black"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#6B635B]">
              {dialog.message}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              {dialog.action && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setDialog(null)}
                  className="rounded-xl border border-[#E8E2D9] px-4 py-2.5 text-sm font-bold text-[#6B635B] hover:bg-[#F8F6F0]"
                >
                  Hủy bỏ
                </button>
              )}

              <button
                type="button"
                disabled={processing}
                onClick={async () => {
                  if (!dialog.action) {
                    setDialog(null);
                    return;
                  }

                  const action = dialog.action;
                  setProcessing(true);
                  setDialog(null);

                  try {
                    await action();
                  } catch (err) {
                    setDialog({
                      title: "Có lỗi xảy ra",
                      message: apiError(err, "Thao tác thất bại."),
                      confirmText: "OK",
                      action: null,
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
                {processing ? "Đang xử lý..." : dialog.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TOAST THÔNG BÁO */}
{toast && (
  <div
    role="status"
    aria-live="polite"
    className="fixed right-5 top-5 z-10000 w-[calc(100%-2.5rem)] max-w-sm animate-fadeIn"
  >
    <div
      className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
        toast.type === "error"
          ? "border-red-200"
          : "border-emerald-200"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-black ${
          toast.type === "error"
            ? "bg-red-50 text-red-600"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {toast.type === "error" ? "×" : "✓"}
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <p
          className={`text-sm font-black ${
            toast.type === "error"
              ? "text-red-700"
              : "text-emerald-700"
          }`}
        >
          {toast.type === "error" ? "Có lỗi xảy ra" : "Thành công"}
        </p>

        <p className="mt-1 wrap-break-words text-sm leading-5 text-[#6B635B]">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setToast(null)}
        aria-label="Đóng thông báo"
        className="rounded-lg px-2 text-lg text-gray-400 hover:bg-gray-100"
      >
        ×
      </button>
    </div>
  </div>
)}
    </div>
  );
}
