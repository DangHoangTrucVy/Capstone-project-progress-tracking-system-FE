import { Link } from "react-router-dom";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#6B635B] hover:text-[#E65100] hover:border-[#E65100] shadow-sm transition-all"
                    >
                        ← Quay lại trang chủ
                    </Link>
                </div>

                <div className="text-center space-y-3 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm">
                    <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full inline-block">
                        QUY CHẾ & BẢO MẬT V2.9
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2825]">Chính sách Quản lý Đồ án Tốt nghiệp</h1>
                    <p className="text-xs text-[#9E958C]">Áp dụng cho các vai trò: Student, Leader, Admin, Moderator và Sub moderator</p>
                </div>

                <div className="space-y-6 text-xs leading-relaxed bg-white p-8 border border-[#E8E2D9] rounded-2xl shadow-sm">
                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">1. Phân quyền và Xác thực (Authentication)</h2>
                        <p className="text-[#6B635B]">Admin và Moderator đăng nhập bảo mật bằng Email/Password với cơ chế vô hiệu hóa Token (`token_version`) ngay khi thay đổi thông tin. Sinh viên đăng nhập trực tiếp qua <strong>Google OAuth</strong> dựa trên danh sách import từ phòng đào tạo.</p>
                    </section>

                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">2. Quyền riêng tư hồ sơ khi Apply nhóm</h2>
                        <p className="text-[#6B635B]">Khi sinh viên gửi đơn <strong>Apply</strong> vào một nhóm, Leader và các thành viên được phép xem hồ sơ cá nhân (thế mạnh, kỹ năng) để tuyển chọn. Quyền xem này tự động chấm dứt khi đơn bị thu hồi hoặc từ chối.</p>
                    </section>

                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">3. Quy định kiểm tra điều kiện & Cờ Finalized</h2>
                        <p className="text-[#6B635B]">Hệ thống tự động đánh giá tiêu chí tích lũy tín chỉ. Sinh viên bị gắn cờ ineligible không thể tạo hoặc tham gia nhóm. Trạng thái <strong>Finalized</strong> được quản lý tập trung ở cấp độ Nhóm (Group-level).</p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="font-bold text-sm text-[#2C2825]">4. Tính duy nhất và Nhất quán dữ liệu báo cáo</h2>
                        <p className="text-[#6B635B]">Mỗi sinh viên chỉ thuộc tối đa một nhóm chính thức. Dữ liệu xuất báo cáo Excel sử dụng mức cô lập giao dịch `REPEATABLE READ` để đảm bảo tính chính xác tuyệt đối tại thời điểm xuất file.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}