import React from "react";
import { removeRoomMember, transferLeader } from "../../services/roomService";

export default function MemberGroup({ roomData, isLeader, onRefresh }) {
  const members = roomData?.members || [];
  const roomId = roomData?.id || roomData?.roomId;

  const isFinalized = Boolean(
    roomData?.finalized ||
    roomData?.status === "FINALIZED" ||
    roomData?.groupCode,
  );

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
    <div className="space-y-4 text-xs font-sans text-[#2C2825]">
      {isFinalized && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
          <span>🔒</span>
          <span>
            Danh sách thành viên đã được khóa cố định sau khi Moderator duyệt
            chốt nhóm.
          </span>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-4 shadow-xs">
        <h3 className="text-sm font-black text-[#2C2825]">
          👥 Quản lý thành viên ({members.length} người)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const uId = m.userId || m.id;
             const isMemLeader = m.isLeader || m.leader || m.role === "LEADER" || m.position === "LEADER";
            return (
              <div
                key={uId}
                className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-[#2C2825]">
                    {m.fullName || m.userFullName}
                  </p>
                  <p className="text-[10px] text-[#6B635B]">
                    MSSV: {m.studentCode}
                  </p>
                </div>
                {isLeader && !isMemLeader && !isFinalized && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransfer(uId, m.fullName)}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer"
                    >
                      ⭐ Nhường Leader
                    </button>
                    <button
                      onClick={() => handleKick(uId, m.fullName)}
                      className="px-2.5 py-1 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer"
                    >
                      ✕ Xóa
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
