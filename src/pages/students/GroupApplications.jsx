import React, { useState, useEffect } from "react";
import { apiError } from "../../utils/apiError";
import {
  getGroupRequests,
  acceptRequest,
  rejectRequest,
  inviteToGroup,
  withdrawRequest,
  getApplicationVotes,
} from "../../services/groupService";

export default function GroupApplications({
  groupId,
  isLeader = false,
  currentUserId,
}) {
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
    if (!groupId || groupId.startsWith("temp-") || groupId.startsWith("leader-")) {
      setLoading(false);
      return;
    }
    try {
      // Gọi đúng API lấy danh sách requests của nhóm
      const res = await getGroupRequests(groupId);
      const reqList = Array.isArray(res) ? res : res?.content || [];
      
      // Mở rộng bộ lọc để nhận diện chính xác đơn xin vào nhóm từ sinh viên khác
      const pendingApps = reqList.filter(
        (item) => 
          (!item.status || item.status === "PENDING") && 
          (item.type === "APPLICATION" || item.type === "APPLY" || item.type === "APPLIED" || !item.type)
      );
      setApplications(pendingApps);

      const pendingInvites = reqList.filter(
        (item) => (!item.status || item.status === "PENDING") && (item.type === "INVITATION" || item.type === "INVITE")
      );
      setInvites(pendingInvites);
    } catch (err) {
      console.error("Lỗi tải danh sách request:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, isLeader]);

  const handleApprove = (reqId) => {
    if (!isLeader) return;
    setDialog({
      title: "Xác nhận duyệt đơn",
      message: "Bạn có chắc chắn muốn duyệt đơn ứng tuyển của sinh viên này không?",
      confirmText: "Duyệt đơn",
      action: async () => {
        await acceptRequest(reqId);
        await fetchData();
        showToast("Đã duyệt đơn và thêm sinh viên vào nhóm thành công!", "success");
      },
    });
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!isLeader || !rejectReason.trim() || !rejectingApp) return;
    setProcessing(true);
    try {
      await rejectRequest(rejectingApp.id, { reason: rejectReason.trim() });
      setRejectingApp(null);
      setRejectReason("");
      await fetchData();
      showToast("Đã từ chối đơn ứng tuyển.", "success");
    } catch (err) {
      showToast(apiError(err, "Từ chối đơn thất bại."), "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!isLeader || inviting || !groupId || !inviteStudentId.trim()) return;

    setDialog({
      title: "Xác nhận gửi lời mời",
      message: `Gửi lời mời đến sinh viên MSSV ${inviteStudentId.trim().toUpperCase()}?`,
      confirmText: "Gửi lời mời",
      action: async () => {
        setInviting(true);
        try {
          await inviteToGroup(groupId, { studentCode: inviteStudentId.trim().toUpperCase() });
          setInviteStudentId("");
          await fetchData();
          showToast("Đã gửi lời mời thành công!", "success");
        } catch (err) {
          showToast(apiError(err, "Gửi lời mời thất bại."), "error");
        } finally {
          setInviting(false);
        }
      },
    });
  };

  const handleRevokeInvite = (requestId) => {
    if (!isLeader) return;
    setDialog({
      title: "Xác nhận thu hồi lời mời",
      message: "Bạn có chắc chắn muốn thu hồi lời mời này không?",
      confirmText: "Thu hồi",
      danger: true,
      action: async () => {
        await withdrawRequest(requestId);
        await fetchData();
        showToast("Đã thu hồi lời mời.", "success");
      },
    });
  };

  if (loading) {
    return <div className="p-6 text-xs text-[#6B635B]">Đang tải danh sách ứng tuyển...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {/* 1. MỜI THÀNH VIÊN VÀO NHÓM (CÓ PHÂN QUYỀN LEADER / MEMBER) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">Mời thành viên vào nhóm bằng MSSV</h3>
          {!isLeader && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
              Chỉ Nhóm Trưởng mới có quyền mời
            </span>
          )}
        </div>

        <form onSubmit={handleInviteSubmit} className="flex gap-3">
          <input
            disabled={!isLeader || inviting}
            type="text"
            value={inviteStudentId}
            onChange={(e) => setInviteStudentId(e.target.value)}
            placeholder={isLeader ? "Vui lòng nhập MSSV" : "Chỉ Trưởng nhóm mới được phép mời thành viên"}
            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100] disabled:opacity-60 disabled:cursor-not-allowed"
            required={isLeader}
          />
          <button 
            type="submit" 
            disabled={!isLeader || inviting || !inviteStudentId.trim()} 
            className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? "Đang gửi..." : "Gửi lời mời"}
          </button>
        </form>
        <p className="text-[11px] text-[#6B635B] italic">
          * Lưu ý: Chức năng này chỉ thực hiện do quyền của Nhóm Trưởng.
        </p>

        {invites.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-bold text-[#6B635B]">Các lời mời đang chờ:</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center bg-[#FBF9F5] p-3 rounded-xl border border-[#E8E2D9] text-xs">
                Thành viên:<span>{inv.fullName}</span>
                <span>MSSV: <strong>{inv.studentCode || inv.userEmail}</strong></span>
                {isLeader && (
                  <button onClick={() => handleRevokeInvite(inv.id)} className="text-red-600 font-bold hover:underline">Thu hồi</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

     {/* DANH SÁCH ĐƠN APPLY CHỜ XÉT DUYỆT */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Danh sách đơn Apply chờ xét duyệt ({applications.length})
          </h3>
          <span className="text-[11px] text-[#6B635B] font-medium">
            {isLeader ? "Bạn có quyền duyệt hoặc từ chối đơn" : "Bạn đang xem ở chế độ Thành viên"}
          </span>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => {
              // Lấy đúng dữ liệu từ object student và format ngày giờ tạo
              const student = app.student || {};
              const studentName = student.fullName || app.studentName || app.userFullName || "Sinh viên ứng tuyển";
              const studentCode = student.studentCode || app.studentCode || app.userCode || "N/A";
              const studentEmail = student.email || app.email || app.userEmail || "N/A";
              
              // Format ngày giờ tạo createdAt từ chuẩn ISO sang định dạng dễ đọc VN
              let formattedDate = "N/A";
              if (app.createdAt) {
                const dateObj = new Date(app.createdAt);
                formattedDate = dateObj.toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
              }

              return (
                <div key={app.id} className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-black text-sm text-[#2C2825]">
                      {studentName}
                    </p>
                    <p className="text-[11px] text-[#6B635B]">
                      MSSV: <strong className="text-[#2C2825]">{studentCode}</strong> | Gmail: <strong className="text-[#2C2825]">{studentEmail}</strong>
                    </p>
                    <p className="text-[11px] text-[#6B635B]">
                      Thời gian gửi: <strong className="text-[#2C2825]">{formattedDate}</strong>
                    </p>
                    <p className="text-[11px] text-[#6B635B] bg-white p-2.5 rounded-xl border border-[#E8E2D9] mt-1">
                      <strong>Hồ sơ năng lực / Lời nhắn:</strong> {app.message || student.skills || student.strengths || "Không có"}
                    </p>
                  </div>

                  {/* Chỉ Leader mới có nút Duyệt / Từ chối */}
                  {isLeader ? (
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleApprove(app.id)} 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Duyệt
                      </button>
                      <button 
                        onClick={() => setRejectingApp(app)} 
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition cursor-pointer"
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-[11px] shrink-0">
                      Chờ Nhóm Trưởng xử lý
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">Chưa có sinh viên nào nộp đơn apply vào nhóm.</p>
        )}
      </div>

      {/* Modal từ chối đơn dành cho Leader */}
      {rejectingApp && isLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleRejectSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-[#2C2825]">Từ chối đơn ứng tuyển</h3>
            <textarea 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)} 
              rows={3} 
              required 
              placeholder="Nhập lý do từ chối..." 
              className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-3 text-xs outline-none focus:border-red-500" 
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingApp(null)} className="px-4 py-2 text-xs font-bold cursor-pointer">Hủy</button>
              <button type="submit" disabled={processing} className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl cursor-pointer">Xác nhận từ chối</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHUNG */}
      {dialog && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#2C2825]/50 p-4" onClick={() => setDialog(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-7 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-[#2C2825]">{dialog.title}</h3>
            <p className="text-xs text-[#6B635B] leading-relaxed">{dialog.message}</p>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setDialog(null)} className="rounded-xl border border-[#E8E2D9] px-5 py-2.5 text-xs font-bold text-[#6B635B] cursor-pointer">Hủy</button>
              <button type="button" onClick={async () => { const action = dialog.action; setDialog(null); await action(); }} className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white cursor-pointer">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}