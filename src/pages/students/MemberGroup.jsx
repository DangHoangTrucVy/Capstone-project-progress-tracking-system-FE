import React, { useState, useEffect } from "react";
import { removeRoomMember, transferLeader } from "../../services/roomService";
import { getCurrentUser } from "../../services/authService";

export default function MemberGroup({ roomData, isLeader, onRefresh }) {
  const [currentUser, setCurrentUser] = useState(null);
  const members = roomData?.members || [];
  const roomId = roomData?.id || roomData?.roomId;

  const isFinalized = Boolean(
    roomData?.finalized ||
    roomData?.status === "FINALIZED" ||
    roomData?.groupCode,
  );

  useEffect(() => {
    getCurrentUser().then(setUser => setCurrentUser(setUser)).catch(() => {});
  }, []);

  const handleKick = async (userId, name) => {
    if (isFinalized) {
      alert("Room đã chốt thành Nhóm, không thể đưa thành viên ra ngoài.");
      return;
    }
    if (!window.confirm(`Xác nhận đưa ${name} ra khỏi Room?`)) return;
    try {
      await removeRoomMember(roomId, userId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Không thể xóa thành viên.");
    }
  };

  const handleTransfer = async (userId, name) => {
    if (isFinalized) {
      alert("Room đã chốt thành Nhóm, không thể thay đổi trưởng nhóm.");
      return;
    }
    if (!window.confirm(`Chuyển quyền Trưởng nhóm cho ${name}?`)) return;
    try {
      await transferLeader(roomId, userId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Không thể chuyển Trưởng nhóm.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#2C2825] pb-12">
      
      {/* BANNER THÔNG BÁO CHỐT PHÒNG */}
      {isFinalized && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-black text-sm">Danh sách thành viên đã được khóa cố định</p>
              <p className="text-[11px] opacity-90 mt-0.5">Sau khi Moderator duyệt chốt nhóm, mọi thay đổi thành viên hoặc trưởng nhóm cần thông qua Đơn xin chuyển nhóm.</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider">
            Mã nhóm: {roomData?.groupCode}
          </span>
        </div>
      )}

      {/* DANH SÁCH THÀNH VIÊN */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D9]">
          <div>
            <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
              <span>👥</span> Thành viên chính thức trong phòng ({members.length} người)
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">Quản lý phân quyền và danh sách thành viên thực tế của nhóm.</p>
          </div>
        </div>

        <div className="space-y-3">
          {members.map((m, idx) => {
            const uId = m.userId || m.id || m.student?.userId || m.accountId;
            const isMemLeader = m.isLeader || m.leader || m.role === "LEADER" || m.position === "LEADER";
            const isMe = currentUser && (String(uId) === String(currentUser.id || currentUser.userId || currentUser.accountId));
            
            const memberName = m.fullName || m.userFullName || m.student?.fullName || m.name || "Thành viên";
            const studentCode = m.studentCode || m.code || m.student?.studentCode || m.userCode || "N/A";
            
            // Quét triệt để mọi đường dẫn có thể chứa email từ backend trả về
            const email = 
              m.email || 
              m.userEmail || 
              m.student?.email || 
              m.student?.userEmail || 
              m.account?.email || 
              m.profile?.email || 
              (isMe ? currentUser?.email : null) || 
              "Chưa có email";

            return (
              <div
                key={uId || idx}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isMe 
                    ? "bg-linear-to-r from-emerald-50/50 via-white to-white border-emerald-300 shadow-sm" 
                    : isMemLeader
                      ? "bg-linear-to-r from-orange-50/50 via-white to-white border-orange-300 shadow-sm"
                      : "bg-[#FBF9F5] border-[#E8E2D9]"
                }`}
              >
                {/* Thông tin cá nhân */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center text-xs shadow-md shrink-0 ${
                    isMe 
                      ? "bg-linear-to-br from-emerald-600 to-teal-700 text-white" 
                      : isMemLeader
                        ? "bg-linear-to-br from-[#E65100] to-orange-600 text-white"
                        : "bg-linear-to-br from-[#2C2825] to-gray-700 text-white"
                  }`}>
                    {memberName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-[#2C2825]">{memberName}</h4>
                      <span className="font-mono text-xs font-bold text-[#E65100] bg-orange-100/60 px-2 py-0.5 rounded-md">
                        {studentCode}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6B635B]">✉️ Email: <strong className="text-[#2C2825]">{email}</strong></p>

                    <div className="flex items-center gap-2 pt-0.5">
                      {isMemLeader && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded-lg text-[10px]">
                          👑 Trưởng nhóm
                        </span>
                      )}
                      {isMe && !isMemLeader && (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-lg text-[10px]">
                          👤 Tài khoản của bạn
                        </span>
                      )}
                      {!isMemLeader && !isMe && (
                        <span className="px-2.5 py-0.5 bg-white text-[#6B635B] border border-[#E8E2D9] font-bold rounded-lg text-[10px]">
                          Thành viên
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Các nút hành động quản lý của Trưởng nhóm */}
                {isLeader && !isMemLeader && !isFinalized && (
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleTransfer(uId, memberName)}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 transition cursor-pointer text-xs shadow-2xs"
                    >
                      ⭐ Nhường Leader
                    </button>
                    <button
                      onClick={() => handleKick(uId, memberName)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition cursor-pointer text-xs shadow-2xs"
                    >
                      ✕ Xóa khỏi phòng
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}