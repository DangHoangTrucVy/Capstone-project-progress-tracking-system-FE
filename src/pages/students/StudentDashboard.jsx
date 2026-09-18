import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/authService";
import { createGroup } from "../../services/groupService";
import MainLayout from "../../components/MainLayout";

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [groupCode, setGroupCode] = useState("");
    const [semester, setSemester] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error("Lỗi tải thông tin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createGroup({ groupCode, semester });
            alert("Tạo nhóm thành công!");
            setIsCreateModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Lỗi tạo nhóm:", error);
            alert("Tạo nhóm thất bại! Vui lòng kiểm tra lại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center">
                <div className="flex items-center space-x-3 text-[#6B635B] font-medium text-xs animate-pulse">
                    <div className="w-2.5 h-2.5 bg-[#E65100] rounded-full animate-bounce"></div>
                    <span>Đang tải không gian làm việc của bạn...</span>
                </div>
            </div>
        );
    }

    return (
        <MainLayout user={user} onLogout={handleLogout}>
            <div className="space-y-8 animate-fadeIn">
                
                {/* 1. WELCOME BANNER (Gọn gàng, chuyên nghiệp, không bị trống trải) */}
                <div className="bg-linear-to-r from-[#2C2825] to-[#4A433E] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="space-y-2 z-10">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-semibold text-orange-200">
                            <span>✨ Học kỳ Spring 2026</span>
                            <span>•</span>
                            <span>Chuyên ngành Kỹ thuật phần mềm</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                            Xin chào, {user?.fullName || "Trúc Vy"}! 👋
                        </h1>
                        <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                            Chào mừng bạn đến với hệ thống quản lý đồ án tốt nghiệp. Theo dõi tiến độ, quản lý thành viên nhóm và đăng ký đề tài ngay tại không gian làm việc cá nhân của bạn.
                        </p>
                    </div>

                    <div className="z-10 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center space-x-4 min-w-55">
                        <div className="w-12 h-12 bg-[#E65100] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "V"}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Trạng thái nhóm</p>
                            <p className="text-xs font-bold text-orange-300 mt-0.5">
                                {user?.group ? "Đã có nhóm" : "Chưa có nhóm"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN WORKSPACE CONTENT */}
                <div>
                    {user?.group ? (
                        /* NẾU ĐÃ CÓ NHÓM */
                        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                            {/* Nội dung khi có nhóm */}
                        </div>
                    ) : (
                        /* NẾU CHƯA CÓ NHÓM (Cân đối không gian, không bị trống thô) */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card chính hành động */}
                            <div className="md:col-span-2 bg-white p-10 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div className="w-14 h-14 bg-orange-50 text-[#E65100] rounded-2xl flex items-center justify-center text-2xl">
                                        🚀
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black text-[#2C2825]">Bắt đầu hành trình Đồ án tốt nghiệp</h2>
                                        <p className="text-xs text-[#6B635B] leading-relaxed">
                                            Bạn chưa tham gia vào nhóm đồ án nào trong học kỳ này. Bạn có thể tự tạo nhóm mới làm nhóm trưởng hoặc chờ liên kết từ các thành viên khác.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <button 
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-6 py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-500/20 transition duration-200"
                                    >
                                        + Tạo nhóm đồ án ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card phụ hướng dẫn nhanh */}
                            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-extrabold text-[#2C2825] uppercase tracking-wider">Lưu ý quan trọng</h3>
                                    <ul className="space-y-2.5 text-xs text-[#6B635B] list-disc pl-4">
                                        <li>Mỗi nhóm tối đa từ 3 - 5 thành viên.</li>
                                        <li>Mã nhóm cần tuân thủ quy định của khoa (VD: SE17-G01).</li>
                                        <li>Sau khi tạo nhóm, bạn có thể thêm các thành viên khác vào.</li>
                                    </ul>
                                </div>
                                <div className="p-3 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] text-[11px] text-[#6B635B]">
                                    💡 Cần trợ giúp? Liên hệ ban chủ nhiệm khoa phần mềm.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODAL TẠO NHÓM (HIỆN ĐẠI, CAO CẤP) ================= */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 border border-[#E8E2D9] shadow-2xl space-y-6">
                        
                        <div className="flex justify-between items-center pb-4 border-b border-[#F0EBE1]">
                            <div>
                                <h3 className="font-black text-lg text-[#2C2825]">Khởi tạo Nhóm Đồ Án Mới</h3>
                                <p className="text-xs text-[#6B635B] mt-0.5">Điền thông tin định danh nhóm của bạn cho học kỳ này</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#6B635B] font-bold text-xs transition"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroupSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-[#6B635B]">Mã nhóm định danh <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={groupCode}
                                    onChange={(e) => setGroupCode(e.target.value)}
                                    placeholder="Ví dụ: SE1701-G01" 
                                    required
                                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-[#6B635B]">Học kỳ thực hiện <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    placeholder="Ví dụ: Spring2026" 
                                    required
                                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                />
                            </div>

                            <div className="bg-[#FFF3EE] p-4 rounded-2xl border border-orange-200 text-xs text-[#E65100] font-medium">
                                📌 Lưu ý: Bạn sẽ tự động trở thành **Nhóm trưởng** sau khi tạo nhóm thành công.
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-[#6B635B] text-xs font-bold rounded-xl transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50"
                                >
                                    {submitting ? "Đang xử lý..." : "Xác nhận tạo nhóm"}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default StudentDashboard;