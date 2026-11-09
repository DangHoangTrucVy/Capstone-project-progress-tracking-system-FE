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
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";

export default function Overview({ roomData, isLeader, onRefresh }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [moderatorName, setModeratorName] = useState("Đang tải...");
  const [applications, setApplications] = useState([]);
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  const currentSemesterCode = roomData?.semesterCode || roomData?.semester || localStorage.getItem("selectedSemester");

  const fetchRoomRequests = async () => {
    if (!roomId || roomId.toString().startsWith("temp-")) return;
    try {
      const res = await getGroupRequests(roomId);
      const reqList = Array.isArray(res) ? res : res?.content || [];
      const pendingApps = reqList.filter(
        (item) => (!item.status || item.status === "PENDING") && 
        (item.type === "APPLICATION" || item.type === "APPLY" || item.type === "APPLIED" || !item.type)
      );
      setApplications(pendingApps);
    } catch (err) {
      console.error("Lỗi tải đơn ứng tuyển:", err);
    }
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Lỗi tải user:", err);
      }

      if (currentSemesterCode) {
        try {
          const semRes = await api.get(`/semesters/${currentSemesterCode}`);
          const semData = semRes?.data?.data || semRes?.data;
          if (semData?.moderator?.fullName) {
            setModeratorName(semData.moderator.fullName);
          } else {
            setModeratorName("Chưa phân công");
          }
        } catch (err) {
          console.error("Không thể tải thông tin Moderator từ học kỳ:", err);
          setModeratorName("Chưa phân công");
        }
      }

      await fetchRoomRequests();
    };

    fetchRealData();
  }, [roomId, isLeader, currentSemesterCode]);

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
        alert("Đã gửi báo chốt phòng thành công đến Giảng viên (Moderator)!");
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

  const handleApproveApp = async (reqId) => {
    try {
      await acceptRequest(reqId);
      alert("Đã chấp nhận yêu cầu tham gia của sinh viên thành công!");
      await fetchRoomRequests();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể duyệt yêu cầu.");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingApp || !rejectReason.trim()) return;
    try {
      await rejectRequest(rejectingApp.id, { reason: rejectReason.trim() });
      alert("Đã từ chối yêu cầu.");
      setRejectingApp(null);
      setRejectReason("");
      await fetchRoomRequests();
    } catch (err) {
      alert("Thao tác từ chối thất bại.");
    }
  };

  const percentFilled = Math.min(100, Math.round((count / maxSize) * 100));

  return (
    <div className="space-y-6 text-xs font-sans text-[#2C2825] pb-12">
      
      {/* 1. BANNER TRẠNG THÁI CHỐT NHÓM */}
      {isFinalized ? (
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              ✨
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-white/20 text-white font-extrabold rounded-md text-[10px] uppercase tracking-wider">
                Đã duyệt chính thức
              </span>
              <h2 className="text-base font-black tracking-tight">
                Phòng đã được duyệt chốt thành Nhóm Đồ án Chính thức!
              </h2>
              <p className="text-[11px] text-white/90">Danh sách thành viên trong phòng đã được khóa và không thể thay đổi nữa.</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-white text-emerald-800 font-black rounded-xl text-[10px] uppercase tracking-wider shadow-sm">
            🔒 Đã chốt nhóm
          </span>
        </div>
      ) : (
        <div className="bg-linear-to-r from-orange-600 via-amber-600 to-yellow-600 p-6 rounded-3xl text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-black rounded-md text-[10px] uppercase">
              Phòng Thảo Luận & Lập Nhóm
            </span>
            <h2 className="text-base font-black">Tiến trình ghép nhóm đang diễn ra</h2>
            <p className="text-[11px] text-orange-100">Hoàn tất sĩ số và chuẩn bị sẵn sàng để báo chốt với Giảng viên điều phối.</p>
          </div>
        </div>
      )}

      {/* BANNER KHÓA PHÒNG */}
      {isLocked && !isFinalized && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="font-black text-xs">Phòng đang ở trạng thái KHÓA!</p>
              <p className="text-[11px] opacity-90 mt-0.5">Khóa bởi: <strong>{lockedBy}</strong></p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-600 text-white font-extrabold rounded-xl text-[10px] uppercase">Đang khóa</span>
        </div>
      )}

      {/* 2. THÔNG TIN PHÒNG (HERO CARD) */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-start flex-wrap gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black rounded-xl uppercase tracking-wider">
                {roomData?.groupCode ? roomData.groupCode : "PHÒNG THẢO LUẬN"}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-xl">
                ● Hợp lệ
              </span>
            </div>
            
            <h1 className="text-3xl font-black text-[#2C2825] tracking-tight">
              Phòng: {roomData?.name}
            </h1>

            <div className="text-xs text-[#6B635B] space-y-1">
              <p>
                🏛️ Chuyên ngành đào tạo: <strong className="text-[#2C2825]">{roomData?.majorCode || roomData?.major || "Công nghệ thông tin"}</strong>
              </p>
              <p>
                👤 Giảng viên điều phối (Moderator): <strong className="text-[#E65100]">{moderatorName}</strong>
              </p>
            </div>
          </div>

          <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[#E8E2D9] min-w-65 space-y-3 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">👥 Sĩ số nhóm hiện tại</span>
              <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {count}/{maxSize} người
              </span>
            </div>
            <div className="w-full bg-[#E8E2D9] h-2.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-emerald-500 to-teal-600 transition-all duration-700" 
                style={{ width: `${percentFilled}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1">
              <span className="text-emerald-700 font-bold">✓ Đạt chuẩn sĩ số</span>
              <span className="text-[#6B635B]">Quy định: {minSize} - {maxSize} bạn</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH THÀNH VIÊN TRONG PHÒNG */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-2 border-b border-[#E8E2D9]">
          <div>
            <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
             Thành viên chính thức trong phòng ({count})
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">Danh sách thành viên thực tế từ cơ sở dữ liệu học kỳ.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 pt-2">
          {members.map((m, idx) => {
            const isMemberLeader = m.isLeader || m.leader || m.role === "LEADER" || m.position === "LEADER";
            const isMe = currentUser && (String(m.userId || m.id) === String(currentUser.id || currentUser.userId));
            const memberName = m.fullName || m.userFullName || m.student?.fullName || "Thành viên";
            const studentCode = m.studentCode || m.code || m.student?.studentCode || "N/A";

            return (
              <div
                key={idx}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 relative group ${
                  isMe 
                    ? "bg-linear-to-b from-emerald-50/90 via-white to-white border-emerald-400 ring-2 ring-emerald-200 shadow-md" 
                    : isMemberLeader
                      ? "bg-linear-to-b from-orange-50/80 via-white to-white border-orange-300 shadow-md"
                      : "bg-[#FBF9F5] border-[#E8E2D9]"
                }`}
              >
                {isMemberLeader && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full shadow-md text-center tracking-wider whitespace-nowrap">
                    👑 Trưởng nhóm
                  </div>
                )}
                {isMe && !isMemberLeader && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full shadow-md text-center tracking-wider whitespace-nowrap">
                    👤 Tài khoản của bạn
                  </div>
                )}

                <div className="text-center space-y-3 pt-2">
                  <div className={`w-14 h-14 mx-auto rounded-2xl font-black flex items-center justify-center text-sm shadow-md ${
                    isMe 
                      ? "bg-linear-to-br from-emerald-600 to-teal-700 text-white" 
                      : isMemberLeader
                        ? "bg-linear-to-br from-[#E65100] to-orange-600 text-white"
                        : "bg-linear-to-br from-[#2C2825] to-gray-700 text-white"
                  }`}>
                    {memberName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="overflow-hidden">
                    <p className="font-black text-[#2C2825] text-xs truncate">{memberName}</p>
                    <p className="text-[11px] font-mono font-bold text-[#E65100] mt-0.5">{studentCode}</p>
                  </div>

                  <div>
                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black ${
                      isMe ? "bg-emerald-100 text-emerald-800" : isMemberLeader ? "bg-amber-100 text-amber-900" : "bg-white text-[#6B635B] border border-[#E8E2D9]"
                    }`}>
                      {isMe ? "Thành viên (Bạn)" : isMemberLeader ? "Trưởng nhóm" : "Thành viên"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. KHU VỰC QUẢN TRỊ DÀNH CHO TRƯỞNG NHÓM (LUÔN HIỂN THỊ KHI CHƯA CHỐT) */}
      {isLeader && !isFinalized && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Khóa/Mở khóa phòng & Báo chốt gửi Giảng viên */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">🔒 Quản trị trạng thái phòng & Báo chốt</h3>
                <p className="text-[11px] text-[#6B635B]">
                  Trạng thái khóa: <strong className={isLocked ? "text-amber-600" : "text-emerald-600"}>{isLocked ? "Đang Khóa" : "Đang Mở tự do"}</strong>
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleFinalizeRequest}
                  disabled={loadingAction}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer text-xs"
                >
                  {hasFinalizeRequest ? "Hủy báo chốt" : "📌 Báo chốt / Chốt danh sách phòng gửi Giảng viên"}
                </button>
                <button
                  onClick={handleToggleLock}
                  disabled={loadingAction}
                  className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer text-xs"
                >
                  {isLocked ? "🔓 Mở khóa phòng ngay" : "🔒 Khóa phòng ngay"}
                </button>
              </div>
            </div>

            {/* Mời thành viên bằng Mã số sinh viên */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">✉️ Mời thành viên bằng Mã số sinh viên</h3>
                <p className="text-[11px] text-[#6B635B]">Gọi API mời sinh viên vào phòng bằng MSSV chính xác.</p>
              </div>
              <form onSubmit={handleInviteSubmit} className="space-y-2 pt-2">
                <input
                  type="text"
                  value={inviteStudentId}
                  onChange={(e) => setInviteStudentId(e.target.value)}
                  placeholder="Nhập MSSV (VD: SE192639)..."
                  className="w-full px-4 py-2.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100] font-bold text-xs"
                  required
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-3 bg-[#2C2825] hover:bg-black text-white font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer text-xs"
                >
                  {inviting ? "Đang gửi..." : "Gửi lời mời tham gia"}
                </button>
              </form>
            </div>

          </div>

          {/* Khu vực danh sách đơn ứng tuyển / yêu cầu xin vào phòng chờ duyệt */}
          <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D9]">
              <div>
                <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
                  <span>📥</span> Danh sách yêu cầu xin vào phòng chờ xét duyệt ({applications.length})
                </h3>
                <p className="text-xs text-[#6B635B] mt-0.5">Sinh viên gửi đơn xin vào hoặc sinh viên do Giảng viên phân bổ.</p>
              </div>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app) => {
                  const student = app.student || {};
                  const studentName = student.fullName || app.studentName || "Sinh viên";
                  const studentCode = student.studentCode || app.studentCode || "N/A";
                  const studentEmail = student.email || app.email || "N/A";
                  const timeStr = app.createdAt ? new Date(app.createdAt).toLocaleString("vi-VN") : "Vừa xong";

                  return (
                    <div key={app.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">ĐƠN XIN VÀO</span>
                          <h4 className="font-black text-xs text-[#2C2825]">{studentName} ({studentCode})</h4>
                        </div>
                        <p className="text-[11px] text-[#6B635B]">✉️ Email: <strong className="text-[#2C2825]">{studentEmail}</strong></p>
                        {app.message && (
                          <p className="text-[11px] text-[#6B635B]"><strong>Lời nhắn:</strong> "{app.message}"</p>
                        )}
                        <p className="text-[10px] text-[#6B635B]">🕒 Thời gian gửi: {timeStr}</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveApp(app.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                        >
                          ✓ Chấp nhận
                        </button>
                        <button
                          onClick={() => setRejectingApp(app)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition cursor-pointer text-xs"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B635B] italic text-center py-4">Hiện không có yêu cầu xin vào phòng nào đang chờ xử lý.</p>
            )}
          </div>

        </div>
      )}

      {/* Modal từ chối đơn */}
      {rejectingApp && isLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E8E2D9]"
          >
            <h3 className="text-sm font-black text-[#2C2825]">Từ chối đơn xin vào phòng</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
              placeholder="Nhập lý do từ chối..."
              className="w-full rounded-2xl border border-[#E8E2D9] bg-[#FBF9F5] p-3 text-xs outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 text-xs font-bold cursor-pointer"
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