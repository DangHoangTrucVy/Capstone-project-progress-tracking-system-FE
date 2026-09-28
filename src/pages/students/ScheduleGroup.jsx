import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function ScheduleGroup({ groupId, topicId }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Chỉ gọi các endpoint có thực trên Swagger (/slots và /topics/{id}/questions)
      const [slotsRes, qRes] = await Promise.all([
        api.get("/slots").catch(() => ({ data: [] })),
        topicId
          ? api.get(`/topics/${topicId}/questions`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      setAvailableSlots(slotsRes.data.content || slotsRes.data || []);
      setQuestions(qRes.data.content || qRes.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu lịch hẹn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, topicId]);

  const handleBookSlot = async (slotId, slotStartTime) => {
    // Ràng buộc Giai đoạn 3.2: Phải đặt trước ít nhất 24 giờ
    const slotDate = new Date(slotStartTime);
    const now = new Date();
    const diffHours = (slotDate - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      alert(
        "Quy chế bắt buộc: Phải đặt lịch hẹn trước ít nhất 24 giờ so với thời gian diễn ra!",
      );
      return;
    }

    try {
      // Khớp chuẩn POST /api/v1/slots/{id}/book từ Swagger
      await api.post(`/slots/${slotId}/book`, { groupId });
      alert("Đặt lịch hẹn tư vấn 1:1 thành công!");
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Đặt lịch thất bại. Lưu ý mỗi ngày chỉ được tối đa 1 slot và phải hoàn thành meeting cũ.",
      );
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !topicId) {
      alert("Vui lòng nhập nội dung câu hỏi hoặc kiểm tra đề tài!");
      return;
    }

    try {
      await api.post(`/topics/${topicId}/questions`, {
        content: newQuestion.trim(),
      });
      alert("Đã gửi câu hỏi vào ngân hàng Pre-meeting thành công!");
      setNewQuestion("");
      fetchData();
    } catch (err) {
      alert("Gửi câu hỏi thất bại.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          Giai đoạn 3 · Đặt lịch hẹn tư vấn 1:1 & Pre-meeting
        </span>
        <h1 className="text-xl font-black">
          Lịch hẹn Giảng viên hướng dẫn (Instructor)
        </h1>
        <p className="text-xs text-[#6B635B]">
          Đặt lịch trước ít nhất 24 giờ và gửi câu hỏi thảo luận trọng tâm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách slot */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Danh sách khung giờ (Slots)
          </h3>
          {loading ? (
            <p className="text-xs text-[#6B635B]">Đang tải lịch...</p>
          ) : availableSlots.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-bold text-[#2C2825]">
                      📅 {new Date(slot.startTime).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#6B635B]">
                      Trạng thái:{" "}
                      <strong className="text-[#E65100]">{slot.status}</strong>
                    </p>
                  </div>
                  {slot.status === "AVAILABLE" && (
                    <button
                      onClick={() => handleBookSlot(slot.id, slot.startTime)}
                      className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer"
                    >
                      Đặt lịch
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B635B] italic">
              Chưa có khung giờ nào.
            </p>
          )}
        </div>

        {/* Ngân hàng câu hỏi Pre-meeting */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Ngân hàng câu hỏi Pre-meeting ({questions.length})
          </h3>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <textarea
              rows={2}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Nhập thắc mắc cần tư vấn trước buổi họp..."
              className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              + Gửi câu hỏi thảo luận
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-3 bg-[#FBF9F5] rounded-xl border text-xs space-y-1"
              >
                <p className="font-bold text-[#2C2825]">
                  ❓{" "}
                  {q.content ||
                    q.questionText ||
                    q.title ||
                    q.text ||
                    q.question ||
                    "Nội dung câu hỏi"}
                </p>
                {q.instructorAnswer && (
                  <p className="text-orange-600 font-medium">
                    💡 Phản hồi: {q.instructorAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
