import React, { useState, useEffect } from "react";
import { getGroupProgress, createGroupProgress } from "../../services/progressService";

export default function WeeklyProgressManagement({ groupId = "default-group-id" }) {
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProgress, setNewProgress] = useState({
    weekNumber: 1,
    summary: "",
    completedTasks: "",
    pendingTasks: "",
    percentage: 10,
  });

  const fetchProgress = async () => {
    try {
      const res = await getGroupProgress(groupId);
      setProgressList(res.content || res || []);
    } catch (err) {
      console.error("Lỗi tải tiến độ tuần:", err);
      setProgressList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchProgress();
  }, [groupId]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      await createGroupProgress(groupId, newProgress);
      alert("Nộp báo cáo tiến độ tuần thành công!");
      setNewProgress({
        weekNumber: progressList.length + 1,
        summary: "",
        completedTasks: "",
        pendingTasks: "",
        percentage: Math.min(100, newProgress.percentage + 15),
      });
      fetchProgress();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi báo cáo tiến độ.");
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-5xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          Group Progress · Báo cáo tuần & Tiến độ
        </span>
        <h1 className="text-xl font-black">Quản lý Tiến độ Hàng Tuần (Weekly Progress)</h1>
        <p className="text-xs text-[#6B635B]">
          Cập nhật công việc đã làm, việc tồn đọng và tỷ lệ hoàn thành đồ án qua từng tuần.
        </p>
      </div>

      {/* Form nộp báo cáo tuần */}
      <form onSubmit={handleSubmitReport} className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Gửi báo cáo tiến độ tuần mới</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#6B635B]">Tuần số (Week Number) *</label>
            <input
              type="number"
              required
              value={newProgress.weekNumber}
              onChange={(e) => setNewProgress({ ...newProgress, weekNumber: Number(e.target.value) })}
              className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#6B635B]">Tỷ lệ hoàn thành tổng thể (%) *</label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={newProgress.percentage}
              onChange={(e) => setNewProgress({ ...newProgress, percentage: Number(e.target.value) })}
              className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#6B635B]">Tóm tắt công việc trong tuần *</label>
          <textarea
            rows={2}
            required
            value={newProgress.summary}
            onChange={(e) => setNewProgress({ ...newProgress, summary: e.target.value })}
            placeholder="Đã hoàn thành các chức năng đăng nhập, đăng ký và thiết kế database..."
            className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
        >
          + Gửi báo cáo tuần
        </button>
      </form>

      {/* Danh sách báo cáo tiến độ */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Lịch sử báo cáo các tuần</h3>
        <div className="divide-y divide-[#E8E2D9]">
          {loading ? (
            <p className="text-xs text-[#6B635B] py-4">Đang tải lịch sử tiến độ...</p>
          ) : progressList.length > 0 ? (
            progressList.map((item) => (
              <div key={item.id} className="py-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-black text-[#2C2825]">📅 Tuần {item.weekNumber}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold">
                    Hoàn thành: {item.percentage || 0}%
                  </span>
                </div>
                <p className="text-[#6B635B]">{item.summary}</p>
                {item.supervisorFeedback && (
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-[11px] text-[#E65100]">
                    <strong>Nhận xét của GVHD:</strong> {item.supervisorFeedback}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#6B635B] italic py-4">Chưa có báo cáo tiến độ nào được ghi nhận.</p>
          )}
        </div>
      </div>
    </div>
  );
}