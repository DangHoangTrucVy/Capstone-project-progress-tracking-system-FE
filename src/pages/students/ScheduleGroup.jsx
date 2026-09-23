import React, { useState, useEffect } from "react";
import { getSlots, bookSlot, cancelBooking, getGroupBookings } from "../../services/scheduleService";

export default function ScheduleGroup({ groupId }) {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Lọc các slot có trạng thái AVAILABLE
            const resSlots = await getSlots({ status: "AVAILABLE" });
            setAvailableSlots(resSlots.content || resSlots || []);

            if (groupId) {
                const resBookings = await getGroupBookings(groupId);
                setMyBookings(resBookings.content || resBookings || []);
            }
        } catch (err) {
            console.error("Lỗi tải lịch hẹn:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [groupId]);

    const handleBook = async (slotId) => {
        if (!window.confirm("Xác nhận đặt lịch hẹn khung giờ này cho nhóm?")) return;
        try {
            // Gọi API book slot (Backend sử dụng pessimistic-lock bảo vệ dữ liệu khi nhiều nhóm book đồng thời)
            await bookSlot(slotId);
            alert("Đặt lịch hẹn thành công!");
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || "Đặt lịch thất bại, khung giờ có thể đã được nhóm khác đặt trước!";
            alert(msg);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này? (Lưu ý quy định cửa sổ hủy trễ)")) return;
        try {
            // Gọi API hủy lịch hẹn
            await cancelBooking(bookingId);
            alert("Hủy lịch hẹn thành công!");
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || "Không thể hủy lịch do vi phạm thời hạn cho phép hủy trễ (late-cancellation window).";
            alert(msg);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold">Sprint 2 · Đặt lịch hướng dẫn</span>
                <h1 className="text-xl font-black text-[#2C2825]">Lịch hẹn của nhóm đồ án</h1>
                <p className="text-xs text-[#6B635B]">Trưởng nhóm có thể chọn khung giờ trống hoặc hủy lịch hẹn đã đặt trước đó.</p>
            </div>

            {/* Danh sách lịch hẹn đã đặt của nhóm */}
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Lịch hẹn hiện tại của nhóm</h3>
                {myBookings.length > 0 ? (
                    <div className="divide-y divide-[#E8E2D9]">
                        {myBookings.map((b) => (
                            <div key={b.id} className="py-4 flex justify-between items-center text-xs">
                                <div>
                                    <p className="font-bold text-[#2C2825]">🕒 {new Date(b.startTime || b.slotTime).toLocaleString()}</p>
                                    <p className="text-[#6B635B]">Giảng viên: <strong>{b.instructorName}</strong> • Trạng thái: <span className="text-emerald-600 font-bold">ACTIVE</span></p>
                                </div>
                                <button 
                                    onClick={() => handleCancel(b.id)}
                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold transition"
                                >
                                    Hủy lịch hẹn
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#6B635B] italic">Nhóm chưa có lịch hẹn nào được xác nhận.</p>
                )}
            </div>

            {/* Danh sách slot trống có thể đặt */}
            <div className="bg-white p-6 border border-[#E8E2D9] space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Khung giờ rảnh có sẵn để đặt</h3>
                {loading ? (
                    <p className="text-xs text-[#6B635B]">Đang tải...</p>
                ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableSlots.map((slot) => (
                            <div key={slot.id} className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-[#2C2825]">📅 {new Date(slot.startTime).toLocaleString()}</p>
                                    <p className="text-[11px] text-[#6B635B]">GV: <strong>{slot.instructorName}</strong> • Sức chứa: {slot.capacity}</p>
                                </div>
                                <button 
                                    onClick={() => handleBook(slot.id)}
                                    className="px-4 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold shadow-sm transition"
                                >
                                    Đặt chỗ
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#6B635B] italic">Hiện tại không có khung giờ rảnh nào.</p>
                )}
            </div>
        </div>
    );
}