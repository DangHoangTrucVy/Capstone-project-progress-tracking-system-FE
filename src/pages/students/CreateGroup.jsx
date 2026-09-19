import React, { useState } from "react";
import { createGroup } from "../../services/groupService";

export default function CreateGroup({ onGroupCreated }) {
    const [subTab, setSubTab] = useState("create"); // "create" hoặc "join"
    
    // Các thuộc tính cơ bản theo API POST /api/v1/groups (đã bỏ bắt buộc topic/supervisor)
    const [groupCode, setGroupCode] = useState("");
    const [semester, setSemester] = useState("Spring2026");
    const [loading, setLoading] = useState(false);

    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Payload tối giản, không bắt buộc truyền topicId hay supervisorId nữa
            const groupPayload = {
                groupCode: groupCode || "G2026-014",
                semester: semester || "Spring2026",
                topicId: null,      // Có thể để trống, cập nhật sau bằng PUT /api/v1/groups/{id}[cite: 56]
                supervisorId: null  // Có thể để trống, cập nhật sau bằng PUT /api/v1/groups/{id}[cite: 56]
            };

            await createGroup(groupPayload);
            alert("Tạo nhóm thành công!");
            onGroupCreated();
        } catch (error) {
            console.error("Lỗi tạo nhóm:", error);
            alert("Tạo nhóm thất bại! Vui lòng kiểm tra lại kết nối server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
                <p className="text-xs font-bold text-[#E65100] uppercase tracking-wider">Bắt đầu đồ án nhóm</p>
                <h1 className="text-2xl md:text-3xl font-black">Tạo nhóm hoặc tham gia một nhóm</h1>
                <p className="text-xs text-[#6B635B] max-w-lg mx-auto">
                    Mỗi đồ án được thực hiện bởi một nhóm sinh viên, do một Trưởng nhóm quản lý.
                </p>
            </div>

            <div className="bg-white p-1.5 rounded-2xl border border-[#E8E2D9] max-w-xl mx-auto grid grid-cols-2 gap-2 shadow-sm">
                <button type="button" onClick={() => setSubTab("create")} className={`py-3 text-xs font-bold rounded-xl transition ${subTab === "create" ? "bg-white text-[#2C2825] shadow-sm border border-[#E8E2D9]" : "text-[#6B635B]"}`}>Tạo nhóm mới</button>
                <button type="button" onClick={() => setSubTab("join")} className={`py-3 text-xs font-bold rounded-xl transition ${subTab === "join" ? "bg-white text-[#2C2825] shadow-sm border border-[#E8E2D9]" : "text-[#6B635B]"}`}>Tham gia bằng mã nhóm</button>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                {subTab === "create" ? (
                    <form onSubmit={handleCreateGroupSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Mã nhóm (groupCode)</label>
                            <input 
                                type="text" 
                                value={groupCode}
                                onChange={(e) => setGroupCode(e.target.value)}
                                placeholder="VD: G2026-014" 
                                required
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Học kỳ (semester)</label>
                            <input 
                                type="text" 
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                placeholder="VD: Spring2026" 
                                required
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]" 
                            />
                        </div>

                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-[11px] text-[#6B635B] space-y-1">
                            <p className="font-bold text-[#E65100]">💡 Thông tin đề tài và giảng viên:</p>
                            <p>Theo bản cập nhật hệ thống mới, bạn có thể tạo nhóm ngay bây giờ mà chưa cần chọn đề tài hay giảng viên. Các thông tin này sẽ được cập nhật sau trong phần quản lý nhóm.</p>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
                            {loading ? "Đang xử lý..." : "Tạo nhóm ngay"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); alert("Chức năng tham gia nhóm bằng mã đang chờ API kết nối"); }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Mã nhóm (groupCode)</label>
                            <input type="text" placeholder="VD: G2026-014" required className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" />
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md">Tham gia nhóm</button>
                    </form>
                )}
            </div>
        </main>
    );
}