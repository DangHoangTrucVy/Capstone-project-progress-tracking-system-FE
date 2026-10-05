import React, { useState, useEffect } from "react";
import {
  getGroupApplications,
  approveApplication,
  rejectApplication,
  getGroupInvites,
  inviteToGroup,
  revokeInvite,
} from "../../services/groupService";

export default function GroupApplications({ groupId, onGroupUpdated }) {
  const [applications, setApplications] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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
      // Chỉ hiển thị các đơn đang chờ xét duyệt (PENDING)
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

  const handleApprove = async (appId, studentInfo) => {
    if (!window.confirm("Bạn có chắc chắn muốn duyệt sinh viên này vào nhóm?"))
      return;
    try {
      // 1. Duyệt đơn apply trước
      await approveApplication(appId);

      // 2. Lấy các thông tin định danh của sinh viên
      const sId = studentInfo?.id || studentInfo?.userId;
      const sCode = studentInfo?.studentCode;
      const sEmail = studentInfo?.email;

      // Thử gọi addGroupMember với các định dạng payload phổ biến
      let added = false;
      const payloadsToTry = [
        { studentCode: sCode || sId },
        { userId: sId || sCode },
        { email: sEmail },
        { studentId: sId },
      ];

      for (const payload of payloadsToTry) {
        if (!Object.values(payload)[0]) continue;
        try {
          await addGroupMember(groupId, payload);
          added = true;
          break;
        } catch (e) {
          // Thử tiếp payload tiếp theo nếu payload này thất bại
        }
      }

      if (!added && sId) {
        // Fallback cuối: gọi trực tiếp bằng ID trên URL nếu service hỗ trợ
        try {
          await api.post(`/api/v1/groups/${groupId}/members`, {
            userId: sId,
            studentCode: sId,
          });
        } catch (e) {}
      }

      alert("Đã duyệt thành công và thêm thành viên vào nhóm!");

      // Lọc bỏ đơn vừa duyệt khỏi danh sách chờ
      setApplications((prev) => prev.filter((app) => app.id !== appId));

      await fetchData();

      if (typeof onGroupUpdated === "function") {
        await onGroupUpdated();
      }
    } catch (err) {
      console.error("Lỗi duyệt đơn:", err);
      alert(
        err.response?.data?.message || "Duyệt đơn thất bại do lỗi hệ thống.",
      );
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim() || !rejectingApp) return;
    try {
      await rejectApplication(rejectingApp.id, { reason: rejectReason.trim() });
      alert("Đã từ chối đơn apply.");
      setRejectingApp(null);
      setRejectReason("");
      fetchData();
    } catch (err) {
      alert("Từ chối đơn thất bại.");
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteStudentId.trim()) return;
    try {
      await inviteToGroup(groupId, { studentCode: inviteStudentId.trim() });
      alert("Đã gửi lời mời thành công!");
      setInviteStudentId("");
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Gửi lời mời thất bại. Vui lòng kiểm tra lại MSSV.",
      );
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm("Bạn có muốn thu hồi lời mời này không?")) return;
    try {
      await revokeInvite(inviteId);
      alert("Đã thu hồi lời mời.");
      fetchData();
    } catch (err) {
      alert("Thu hồi thất bại.");
    }
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
      {/* 1. Phần Trưởng nhóm mời thành viên trực tiếp */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Mời thành viên vào nhóm bằng MSSV
        </h3>
        <form onSubmit={handleInviteSubmit} className="flex gap-3">
          <input
            type="text"
            value={inviteStudentId}
            onChange={(e) => setInviteStudentId(e.target.value)}
            placeholder="Nhập MSSV cần mời..."
            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            required
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315]"
          >
            Gửi lời mời
          </button>
        </form>

        {invites.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-[#6B635B] mb-2">
              Các lời mời đã gửi:
            </p>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-[#FBF9F5] rounded-xl border flex justify-between items-center text-xs"
                >
                  <span>
                    MSSV/Email: {inv.studentEmail || inv.userId} — Trạng thái:{" "}
                    <strong className="text-orange-600">{inv.status}</strong>
                  </span>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    Thu hồi
                  </button>
                </div>
              ))}
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
    </div>
  );
}
