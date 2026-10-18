import React, { useState } from "react";

export default function ContentReviewQueue() {
  const [filter, setFilter] = useState("all");

  const queueItems = [
    { id: 1, type: "Đơn xin đổi Leader", group: "SE1801 - Nhóm 3", requester: "Trần Văn Nam", time: "10 phút trước", status: "Chờ duyệt" },
    { id: 2, type: "Tài liệu đề tài Capstone", group: "IA1702 - Nhóm 5", requester: "Lê Thị Hoa", time: "1 giờ trước", status: "Chờ duyệt" },
    { id: 3, type: "Yêu cầu giải tán nhóm", group: "SE1804 - Nhóm 2", requester: "Nguyễn Minh Tuấn", time: "3 giờ trước", status: "Cần xem xét" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C2825]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full">
              MODERATOR QUEUE
            </span>
            <h1 className="text-2xl font-black mt-2">Hàng đợi Kiểm duyệt Nội dung & Yêu cầu</h1>
            <p className="text-xs text-[#6B635B] mt-1">Xem xét và phê duyệt các yêu cầu đặc biệt từ sinh viên và trưởng nhóm.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filter === "all" ? "bg-[#E65100] text-white" : "bg-[#F5EBE1] text-[#E65100]"}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filter === "pending" ? "bg-[#E65100] text-white" : "bg-[#F5EBE1] text-[#E65100]"}`}
            >
              Cần xử lý gấp
            </button>
          </div>
        </div>

        {/* Danh sách hàng đợi */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#6B635B]">
              <thead className="bg-[#F9F6F0] text-[#2C2825] uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Loại yêu cầu</th>
                  <th className="p-3">Thông tin nhóm</th>
                  <th className="p-3">Người gửi</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 rounded-r-xl text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {queueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFBF9] transition">
                    <td className="p-3 font-bold text-[#2C2825]">{item.type}</td>
                    <td className="p-3">{item.group}</td>
                    <td className="p-3">{item.requester}</td>
                    <td className="p-3 text-[#9E958C]">{item.time}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-full text-[10px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">
                        Duyệt
                      </button>
                      <button className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition">
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}