import React, { useState, useEffect } from "react";
import { 
  getGroupRequests, 
  inviteToGroup, 
  acceptRequest, 
  rejectRequest 
} from "../../services/groupService";
import { 
  lockRoom, 
  unlockRoom, 
  requestFinalizeRoom, 
  withdrawFinalizeRequest 
} from "../../services/roomService";

export default function Overview({ roomData, isLeader, onRefresh }) {
  const members = roomData?.members || [];
  const count = members.length;
  const minSize = roomData?.minSize || 3;
  const maxSize = roomData?.maxSize || 5;
  const roomId = roomData?.id || roomData?.roomId;

  const isFinalized = Boolean(
    roomData?.finalized || 
    roomData?.status === "FINALIZED" || 
    roomData?.groupCode
  );

  const isLocked = roomData?.locked;
  const lockedBy = roomData?.lockedByName || roomData?.lockedBy || "Trưởng nhóm";
  const hasFinalizeRequest = roomData?.finalizeRequested;

  // State quản lý đơn và mời thành viên
  const [applications, setApplications] = useState([]);
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!roomId || roomId.toString().startsWith("temp-")) return;
      try {
        const res = await getGroupRequests(roomId);
        const reqList = Array.isArray(res) ? res : res?.content || [];
        const pendingApps = reqList.filter(
          (item) => (!item.status || item.status === "PENDING") && 
          (item.type === "APPLICATION" || item.type === "APPLY" || !item.type)
        );
        setApplications(pendingApps);
      } catch (err) {
        console.error("Lỗi tải đơn ứng tuyển:", err);
      }
    };
    if (isLeader) {
      fetchRequests();
    }
  }, [roomId, isLeader]);

  const handleToggleLock = async () => {
    if (isFinalized) return;
    setLoadingAction(true);
    try {
      if (isLocked) {
        await unlockRoom(roomId);
        alert("Đã mở khóa phòng thành công!");
      } else {
        await lockRoom(roomId);
        alert("Đã khóa phòng thành công!");
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Thao tác khóa/mở phòng thất bại.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFinalizeRequest = async () => {
    if (isFinalized) return;
    setLoadingAction(true);
    try {
      if (hasFinalizeRequest) {
        await withdrawFinalizeRequest(roomId);
        alert("Đã hủy yêu cầu báo chốt.");
      } else {
        await requestFinalizeRoom(roomId);
        alert("Đã gửi báo chốt phòng thành công đến Giảng viên!");
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác báo chốt thất bại.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteStudentId.trim() || inviting) return;
    setInviting(true);
    try {
      await inviteToGroup(roomId, { studentCode: inviteStudentId.trim().toUpperCase() });
      alert(`Đã gửi lời mời thành công đến sinh viên ${inviteStudentId.toUpperCase()}!`);
      setInviteStudentId("");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Gửi lời mời thất bại. Kiểm tra lại MSSV.");
    } finally {
      setInviting(false);
    }
  };

  const handleApproveApp = async (appId) => {
    try {
      await acceptRequest(appId);
      alert("Đã duyệt đơn và thêm sinh viên vào phòng!");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Không thể duyệt đơn.");
    }
  };

  const handleRejectApp = async (appId) => {
    const reason = prompt("Nhập lý do từ chối đơn ứng tuyển:");
    if (reason === null) return;
    try {
      await rejectRequest(appId, { reason: reason || "Từ chối" });
      alert("Đã từ chối đơn.");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Thực hiện thất bại.");
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans text-[#2C2825]">
      
      {/* BANNER THÔNG BÁO TRẠNG THÁI KHÓA */}
      {isLocked && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="font-black text-xs">Phòng đang ở trạng thái KHÓA!</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Phòng đã được khóa bởi <strong>{lockedBy}</strong>. Người ngoài không thể tự do tham gia.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-600 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider">
            Đang khóa
          </span>
        </div>
      )}

      {/* BANNER CHỐT NHÓM */}
      {isFinalized && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg">✨</span>
            <div>
              <p className="font-black text-xs">Phòng đã được Giảng viên duyệt chốt thành Nhóm chính thức!</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Mã định danh nhóm: <strong className="text-emerald-700">{roomData?.groupCode}</strong>.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider">
            Đã chốt nhóm
          </span>
        </div>
      )}

      {/* KHỐI 1: HEADER THÔNG TIN PHÒNG */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-center flex-wrap gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black rounded-lg uppercase">
                {roomData?.groupCode ? "Nhóm Đồ Án Chính Thức" : "Phòng Thảo Luận"}
              </span>
              {isLeader && (
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg">
                  Trưởng nhóm
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-[#E65100] tracking-tight">
              {roomData?.groupCode ? `Mã nhóm: ${roomData.groupCode}` : `Phòng: ${roomData?.name}`}
            </h1>
            <p className="text-[#6B635B]">
              Chuyên ngành đào tạo: <strong className="text-[#2C2825]">{roomData?.majorCode || roomData?.major || "Công nghệ thông tin"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-2xl border font-bold flex items-center gap-2 shadow-2xs ${count >= minSize ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              <span>👥</span>
              <span>Sĩ số: {count}/{maxSize} (Tối thiểu: {minSize})</span>
            </div>
          </div>
        </div>

        {/* LƯỚI THÀNH VIÊN TRONG PHÒNG */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B] flex items-center gap-2">
            <span>📋</span> Thành viên hiện tại ({count} thành viên)
          </h3>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {members.map((m, idx) => {
              const isMemberLeader = m.isLeader || m.leader || m.role === "LEADER" || m.position === "LEADER";

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all hover:shadow-md ${isMemberLeader ? "bg-orange-50/70 border-orange-200 shadow-xs" : "bg-[#FBF9F5] border-[#E8E2D9]"}`}
                >
                  <div className={`w-11 h-11 mx-auto rounded-2xl font-black flex items-center justify-center text-xs shadow-xs ${isMemberLeader ? "bg-[#E65100] text-white shadow-orange-500/20" : "bg-[#2C2825] text-white"}`}>
                    {m.fullName?.slice(0, 2).toUpperCase() || "SV"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-[#2C2825] truncate text-xs">
                      {m.fullName || m.userFullName}
                    </p>
                    <p className="text-[10px] text-[#6B635B] mt-0.5">
                      MSSV: {m.studentCode || "N/A"}
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black ${isMemberLeader ? "bg-amber-200 text-amber-900" : "bg-white text-[#6B635B] border border-[#E8E2D9]"}`}>
                      {isMemberLeader ? "Trưởng nhóm" : "Thành viên"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KHU VỰC QUẢN TRỊ DÀNH RIÊNG CHO TRƯỞNG NHÓM (GỘP NGAY TẠI TỔNG QUAN) */}
      {/* ========================================================= */}
      {isLeader && !isFinalized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Quản lý Báo chốt gửi Moderator */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#E65100] font-black uppercase text-xs">
                <span>📌</span>
                <span>Báo chốt phòng gửi Giảng viên</span>
              </div>
              <p className="text-[#6B635B] text-[11px] leading-relaxed">
                Khi phòng đạt đủ sĩ số tối thiểu (từ 3 đến 5 người), Trưởng nhóm bấm báo chốt để hệ thống gửi yêu cầu cấp mã nhóm chính thức.
              </p>
            </div>
            <button
              onClick={handleFinalizeRequest}
              disabled={loadingAction}
              className={`w-full py-3 font-black uppercase tracking-wider rounded-2xl text-white transition cursor-pointer shadow-md ${
                hasFinalizeRequest
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
            >
              {hasFinalizeRequest ? "Hủy yêu cầu Báo chốt" : "Báo chốt phòng gửi Giảng viên"}
            </button>
          </div>

          {/* Card Quản lý Khóa / Mở khóa phòng */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#E65100] font-black uppercase text-xs">
                <span>🔒</span>
                <span>Quản lý trạng thái Khóa / Mở phòng</span>
              </div>
              <p className="text-[#6B635B] text-[11px] leading-relaxed">
                Khi khóa phòng, thành viên bên ngoài không thể tự do tham gia trực tiếp mà phải gửi đơn xin vào để bạn duyệt.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleLock}
                disabled={loadingAction}
                className="flex-1 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase tracking-wider rounded-2xl shadow-md shadow-orange-500/20 transition cursor-pointer text-center"
              >
                {isLocked ? "Mở khóa phòng ngay" : "Khóa phòng ngay"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* KHU VỰC MỜI THÀNH VIÊN VÀ DUYỆT ĐƠN ỨNG TUYỂN (DÀNH CHO TRƯỞNG NHÓM) */}
      {/* ========================================================= */}
      {isLeader && !isFinalized && (
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
          <div className="space-y-1 pb-4 border-b border-[#E8E2D9]">
            <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
              <span>👥</span> Quản lý Thành viên & Đơn ứng tuyển
            </h3>
            <p className="text-xs text-[#6B635B]">Mời thành viên mới bằng MSSV hoặc xét duyệt đơn ứng tuyển đang chờ.</p>
          </div>

          {/* Form mời thành viên */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-[#6B635B]">Mời thành viên mới bằng Mã số sinh viên (MSSV)</label>
            <form onSubmit={handleInviteSubmit} className="flex gap-3">
              <input
                type="text"
                value={inviteStudentId}
                onChange={(e) => setInviteStudentId(e.target.value)}
                placeholder="Nhập MSSV (Ví dụ: SE192635)"
                className="flex-1 px-4 py-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#E65100] font-bold text-xs"
                required
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-md transition cursor-pointer"
              >
                {inviting ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            </form>
          </div>

          {/* Danh sách đơn ứng tuyển chờ duyệt */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase text-[#6B635B]">Đơn ứng tuyển chờ xét duyệt ({applications.length})</h4>
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app) => {
                  const student = app.student || {};
                  const studentName = student.fullName || app.studentName || app.userFullName || "Sinh viên ứng tuyển";
                  const studentCode = student.studentCode || app.studentCode || "N/A";
                  const studentMessage = app.message || student.skills || "Không có lời nhắn";

                  return (
                    <div key={app.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <p className="font-black text-sm text-[#2C2825]">{studentName} <span className="text-xs font-normal text-[#6B635B]">({studentCode})</span></p>
                        <p className="text-[11px] text-[#6B635B] bg-white p-2.5 rounded-xl border border-[#E8E2D9]">
                          <strong>Kỹ năng / Lời nhắn:</strong> {studentMessage}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveApp(app.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectApp(app.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition cursor-pointer"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B635B] italic">Chưa có sinh viên nào nộp đơn ứng tuyển vào phòng.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}