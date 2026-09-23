import React, { useState, useEffect } from "react";
import { getSlots, createSlot } from "../../services/scheduleService";

export default function InstructorScheduleManagement() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    
    const [form, setForm] = useState({
        startTime: "",
        endTime: "",
        durationMinutes: 30,
        capacity: 1,
        locationType: "ONLINE",
        meetingUrl: ""
    });

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await getSlots(params);
            setSlots(res.content || res || []);
        } catch (err) {
            console.error("Lỗi tải danh sách slot:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [filterStatus]);

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                startTime: new Date(form.startTime).toISOString(),
                endTime: new Date(form.endTime).toISOString(),
                durationMinutes: Number(form.durationMinutes),
                capacity: Number(form.capacity),
                locationType: form.locationType,
                meetingUrl: form.meetingUrl.trim()
            };

            await createSlot(payload);
            alert("Tạo khung giờ rảnh thành công (Đã ràng buộc không trùng lịch)!");
            setForm({ startTime: "", endTime: "", durationMinutes: 30, capacity: 1, locationType: "ONLINE", meetingUrl: "" });
            fetchSlots();
        } catch (err) {
            const msg = err.response?.data?.message || "Không thể tạo khung giờ. Có thể bị trùng lịch với slot đã tồn tại!";
            alert(msg);
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-5xl mx-auto animate-fadeIn">
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold">Sprint 2 · Quản lý Slot rảnh</span>
                <h1 className="text-xl font-black text-[#2C2825]">Tạo & Quản lý Khung giờ rảnh (Schedule Slots)</h1>
                <p className="text-xs text-[#6B635B]">Giảng viên tạo lịch trống, hệ thống tự động kiểm tra xung đột thời gian.</p>
            </div>

            {/* Form tạo slot mới */}
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Tạo khung giờ mới</h3>
                <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Thời gian bắt đầu</label>
                        <input 
                            type="datetime-local" 
                            required
                            value={form.startTime}
                            onChange={(e) => setForm({...form, startTime: e.target.value})}
                            className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9]"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Thời gian kết thúc</label>
                        <input 
                            type="datetime-local" 
                            required
                            value={form.endTime}
                            onChange={(e) => setForm({...form, endTime: e.target.value})}
                            className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9]"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Sức chứa tối đa (Số nhóm)</label>
                        <input 
                            type="number" 
                            min="1" max="5"
                            required
                            value={form.capacity}
                            onChange={(e) => setForm({...form, capacity: e.target.value})}
                            className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9]"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Link phòng họp (Meeting URL)</label>
                        <input 
                            type="text" 
                            placeholder="https://meet.google.com/..."
                            value={form.meetingUrl}
                            onChange={(e) => setForm({...form, meetingUrl: e.target.value})}
                            className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9]"
                        />
                    </div>
                    <div className="md:col-span-2 pt-2">
                        <button type="submit" className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold transition shadow-sm">
                            Xác nhận tạo Slot
                        </button>
                    </div>
                </form>
            </div>

            {/* Danh sách slot với bộ lọc status */}
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách Slot đã tạo</h3>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9]"
                    >
                        <p className="text-[11px] text-[#6B635B]">Tất cả trạng thái</p>
                        <option value="">Tất cả trạng thái</option>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="FULL">FULL</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>

                <div className="divide-y divide-[#E8E2D9]">
                    {loading ? (
                        <p className="text-xs text-[#6B635B] py-4">Đang tải...</p>
                    ) : slots.length > 0 ? (
                        slots.map((s) => (
                            <div key={s.id} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                    <p className="font-bold text-[#2C2825]">
                                        📅 {new Date(s.startTime).toLocaleString()} → {new Date(s.endTime).toLocaleTimeString()}
                                    </p>
                                    <p className="text-[11px] text-[#6B635B]">
                                        Giảng viên: {s.instructorName || "Bạn"} • Đã đặt: {s.bookedCount || 0}/{s.capacity} nhóm
                                    </p>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-bold ${
                                    s.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                }`}>
                                    {s.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-[#6B635B] italic py-4">Không tìm thấy slot nào.</p>
                    )}
                </div>
            </div>
        </div>
    );
}