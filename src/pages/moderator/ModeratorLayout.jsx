import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function ModeratorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Giám sát tổng quan", path: "/moderator/dashboard", icon: "📊" },
    { label: "Hàng đợi kiểm duyệt", path: "/moderator/review-queue", icon: "📥" },
    { label: "Quản lý Sub Moderator", path: "/moderator/sub-mods", icon: "👥" },
    { label: "Nhiệm vụ Sub Mod (Tasks)", path: "/submod/tasks", icon: "📝" },
    { label: "Hồ sơ Moderator", path: "/moderator/profile", icon: "⚙️" }, // Thêm mục Profile ở đây
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden relative">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-79 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-4 select-none shrink-0 h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-8 pr-1">
          {/* Logo / Header Sidebar */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E65100] flex items-center justify-center text-white shadow-md shadow-orange-200 font-bold">
              M
            </div>
            <div>
              <h2 className="font-black text-sm text-[#2C2825]">
                Khu Vực Moderator
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Hệ thống MatchPoint FPT.
              </p>
            </div>
          </div>

          {/* Danh sách menu điều hướng */}
          <div className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mb-2 px-3">
              ĐIỀU HÀNH CHUNG
            </p>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                    isActive
                      ? "bg-[#E65100] text-white shadow-md"
                      : "hover:bg-[#F8F6F0]"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thông tin user & Nút đăng xuất ở chân Sidebar */}
        <div className="shrink-0 pt-4 mt-3 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3 px-1">
            <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-sm">
              MOD
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">Moderator Hệ Thống</h4>
              <p className="text-[10px] text-[#6B635B] truncate">mod@fpt.edu.vn</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* KHUNG NỘI DUNG CHÍNH BÊN PHẢI */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FDFBF7]">
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs font-semibold text-[#6B635B] shrink-0">
          <span>Hệ Thống Kiểm Duyệt MatchPoint</span>
          <span className="text-[#E65100] font-bold">Xin chào, Moderator</span>
        </header>

        {/* Nơi hiển thị nội dung của từng trang con */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}