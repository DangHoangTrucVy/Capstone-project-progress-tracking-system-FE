import React from 'react';

const MainLayout = ({ children, user, onLogout }) => {
    return (
        <div className="min-h-screen bg-[#F8F6F0] text-[#2C2825] flex flex-col font-sans selection:bg-[#E65100] selection:text-white relative overflow-hidden">
            
            {/* ================= HIỆU ỨNG NỀN AMBIENT GLOW ================= */}
            {/* Khối sáng màu cam mờ ở góc trên bên trái */}
            <div className="absolute top-0 left-1/4 w-125 h-125 bg-orange-300/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            {/* Khối sáng màu vàng ấm ở góc dưới bên phải */}
            <div className="absolute bottom-10 right-10 w-112.5 h-112.5 bg-amber-200/25 rounded-full blur-[140px] pointer-events-none -z-10"></div>
            {/* ============================================================ */}

            {/* HEADER CHUYÊN NGHIỆP */}
            <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-[#E65100] rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shadow-orange-500/20">
                                F
                            </div>
                            <span className="font-black text-base tracking-tight text-[#2C2825]">
                                Capstone <span className="text-[#E65100]">Manager</span>
                            </span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-1">
                            <a href="/student/dashboard" className="px-3 py-2 rounded-xl text-xs font-bold text-[#E65100] bg-[#FFF3EE]">Tổng quan</a>
                            <a href="#topics" className="px-3 py-2 rounded-xl text-xs font-semibold text-[#6B635B] hover:text-[#2C2825] hover:bg-gray-50/50 transition">Đề tài</a>
                            <a href="#schedule" className="px-3 py-2 rounded-xl text-xs font-semibold text-[#6B635B] hover:text-[#2C2825] hover:bg-gray-50/50 transition">Lịch hẹn</a>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-[#2C2825]">{user?.fullName || "Đặng Hoàng Trúc Vy"}</p>
                            <p className="text-[10px] text-[#E65100] font-bold uppercase">Sinh viên • FPT University</p>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                        >
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="grow max-w-7xl w-full mx-auto px-6 py-8 z-10">
                {children}
            </main>

            {/* FOOTER TINH TẾ */}
            <footer className="bg-white/80 backdrop-blur-md border-t border-[#E8E2D9] py-6 mt-auto z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B635B] gap-4">
                    <p>© 2026 Đại học FPT - Hệ thống Quản lý Đồ án Tốt nghiệp.</p>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-[#E65100] transition">Quy chế đồ án</a>
                        <a href="#" className="hover:text-[#E65100] transition">Tài liệu hướng dẫn</a>
                        <a href="#" className="hover:text-[#E65100] transition">Hỗ trợ kỹ thuật</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;