import React from "react";

export default function Overview({ groupData, isLeader }) {
  const semesterName = groupData?.semester || "Fall2026";
  const groupCode = groupData?.groupCode || "N/A";
  const memberCount = groupData?.members?.length || 0;
  const isValidTeamSize = memberCount >= 3 && memberCount <= 5;

  return (
    <div className="space-y-6 animate-fadeIn text-[#2C2825]">
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
              Khoa Công nghệ thông tin · Đại học FPT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-extrabold px-3 py-1 rounded-full text-[11px] border ${isValidTeamSize ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
              {isValidTeamSize ? "✓ NHÓM ĐẠT SĨ SỐ HỢP LỆ (3–5 NGƯỜI)" : "⚠️ SĨ SỐ CHƯA ĐẠT CHUẨN (CẦN 3–5 NGƯỜI)"}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
          <p className="text-[10px] font-black uppercase text-[#9E958C] tracking-wider">
            Thông tin quản lý đầu kỳ
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] text-[#6B635B] font-bold">Quy mô nhóm</span>
              <p className="text-sm font-black text-[#2C2825]">{memberCount} / 5 thành viên</p>
            </div>
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] text-[#6B635B] font-bold">Vai trò của bạn</span>
              <p className="text-sm font-black text-[#E65100]">{isLeader ? "👑 Trưởng nhóm (Leader)" : "👤 Thành viên (Member)"}</p>
            </div>
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] text-[#6B635B] font-bold">Trạng thái hệ thống</span>
              <p className="text-sm font-black text-emerald-600">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 text-xs space-y-2">
          <p className="font-black text-[#E65100]">Lưu ý quan trọng giai đoạn đầu kỳ:</p>
          <ul className="list-disc pl-4 space-y-1 text-[#6B635B]">
            <li>Mỗi sinh viên chỉ thuộc tối đa một nhóm chính thức tại một thời điểm trong cùng đợt luận án.</li>
            <li>Trưởng nhóm (Leader) có quyền xét duyệt đơn apply hoặc gửi lời mời trực tiếp cho các thành viên.</li>
            <li>Hãy đảm bảo nhóm đạt từ 3 đến 5 thành viên trước thời điểm khóa danh sách (Locked) của Admin.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}