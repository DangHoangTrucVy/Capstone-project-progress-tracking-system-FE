import React, { useState, useEffect } from "react";
import { getSubjectMyRequests, getSubjectsBySemester } from "../../services/groupService";

export default function ActivityHistory({ semester = "Spring2027" }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Lấy danh sách môn học của học kỳ trước để gọi API lịch sử theo môn
        const subsRes = await getSubjectsBySemester(semester).catch(() => []);
        const subs = Array.isArray(subsRes) ? subsRes : subsRes?.content || [];
        
        let allRequests = [];
        for (const sub of subs) {
          const subId = sub.id || sub.subjectId;
          if (subId) {
            const reqs = await getSubjectMyRequests(subId).catch(() => []);
            const reqList = Array.isArray(reqs) ? reqs : reqs?.content || [];
            allRequests = [...allRequests, ...reqList];
          }
        }
        
        // Sắp xếp theo thời gian mới nhất lên đầu
        allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryList(allRequests);
      } catch (err) {
        console.error("Lỗi tải lịch sử hoạt động:", err);
      } finally {
        setLoading(false);
      }
    };

    if (semester) {
      fetchHistory();
    }
  }, [semester]);

  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACCEPTED":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">✓ Đã chấp nhận</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px]">✕ Đã từ chối</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]">⏳ Đang chờ duyệt</span>;
    }
  };

  const getTypeBadge = (type) => {
    const isApply = type === "APPLY" || type === "APPLICATION";
    return (
      <span className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${isApply ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
        {isApply ? "⚡ Đơn ứng tuyển (Apply)" : "📬 Lời mời (Invite)"}
      </span>
    );
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6 font-sans text-[#2C2825]">
      
      {/* Tiêu đề mục */}
      <div className="flex justify-between items-center pb-4 border-b border-[#E8E2D9]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black uppercase rounded-lg mb-1">
            <span>📜</span> NHẬT KÝ HOẠT ĐỘNG
          </div>
          <h3 className="text-base font-black text-[#2C2825]">Lịch sử gửi đơn & Lời mời tham gia phòng</h3>
          <p className="text-xs text-[#6B635B] mt-0.5">Toàn bộ các mốc thời gian bạn thao tác gửi đơn hoặc nhận lời mời đều được lưu vết minh bạch.</p>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9] rounded-xl">
          Tổng số: {historyList.length} hoạt động
        </span>
      </div>

      {/* Danh sách nhật ký */}
      {loading ? (
        <div className="text-center py-10 text-xs text-[#6B635B] font-bold">Đang tải lịch sử hoạt động...</div>
      ) : historyList.length > 0 ? (
        <div className="space-y-3">
          {historyList.map((item, idx) => {
            const groupName = item.groupName || item.roomName || item.groupCode || "Phòng đồ án";
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "N/A";

            return (
              <div key={item.id || idx} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:border-[#E65100]/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(item.type)}
                    <h4 className="font-black text-sm text-[#2C2825]">{groupName}</h4>
                  </div>
                  {item.message && (
                    <p className="text-[11px] text-[#6B635B] bg-white p-2.5 rounded-xl border border-[#E8E2D9]">
                      <strong>Lời nhắn/Kỹ năng:</strong> "{item.message}"
                    </p>
                  )}
                  <p className="text-[10px] text-[#6B635B]">
                    🕒 Thời gian thao tác: <strong className="text-[#2C2825]">{dateStr}</strong>
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
          <p className="text-[11px] text-[#6B635B] italic">Bạn chưa thực hiện gửi đơn ứng tuyển hoặc nhận lời mời nào trong học kỳ này.</p>
        </div>
      )}

    </div>
  );
}