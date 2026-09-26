import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Overview({ groupData, onGroupUpdated }) {
  const [topics, setTopics] = useState([]);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(
    groupData?.topicId || "",
  );
  const [loading, setLoading] = useState(false);

  // Trạng thái phê duyệt đề tài thực tế từ backend
  const topicApprovalStatus = groupData?.status || "PENDING";
  const isApproved = topicApprovalStatus === "ACTIVE"; // Kiểm tra nếu đã được duyệt (độc quyền/ACTIVE)

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
    // Chặn bảo mật nếu đã được duyệt thì không cho gửi yêu cầu đổi nữa
    if (isApproved) {
      alert(
        "Đề tài đã được phê duyệt chính thức. Bạn không thể thay đổi đề tài nữa!",
      );
      return;
    }

    setLoading(true);
    try {
      await api.put(`/groups/${groupData.id}`, {
        groupCode: groupData.groupCode,
        semester: groupData.semester,
        status: "PENDING",
        topicId: selectedTopicId || null,
        supervisorId: groupData.supervisorId || null,
      });
      alert(
        "Đã gửi yêu cầu chọn đề tài thành công! Vui lòng chờ Admin/GVHD phê duyệt.",
      );
      setIsEditingTopic(false);

      if (onGroupUpdated) {
        onGroupUpdated();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Lỗi cập nhật đề tài:", err.response?.data);
      alert(
        err.response?.data?.message || "Không thể gửi yêu cầu chọn đề tài.",
      );
    } finally {
      setLoading(false);
    }
  };

  const topicName =
    groupData?.topicTitle ||
    groupData?.topic?.title ||
    "Đồ án tốt nghiệp: Chưa chọn đề tài chính thức";
  // Học kỳ hiển thị theo cấu hình nhóm được mở (vd: Spring2026, Spring2027,...)
  const semesterName = groupData?.semester || "Spring2026";
  const groupCode = groupData?.groupCode || "N/A";
  const supervisorName =
    groupData?.supervisorName ||
    groupData?.supervisor?.fullName ||
    "Chưa phân công (Admin sẽ phân công sau khi duyệt đề tài)";

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
      {/* 1. TOP BANNER: TRẠNG THÁI KHỞI ĐẦU ĐỒ ÁN TỐT NGHIỆP */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        {/* Sub-header tags */}
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
                ✓ ĐÃ ĐƯỢC PHÊ DUYỆT (ACTIVE)
              </span>
            ) : (
              <span className="font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-[11px] border border-amber-200">
                ⏳ ĐANG CHỜ ADMIN / GVHD DUYỆT (PENDING)
              </span>
            )}
          </div>
        </div>

        {/* Nội dung đề tài chính */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-black uppercase text-[#9E958C] tracking-wider">
            Trạng thái khởi đầu đồ án tốt nghiệp
          </p>

          {!isEditingTopic ? (
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-black text-[#2C2825] leading-snug">
                {topicName}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <p className="text-xs text-[#6B635B]">
                  GVHD phân công:{" "}
                  <strong className="text-[#2C2825]">{supervisorName}</strong>
                </p>

                <div className="flex items-center gap-2.5">
                  {/* Nút đổi đề tài chỉ hiển thị khi CHƯA được duyệt (Không hiển thị khi đã là ACTIVE) */}
                  {!isApproved && (
                    <button
                      onClick={() => setIsEditingTopic(true)}
                      className="px-4 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🎯</span>
                      <span>
                        {groupData?.topicId
                          ? "Đổi đề tài / Gửi lại yêu cầu"
                          : "Chọn đề tài & Gửi duyệt"}
                      </span>
                    </button>
                  )}

                  {isApproved && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      🔒 Đề tài đã khóa độc quyền
                    </span>
                  )}

                  <button
                    onClick={() =>
                      alert("Đã sao chép liên kết mời thành công!")
                    }
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C2825] text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>👥</span>
                    <span>
                      Mời thành viên ({groupData?.members?.length || 1}/6)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleUpdateTopic}
              className="space-y-3 pt-2 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]"
            >
              <label className="block text-xs font-bold text-[#2C2825]">
                Chọn đề tài đồ án và gửi yêu cầu phê duyệt cho Admin/GVHD:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  required
                >
                  <option value="">-- Chọn đề tài hệ thống --</option>
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
                  className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu duyệt"}
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

      {/* 2. THỐNG KÊ NHANH 4 CỘT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thành viên nhóm */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Thành viên nhóm</span>
            <span>👥</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2C2825]">
                {groupData?.members?.length || 1}/6
              </span>
              <span className="text-xs text-[#6B635B]">sinh viên</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#E65100] h-full rounded-full"
                style={{
                  width: `${((groupData?.members?.length || 1) / 6) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">
            Đạt chuẩn quy chế nhóm (4-6 người)
          </p>
        </div>

        {/* Mã nhóm & Thời hạn */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Mã nhóm & Thời hạn</span>
            <span>⏱️</span>
          </div>
          <div>
            <span className="text-lg font-black text-[#2C2825] block">
              {groupCode}
            </span>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
              Hoạt động bình thường ✓
            </p>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">
            Chốt đề tài: <strong className="text-[#E65100]">Còn 12 ngày</strong>
          </p>
        </div>

        {/* Vai trò trong nhóm */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Vai trò trong nhóm</span>
            <span>👑</span>
          </div>
          <div>
            <span className="text-lg font-black text-[#E65100] block">
              Leader (Trưởng nhóm)
            </span>
            <p className="text-[11px] text-[#2C2825] truncate">
              {groupData?.members?.find(
                (m) => m.isLeader || m.role === "GROUP_LEADER",
              )?.userFullName ||
                groupData?.members?.find(
                  (m) => m.isLeader || m.role === "GROUP_LEADER",
                )?.fullName ||
                "Đặng Hoàng Trúc Vy"}
            </p>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">
            Quyền: Toàn quyền nộp bài & chọn đề tài
          </p>
        </div>

        {/* Giảng viên hướng dẫn */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Giảng viên hướng dẫn</span>
            <span>👨‍🏫</span>
          </div>
          <div>
            <span className="text-sm font-black text-[#2C2825] block truncate">
              {supervisorName}
            </span>
            <p className="text-[10px] text-[#6B635B]">
              Do Admin phân bổ sau khi duyệt
            </p>
          </div>
          <p className="text-[10px] text-orange-600 font-bold pt-1">
            {isApproved
              ? "Trạng thái: Đã duyệt chính thức"
              : "Trạng thái: Chờ duyệt đề tài"}
          </p>
        </div>
      </div>

      {/* 3. KHU VỰC CHÍNH CHIA 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: Các bước cần hoàn thành tiếp theo */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
            <div>
              <h3 className="font-black text-sm text-[#2C2825]">
                Các bước cần hoàn thành tiếp theo
              </h3>
              <p className="text-[11px] text-[#6B635B]">
                Lộ trình chuẩn bị đồ án tốt nghiệp Khoa CNTT
              </p>
            </div>
            <span className="px-2.5 py-1 bg-orange-50 text-[#E65100] text-[10px] font-black rounded-lg">
              Đang tiến hành
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">
                    1. Tạo nhóm đồ án tốt nghiệp {groupCode}
                  </p>
                  <p className="text-[10px] text-[#6B635B]">
                    Khởi tạo thành công mã nhóm, phân quyền Group Leader.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                Đã xong 100%
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isApproved ? "bg-emerald-50/50 border-emerald-200" : "bg-orange-50/50 border-orange-200"}`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${isApproved ? "bg-emerald-600" : "bg-[#E65100]"}`}
                >
                  {isApproved ? "✓" : "2"}
                </span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">
                    2. Đăng ký đề tài & Phê duyệt độc quyền
                  </p>
                  <p className="text-[10px] text-[#6B635B]">
                    {isApproved
                      ? "Đề tài đã được Admin/GVHD thông qua và khóa độc quyền."
                      : "Chọn đề tài hệ thống, trạng thái chuyển sang ACTIVE khi được duyệt."}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${isApproved ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"}`}
              >
                {isApproved ? "Đã hoàn tất" : "Đang chờ duyệt"}
              </span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Lịch trình quan trọng */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-center">
            <h3 className="font-black text-sm text-[#2C2825]">
              Lịch trình quan trọng
            </h3>
            <span className="text-[10px] font-bold text-[#6B635B]">
              Học kỳ: {semesterName}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div
              className={`space-y-1 pl-3 border-l-2 p-2 rounded-r-xl ${isApproved ? "border-emerald-500 bg-emerald-50/50" : "border-[#E65100] bg-orange-50/50"}`}
            >
              <div className="flex justify-between">
                <strong
                  className={isApproved ? "text-emerald-700" : "text-[#E65100]"}
                >
                  {isApproved ? "Đề tài đã được khóa" : "Phê duyệt đề tài"}
                </strong>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {isApproved ? "Active" : "Chờ duyệt"}
                </span>
              </div>
              <p className="text-[11px] text-[#6B635B]">
                {isApproved
                  ? "Nhóm đã chính thức bước vào giai đoạn thực hiện đồ án."
                  : "Hệ thống ghi nhận đề tài và chờ Admin/GVHD thông qua."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
