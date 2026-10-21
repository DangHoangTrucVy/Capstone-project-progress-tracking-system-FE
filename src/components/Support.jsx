import { Link } from "react-router-dom";

export default function Support() {
    const faqs = [
        {
            q: "Tại sao tài khoản của tôi bị gắn cờ không đủ điều kiện (Ineligible)?",
            a: "Cờ không đủ điều kiện được hệ thống đánh giá theo tỷ lệ tín chỉ tích lũy (dưới 80%) hoặc do Phòng Đào tạo import đầu kỳ. Sinh viên bị gắn cờ vẫn có thể đăng nhập Google để theo dõi thông tin, nhưng không được phép tạo nhóm hoặc tham gia nhóm cho đến khi được gỡ cờ."
        },
        {
            q: "Quy mô một nhóm hợp lệ được quy định như thế nào?",
            a: "Nhóm chuẩn cần đạt từ 3 đến 5 thành viên chính thức. Nhóm dưới 3 người sau thời điểm chốt sẽ không bị tự động giải tán ngoài deadline, nhưng giảng viên và ban quản trị sẽ theo dõi sát sao."
        },
        {
            q: "Giới hạn gửi đơn Apply và nhận Invite diễn ra như thế nào?",
            a: "Sinh viên tự do được phép giữ tối đa 3 đơn Apply đang chờ xử lý cùng lúc. Nếu đơn bị từ chối hoặc thu hồi, hệ thống sẽ trả lại lượt để bạn nộp đơn khác. Riêng các lời mời (Invite) nhận từ Leader không bị tính vào giới hạn này."
        },
        {
            q: "Trạng thái Chốt danh sách (Finalized) được quản lý như thế nào?",
            a: "Cờ Finalized được chuyển sang quản lý tập trung ở cấp Nhóm (Group-level). Khi Leader gửi danh sách lên Admin/Moderator duyệt, nhóm sẽ được khóa để đảm bảo tính nhất quán dữ liệu."
        }
    ];

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
                        TRỢ GIÚP HỆ THỐNG V2.9
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2825]">Trung tâm Hỗ trợ Lập nhóm Đồ án</h1>
                    <p className="text-xs sm:text-sm text-[#6B635B] max-w-xl mx-auto">
                        Giải đáp quy chế v2.9, quy trình đăng nhập Google OAuth và phân quyền Student, Leader, Admin, Moderator.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((item, idx) => (
                        <div key={idx} className="p-6 bg-white border border-[#E8E2D9] rounded-2xl space-y-2 shadow-sm">
                            <h3 className="font-bold text-sm sm:text-base text-[#2C2825] flex items-start gap-2">
                                <span className="text-[#E65100]">Q{idx + 1}:</span> {item.q}
                            </h3>
                            <p className="text-xs text-[#6B635B] pl-6 leading-relaxed">
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-white border border-[#E8E2D9] rounded-2xl text-center space-y-4 shadow-sm">
                    <h3 className="font-bold text-base text-[#2C2825]">Bạn cần can thiệp xử lý đặc biệt từ Admin?</h3>
                    <p className="text-xs text-[#6B635B]">Liên hệ ban quản trị hoặc phòng đào tạo nếu gặp sự cố về cờ điều kiện hoặc phân quyền nhóm.</p>
                    <Link 
                        to="/contact" 
                        className="inline-block px-6 py-3 bg-[#E65100] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#D84315] transition-all"
                    >
                        Đến trang Liên hệ
                    </Link>
                </div>
            </div>
        </div>
    );
}