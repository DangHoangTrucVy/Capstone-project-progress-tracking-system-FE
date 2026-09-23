import React, { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const Home = () => {
    const [hoveredRole, setHoveredRole] = useState(0);

    const rolesData = [
        {
            title: "Sinh viên",
            heading: "Chủ động với đồ án của mình",
            features: [
                "Xem lộ trình và hạn của từng mốc đồ án",
                "Tự đặt lịch hẹn với GVHD theo khung giờ trống",
                "Theo dõi % tiến độ và nộp tài liệu đúng hạn"
            ],
            btnText: "Đăng ký với vai trò Sinh viên",
            link: "/register"
        },
        {
            title: "Giảng viên",
            heading: "Quản lý nhiều sinh viên cùng lúc",
            features: [
                "Duyệt hoặc từ chối yêu cầu lịch hẹn",
                "Xem tiến độ của cả danh sách sinh viên hướng dẫn",
                "Duyệt tài liệu và ghi nhận nhận xét"
            ],
            btnText: "Đăng ký với vai trò Giảng viên",
            link: "/register"
        },
        {
            title: "Trưởng bộ môn",
            heading: "Giám sát toàn bộ khoa",
            features: [
                "Xem lịch hẹn của tất cả giảng viên trên một màn hình",
                "Phát hiện lịch trùng và xử lý kịp thời",
                "Theo dõi tỷ lệ sinh viên đúng và trễ tiến độ"
            ],
            btnText: "Xem lịch giám sát",
            link: "/login"
        }
    ];

    return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#2C2825] font-sans antialiased selection:bg-[#E65100] selection:text-white overflow-x-hidden">
            {/* CSS Hiệu ứng nổi Floating */}
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
                        <a href="/login" className="text-sm font-semibold text-[#2C2825] bg-[#F3EFEA] hover:bg-[#E8E2D9] px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95">
                            Đăng nhập
                        </a>
                        <a href="/register" className="text-sm font-semibold bg-[#E65100] hover:bg-[#D84315] text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 active:scale-95">
                            Đăng ký miễn phí
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
                            <a href="/register" className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold px-7 py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95">
                                Bắt đầu miễn phí
                            </a>
                            <a href="/login" className="bg-[#F3EFEA] hover:bg-[#E8E2D9] text-[#2C2825] font-bold px-7 py-3.5 rounded-xl transition-all border border-[#E8E2D9] active:scale-95">
                                Tôi đã có tài khoản
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

                            <div className="absolute -bottom-6 -right-2 z-20 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 animate-float-badge-2">
                                <div className="w-7 h-7 rounded-lg bg-[#F5EBE1] flex items-center justify-center text-[#E65100] text-sm">📅</div>
                                <span className="text-xs font-bold text-[#2C2825]">Còn 46 ngày đến bảo vệ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counter Statistics */}
                <ScrollReveal delay={100}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-[#E8E2D9] mt-16 text-center">
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">1.200+</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Sinh viên đang theo dõi đồ án</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">85</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Giảng viên hướng dẫn</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">4.600+</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Lịch hẹn đã đặt thành công</div>
                        </div>
                        <div className="group cursor-default">
                            <div className="text-3xl sm:text-4xl font-black text-[#E65100] group-hover:scale-110 transition-transform">96%</div>
                            <div className="text-xs font-medium text-[#6B635B] mt-1">Bảo vệ đúng hạn</div>
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
                            <p className="text-[#6B635B] text-sm sm:text-base">
                                Từ lúc đề xuất đề tài đến ngày bảo vệ, hệ thống đồng hành cùng cả sinh viên và giảng viên.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">📊</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Lộ trình rõ ràng</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Toàn bộ mốc đồ án — đề cương, kiểm tra tiến độ, bảo vệ — hiển thị trên một lộ trình duy nhất.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">📅</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Đặt lịch hẹn nhanh</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Xem khung giờ trống của giảng viên hướng dẫn và đặt lịch chỉ trong vài giây.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">⏱️</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Theo dõi tiến độ</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Cập nhật nhiệm vụ, nộp tài liệu và xem tiến độ tổng thể theo thời gian thực.
                                </p>
                            </div>
                            <div className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 bg-[#F5EBE1] text-[#E65100] rounded-xl flex items-center justify-center font-bold text-lg">👥</div>
                                <h3 className="font-bold text-lg text-[#2C2825]">Giám sát toàn khoa</h3>
                                <p className="text-[#6B635B] text-xs leading-relaxed">
                                    Trưởng bộ môn xem được toàn bộ lịch hẹn trong khoa trên một lịch chung.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* 4. Workflow Section */}
            <ScrollReveal delay={100}>
                <section id="cach-hoat-dong" className="py-20 max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">CÁCH HOẠT ĐỘNG</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#2C2825]">
                            Bắt đầu chỉ trong ba bước
                        </h2>
                    </div>

                    <div className="bg-[#F3EFEA] p-8 sm:p-12 rounded-3xl border border-[#E8E2D9] grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <div className="w-9 h-9 rounded-full border-2 border-[#E65100] text-[#E65100] font-bold flex items-center justify-center text-sm bg-white">1</div>
                            <h3 className="font-bold text-base text-[#2C2825]">Tạo tài khoản</h3>
                            <p className="text-[#6B635B] text-xs leading-relaxed">Đăng ký bằng email trường theo vai trò sinh viên hoặc giảng viên hướng dẫn.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-9 h-9 rounded-full border-2 border-[#E65100] text-[#E65100] font-bold flex items-center justify-center text-sm bg-white">2</div>
                            <h3 className="font-bold text-base text-[#2C2825]">Đặt lịch với GVHD</h3>
                            <p className="text-[#6B635B] text-xs leading-relaxed">Chọn khung giờ trống và gửi yêu cầu hẹn, giảng viên xác nhận dễ dàng.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-9 h-9 rounded-full border-2 border-[#E65100] text-[#E65100] font-bold flex items-center justify-center text-sm bg-white">3</div>
                            <h3 className="font-bold text-base text-[#2C2825]">Theo dõi đến ngày bảo vệ</h3>
                            <p className="text-[#6B635B] text-xs leading-relaxed">Cập nhật nhiệm vụ theo từng giai đoạn và nộp tài liệu ngay trên hệ thống.</p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* 5. Target Roles Section */}
            <ScrollReveal delay={100}>
                <section id="danh-cho-ai" className="py-20 bg-white border-t border-[#E8E2D9]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">DÀNH CHO AI</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#2C2825]">Một hệ thống, ba góc nhìn</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rolesData.map((role, index) => {
                                const isHovered = hoveredRole === index;
                                return (
                                    <div
                                        key={index}
                                        onMouseEnter={() => setHoveredRole(index)}
                                        className={`p-6 rounded-2xl bg-white space-y-6 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                                            isHovered
                                                ? "border-2 border-[#E65100] shadow-xl shadow-orange-500/10 -translate-y-2"
                                                : "border border-[#E8E2D9] hover:border-[#E65100]/50 shadow-sm"
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
                                            className={`block text-center w-full py-3 font-bold text-xs rounded-xl transition-all duration-300 active:scale-95 ${
                                                isHovered
                                                    ? "bg-[#E65100] hover:bg-[#D84315] text-white shadow-md"
                                                    : "bg-[#F3EFEA] hover:bg-[#E8E2D9] text-[#2C2825] border border-[#E8E2D9]"
                                            }`}
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

            {/* 6. Call to Action (CTA Banner) */}
            <ScrollReveal delay={100}>
                <section className="py-16 max-w-7xl mx-auto px-6">
                    <div className="bg-[#E65100] text-white p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-600/30">
                        <div className="space-y-3 text-center md:text-left">
                            <h2 className="text-2xl sm:text-3xl font-black">Sẵn sàng cho đồ án tốt nghiệp của bạn?</h2>
                            <p className="text-white/80 text-xs sm:text-sm max-w-md">
                                Tạo tài khoản trong một phút và đặt lịch hẹn đầu tiên với giảng viên hướng dẫn ngay hôm nay.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                            <a href="/register" className="bg-white text-[#2C2825] font-bold px-6 py-3 rounded-xl text-xs sm:text-sm hover:bg-gray-100 transition shadow-sm active:scale-95">
                                Bắt đầu miễn phí
                            </a>
                            <a href="/login" className="bg-transparent border border-white/40 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm hover:bg-white/10 transition active:scale-95">
                                Đăng nhập
                            </a>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* 7. Footer */}
            <footer className="py-12 border-t border-[#E8E2D9] text-[#6B635B] text-xs">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
                    <div className="md:col-span-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#E65100] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                <div className="w-3.5 h-3.5 border border-white rounded flex items-center justify-center text-[8px]">
                                    ✓
                                </div>
                            </div>
                            <span className="font-bold text-sm text-[#2C2825]">Lịch Đồ Án</span>
                        </div>
                        <p className="text-[#9E958C] max-w-sm">
                            Nền tảng đặt lịch và theo dõi tiến độ đồ án tốt nghiệp cho Khoa Công nghệ thông tin.
                        </p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <p className="font-bold text-[#2C2825]">Sản phẩm</p>
                        <ul className="space-y-1.5 text-[#9E958C]">
                            <li><a href="#tinh-nang" className="hover:text-[#E65100] transition-colors">Tính năng</a></li>
                            <li><a href="#cach-hoat-dong" className="hover:text-[#E65100] transition-colors">Cách hoạt động</a></li>
                            <li><a href="#danh-cho-ai" className="hover:text-[#E65100] transition-colors">Dành cho ai</a></li>
                        </ul>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <p className="font-bold text-[#2C2825]">Tài khoản</p>
                        <ul className="space-y-1.5 text-[#9E958C]">
                            <li><a href="/login" className="hover:text-[#E65100] transition-colors">Đăng nhập</a></li>
                            <li><a href="/register" className="hover:text-[#E65100] transition-colors">Đăng ký</a></li>
                        </ul>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <p className="font-bold text-[#2C2825]">Hỗ trợ</p>
                        <ul className="space-y-1.5 text-[#9E958C]">
                            <li><a href="#" className="hover:text-[#E65100] transition-colors">Liên hệ khoa</a></li>
                            <li><a href="#" className="hover:text-[#E65100] transition-colors">Hướng dẫn sử dụng</a></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-[#E8E2D9]/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#9E958C]">
                    <p>© 2026 Lịch Đồ Án · Khoa Công nghệ thông tin</p>
                    <p>Được xây dựng cho sinh viên và giảng viên</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;