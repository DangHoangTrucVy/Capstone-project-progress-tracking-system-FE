import React, { useState, useEffect } from "react";
import { getSemesterRooms } from "../../services/roomService";
import { getGroupRequests } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function ActivityHistory({ semester }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!semester) return;
      setLoading(true);
      try {
        const user = await getCurrentUser().catch(() => null);
        const userId = user?.id || user?.userId;

        const roomsRes = await getSemesterRooms(semester).catch(() => []);
        const roomList = Array.isArray(roomsRes) ? roomsRes : roomsRes?.content || [];
        
        let allRequests = [];
        
        for (const room of roomList) {
          const roomId = room.id || room.roomId;
          const members = room.members || [];
          
          // Kiểm tra xem sinh viên hiện tại có nằm trong phòng này không (hoặc là leader)
          const isMemberOfThisRoom = members.some(
            m => String(m.userId || m.id) === String(userId)
          ) || room.leaderId === userId;

          // Chỉ gọi API getGroupRequests nếu sinh viên có quyền (là thành viên phòng đó)
          if (roomId && isMemberOfThisRoom) {
            try {
              const reqs = await getGroupRequests(roomId);
              const reqList = Array.isArray(reqs) ? reqs : reqs?.content || [];
              const mappedReqs = reqList.map(item => ({
                ...item,
                roomName: room.name || room.groupCode || item.groupName
              }));
              allRequests = [...allRequests, ...mappedReqs];
            } catch (err) {
              // Bỏ qua lỗi 403 nếu có phát sinh
            }
          }
        }
        
        // Sắp xếp theo thời gian mới nhất lên đầu
        allRequests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setHistoryList(allRequests);
      } catch (err) {
        console.error("Lỗi tải lịch sử hoạt động:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [semester]);

  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACCEPTED":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">Đã chấp nhận</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px]"> Đã từ chối</span>;
      case "WITHDRAWN":
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-[10px]"> Đã thu hồi</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]"> Đang chờ duyệt</span>;
    }
  };

  const getTypeBadge = (type) => {
    const isApply = type === "APPLY" || type === "APPLICATION" || type === "APPLIED";
    return (
      <span className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${isApply ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
        {isApply ? " Đơn ứng tuyển " : "Lời mời "}
      </span>
    );
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6 font-sans text-[#2C2825]">
      <div className="flex justify-between items-center pb-4 border-b border-[#E8E2D9]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black uppercase rounded-lg mb-1">
            <span>📜</span> NHẬT KÝ HOẠT ĐỘNG
          </div>
          <h3 className="text-base font-black text-[#2C2825]">Lịch sử yêu cầu & Lời mời trong học kỳ</h3>
          <p className="text-xs text-[#6B635B] mt-0.5">Toàn bộ lịch sử các lượt gửi đơn, lời mời và trạng thái xử lý của phòng bạn tham gia.</p>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9] rounded-xl">
          Tổng số: {historyList.length} hoạt động
        </span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-[#6B635B] font-bold">Đang tải lịch sử hoạt động từ hệ thống...</div>
      ) : historyList.length > 0 ? (
        <div className="space-y-3">
          {historyList.map((item, idx) => {
            const displayName = item.roomName || item.groupName || item.groupCode || "Phòng đồ án";
            const studentName = item.student?.fullName || item.fullName || "Thành viên";
            const studentCode = item.student?.studentCode || item.studentCode || "";
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "N/A";

            return (
              <div key={item.id || idx} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:border-[#E65100]/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(item.type)}
                    <h4 className="font-black text-sm text-[#2C2825]">{displayName}</h4>
                  </div>
                  <p className="text-xs text-[#6B635B]">
                    Thành viên: <strong className="text-[#2C2825]">{studentName} {studentCode && `(${studentCode})`}</strong>
                  </p>
                  {item.message && (
                    <p className="text-[11px] text-[#6B635B] bg-white p-2.5 rounded-xl border border-[#E8E2D9]">
                      <strong>Lời nhắn:</strong> "{item.message}"
                    </p>
                  )}
                  <p className="text-[10px] text-[#6B635B]">
                    🕒 Thời gian: <strong className="text-[#2C2825]">{dateStr}</strong>
                  </p>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center bg-[#FBF9F5] rounded-3xl border border-dashed border-[#E8E2D9] space-y-1">
          <p className="text-xs font-bold text-[#2C2825]">Chưa có lịch sử hoạt động</p>
          <p className="text-[11px] text-[#6B635B] italic">Không ghi nhận yêu cầu hoặc lời mời nào trong phòng của bạn.</p>
        </div>
      )}
    </div>
  );
}