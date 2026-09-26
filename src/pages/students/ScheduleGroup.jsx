import React, { useState, useEffect } from "react";
import {
  getSlots,
  bookSlot,
  cancelBooking,
  getGroupBookings,
} from "../../services/scheduleService";
import {
  getTopicQuestions,
  addTopicQuestion,
} from "../../services/topicService";

export default function ScheduleGroup({ groupId, topicId }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho phần Câu hỏi trước buổi họp (Pre-meeting Questions)
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDateStr, setSelectedDateStr] = useState(
    today.toISOString().split("T")[0],
  );

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
      const resSlots = await getSlots({ status: "AVAILABLE" }).catch(() => []);
      setAvailableSlots(resSlots.content || resSlots || []);

      if (groupId) {
        const resBookings = await getGroupBookings(groupId).catch(() => []);
        setMyBookings(resBookings.content || resBookings || []);
      }

      if (topicId) {
        setQuestionLoading(true);
        const resQuestions = await getTopicQuestions(topicId).catch(() => []);
        setQuestions(resQuestions.content || resQuestions || []);
      }
    } catch (err) {
      console.warn("Lỗi tải dữ liệu lịch hẹn:", err);
    } finally {
      setLoading(false);
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId, topicId]);

  const handleBook = async (slotId) => {
    if (!window.confirm("Xác nhận đặt lịch hẹn khung giờ này cho nhóm?"))
      return;
    try {
      await bookSlot(slotId, {
        groupId: groupId,
        notes: "Nhóm đăng ký buổi gặp GVHD",
      });
      alert("Đặt lịch hẹn thành công! (Chờ GVHD phê duyệt)");
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Đặt lịch thất bại. Lưu ý quy định phải đặt trước ít nhất 24 giờ và hoàn thành buổi meeting cũ!";
      alert(msg);
    }
  };

  const handleCancel = async (booking) => {
    const slotStartTime = new Date(booking.startTime || booking.slotTime);
    const now = new Date();
    const hoursDifference = (slotStartTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 12) {
      alert(
        "Đã quá thời hạn tự hủy (dưới 12 giờ trước giờ hẹn). Vui lòng liên hệ trực tiếp Giảng viên hướng dẫn để được hỗ trợ hủy/dời lịch (Late Cancellation).",
      );
      return;
    }

    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy lịch hẹn này? (Hủy trước 12h không bị ghi nhận vi phạm)",
      )
    )
      return;

    try {
      await cancelBooking(booking.id);
      alert("Hủy lịch hẹn thành công!");
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể hủy lịch do vi phạm thời hạn cho phép.";
      alert(msg);
    }
  };

  // Gửi câu hỏi mới trước buổi họp
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    if (!topicId) {
      alert("Nhóm cần được gán đề tài để gửi câu hỏi thảo luận!");
      return;
    }

    try {
      const payload = { questionText: newQuestion.trim() };
      await addTopicQuestion(topicId, payload);
      alert("Đã gửi câu hỏi thành công cho GVHD!");
      setNewQuestion("");
      
      const resQuestions = await getTopicQuestions(topicId);
      setQuestions(resQuestions.content || resQuestions || []);
    } catch (err) {
      alert("Gửi câu hỏi thất bại!");
    }
  };

  // --- LỌC SLOTS THEO NGÀY ---
  const filteredSlots = availableSlots.filter((slot) => {
    const slotDateStr = new Date(slot.startTime).toISOString().split("T")[0];
    return slotDateStr === selectedDateStr;
  });

  // --- LỊCH THÁNG ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
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
      dateStr: new Date(year, month - 1, prevTotalDays - i)
        .toISOString()
        .split("T")[0],
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
              Lịch hẹn & Câu hỏi thảo luận GVHD
            </h1>
            <span className="px-2.5 py-0.5 bg-orange-50 text-[#E65100] font-extrabold rounded-md text-xs">
              Kỳ 1 - Spring 2026
            </span>
          </div>
          <p className="text-xs text-[#6B635B]">
            Quản lý lịch hẹn, đặt slot trống và chuẩn bị câu hỏi trước buổi gặp giảng viên hướng dẫn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              alert(
                "Quy định gặp GVHD:\n- Đặt lịch trước ít nhất 24h.\n- Tối đa 1 slot/ngày.\n- Hủy chuẩn trước >= 12h.",
              )
            }
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C2825] text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📖</span>
            <span>Quy định đặt lịch</span>
          </button>
        </div>
      </div>

      {/* 2. LAYOUT CHÍNH CHIA 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: LỊCH THÁNG */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-[#2C2825]">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 px-2 cursor-pointer"
                >
                  &lt;
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 bg-[#FBF9F5] border text-[11px] font-bold rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 px-2 cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6B635B]">
              Chọn ngày để xem slot trống
            </p>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#6B635B]">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {calendarCells.map((cell, idx) => {
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = todayStr === cell.dateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`p-2 relative rounded-xl font-bold transition flex items-center justify-center h-9 cursor-pointer ${
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
        </div>

        {/* CỘT PHẢI: LỊCH HẸN, SLOT RẢNH & GỬI CÂU HỎI */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lịch hẹn hiện tại */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="font-black text-sm text-[#2C2825]">
                Lịch hẹn hiện tại của nhóm
              </h3>
              <span className="text-[11px] text-[#6B635B]">
                {myBookings.length} lịch hẹn
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
                        {b.status || "BOOKED"}
                      </span>
                      <button
                        onClick={() => handleCancel(b)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition cursor-pointer"
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

          {/* TÍCH HỢP MODULE PRE-MEETING QUESTIONS */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="border-b border-[#E8E2D9] pb-3">
              <h3 className="font-black text-sm text-[#2C2825]">
                💬 Câu hỏi thảo luận trước buổi gặp (Pre-meeting Questions)
              </h3>
              <p className="text-[11px] text-[#6B635B]">
                Gửi thắc mắc hoặc nội dung cần GVHD tư vấn trước khi họp.
              </p>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3">
              <textarea
                rows={2}
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Nhập nội dung thắc mắc, vấn đề code hoặc kiến trúc cần thảo luận..."
                className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                + Gửi câu hỏi cho GVHD
              </button>
            </form>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase text-[#6B635B]">
                Lịch sử câu hỏi ({questions.length})
              </h4>
              {questionLoading ? (
                <p className="text-xs text-[#6B635B] py-2">
                  Đang tải câu hỏi...
                </p>
              ) : questions.length > 0 ? (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-2 text-xs"
                    >
                      <p className="font-bold text-[#2C2825]">❓ {q.content}</p>
                      {q.instructorAnswer && (
                        <div className="p-2.5 bg-white rounded-xl border border-orange-100 space-y-1">
                          <p className="font-bold text-[#E65100]">
                            💡 Phản hồi từ GVHD:
                          </p>
                          <p className="text-[#6B635B]">{q.instructorAnswer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B635B] italic py-2">
                  Chưa có câu hỏi nào được gửi cho đề tài này.
                </p>
              )}
            </div>
          </div>

          {/* Khung giờ rảnh theo ngày đã chọn */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-black text-sm text-[#2C2825]">
                  Khung giờ rảnh ngày {selectedDateStr}
                </h3>
                <p className="text-[11px] text-[#6B635B]">
                  Áp dụng quy tắc đặt trước tối thiểu 24h
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
                {filteredSlots.map((slot) => {
                  const slotTime = new Date(slot.startTime);
                  const now = new Date();
                  const hoursUntilSlot = (slotTime - now) / (1000 * 60 * 60);
                  const isTooLateToBook = hoursUntilSlot < 24;

                  return (
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
                            📅 {new Date(slot.startTime).toLocaleString()} • Sức
                            chứa:{" "}
                            <strong className="text-emerald-600">1 nhóm</strong>
                          </p>
                          {isTooLateToBook && (
                            <p className="text-[10px] text-red-500 font-bold">
                              ⚠️ Không đủ 24h trước giờ hẹn (Đã khóa đặt lịch)
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBook(slot.id)}
                        disabled={isTooLateToBook}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shadow-sm w-full sm:w-auto ${
                          isTooLateToBook
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#E65100] hover:bg-[#D84315] text-white cursor-pointer"
                        }`}
                      >
                        {isTooLateToBook ? "Đã khóa (<24h)" : "Đặt lịch ngay"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B635B] py-6 text-center italic">
                Không có khung giờ rảnh nào vào ngày {selectedDateStr} thỏa mãn.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}