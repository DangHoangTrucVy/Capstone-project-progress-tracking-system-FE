import React, { useState } from "react";

export default function SubModManagement() {
  const [subMods, setSubMods] = useState([
    { id: 1, name: "Nguyễn Văn A", email: "annv@fpt.edu.vn", scope: "Khối ngành SE", status: "Hoạt động" },
    { id: 2, name: "Trần Thị B", email: "btt@fpt.edu.vn", scope: "Khối ngành IA", status: "Hoạt động" },
    { id: 3, name: "Lê Hoàng C", email: "clh@fpt.edu.vn", scope: "Khối ngành GD", status: "Tạm khóa" },
  ]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 text-[#2C2825]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full">
              SUB-MOD ADMINISTRATION
            </span>
            <h1 className="text-2xl font-black mt-2">Quản lý Đội ngũ Sub Moderator</h1>
            <p className="text-xs text-[#6B635B] mt-1">Thêm mới, phân quyền phạm vi kiểm duyệt và theo dõi trạng thái tài khoản.</p>
          </div>
          <button className="px-4 py-2 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#D84315] transition">
            + Thêm Sub Moderator mới
          </button>
        </div>

        {/* Bảng danh sách Sub Mod */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#6B635B]">
              <thead className="bg-[#F9F6F0] text-[#2C2825] uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Họ và tên</th>
                  <th className="p-3">Email trường</th>
                  <th className="p-3">Phạm vi quản lý</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 rounded-r-xl text-right">Quản lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {subMods.map((mod) => (
                  <tr key={mod.id} className="hover:bg-[#FCFBF9] transition">
                    <td className="p-3 font-bold text-[#2C2825]">{mod.name}</td>
                    <td className="p-3">{mod.email}</td>
                    <td className="p-3 font-medium text-[#E65100]">{mod.scope}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 font-semibold rounded-full text-[10px] ${mod.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {mod.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button className="text-xs font-bold text-[#6B635B] hover:text-[#E65100] transition">
                        Sửa quyền
                      </button>
                      <button className="text-xs font-bold text-rose-600 hover:text-rose-800 transition">
                        Thu hồi
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