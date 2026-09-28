import React, { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const Home = () => {
    const [hoveredRole, setHoveredRole] = useState(0);

    const rolesData = [
        {
            title: "Leader",
            heading: "Trưởng nhóm sinh viên điều hành đồ án",
            features: [
                "Nộp danh sách đề tài sơ bộ và theo dõi kết quả duyệt",
                "Đặt lịch hẹn tư vấn 1:1 theo slot trống của giảng viên",
                "Theo dõi tiến độ, nộp tài liệu và nhận thông báo phản hồi"
            ],
            btnText: "Đăng nhập với vai trò Leader",
            link: "/login"
        },
        {
            title: "Instructor",
            heading: "Giảng viên hướng dẫn & reviewer",
            features: [
                "Sơ duyệt danh sách đề tài và hỗ trợ tư vấn nhóm",
                "Gắn warning flags khi nhóm chậm tiến độ hoặc thiếu chủ động",
                "Theo dõi đánh giá review và hỗ trợ các vòng phản biện"
            ],
            btnText: "Đăng nhập với vai trò Instructor",
            link: "/login"
        },
        {
            title: "Council",
            heading: "Hội đồng xét duyệt và bảo vệ",
            features: [
                "Thẩm định đề tài qua các đợt duyệt tối đa 4 lần",
                "Phân loại nhóm ở Review 3 và hỗ trợ hội đồng kín",
                "Chấm điểm bảo vệ cuối kỳ theo lịch cuốn chiếu"
            ],
            btnText: "Đăng nhập với vai trò Council",
            link: "/login"
        },
        {
            title: "Admin",
            heading: "Quản lý hệ thống và phân quyền",
            features: [
                "Quản lý tài khoản, role và cấu hình hệ thống",
                "Mở/đóng cổng nộp đề tài theo từng đợt duyệt",
                "Giám sát toàn bộ quá trình đồ án từ đầu đến bảo vệ"
            ],
            btnText: "Đăng nhập với vai trò Admin",
            link: "/login"
        }
    ];

    return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#2C2825] font-sans antialiased selection:bg-[#E65100] selection:text-white overflow-x-hidden">
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(-1deg); }
                    50% { transform: translateY(-8px) rotate(-1deg); }
                }
                @keyframes float-badge-left {
                    0%, 100% { transform: translateY(0px) rotate(-6deg); }
                    50% { transform: translateY(-6px) rotate(-6deg); }
                }
                @keyframes float-badge-right {
                    0%, 100% { transform: translateY(0px) rotate(3deg); }
                    50% { transform: translateY(-7px) rotate(3deg); }
                }
                .animate-float-main { animation: float-slow 6s ease-in-out infinite; }
                .animate-float-badge-1 { animation: float-badge-left 5s ease-in-out infinite 0.5s; }
                .animate-float-badge-2 { animation: float-badge-right 5.5s ease-in-out infinite 1s; }
            `}</style>

            {/* 1. Header / Navigation */}
            <header className="bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E8E2D9] sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                            <div className="w-5 h-5 border-2 border-white rounded-lg flex items-center justify-center text-[10px]">
                                ✓
                            </div>
                        </div>
                        <span className="font-extrabold text-xl text-[#2C2825] tracking-tight group-hover:text-[#E65100] transition-colors">
                            Lịch Đồ Án
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B635B]">
                        <a href="#tinh-nang" className="hover:text-[#E65100] transition-colors">Tính năng</a>
                        <a href="#cach-hoat-dong" className="hover:text-[#E65100] transition-colors">Cách hoạt động</a>
                        <a href="#danh-cho-ai" className="hover:text-[#E65100] transition-colors">Dành cho ai</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <a href="/login" className="text-sm font-semibold bg-[#E65100] hover:bg-[#D84315] text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                            Đăng nhập hệ thống
                        </a>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section */}
            <section className="pt-16 pb-20 max-w-7xl mx-auto px-6 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5EBE1] text-[#E65100] text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#E65100] animate-pulse"></span>
                            Dành cho sinh viên & giảng viên hướng dẫn
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black text-[#2C2825] leading-[1.15] tracking-tight">
                            Đồ án tốt nghiệp,<br />
                            đúng hẹn và đúng<br />
                            tiến độ
                        </h1>

                        <p className="text-[#6B635B] text-base leading-relaxed max-w-lg">
                            Đặt lịch hẹn với giảng viên hướng dẫn, theo dõi từng mốc đồ án và nộp tài liệu — tất cả trong một nền tảng duy nhất cho Khoa Công nghệ thông tin.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <a href="/login" className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold px-7 py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95">
                                Truy cập ngay
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-6 relative flex justify-center items-center py-12">
                        <div className="absolute w-72 h-72 bg-linear-to-br from-amber-200/40 via-orange-300/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative w-full max-w-125">
                            <div className="absolute -top-6 -left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center gap-2.5 animate-float-badge-1">
                                <div className="w-6 h-6 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] text-xs font-bold">✓</div>
                                <span className="text-xs font-bold text-[#2C2825]">Đã xác nhận lịch hẹn</span>
                            </div>

                            <div className="bg-white/90 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#F0ECE6] animate-float-main space-y-7 relative z-10">
                                <div className="flex justify-end gap-1.5 pr-1">
                                    <span className="w-2 h-2 rounded-full bg-[#E8E2D9]"></span>
                                    <span className="w-2 h-2 rounded-full bg-[#E8E2D9]"></span>
                                    <span className="w-2 h-2 rounded-full bg-[#E8E2D9]"></span>
                                </div>
                                <div className="grid grid-cols-5 gap-2.5">
                                    <div className="h-2 bg-[#2E7D32] rounded-full"></div>
                                    <div className="h-2 bg-[#2E7D32] rounded-full"></div>
                                    <div className="h-2 bg-[#E65100] rounded-full"></div>
                                    <div className="h-2 bg-[#F3EFEA] rounded-full"></div>
                                    <div className="h-2 bg-[#F3EFEA] rounded-full"></div>
                                </div>
                                <div className="flex items-center gap-6 pt-1">
                                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                                        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#E65100 0% 46%, #F3EFEA 46% 100%)` }}>
                                            <div className="w-15.5 h-15.5 bg-white rounded-full flex items-center justify-center shadow-inner">
                                                <span className="font-extrabold text-sm text-[#2C2825]">46%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-3.5 bg-[#F3EFEA] rounded-full w-full"></div>
                                        <div className="h-3.5 bg-[#F3EFEA] rounded-full w-4/5"></div>
                                        <div className="h-3.5 bg-[#F3EFEA] rounded-full w-3/5"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counter Statistics */}
                <ScrollReveal delay={100}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-[#E8E2D9] mt-16 text-center">
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">10</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Nhóm đồ án tham gia</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">4</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Lần duyệt đề tài tối đa</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">3</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Vòng review tiến độ</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">100%</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Chuẩn hóa quy trình</div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* 3. Features Section */}
            <ScrollReveal delay={100}>
                <section id="tinh-nang" className="py-20 bg-white border-y border-[#E8E2D9]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">TÍNH NĂNG</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#2C2825]">
                                Mọi thứ cần cho một đồ án đúng tiến độ
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">📊</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Duyệt đề tài 4 lần</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Quy trình thẩm định đề tài minh bạch qua hội đồng, thời hạn chuẩn hóa rõ ràng.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">📅</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Đặt lịch hẹn 1:1</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Chọn khung giờ trống của GVHD kèm ngân hàng câu hỏi thảo luận trước buổi họp.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">⏱️</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Cờ cảnh báo tiến độ</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Giảng viên gắn cờ cảnh báo (Warning Flags) khi nhóm chậm trễ hoặc thành viên không chủ động.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">🎓</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Hội đồng kín & Bảo vệ</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Trải qua 3 vòng review và hội đồng kín trước khi bước vào bảo vệ cuốn chiếu cuối kỳ.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* 4. Target Roles Section */}
            <ScrollReveal delay={100}>
                <section id="danh-cho-ai" className="py-20 bg-white border-t border-[#E8E2D9]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">DÀNH CHO AI</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#2C2825]">Phân quyền hệ thống</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {rolesData.map((role, index) => {
                                const isHovered = hoveredRole === index;
                                return (
                                    <div
                                        key={index}
                                        onMouseEnter={() => setHoveredRole(index)}
                                        className={`p-6 rounded-2xl bg-white space-y-6 flex flex-col justify-between transition-all duration-300 ${
                                            isHovered
                                                ? "border-2 border-[#E65100] shadow-xl -translate-y-2"
                                                : "border border-[#E8E2D9]"
                                        }`}
                                    >
                                        <div className="space-y-4">
                                            <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full inline-block">
                                                {role.title}
                                            </span>
                                            <h3 className="font-bold text-xl text-[#2C2825]">{role.heading}</h3>
                                            <ul className="space-y-2.5 text-xs text-[#6B635B]">
                                                {role.features.map((feature, fIndex) => (
                                                    <li key={fIndex} className="flex items-start gap-2">
                                                        <span className="text-[#E65100]">✓</span> {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <a
                                            href={role.link}
                                            className="block text-center w-full py-3 font-bold text-xs rounded-xl bg-[#E65100] text-white shadow-md hover:bg-[#D84315] transition"
                                        >
                                            {role.btnText}
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* 5. Footer */}
            <footer className="py-12 border-t border-[#E8E2D9] text-[#6B635B] text-xs">
                <div className="max-w-7xl mx-auto px-6 text-center text-[#9E958C]">
                    <p>© 2026 Lịch Đồ Án · Khoa Công nghệ thông tin · Đại học FPT</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;