import { Link } from "react-router-dom";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            {/* Hiệu ứng khung xuất hiện mượt mà */}
            <div className="max-w-3xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out_forwards]">
                
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
                        QUY CHẾ & BẢO MẬT
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2825]">Chính sách Quản lý Đồ án Tốt nghiệp</h1>
                    <p className="text-xs text-[#9E958C]">Áp dụng cho các vai trò: Student, Leader và Admin</p>
                </div>

                {/* Nội dung chính sách */}
                <div className="space-y-6 text-xs leading-relaxed bg-white p-8 border border-[#E8E2D9] rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md">
                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">1. Phân quyền và Vai trò (Actors)</h2>
                        <p className="text-[#6B635B]">Hệ thống vận hành với 3 nhóm người dùng chính: <strong>Student</strong> (sinh viên tự do, tham gia nhóm), <strong>Leader</strong> (trưởng nhóm quản lý thành viên và xét duyệt đơn) và <strong>Admin / Phòng Đào Tạo</strong> (quản lý danh sách, gắn/gỡ cờ điều kiện và can thiệp thay đổi nhân sự khi cần thiết).</p>
                    </section>

                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">2. Quyền riêng tư hồ sơ khi Apply nhóm</h2>
                        <p className="text-[#6B635B]">Khi sinh viên gửi đơn <strong>Apply</strong> vào một nhóm, Leader và các thành viên chính thức được phép xem hồ sơ cá nhân của ứng viên nhằm mục đích tuyển chọn. Quyền xem này chỉ phát sinh thông qua đơn Apply và sẽ tự động chấm dứt khi đơn bị thu hồi, từ chối hoặc hết thời hạn.</p>
                    </section>

                    <section className="space-y-2 border-b border-[#F2ECE4] pb-4">
                        <h2 className="font-bold text-sm text-[#2C2825]">3. Quy định kiểm tra điều kiện đầu kỳ</h2>
                        <p className="text-[#6B635B]">Việc đăng nhập hệ thống bằng tài khoản trường và việc kiểm tra điều kiện tham gia đồ án là hai quá trình độc lập. Sinh viên bị gắn cờ không đủ điều kiện từ Phòng Đào tạo sẽ bị hạn chế các quyền tạo nhóm và nộp đơn cho đến khi được xử lý mở khóa.</p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="font-bold text-sm text-[#2C2825]">4. Tính duy nhất trong nhóm</h2>
                        <p className="text-[#6B635B]">Mỗi sinh viên chỉ thuộc tối đa một nhóm chính thức tại một thời điểm trong cùng một đợt đồ án. Hệ thống tự động hủy toàn bộ các đơn Apply hoặc Invite khác ngay khi sinh viên chính thức gia nhập một nhóm.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}