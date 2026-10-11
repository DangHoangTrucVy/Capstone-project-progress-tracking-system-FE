import { useState, useEffect, useCallback } from "react";
import { getSlots, bookSlot, cancelBooking as cancelGroupBooking, getTopicQuestions, submitTopicQuestion } from '../../services/schedulingService';
import { apiError } from '../../utils/apiError';

export default function ScheduleGroup({ groupId, topicId, isLeader }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [bookingId, setBookingId] = useState(() => localStorage.getItem(`booking:${groupId}`) || '');
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Chỉ gọi các endpoint có thực trên Swagger (/slots và /topics/{id}/questions)
      const [slotsRes, qRes] = await Promise.all([
        getSlots({ page, size: 20 }),
        topicId
          ? getTopicQuestions(topicId)
          : Promise.resolve([]),
      ]);

      setAvailableSlots(slotsRes.content || slotsRes || []);
      setTotalPages(slotsRes.totalPages || 0);
      setQuestions(qRes.content || qRes || []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, topicId]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleBookSlot = async (slotId, slotStartTime) => {
    if (busy || !isLeader || !groupId) return;
    // Ràng buộc Giai đoạn 3.2: Phải đặt trước ít nhất 24 giờ
    const slotDate = new Date(slotStartTime);
    const now = new Date();
    const diffHours = (slotDate - now) / (1000 * 60 * 60);

    if (!Number.isFinite(diffHours) || diffHours < 24) {
      alert(
        "Quy chế bắt buộc: Phải đặt lịch hẹn trước ít nhất 24 giờ so với thời gian diễn ra!",
      );
      return;
    }

    setBusy(true);
    try {
      // Khớp chuẩn POST /api/v1/slots/{id}/book từ Swagger
      const response = await bookSlot(slotId, groupId);
      if (response.id) { setBookingId(response.id); localStorage.setItem(`booking:${groupId}`, response.id); }
      alert("Đặt lịch hẹn tư vấn 1:1 thành công!");
      fetchData();
    } catch (err) {
      alert(
        apiError(err),
      );
    } finally { setBusy(false); }
  };

  const cancelBooking = async event => {
    event.preventDefault(); if (busy || !isLeader || !bookingId.trim() || !cancelReason.trim()) return;
    if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn?')) return;
    setBusy(true); setError('');
    try {
      await cancelGroupBooking(bookingId.trim(), cancelReason.trim());
      localStorage.removeItem(`booking:${groupId}`); setBookingId(''); setCancelReason(''); await fetchData();
      alert('Đã hủy lịch hẹn.');
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (busy || !isLeader || !newQuestion.trim() || !topicId) {
      alert("Vui lòng nhập nội dung câu hỏi hoặc kiểm tra đề tài!");
      return;
    }

    setBusy(true);
    try {
      await submitTopicQuestion(topicId, newQuestion.trim());
      alert("Đã gửi câu hỏi vào ngân hàng Pre-meeting thành công!");
      setNewQuestion("");
      fetchData();
    } catch (err) { alert(apiError(err)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {error && <p role="alert" className="bg-red-50 p-4 text-red-700">{error}</p>}
      <button disabled={loading || busy} onClick={fetchData}>Làm mới lịch</button>
      <div className="flex gap-4"><button disabled={loading || page === 0} onClick={() => setPage(p => p - 1)}>Trang trước</button><span>{page + 1} / {Math.max(1, totalPages)}</span><button disabled={loading || page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button></div>
      {isLeader && <form onSubmit={cancelBooking} className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="font-bold">Hủy lịch đã đặt</h2><p className="text-sm">Mã lịch vừa đặt được lưu trên trình duyệt này. Bạn có thể nhập mã lịch đã đặt từ thiết bị khác.</p><input aria-label="Mã lịch hẹn" className="border rounded-xl p-3 w-full" value={bookingId} onChange={e => setBookingId(e.target.value)} required placeholder="Booking ID" disabled={busy} /><input aria-label="Lý do hủy lịch" className="border rounded-xl p-3 w-full" value={cancelReason} onChange={e => setCancelReason(e.target.value)} required placeholder="Lý do hủy" disabled={busy} /><button disabled={busy || !bookingId.trim() || !cancelReason.trim()} className="text-red-700">{busy ? 'Đang xử lý...' : 'Hủy lịch hẹn'}</button></form>}
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
                  {isLeader && slot.status === 'AVAILABLE' && (
                    <button
                      disabled={busy}
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
            {!topicId && <p className="text-sm">Nhóm chưa được gán đề tài để gửi câu hỏi.</p>}
            <textarea
              disabled={busy || !isLeader || !topicId}
              rows={2}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Nhập thắc mắc cần tư vấn trước buổi họp..."
              className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              required
            />
            <button
              type="submit"
              disabled={busy || !isLeader || !topicId || !newQuestion.trim()}
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
