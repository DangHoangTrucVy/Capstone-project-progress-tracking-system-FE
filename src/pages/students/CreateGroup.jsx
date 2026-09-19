import React, { useState, useEffect } from "react";
import { createGroup } from "../../services/groupService";
import api from "../../services/api"; // Giả định file api.js của bạn

export default function CreateGroup({ onGroupCreated }) {
    const [subTab, setSubTab] = useState("create");
    
    const [groupCode, setGroupCode] = useState("");
    const [semester, setSemester] = useState("Spring2026");
    
    // State lưu danh sách lựa chọn từ API
    const [topics, setTopics] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    const [topicId, setTopicId] = useState(""); 
    const [supervisorId, setSupervisorId] = useState(""); 
    const [loading, setLoading] = useState(false);

    // Tự động gọi API lấy Topics và Giảng viên khi component được load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi API lấy topics (thử lấy không truyền params hoặc truyền status phù hợp)
                const topicsRes = await api.get("/topics", { params: { page: 0, size: 50 } });
                // Tùy cấu trúc phân trang của backend (Spring Boot thường trả về dạng Page có thuộc tính .content hoặc là một mảng trực tiếp)
                const topicList = topicsRes.data.content || topicsRes.data || [];
                setTopics(topicList);

                // Gọi API lấy danh sách user/giảng viên (điều chỉnh endpoint theo đúng Swagger của bạn nếu khác)
                const usersRes = await api.get("/users", { params: { page: 0, size: 50 } }).catch(() => null);
                if (usersRes) {
                    const userList = usersRes.data.content || usersRes.data || [];
                    // Lọc ra các user có vai trò là giảng viên (INSTRUCTOR / TEACHER)
                    const instructorList = userList.filter(u => u.role === "INSTRUCTOR" || u.role === "TEACHER" || u.role === "LECTURER");
                    setSupervisors(instructorList.length > 0 ? instructorList : userList);
                }
            } catch (error) {
                console.error("Không thể tải danh sách dữ liệu ban đầu:", error);
            }
        };

        fetchData();
    }, []);

    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const groupPayload = {
                groupCode: groupCode.trim(),
                semester: semester.trim(),
                topicId: topicId ? topicId.trim() : null,          
                supervisorId: supervisorId ? supervisorId.trim() : null  
            };

            const response = await createGroup(groupPayload);
            console.log("Kết quả tạo nhóm:", response);
            alert("Tạo nhóm thành công!");
            if (onGroupCreated) onGroupCreated();
        } catch (error) {
            console.error("Lỗi tạo nhóm:", error);
            const errorMsg = error.response?.data?.message || "Tạo nhóm thất bại! Vui lòng kiểm tra lại.";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
                <p className="text-xs font-bold text-[#E65100] uppercase tracking-wider">Bắt đầu đồ án nhóm</p>
                <h1 className="text-2xl md:text-3xl font-black text-[#2C2825]">Tạo nhóm hoặc tham gia một nhóm</h1>
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
                                placeholder="VD: G2026-02" 
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

                        {/* Chọn Đề tài (Topic) thay vì phải copy UUID thủ công */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Chọn Đề tài (Topic)</label>
                            <select 
                                value={topicId}
                                onChange={(e) => setTopicId(e.target.value)}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                            >
                                <option value="">-- Chọn đề tài (Có thể để trống) --</option>
                                {topics.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.topicCode ? `[${t.topicCode}] ` : ""}{t.title || t.name || t.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Chọn Giảng viên hướng dẫn (Supervisor) */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Chọn Giảng viên hướng dẫn (Supervisor)</label>
                            <select 
                                value={supervisorId}
                                onChange={(e) => setSupervisorId(e.target.value)}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                            >
                                <option value="">-- Chọn giảng viên (Có thể để trống) --</option>
                                {supervisors.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.fullName || s.name || s.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition">
                            {loading ? "Đang xử lý..." : "Tạo nhóm ngay"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); alert("Chức năng tham gia nhóm bằng mã đang chờ API kết nối"); }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#2C2825]">Mã nhóm (groupCode)</label>
                            <input type="text" placeholder="VD: G2026-02" required className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" />
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md">Tham gia nhóm</button>
                    </form>
                )}
            </div>
        </main>
    );
}