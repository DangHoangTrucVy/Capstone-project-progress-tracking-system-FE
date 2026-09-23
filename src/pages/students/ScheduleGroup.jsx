import React, { useState, useEffect } from "react";
import {
  getSlots,
  bookSlot,
  cancelBooking,
  getGroupBookings,
} from "../../services/scheduleService";
import { getUsers } from "../../services/userService"; // Thêm service lấy users

export default function ScheduleGroup({ groupId }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [instructors, setInstructors] = useState([]); // State chứa danh sách giảng viên từ BE
  const [loading, setLoading] = useState(false);

  // Lấy ngày hiện tại thực tế
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDateStr, setSelectedDateStr] = useState(
    today.toISOString().split("T")[0]
  );

  const [instructorFilter, setInstructorFilter] = useState("ALL");
  const [meetingType, setMeetingType] = useState("ALL");

  // Hàm hỗ trợ lấy tên giảng viên an toàn từ bất kỳ cấu trúc dữ liệu nào của BE
  const getInstructorName = (item) => {
    if (!item) return "Giảng viên hướng dẫn";
    return (
      item.instructorName ||
      item.instructor?.fullName ||
      item.instructorFullName ||
      item.supervisorName ||
      item.supervisor?.fullName ||
      "TS. Giảng viên"
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Gọi API lấy danh sách slots rảnh
      const resSlots = await getSlots({ status: "AVAILABLE" });
      setAvailableSlots(resSlots.content || resSlots || []);

      // 2. Gọi API lấy danh sách bookings của nhóm
      if (groupId) {
        const resBookings = await getGroupBookings(groupId);
        setMyBookings(resBookings.content || resBookings || []);
      }

      // 3. Gọi API lấy danh sách người dùng để lọc Giảng viên (Role: INSTRUCTOR hoặc lấy từ danh sách users)
      const resUsers = await getUsers().catch(() => []);
      const userList = resUsers.content || resUsers || [];
      // Lọc ra các tài khoản có role là INSTRUCTOR hoặc ADMIN (giảng viên)
      const instructorList = userList.filter(
        (u) => u.role === "INSTRUCTOR" || u.role === "ADMIN"
      );
      setInstructors(instructorList);

    } catch (err) {
      console.error("Lỗi tải dữ liệu lịch hẹn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId]);

  const handleBook = async (slotId) => {
    if (!window.confirm("Xác nhận đặt lịch hẹn khung giờ này cho nhóm?"))
      return;
    try {
      await bookSlot(slotId, {
        groupId: groupId,
        notes: "Nhóm đăng ký buổi gặp GVHD",
      });
      alert("Đặt lịch hẹn thành công!");
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Đặt lịch thất bại, khung giờ có thể đã được nhóm khác đặt trước!";
      alert(msg);
    }
  };

  const handleCancel = async (bookingId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy lịch hẹn này? (Lưu ý quy định cửa sổ hủy trễ)",
      )
    )
      return;
    try {
      await cancelBooking(bookingId);
      alert("Hủy lịch hẹn thành công!");
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể hủy lịch do vi phạm thời hạn cho phép hủy trễ (late-cancellation window).";
      alert(msg);
    }
  };

  // --- LỌC SLOTS THEO GIẢNG VIÊN VÀ HÌNH THỨC ---
  const filteredSlots = availableSlots.filter((slot) => {
    const matchInstructor =
      instructorFilter === "ALL" ||
      slot.instructorId === instructorFilter ||
      slot.instructorName === instructorFilter;
    
    const matchType =
      meetingType === "ALL" || slot.locationType === meetingType;

    return matchInstructor && matchType;
  });

  // --- LOGIC TẠO LỊCH ĐỘNG THEO THÁNG THỰC TẾ ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  const calendarCells = [];
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevTotalDays - i,
      isCurrentMonth: false,
      dateStr: new Date(year, month - 1, prevTotalDays - i).toISOString().split("T")[0],
    });
  }
  for (let i = 1; i <= totalDays; i++) {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      dateStr: dStr,
    });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateStr: new Date(year, month + 1, i).toISOString().split("T")[0],
    });
  }

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {/* 1. TOP BANNER TIÊU ĐỀ */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#2C2825]">
              Lịch hẹn của nhóm đồ án
            </h1>
            <span className="px-2.5 py-0.5 bg-orange-50 text-[#E65100] font-extrabold rounded-md text-xs">
              Kỳ 1 - Spring 2026
            </span>
          </div>
          <p className="text-xs text-[#6B635B]">
            Trưởng nhóm có thể chọn khung giờ trống hoặc hủy/dời lịch hẹn đã đặt
            trước đó theo quy định.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              alert(
                "Quy định gặp GVHD: Mỗi nhóm tối đa 2 buổi/tuần. Hủy lịch trước ít nhất 24 giờ.",
              )
            }
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C2825] text-xs font-bold rounded-2xl transition flex items-center gap-1.5"
          >
            <span>📖</span>
            <span>Quy định gặp GVHD</span>
          </button>
        </div>
      </div>

      {/* 2. LAYOUT CHÍNH CHIA 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: LỊCH THÁNG & BỘ LỌC TỪ BE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Lịch tháng thời gian thực */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-[#2C2825]">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 px-2"
                >
                  &lt;
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 bg-[#FBF9F5] border text-[11px] font-bold rounded-lg hover:bg-gray-100"
                >
                  Hôm nay
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 px-2"
                >
                  &gt;
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6B635B]">Lịch biểu chính thức</p>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#6B635B]">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {calendarCells.map((cell, idx) => {
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = todayStr === cell.dateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`p-2 relative rounded-xl font-bold transition flex items-center justify-center h-9 ${
                      isSelected
                        ? "bg-[#E65100] text-white shadow-md"
                        : isToday
                        ? "border-2 border-[#E65100] text-[#E65100] bg-orange-50/50"
                        : cell.isCurrentMonth
                        ? "text-[#2C2825] hover:bg-gray-100"
                        : "text-gray-300"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bộ lọc giảng viên lấy động từ Backend */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <h3 className="font-black text-sm text-[#2C2825]">
              Bộ lọc giảng viên & hình thức
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#2C2825]">
                Giảng viên hướng dẫn (GVHD)
              </label>
              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              >
                <option value="ALL">Tất cả giảng viên ({instructors.length})</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.fullName} ({ins.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#2C2825]">
                Hình thức gặp gỡ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingType("ALL")}
                  className={`p-2.5 rounded-xl border text-center font-bold transition ${meetingType === "ALL" ? "bg-orange-50 border-[#E65100] text-[#E65100]" : "bg-[#FBF9F5] border-[#E8E2D9] text-[#6B635B]"}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingType("ONLINE")}
                  className={`p-2.5 rounded-xl border text-center font-bold transition ${meetingType === "ONLINE" ? "bg-orange-50 border-[#E65100] text-[#E65100]" : "bg-[#FBF9F5] border-[#E8E2D9] text-[#6B635B]"}`}
                >
                  Online / Lab
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LỊCH HẸN VÀ SLOT RẢNH */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Lịch hẹn hiện tại */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="font-black text-sm text-[#2C2825]">
                Lịch hẹn hiện tại của nhóm
              </h3>
              <span className="text-[11px] text-[#6B635B]">
                {myBookings.length} lịch hẹn đã xác nhận
              </span>
            </div>

            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 bg-linear-to-r from-orange-50/50 to-white rounded-2xl border border-orange-200 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">
                        GVHD Đã xác nhận
                      </span>
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition"
                      >
                        ✕ Hủy lịch
                      </button>
                    </div>

                    <h4 className="font-extrabold text-base text-[#2C2825]">
                      {b.title || b.notes || "Buổi trao đổi định hướng đồ án"}
                    </h4>

                    <div className="flex flex-wrap gap-4 text-xs text-[#6B635B]">
                      <span>
                        👨‍🏫 GVHD:{" "}
                        <strong className="text-[#2C2825]">
                          {getInstructorName(b)}
                        </strong>
                      </span>
                      <span>
                        🕒{" "}
                        <strong>
                          {new Date(
                            b.startTime || b.slotTime || Date.now(),
                          ).toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] text-xs text-[#6B635B]">
                <p className="font-bold text-[#2C2825]">
                  Chưa có lịch hẹn chính thức nào được xác nhận.
                </p>
              </div>
            )}
          </div>

          {/* Khung giờ rảnh thực tế từ Backend */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-black text-sm text-[#2C2825]">
                  Khung giờ rảnh có sẵn để đặt
                </h3>
                <p className="text-[11px] text-[#6B635B]">
                  Lấy dữ liệu trực tiếp từ API hệ thống
                </p>
              </div>
              <span className="text-xs font-bold text-[#E65100]">
                Tìm thấy: {filteredSlots.length} slot trống
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-[#6B635B] py-4 text-center">
                Đang tải danh sách slot...
              </p>
            ) : filteredSlots.length > 0 ? (
              <div className="space-y-3">
                {filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center px-3 py-2 bg-white rounded-xl border border-[#E8E2D9] shrink-0">
                        <span className="text-xs font-black text-[#E65100] block">
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] text-[#6B635B]">
                          {slot.durationMinutes || 45} min
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-[#2C2825]">
                            {getInstructorName(slot)}
                          </h4>
                          <span className="px-2 py-0.5 bg-orange-100 text-[#E65100] text-[9px] font-bold rounded">
                            {slot.locationType || "ONLINE"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B635B]">
                          📅 {new Date(slot.startTime).toLocaleString()} • Sức chứa:{" "}
                          <strong className="text-emerald-600">
                            {slot.capacity || 1} nhóm
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBook(slot.id)}
                      className="px-4 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition shadow-sm w-full sm:w-auto"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B635B] py-6 text-center italic">
                Hiện tại không có khung giờ rảnh nào phù hợp với bộ lọc.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}