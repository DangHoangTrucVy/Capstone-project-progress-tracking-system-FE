import React, { useState } from "react";
import api from "../../services/api";
import { getAllGroups } from "../../services/groupService";

export default function Overview({ groupData, onGroupUpdated, isLeader }) {
  const [topics, setTopics] = useState([]);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(
    groupData?.topicId || "",
  );
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const topicApprovalStatus = groupData?.status || "FORMED";
  const hasSubmittedTopic = Boolean(groupData?.topicId || groupData?.topic?.id);
  const isApproved = topicApprovalStatus === "ACTIVE";
  const groupMemberCount = groupData?.members?.length ?? 0;

  // Quy chế duyệt đề tài: Tối đa 4 lần, lần 1 là 14 ngày, từ lần 2 là 10 ngày do Admin mở cổng
  const attemptCount = groupData?.attemptCount || 1;
  const deadlineDays = attemptCount === 1 ? 14 : 10;

  const loadAvailableTopics = async () => {
    setLoadingTopics(true);
    try {
      const [topicsRes, groupsRes] = await Promise.all([
        api.get("/topics", { params: { status: "PUBLISHED" } }),
        getAllGroups(),
      ]);
      const topicList = topicsRes.data.content || topicsRes.data || [];
      const groupList = groupsRes?.content || groupsRes || [];
      const approvedTopicIds = new Set(
        groupList
          .filter((group) => group.status === "ACTIVE")
          .map((group) => group.topicId || group.topic?.id)
          .filter(Boolean)
          .map(String),
      );

      setTopics(
        topicList.filter((topic) => !approvedTopicIds.has(String(topic.id))),
      );
      return true;
    } catch (err) {
      console.error("Không thể tải danh sách đề tài:", err);
      setTopics([]);
      alert("Không thể tải danh sách đề tài. Vui lòng thử lại.");
      return false;
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleOpenTopicSelector = async () => {
    if (await loadAvailableTopics()) {
      setIsEditingTopic(true);
    }
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (isApproved) {
      alert("Đề tài đã được phê duyệt chính thức. Bạn không thể thay đổi đề tài nữa!");
      return;
    }
    if (!isLeader) {
      alert("Chỉ Trưởng nhóm (Leader) mới có quyền đăng ký và nộp đề tài.");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/groups/${groupData.id}`, {
        groupCode: groupData.groupCode,
        semester: groupData.semester,
        status: "FORMED",
        topicId: selectedTopicId,
        supervisorId: groupData.supervisorId || null,
      });
      alert("Đã gửi danh sách/đề tài sơ bộ thành công! Hệ thống đã tự động thông báo đến GVHD và gửi email CC cho thành viên.");
      setIsEditingTopic(false);

      if (onGroupUpdated) {
        onGroupUpdated();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Lỗi cập nhật đề tài:", err.response?.data);
      alert(err.response?.data?.message || "Không thể gửi yêu cầu chọn đề tài.");
    } finally {
      setLoading(false);
    }
  };

  const topicName = groupData?.topicTitle || groupData?.topic?.title || "Đồ án tốt nghiệp: Chưa chọn đề tài chính thức";
  const semesterName = groupData?.semester || "Spring2026";
  const groupCode = groupData?.groupCode || "N/A";
  const supervisorName = groupData?.supervisorName || groupData?.supervisor?.fullName || "Chưa phân công (Admin phân bổ sau khi duyệt)";

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {/* Top Banner Trạng thái */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-50 text-[#E65100] font-bold rounded-full">
              Học kỳ: {semesterName}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-[#2C2825] font-bold rounded-full">
              Mã nhóm: {groupCode}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-[#6B635B] font-bold rounded-full">
              Khoa Công nghệ thông tin
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                ✓ ĐÃ ĐƯỢC PHÊ DUYỆT CHÍNH THỨC (ACTIVE)
              </span>
            ) : hasSubmittedTopic ? (
              <span className="font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-[11px] border border-amber-200">
                ⏳ ĐANG CHỜ HỘI ĐỒNG / ADMIN DUYỆT
              </span>
            ) : (
              <span className="font-extrabold text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-[11px] border border-gray-200">
                CHƯA GỬI ĐỀ TÀI SƠ BỘ
              </span>
            )}
          </div>
        </div>

        {/* Quy chế tối đa 4 lần duyệt */}
        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div>
            <span className="font-black text-[#E65100]">Quy chế thẩm định đề tài: </span>
            <span className="font-bold text-[#2C2825]">Lần {attemptCount} / 4 lần tối đa</span>
          </div>
          <span className="text-[11px] text-[#6B635B]">
            Thời hạn đợt hiện tại: <strong className="text-[#2C2825]">{deadlineDays} ngày</strong> {attemptCount > 1 ? "(Admin đã mở cổng đợt tiếp theo)" : ""}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-black uppercase text-[#9E958C] tracking-wider">
            Đề tài đồ án tốt nghiệp
          </p>

          {!isEditingTopic ? (
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-black text-[#2C2825] leading-snug">
                {topicName}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <p className="text-xs text-[#6B635B]">
                  Người hướng dẫn (Instructor):{" "}
                  <strong className="text-[#2C2825]">{supervisorName}</strong>
                </p>

                <div className="flex items-center gap-2.5">
                  {!isApproved && isLeader && (
                    <button
                      onClick={handleOpenTopicSelector}
                      disabled={loadingTopics}
                      className="px-4 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🎯</span>
                      <span>
                        {loadingTopics ? "Đang tải đề tài..." : groupData?.topicId ? "Đổi đề tài / Gửi lại" : "Nộp đề tài sơ bộ"}
                      </span>
                    </button>
                  )}

                  {isApproved && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      🔒 Đề tài đã khóa độc quyền
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateTopic} className="space-y-3 pt-2 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
              <label className="block text-xs font-bold text-[#2C2825]">
                Chọn đề tài từ danh sách để gửi cho Instructor và Hội đồng thẩm định:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  required
                >
                  <option value="">
                    {topics.length > 0 ? "-- Chọn đề tài khả dụng --" : "-- Không còn đề tài --"}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topicCode ? `[${t.topicCode}] ` : ""} {t.title} ({t.category})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading || topics.length === 0}
                  className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {loading ? "Đang gửi..." : "Gửi thẩm định"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTopic(false)}
                  className="px-4 py-2.5 bg-gray-200 text-[#6B635B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}