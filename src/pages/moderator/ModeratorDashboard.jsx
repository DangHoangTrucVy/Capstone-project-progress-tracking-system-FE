import React, { useState } from "react";

export default function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C2825]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full">
              MODERATOR CHÍNH PORTAL
            </span>
            <h1 className="text-2xl font-black mt-2">Quản trị & Kiểm duyệt cấp cao</h1>
            <p className="text-xs text-[#6B635B] mt-1">Giám sát hoạt động hệ thống và điều phối đội ngũ Sub moderator.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#D84315] transition">
              + Tạo thông báo kiểm duyệt
            </button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#6B635B]">Hồ sơ chờ kiểm duyệt</span>
            <div className="text-3xl font-black text-[#E65100]">24</div>
            <p className="text-[11px] text-emerald-600 font-semibold">↑ 4 đơn cần xử lý gấp trong ngày</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#6B635B]">Sub moderator hoạt động</span>
            <div className="text-3xl font-black text-[#2C2825]">8 / 10</div>
            <p className="text-[11px] text-[#6B635B]">Đang trực tuyến và làm nhiệm vụ</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#6B635B]">Tranh chấp / Khiếu nại</span>
            <div className="text-3xl font-black text-amber-600">3</div>
            <p className="text-[11px] text-amber-600 font-semibold">Cần giải quyết trực tiếp</p>
          </div>
        </div>

        {/* Danh sách công việc / Bảng điều phối */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#2C2825]">Danh sách Sub moderator & Phân công công việc</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#6B635B]">
              <thead className="bg-[#F9F6F0] text-[#2C2825] uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Họ và tên</th>
                  <th className="p-3">Khu vực phân công</th>
                  <th className="p-3">Đã xử lý</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 rounded-r-xl text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                <tr>
                  <td className="p-3 font-bold text-[#2C2825]">Nguyễn Văn A</td>
                  <td className="p-3">Kiểm duyệt nhóm đồ án IT</td>
                  <td className="p-3">45 hồ sơ</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Đang hoạt động</span></td>
                  <td className="p-3 text-right">
                    <button className="text-[#E65100] font-bold hover:underline">Phân công lại</button>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#2C2825]">Trần Thị B</td>
                  <td className="p-3">Xử lý khiếu nại sinh viên</td>
                  <td className="p-3">30 hồ sơ</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Tạm nghỉ</span></td>
                  <td className="p-3 text-right">
                    <button className="text-[#E65100] font-bold hover:underline">Phân công lại</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}