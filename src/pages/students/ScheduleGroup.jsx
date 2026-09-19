import React, { useState } from "react";

export default function ScheduleGroup() {
    const [meetings, setMeetings] = useState([
        { id: 1, title: "Hướng dẫn đề tài tuần 3", date: "2026-03-25 14:00", supervisor: "Dr. Nguyễn Văn A", status: "APPROVED" },
        { id: 2, title: "Kiểm tra giao diện Front-end", date: "2026-04-02 09:30", supervisor: "Dr. Nguyễn Văn A", status: "PENDING" }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ title: "", date: "", note: "" });

    const handleCreateMeeting = (e) => {
        e.preventDefault();
        const newMeeting = {
            id: Date.now(),
            title: form.title,
            date: form.date,
            supervisor: "Dr. Nguyễn Văn A",
            status: "PENDING"
        };
        setMeetings([newMeeting, ...meetings]);
        setIsModalOpen(false);
        setForm({ title: "", date: "", note: "" });
        alert("Gửi yêu cầu đặt lịch hẹn thành công!");
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#2C2825]">Lịch hẹn với Giảng viên</h1>
                    <p className="text-xs text-[#6B635B] mt-1">Đăng ký khung giờ trống và theo dõi trạng thái phê duyệt lịch hẹn.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl shadow-md transition"
                >
                    + Đặt lịch hẹn mới
                </button>
            </div>

            {/* Danh sách lịch hẹn */}
            <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#E8E2D9]">
                    <h3 className="font-bold text-base text-[#2C2825]">Danh sách lịch hẹn đã đăng ký</h3>
                </div>
                <div className="divide-y divide-[#E8E2D9]">
                    {meetings.length > 0 ? (
                        meetings.map((m) => (
                            <div key={m.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#FBF9F5]/60 transition">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm text-[#2C2825]">{m.title}</span>
                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                            m.status === "APPROVED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                        }`}>
                                            {m.status === "APPROVED" ? "Đã xác nhận" : "Đang chờ duyệt"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6B635B]">Giảng viên: <strong>{m.supervisor}</strong></p>
                                    <p className="text-xs text-[#9E958C]">Thời gian: 🕒 {m.date}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="p-8 text-center text-xs text-[#6B635B]">Chưa có lịch hẹn nào được tạo.</p>
                    )}
                </div>
            </div>

            {/* Modal Đặt lịch */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-[#E8E2D9] shadow-2xl space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-[#F0EBE1]">
                            <h3 className="font-black text-lg text-[#2C2825]">Đặt lịch hẹn hướng dẫn</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6B635B]">✕</button>
                        </div>
                        <form onSubmit={handleCreateMeeting} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#6B635B] mb-1">Nội dung buổi hẹn</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none"
                                    placeholder="VD: Thảo luận tiến độ API..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B635B] mb-1">Thời gian mong muốn</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B635B] mb-1">Ghi chú cho GVHD</label>
                                <textarea
                                    rows="3"
                                    value={form.note}
                                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none resize-none"
                                    placeholder="Nhập ghi chú thêm..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 bg-gray-100 text-[#6B635B] text-xs font-bold rounded-xl">Hủy</button>
                                <button type="submit" className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md">Gửi yêu cầu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}