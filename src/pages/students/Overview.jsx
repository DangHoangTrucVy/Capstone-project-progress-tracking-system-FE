import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Overview({ groupData, onGroupUpdated }) {
  const [topics, setTopics] = useState([]);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(
    groupData?.topicId || "",
  );
  const [loading, setLoading] = useState(false);

  // Tải danh sách đề tài đã publish để Trưởng nhóm chọn
  useEffect(() => {
    const fetchPublishedTopics = async () => {
      try {
        const res = await api.get("/topics", {
          params: { status: "PUBLISHED" },
        });
        setTopics(res.data.content || res.data || []);
      } catch (err) {
        console.error("Không thể tải danh sách đề tài:", err);
      }
    };
    fetchPublishedTopics();
  }, []);

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Đảm bảo gửi đầy đủ các trường bắt buộc mà Backend yêu cầu (bao gồm cả status)
      await api.put(`/groups/${groupData.id}`, {
        groupCode: groupData.groupCode,
        semester: groupData.semester,
        status: groupData.status || "FORMED", // Bổ sung trường status để vượt qua validation
        topicId: selectedTopicId || null,
        supervisorId: groupData.supervisorId || null,
      });
      alert("Chọn đề tài cho nhóm thành công!");
      setIsEditingTopic(false);
      if (onGroupUpdated) onGroupUpdated();
      window.location.reload();
    } catch (err) {
      console.error("Lỗi cập nhật đề tài:", err.response?.data);
      alert(
        err.response?.data?.message || "Không thể cập nhật đề tài cho nhóm.",
      );
    } finally {
      setLoading(false);
    }
  };

  const topicName =
    groupData?.topicTitle ||
    groupData?.topic?.title ||
    "Đồ án tốt nghiệp chưa chọn đề tài";
  const semesterName = groupData?.semester || "Spring2026";
  const groupCode = groupData?.groupCode || "N/A";
  const supervisorName =
    groupData?.supervisorName ||
    groupData?.supervisor?.fullName ||
    "Chưa phân công";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner chào mừng & Thông tin đề tài */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 flex-1">
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-full">
            Học kỳ: {semesterName}
          </span>

          {!isEditingTopic ? (
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-[#2C2825]">
                {topicName}
              </h1>
              <div className="flex items-center space-x-3">
                <p className="text-xs text-[#6B635B]">
                  Mã nhóm:{" "}
                  <strong className="text-[#2C2825]">{groupCode}</strong> ·
                  GVHD:{" "}
                  <strong className="text-[#2C2825]">{supervisorName}</strong>
                </p>
                <button
                  onClick={() => setIsEditingTopic(true)}
                  className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-[#E65100] text-[11px] font-bold rounded-xl transition"
                >
                  ✏️{" "}
                  {groupData?.topicId ? "Đổi đề tài" : "Chọn đề tài cho nhóm"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateTopic} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-[#2C2825]">
                Chọn đề tài đồ án từ danh sách hệ thống:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  required
                >
                  <option value="">-- Chọn đề tài --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topicCode ? `[${t.topicCode}] ` : ""}
                      {t.title} ({t.category})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTopic(false)}
                  className="px-4 py-2.5 bg-gray-100 text-[#6B635B] text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-[#FBF9F5] px-6 py-4 rounded-2xl border border-[#E8E2D9] text-center shrink-0">
          <p className="text-[11px] font-bold text-[#6B635B]">
            Trạng thái nhóm
          </p>
          <p className="text-sm font-extrabold text-[#E65100] mt-0.5">
            {groupData?.status || "FORMED"}
          </p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
          <p className="text-xs font-bold text-[#6B635B]">Thành viên nhóm</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#2C2825]">
              {groupData?.members?.length || 1}/5
            </span>
            <span className="text-xs text-[#E65100] font-bold">Thành viên</span>
          </div>
          <p className="text-[11px] text-[#9E958C] pt-2">
            Đã tối ưu phân quyền
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
          <p className="text-xs font-bold text-[#6B635B]">Mã nhóm</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#2C2825]">
              {groupCode}
            </span>
          </div>
          <p className="text-[11px] text-green-600 font-bold pt-2">
            Hoạt động bình thường ✓
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
          <p className="text-xs font-bold text-[#6B635B]">Vai trò hệ thống</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#E65100]">
              Group Leader
            </span>
          </div>
          <p className="text-[11px] text-[#9E958C] pt-2">
            Toàn quyền quản lý nhóm
          </p>
        </div>
      </div>
    </div>
  );
}
