import { Link } from "react-router-dom";

export default function Support() {
    const faqs = [
        {
            q: "Tại sao tài khoản của tôi bị gắn cờ không đủ điều kiện tham gia?",
            a: "Cờ không đủ điều kiện được Phòng Đào tạo import và cập nhật đầu kỳ. Sinh viên bị gắn cờ vẫn có thể đăng nhập để xem lý do, nhưng không được phép tạo nhóm, gửi đơn Apply hoặc chấp nhận Invite cho đến khi được gỡ cờ."
        },
        {
            q: "Quy mô một nhóm hợp lệ được quy định như thế nào?",
            a: "Nhóm chuẩn cần đạt từ 3 đến 5 thành viên chính thức, trong đó có đúng 1 Leader (sinh viên khởi tạo nhóm). Khi mới tạo, nhóm có thể chỉ có 1 mình Leader và tiếp tục tiến hành tuyển thêm thành viên."
        },
        {
            q: "Giới hạn gửi đơn Apply và nhận Invite diễn ra như thế nào?",
            a: "Sinh viên tự do được phép giữ tối đa 3 đơn Apply đang chờ xử lý cùng lúc. Nếu đơn bị từ chối, thu hồi hoặc hết hạn (mặc định sau 48 giờ), hệ thống sẽ trả lại lượt để bạn nộp đơn khác. Riêng các lời mời (Invite) nhận từ nhóm khác không bị tính vào giới hạn này."
        },
        {
            q: "Làm thế nào để thay đổi nhân sự hoặc rời nhóm trước khi khóa danh sách (Locked)?",
            a: "Trước thời điểm khóa danh sách, thành viên muốn rời nhóm phải được Leader phê duyệt. Leader cũng có quyền kick thành viên khỏi nhóm mà không cần biểu quyết 100%. Sau khi rời hoặc bị kick hợp lệ, bạn hoàn toàn có thể tham gia nhóm mới nếu còn thời gian."
        }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            {/* Sử dụng hiệu ứng animate-fade-in (hoặc lớp transition mượt) */}
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

                {/* Tiêu đề trang với hiệu ứng trượt nhẹ từ dưới lên */}
                <div className="text-center space-y-3 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm transform transition-all duration-500 hover:shadow-md">
                    <span className="px-3 py-1 bg-[#F5EBE1] text-[#E65100] text-xs font-bold rounded-full inline-block animate-pulse">
                        TRỢ GIÚP HỆ THỐNG
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2825]">Trung tâm Hỗ trợ Lập nhóm Đồ án</h1>
                    <p className="text-xs sm:text-sm text-[#6B635B] max-w-xl mx-auto">
                        Giải đáp quy chế, quy trình lập nhóm và phân quyền dành cho Student, Leader và Admin.
                    </p>
                </div>

                {/* Danh sách câu hỏi có hiệu ứng hiện dần từng khung */}
                <div className="space-y-4">
                    {faqs.map((item, idx) => (
                        <div 
                            key={idx} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className="p-6 bg-white border border-[#E8E2D9] rounded-2xl space-y-2 shadow-sm hover:border-[#E65100]/50 hover:shadow-md transition-all duration-300"
                        >
                            <h3 className="font-bold text-sm sm:text-base text-[#2C2825] flex items-start gap-2">
                                <span className="text-[#E65100]">Q{idx + 1}:</span> {item.q}
                            </h3>
                            <p className="text-xs text-[#6B635B] pl-6 leading-relaxed">
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Khung liên hệ cuối trang */}
                <div className="p-8 bg-white border border-[#E8E2D9] rounded-2xl text-center space-y-4 shadow-sm transition-all duration-300 hover:shadow-md">
                    <h3 className="font-bold text-base text-[#2C2825]">Bạn cần can thiệp xử lý đặc biệt từ Admin?</h3>
                    <p className="text-xs text-[#6B635B]">Liên hệ ban quản trị hoặc phòng đào tạo nếu gặp sự cố về cờ điều kiện hoặc phân quyền Leader.</p>
                    <Link 
                        to="/contact" 
                        className="inline-block px-6 py-3 bg-[#E65100] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#D84315] hover:scale-105 transition-all duration-300"
                    >
                        Đến trang Liên hệ
                    </Link>
                </div>
            </div>
        </div>
    );
}