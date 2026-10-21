import React, { useState, useEffect } from "react";
import { apiError } from "../../utils/apiError";
import {
  getGroupRequests,
  acceptRequest,
  rejectRequest,
  getGroupInvites,
  inviteToGroup,
  withdrawRequest,
  getApplicationVotes,
  voteOnApplication,
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

  const [applicationVotes, setApplicationVotes] = useState({});
  const [voteChoices, setVoteChoices] = useState({});
  const [voteComments, setVoteComments] = useState({});
  const [votingAppId, setVotingAppId] = useState(null);

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
      const res = await getGroupRequests(groupId);
      const reqList = Array.isArray(res) ? res : res?.content || [];
      
      const pendingApps = reqList.filter(
        (item) => (!item.status || item.status === "PENDING") && item.type === "APPLICATION"
      );
      setApplications(pendingApps);

      const pendingInvites = reqList.filter(
        (item) => (!item.status || item.status === "PENDING") && item.type === "INVITATION"
      );
      setInvites(pendingInvites);

      const voteResults = await Promise.all(
        pendingApps.map(async (app) => {
          try {
            const result = await getApplicationVotes(app.id);
            return [app.id, Array.isArray(result) ? result : result?.content || []];
          } catch {
            return [app.id, []];
          }
        })
      );
      setApplicationVotes(Object.fromEntries(voteResults));
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
    if (!rejectReason.trim() || !rejectingApp) return;
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
    if (inviting || !groupId || !inviteStudentId.trim()) return;

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
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Mời thành viên vào nhóm bằng MSSV</h3>
        <form onSubmit={handleInviteSubmit} className="flex gap-3">
          <input
            disabled={inviting}
            type="text"
            value={inviteStudentId}
            onChange={(e) => setInviteStudentId(e.target.value)}
            placeholder="Vui lòng nhập MSSV"
            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            required
          />
          <button type="submit" disabled={inviting || !inviteStudentId.trim()} className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315]">
            {inviting ? "Đang gửi..." : "Gửi lời mời"}
          </button>
        </form>

        {invites.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-bold text-[#6B635B]">Các lời mời đang chờ:</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center bg-[#FBF9F5] p-3 rounded-xl border border-[#E8E2D9] text-xs">
                <span>MSSV: <strong>{inv.studentCode || inv.userEmail}</strong></span>
                <button onClick={() => handleRevokeInvite(inv.id)} className="text-red-600 font-bold">Thu hồi</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách đơn Apply chờ xét duyệt ({applications.length})</h3>
        {applications.length > 0 ? (
          applications.map((app) => (
            <div key={app.id} className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs">
              <div>
                <p className="font-black text-sm">{app.studentName || app.userFullName || "Sinh viên"}</p>
                <p className="text-[11px] text-[#6B635B]">Lời nhắn: {app.message || "Không có"}</p>
              </div>
              {isLeader && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(app.id)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl">Duyệt</button>
                  <button onClick={() => setRejectingApp(app)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl">Từ chối</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-[#6B635B] italic">Chưa có sinh viên nào nộp đơn apply.</p>
        )}
      </div>

      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleRejectSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-[#2C2825]">Từ chối đơn ứng tuyển</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} required placeholder="Nhập lý do từ chối..." className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] p-3 text-xs" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingApp(null)} className="px-4 py-2 text-xs font-bold">Hủy</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl">Xác nhận</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}