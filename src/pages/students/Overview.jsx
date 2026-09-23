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
      await api.put(`/groups/${groupData.id}`, {
        groupCode: groupData.groupCode,
        semester: groupData.semester,
        status: groupData.status || "FORMED",
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
    "Đồ án tốt nghiệp: Chưa chọn đề tài chính thức";
  const semesterName = groupData?.semester || "Spring2026";
  const groupCode = groupData?.groupCode || "N/A";
  const supervisorName =
    groupData?.supervisorName ||
    groupData?.supervisor?.fullName ||
    "Chưa có GVHD (Hệ thống sẽ gợi ý và phân công sau khi nhóm chọn đề tài)";

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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[11px]">
              FORMED • ĐÃ THÀNH LẬP NHÓM
            </span>
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
                  GVHD: <strong className="text-[#2C2825]">{supervisorName}</strong>
                </p>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsEditingTopic(true)}
                    className="px-4 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>🎯</span>
                    <span>{groupData?.topicId ? "Đổi đề tài cho nhóm" : "Chọn đề tài cho nhóm ngay"}</span>
                  </button>
                  <button 
                    onClick={() => alert("Đã sao chép liên kết mời thành công!")}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C2825] text-xs font-bold rounded-2xl transition flex items-center gap-1.5"
                  >
                    <span>👥</span>
                    <span>Mời thành viên ({groupData?.members?.length || 1}/5)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateTopic} className="space-y-3 pt-2 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
              <label className="block text-xs font-bold text-[#2C2825]">
                Chọn đề tài đồ án chính thức từ danh sách hệ thống:
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
                  className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {loading ? "Đang lưu..." : "Xác nhận chọn"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTopic(false)}
                  className="px-4 py-2.5 bg-gray-200 text-[#6B635B] text-xs font-bold rounded-xl"
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
              <span className="text-2xl font-black text-[#2C2825]">{groupData?.members?.length || 1}/5</span>
              <span className="text-xs text-[#6B635B]">sinh viên</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#E65100] h-full rounded-full" 
                style={{ width: `${((groupData?.members?.length || 1) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">Trưởng nhóm đã kích hoạt • Mời thêm 4 bạn</p>
        </div>

        {/* Mã nhóm & Thời hạn */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Mã nhóm & Thời hạn</span>
            <span>⏱️</span>
          </div>
          <div>
            <span className="text-lg font-black text-[#2C2825] block">{groupCode}</span>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Hoạt động bình thường ✓</p>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">Chốt đề tài: <strong className="text-[#E65100]">Còn 12 ngày</strong></p>
        </div>

        {/* Vai trò trong nhóm */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Vai trò trong nhóm</span>
            <span>👑</span>
          </div>
          <div>
            <span className="text-lg font-black text-[#E65100] block">Leader (Trưởng nhóm)</span>
            <p className="text-[11px] text-[#2C2825] truncate">Student A (sa@gmail.com)</p>
          </div>
          <p className="text-[10px] text-[#9E958C] pt-1">Quyền: Toàn quyền nộp bài & chọn đề tài</p>
        </div>

        {/* Giảng viên hướng dẫn */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#6B635B]">
            <span>Giảng viên hướng dẫn</span>
            <span>👨‍🏫</span>
          </div>
          <div>
            <span className="text-sm font-black text-[#2C2825] block">Chưa có GVHD</span>
            <p className="text-[10px] text-[#6B635B]">Ghé́p cặp theo chuyên ngành đề tài</p>
          </div>
          <p className="text-[10px] text-orange-600 font-bold pt-1">Yêu cầu bắt buộc: Đăng ký đề tài 1 trước</p>
        </div>

      </div>

      {/* 3. KHU VỰC CHÍNH CHIA 2 CỘT (Các bước tiếp theo & Lịch trình quan trọng) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CỘT TRÁI: Các bước cần hoàn thành tiếp theo (8 phần) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
            <div>
              <h3 className="font-black text-sm text-[#2C2825]">Các bước cần hoàn thành tiếp theo</h3>
              <p className="text-[11px] text-[#6B635B]">Lộ trình chuẩn bị đồ án tốt nghiệp Khoa CNTT (1/4 bước đã xong)</p>
            </div>
            <span className="px-2.5 py-1 bg-orange-50 text-[#E65100] text-[10px] font-black rounded-lg">25% Hoàn tất</span>
          </div>

          <div className="space-y-3">
            {/* Bước 1 */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">1. Tạo nhóm đồ án tốt nghiệp {groupCode}</p>
                  <p className="text-[10px] text-[#6B635B]">Khởi tạo thành công mã nhóm, phân quyền Group Leader cho sinh viên SA.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md shrink-0">Đã xong 100%</span>
            </div>

            {/* Bước 2 */}
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-[#E65100] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">2. Đủ số lượng thành viên quy định (3 - 5 thành viên)</p>
                  <p className="text-[10px] text-[#6B635B]">Quy chế Khoa yêu cầu mỗi nhóm cần tối thiểu 3 sinh viên để đủ điều kiện phê duyệt đề tài.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md shrink-0">Đang chờ x 1/3</span>
            </div>

            {/* Bước 3 */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-gray-300 text-[#2C2825] flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">3. Duyệt và chọn đề tài mở từ Doanh nghiệp & Khoa</p>
                  <p className="text-[10px] text-[#6B635B]">Xem danh mục 42 đề tài đã qua thẩm định hoặc tự đề xuất đề tài nghiên cứu riêng.</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-[#E65100] bg-orange-100 px-2.5 py-1 rounded-md shrink-0">Ưu tiên cao</span>
            </div>

            {/* Bước 4 */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between opacity-75">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <div>
                  <p className="text-xs font-black text-[#2C2825]">4. Nộp đơn đăng ký đề tài chính thức & gợi ý GVHD</p>
                  <p className="text-[10px] text-[#6B635B]">Sau khi chọn đề tài và đủ thành viên, trưởng nhóm gửi yêu cầu xét duyệt để Hội đồng Khoa phân GVHD.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md shrink-0">Hạn: 28/02/2026</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Lịch trình quan trọng (4 phần) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-center">
            <h3 className="font-black text-sm text-[#2C2825]">Lịch trình quan trọng</h3>
            <span className="text-[10px] font-bold text-[#6B635B]">Tuần 1 / 15</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1 pl-3 border-l-2 border-emerald-500">
              <div className="flex justify-between">
                <strong className="text-[#2C2825]">Tuần 1: Khởi tạo nhóm</strong>
                <span className="text-[10px] text-emerald-600 font-bold">Đã xong</span>
              </div>
              <p className="text-[11px] text-[#6B635B]">10/02 - 14/02/2026 • Sinh viên tạo và liên kết mã nhóm trên cổng thông tin.</p>
            </div>

            <div className="space-y-1 pl-3 border-l-2 border-[#E65100] bg-orange-50/50 p-2 rounded-r-xl">
              <div className="flex justify-between">
                <strong className="text-[#E65100]">Tuần 2: Đăng ký đề tài</strong>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">Hết hạn</span>
              </div>
              <p className="text-[11px] text-[#6B635B]">15/02 - 25/02/2026 • Chốt đề tài đủ 3-5 thành viên. Sau hạn chót sẽ đóng hệ thống đăng ký.</p>
              <p className="text-[10px] font-bold text-red-600 pt-1">⏳ Còn lại: 12 ngày 04 giờ</p>
            </div>

            <div className="space-y-1 pl-3 border-l-2 border-gray-300">
              <div className="flex justify-between">
                <strong className="text-[#2C2825]">Tuần 4: Bảo vệ đề cương</strong>
                <span className="text-[10px] text-[#6B635B]">Sắp tới</span>
              </div>
              <p className="text-[11px] text-[#6B635B]">10/03 - 15/03/2026 • Báo cáo phạm vi và kiến trúc hệ thống với GVHD.</p>
            </div>

            <div className="space-y-1 pl-3 border-l-2 border-gray-300">
              <div className="flex justify-between">
                <strong className="text-[#2C2825]">Tuần 15: Hội đồng chấm</strong>
                <span className="text-[10px] text-[#6B635B]">Tháng 6/2026</span>
              </div>
              <p className="text-[11px] text-[#6B635B]">Bảo vệ khóa luận tốt nghiệp trước Hội đồng Khoa CNTT.</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. ĐỀ TÀI ĐỀ XUẤT TIÊU BIỂU CHO NHÓM */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm text-[#2C2825]">Đề tài đề xuất tiêu biểu cho nhóm</h3>
            <p className="text-[11px] text-[#6B635B]">Gợi ý dựa trên định hướng CNTT K19 và xu hướng công nghệ hiện hành.</p>
          </div>
          <button className="text-xs font-bold text-[#E65100] hover:underline">Xem tất cả →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card đề tài 1 */}
          <div className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black">
              <span className="bg-orange-100 text-[#E65100] px-2.5 py-1 rounded-md">AI / DEVOPS</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Độ khó : Khá</span>
            </div>
            <h4 className="font-extrabold text-sm text-[#2C2825]">Hệ thống AI giám xết chất lượng & dự đoán lỗi trong quy trình CI/CD</h4>
            <p className="text-xs text-[#6B635B]">Tự động phân tích log deploy, optimize pipeline bằng mô hình Transformers...</p>
            
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">Python</span>
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">Docker</span>
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">FastAPI</span>
            </div>

            <div className="pt-2 border-t border-[#E8E2D9] flex justify-between items-center text-xs">
              <span className="text-[#6B635B]">👨‍🏫 GV: <strong>Trần Văn A</strong></span>
              <button onClick={() => setIsEditingTopic(true)} className="px-3 py-1.5 bg-[#E65100] text-white font-bold rounded-xl text-[11px]">Chọn đề tài</button>
            </div>
          </div>

          {/* Card đề tài 2 */}
          <div className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black">
              <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md">BLOCKCHAIN / WEB3</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Độ khó : Nâng cao</span>
            </div>
            <h4 className="font-extrabold text-sm text-[#2C2825]">Nền tảng Quản trị & Truy xuất nguồn gốc chuỗi cung ứng nông sản</h4>
            <p className="text-xs text-[#6B635B]">Sử dụng Smart Contracts trên Hyperledger Fabric và Web3.js...</p>
            
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">Solidity</span>
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">ReactJS</span>
              <span className="px-2 py-0.5 bg-white border text-[10px] rounded font-bold text-gray-600">Node.js</span>
            </div>

            <div className="pt-2 border-t border-[#E8E2D9] flex justify-between items-center text-xs">
              <span className="text-[#6B635B]">👨‍🏫 GV: <strong>Lê Thị B</strong></span>
              <button onClick={() => setIsEditingTopic(true)} className="px-3 py-1.5 bg-[#E65100] text-white font-bold rounded-xl text-[11px]">Chọn đề tài</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}