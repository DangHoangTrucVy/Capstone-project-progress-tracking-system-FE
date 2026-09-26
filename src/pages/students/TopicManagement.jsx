import React, { useState } from "react";

export default function TopicManagement({ userRole = "STUDENT" }) {
    // State cho phía sinh viên đăng ký đề tài
    const [topicForm, setTopicForm] = useState({
        titleVi: "",
        titleEn: "",
        description: "",
        techStack: "",
        preferredInstructor: ""
    });

    // State danh sách đề tài giả lập dành cho Admin/Hội đồng duyệt
    const [topicsList, setTopicsList] = useState([
        {
            id: "TOPIC-01",
            groupCode: "G2026-01",
            titleVi: "Nền tảng Cứu trợ và Điều phối Lũ lụt (RESCUE.NOW)",
            titleEn: "Flood Rescue Coordination and Relief Management System",
            status: "PENDING",
            submittedDate: "2026-09-24"
        },
        {
            id: "TOPIC-02",
            groupCode: "G2026-02",
            titleVi: "Hệ thống Quản lý Tiến độ Đồ án Capstone",
            titleEn: "Capstone Project Progress Tracking System",
            status: "APPROVED",
            submittedDate: "2026-09-20"
        }
    ]);

    const handleRegisterTopic = (e) => {
        e.preventDefault();
        alert("Đăng ký đề tài thành công! Đang chờ Hội đồng và Admin phê duyệt.");
        setTopicForm({
            titleVi: "",
            titleEn: "",
            description: "",
            techStack: "",
            preferredInstructor: ""
        });
    };

    const handleApprove = (id) => {
        setTopicsList(topicsList.map(t => t.id === id ? { ...t, status: "APPROVED" } : t));
        alert(`Đã phê duyệt đề tài ${id}!`);
    };

    const handleReject = (id) => {
        setTopicsList(topicsList.map(t => t.id === id ? { ...t, status: "REJECTED" } : t));
        alert(`Đã từ chối đề tài ${id}.`);
    };

    return (
        <div className="space-y-6 p-8 max-w-5xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                    Phân hệ · Quản lý & Duyệt Đề Tài (BR-TOPIC)
                </span>
                <h1 className="text-xl font-black">Đăng ký & Phê duyệt Đề tài Capstone</h1>
                <p className="text-xs text-[#6B635B]">
                    {userRole === "STUDENT" 
                        ? "Trưởng nhóm nộp thông tin đề tài đồ án tốt nghiệp để Hội đồng xem xét." 
                        : "Hội đồng / Admin kiểm duyệt và phân bổ Giảng viên hướng dẫn cho các nhóm."}
                </p>
            </div>

            {/* GIAO DIỆN DÀNH CHO SINH VIÊN (ĐĂNG KÝ ĐỀ TÀI) */}
            {userRole === "STUDENT" && (
                <form onSubmit={handleRegisterTopic} className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Form Đăng ký Đề tài Mới</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-[#2C2825]">Tên đề tài (Tiếng Việt) *</label>
                            <input
                                type="text"
                                required
                                placeholder="VD: Nền tảng cứu trợ lũ lụt..."
                                value={topicForm.titleVi}
                                onChange={(e) => setTopicForm({ ...topicForm, titleVi: e.target.value })}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-[#2C2825]">Tên đề tài (Tiếng Anh) *</label>
                            <input
                                type="text"
                                required
                                placeholder="VD: Flood Rescue Coordination..."
                                value={topicForm.titleEn}
                                onChange={(e) => setTopicForm({ ...topicForm, titleEn: e.target.value })}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#2C2825]">Mô tả tóm tắt đề tài (Description) *</label>
                        <textarea
                            rows={3}
                            required
                            placeholder="Mục tiêu, tính năng cốt lõi và đối tượng sử dụng..."
                            value={topicForm.description}
                            onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                            className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-[#2C2825]">Công nghệ sử dụng (Tech Stack) *</label>
                            <input
                                type="text"
                                required
                                placeholder="VD: React, Spring Boot, SQL Server..."
                                value={topicForm.techStack}
                                onChange={(e) => setTopicForm({ ...topicForm, techStack: e.target.value })}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-[#2C2825]">Giảng viên hướng dẫn mong muốn</label>
                            <select
                                value={topicForm.preferredInstructor}
                                onChange={(e) => setTopicForm({ ...topicForm, preferredInstructor: e.target.value })}
                                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                            >
                                <option value="">-- Chọn giảng viên (tùy chọn) --</option>
                                <option value="INS-01">TS. Nguyễn Văn A</option>
                                <option value="INS-02">ThS. Trần Thị B</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold uppercase rounded-xl shadow-md transition cursor-pointer"
                    >
                        Gửi duyệt đề tài
                    </button>
                </form>
            )}

            {/* GIAO DIỆN DÀNH CHO ADMIN / HỘI ĐỒNG (DUYỆT ĐỀ TÀI) */}
            {userRole === "ADMIN" && (
                <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách đề tài chờ duyệt</h3>
                    <div className="divide-y divide-[#E8E2D9]">
                        {topicsList.map((item) => (
                            <div key={item.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#E65100]">{item.groupCode}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">Ngày nộp: {item.submittedDate}</span>
                                    </div>
                                    <h4 className="font-extrabold text-sm text-[#2C2825]">{item.titleVi}</h4>
                                    <p className="text-gray-500 italic">{item.titleEn}</p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-3 py-1 font-bold rounded-full text-[10px] ${
                                        item.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                                        item.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                    }`}>
                                        {item.status}
                                    </span>
                                    {item.status === "PENDING" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(item.id)}
                                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                                            >
                                                Duyệt
                                            </button>
                                            <button
                                                onClick={() => handleReject(item.id)}
                                                className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition cursor-pointer"
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}