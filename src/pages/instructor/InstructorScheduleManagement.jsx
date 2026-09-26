import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function InstructorScheduleManagement() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlotForm, setNewSlotForm] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    durationMinutes: 45,
    capacity: 1,
    locationType: "ONLINE",
    meetingUrl: "",
  });

  // Lấy danh sách slot rảnh của giảng viên theo GET /api/v1/slots
  const fetchSlots = async () => {
    try {
      const res = await api.get("/api/v1/slots");
      setSlots(res.data.content || res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách slot:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Xử lý tạo slot mới khớp chuẩn POST /api/v1/slots trong Swagger[cite: 8]
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        startTime: `${newSlotForm.startDate}T${newSlotForm.startTime}:00.000Z`,
        endTime: `${newSlotForm.endDate}T${newSlotForm.endTime}:00.000Z`,
        durationMinutes: Number(newSlotForm.durationMinutes),
        capacity: Number(newSlotForm.capacity),
        locationType: newSlotForm.locationType,
        meetingUrl: newSlotForm.meetingUrl,
      };

      await api.post("/api/v1/slots", payload);
      alert("Tạo khung giờ rảnh thành công!");
      setNewSlotForm({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        durationMinutes: 45,
        capacity: 1,
        locationType: "ONLINE",
        meetingUrl: "",
      });
      fetchSlots();
    } catch (err) {
      console.error("Lỗi tạo slot:", err);
      alert(err.response?.data?.message || "Không thể tạo khung giờ rảnh. Vui lòng kiểm tra lại dữ liệu.");
    }
  };

  // Duyệt hoặc từ chối booking
  const handleApproveBooking = async (slotId, status) => {
    try {
      await api.put(`/api/v1/slots/${slotId}`, { status });
      alert(`Đã cập nhật trạng thái lịch hẹn thành công!`);
      fetchSlots();
    } catch (err) {
      console.error("Lỗi cập nhật lịch hẹn:", err);
      alert("Thực hiện thất bại.");
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          Instructor · Lịch hẹn & Booking
        </span>
        <h1 className="text-xl font-black">
          Quản lý Khung giờ rảnh & Lịch hẹn tư vấn
        </h1>
        <p className="text-xs text-[#6B635B]">
          Thiết lập lịch rảnh (Calendly-style) và phê duyệt yêu cầu đặt lịch từ các nhóm sinh viên.
        </p>
      </div>

      {/* Form tạo Time Slot mới khớp chuẩn Swagger */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Mở khung giờ rảnh mới (Time Slots)
        </h3>
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#6B635B]">Thời gian bắt đầu *</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={newSlotForm.startDate}
                  onChange={(e) => setNewSlotForm({ ...newSlotForm, startDate: e.target.value })}
                  className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                />
                <input
                  type="time"
                  required
                  value={newSlotForm.startTime}
                  onChange={(e) => setNewSlotForm({ ...newSlotForm, startTime: e.target.value })}
                  className="w-32 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#6B635B]">Thời gian kết thúc *</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={newSlotForm.endDate}
                  onChange={(e) => setNewSlotForm({ ...newSlotForm, endDate: e.target.value })}
                  className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                />
                <input
                  type="time"
                  required
                  value={newSlotForm.endTime}
                  onChange={(e) => setNewSlotForm({ ...newSlotForm, endTime: e.target.value })}
                  className="w-32 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#6B635B]">Thời lượng (Phút)</label>
              <input
                type="number"
                value={newSlotForm.durationMinutes}
                onChange={(e) => setNewSlotForm({ ...newSlotForm, durationMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#6B635B]">Hình thức (Location Type)</label>
              <select
                value={newSlotForm.locationType}
                onChange={(e) => setNewSlotForm({ ...newSlotForm, locationType: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#6B635B]">Đường dẫn họp (Meeting URL)</label>
              <input
                type="text"
                placeholder="https://meet.google.com/..."
                value={newSlotForm.meetingUrl}
                onChange={(e) => setNewSlotForm({ ...newSlotForm, meetingUrl: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md">
            + Tạo khung giờ rảnh
          </button>
        </form>
      </div>

      {/* Danh sách Slots */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Danh sách khung giờ rảnh ({slots.length})
        </h3>
        <div className="divide-y divide-[#E8E2D9]">
          {loading ? (
            <p className="text-xs text-[#6B635B] py-4">Đang tải lịch hẹn...</p>
          ) : slots.length > 0 ? (
            slots.map((slot) => (
              <div key={slot.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#2C2825]">
                      📅 Bắt đầu: {new Date(slot.startTime).toLocaleString()}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                      {slot.durationMinutes || 45} phút
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B635B]">
                    Kết thúc: {new Date(slot.endTime).toLocaleString()} • Hình thức: <strong className="text-[#2C2825]">{slot.locationType}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 font-bold rounded-full text-[10px] ${
                    slot.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-200"
                  }`}>
                    {slot.status || "AVAILABLE"}
                  </span>

                  {slot.status === "PENDING_APPROVAL" && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleApproveBooking(slot.id, "BOOKED")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-[11px] cursor-pointer"
                      >
                        Phê duyệt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#6B635B] italic py-4">
              Chưa có khung giờ rảnh nào được tạo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}