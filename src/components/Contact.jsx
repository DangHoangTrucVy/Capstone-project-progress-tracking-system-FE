import { Link } from "react-router-dom";

export default function Contact() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            {/* Hiệu ứng khung xuất hiện mượt mà */}
            <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out_forwards]">
                
                {/* Nút quay lại trang chủ */}
                <div className="transition-all duration-300 hover:-translate-x-1">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#6B635B] hover:text-[#E65100] hover:border-[#E65100] shadow-sm transition-all"
                    >
                        ← Quay lại trang chủ
                    </Link>
                </div>

                {/* Tiêu đề trang */}
                <div className="text-center space-y-3 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm transition-all duration-500 hover:shadow-md">
                    <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full inline-block animate-pulse">
                        KẾT NỐI HỆ THỐNG
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2825]">Liên hệ Ban Quản Trị & Đào Tạo</h1>
                    <p className="text-xs sm:text-sm text-[#6B635B]">Hỗ trợ giải quyết các vấn đề về cờ điều kiện, tài khoản đăng nhập và phân quyền nhóm.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Thông tin liên hệ */}
                    <div className="p-8 bg-white border border-[#E8E2D9] rounded-2xl space-y-6 shadow-sm transition-all duration-300 hover:shadow-md">
                        <h3 className="font-bold text-base text-[#2C2825]">Thông tin hỗ trợ vận hành</h3>
                        
                        <div className="space-y-4 text-xs text-[#6B635B]">
                            <div className="flex items-start gap-3">
                                <span className="text-[#E65100] font-bold text-sm">📍</span>
                                <p>Phòng Đào Tạo / Ban Quản Trị Hệ Thống Đồ Án Tốt Nghiệp.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[#E65100] font-bold text-sm">✉️</span>
                                <p>admin.capstone@fpt.edu.vn</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[#E65100] font-bold text-sm">📞</span>
                                <p>Hotline: Giờ hành chính từ Thứ Hai đến Thứ Sáu.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#F2ECE4]">
                            <p className="text-[11px] text-[#9E958C]">Lưu ý: Các thắc mắc liên quan đến gỡ cờ điều kiện tham gia cần có xác nhận từ cố vấn học tập hoặc phòng đào tạo.</p>
                        </div>
                    </div>

                    {/* Form gửi yêu cầu */}
                    <form className="p-8 bg-white border border-[#E8E2D9] rounded-2xl space-y-4 shadow-sm transition-all duration-300 hover:shadow-md" onSubmit={(e) => { e.preventDefault(); alert("Đã gửi yêu cầu thành công!"); }}>
                        <h3 className="font-bold text-base text-[#2C2825]">Gửi yêu cầu hỗ trợ (Student / Leader)</h3>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#6B635B]">Họ và tên</label>
                            <input type="text" placeholder="Nhập họ và tên..." className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#E65100] transition-colors" required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#6B635B]">Mã sinh viên / Email trường</label>
                            <input type="text" placeholder="VD: HE123456 hoặc email@fpt.edu.vn" className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#E65100] transition-colors" required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#6B635B]">Nội dung cần hỗ trợ</label>
                            <textarea rows="4" placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#E65100] resize-none transition-colors" required></textarea>
                        </div>

                        <button type="submit" className="w-full py-3 bg-[#E65100] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#D84315] hover:scale-[1.02] transition-all duration-300">
                            Gửi yêu cầu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}