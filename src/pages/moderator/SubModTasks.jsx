import React, { useState } from "react";

export default function SubModTasks() {
  const [selectedTab, setSelectedTab] = useState("pending");

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C2825]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full">
              SUB MODERATOR PORTAL
            </span>
            <h1 className="text-2xl font-black mt-2">Hàng đợi Kiểm duyệt & Hỗ trợ</h1>
            <p className="text-xs text-[#6B635B] mt-1">Xử lý các yêu cầu tham gia nhóm và báo cáo vi phạm nhỏ từ sinh viên.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button 
              onClick={() => setSelectedTab("pending")}
              className={`px-4 py-2 rounded-xl font-bold transition ${selectedTab === "pending" ? "bg-[#E65100] text-white" : "bg-[#F5EBE1] text-[#E65100]"}`}
            >
              Đang chờ xử lý (12)
            </button>
            <button 
              onClick={() => setSelectedTab("history")}
              className={`px-4 py-2 rounded-xl font-bold transition ${selectedTab === "history" ? "bg-[#E65100] text-white" : "bg-[#F5EBE1] text-[#E65100]"}`}
            >
              Lịch sử duyệt
            </button>
          </div>
        </div>

        {/* Danh sách yêu cầu cần duyệt */}
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">Yêu cầu tạo nhóm mới</span>
                  <span className="text-xs text-[#9E958C]">Gửi lúc: 10:30 AM - Hôm nay</span>
                </div>
                <h3 className="font-bold text-base text-[#2C2825]">Nhóm SE1801 - Phát triển ứng dụng Web (5 thành viên)</h3>
                <p className="text-xs text-[#6B635B]">Trưởng nhóm: Nguyễn Hoàng Nam (HE170123) · Đã kiểm tra đủ điều kiện học phần.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">
                  Phê duyệt
                </button>
                <button className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition">
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}