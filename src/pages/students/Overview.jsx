import React, { useState, useEffect } from "react";
import {
  getGroupRequests,
  getMyLeaveRequests,
} from "../../services/groupService";
import api from "../../services/api";

export default function Overview({ groupData, isLeader, onNavigateTab }) {
  const semesterName =
    groupData?.semesterCode ||
    groupData?.semester ||
    groupData?.semesterName ||
    "Spring 2027";
  const groupCode = groupData?.groupCode || groupData?.code || "N/A";
  const majorName =
    groupData?.majorName || groupData?.majorCode || "Software Engineering";

  const members = groupData?.members || [];
  const memberCount = members.length;
  const isValidTeamSize = memberCount >= 3 && memberCount <= 5;
  const isFullTeam = memberCount === 5;

  const [pendingCount, setPendingCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);

  // Lấy số lượng đơn ứng tuyển đang chờ và đơn xin rời nhóm
  useEffect(() => {
    const fetchCounts = async () => {
      if (!groupData?.id) return;
      try {
        // 1. Lấy số lượng đơn ứng tuyển
        const res = await getGroupRequests(groupData.id);
        const reqList = Array.isArray(res) ? res : res?.content || [];
        const pendingApps = reqList.filter(
          (item) =>
            (!item.status || item.status === "PENDING") &&
            (item.type === "APPLICATION" ||
              item.type === "APPLY" ||
              item.type === "APPLIED" ||
              !item.type),
        );
        setPendingCount(pendingApps.length);

        // 2. Lấy số lượng đơn xin rời nhóm (Nếu là leader hoặc chung endpoint)
        const leaveRes = await api
          .get(`/groups/${groupData.id}/leave-requests`)
          .catch(() => []);
        const leaveList = Array.isArray(leaveRes.data)
          ? leaveRes.data
          : leaveRes.data?.content || leaveRes || [];
        const pendingLeaves = leaveList.filter(
          (item) => !item.status || item.status === "PENDING",
        );
        setLeaveCount(pendingLeaves.length);
      } catch (err) {
        console.error("Không thể tải số lượng yêu cầu:", err);
      }
    };
    fetchCounts();
  }, [groupData?.id]);

  const getInitials = (name) => {
    if (!name) return "SV";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 font-sans text-[#2C2825] animate-fadeIn">
      {/* Báo hiệu nhóm đang khóa cho mọi thành viên cùng thấy */}
      {groupData?.locked && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <div>
              <p className="font-black">Nhóm đã được Trưởng nhóm khóa lại!</p>
              <p className="text-[11px] opacity-90">
                Hệ thống hiện đang tạm ngưng nhận đơn ứng tuyển mới từ các sinh
                viên khác.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold rounded-lg text-[10px]">
            ĐÃ KHÓA
          </span>
        </div>
      )}
      {/* 1. KHUNG THẺ CHÍNH: THÔNG TIN NHÓM & THÀNH VIÊN */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#2C2825] tracking-tight">
              {groupCode}
            </h1>
            <p className="text-xs text-[#6B635B] flex flex-wrap items-center gap-2">
              <span>
                Học kỳ{" "}
                <strong className="text-[#2C2825]">{semesterName}</strong>
              </span>
              <span>•</span>
              <span>
                Ngành <strong className="text-[#2C2825]">{majorName}</strong>
              </span>
              <span>•</span>
              <span>
                Bạn là{" "}
                <strong className="text-[#E65100]">
                  {isLeader ? "Trưởng nhóm" : "Thành viên"}
                </strong>
              </span>
            </p>
          </div>

          <span
            className={`self-start md:self-auto px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
              isFullTeam
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isValidTeamSize
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isValidTeamSize ? "bg-emerald-500" : "bg-amber-500"}`}
            ></span>
            {isFullTeam
              ? "Đạt chuẩn"
              : isValidTeamSize
                ? "Đủ sĩ số, nhóm đang hoạt động"
                : "Sĩ số chưa đạt chuẩn (Cần 3-5 người)"}
          </span>
        </div>

        {/* Danh sách thành viên dạng thẻ ngang */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
          {[0, 1, 2, 3, 4].map((idx) => {
            const member = members[idx];
            const isThisLeader = member
              ? member.isLeader ||
                member.leader ||
                member.role === "LEADER" ||
                String(member.userId || member.id) ===
                  String(groupData?.leaderId)
              : false;

            const fullName = member
              ? member.userFullName ||
                member.fullName ||
                `Thành viên ${idx + 1}`
              : "";

            return member ? (
              <div
                key={member.id || member.userId || idx}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center space-y-3 transition ${
                  isThisLeader
                    ? "bg-orange-50/50 border-orange-300 shadow-xs"
                    : "bg-[#FBF9F5] border-[#E8E2D9]"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                    isThisLeader
                      ? "bg-[#E65100] text-white"
                      : "bg-[#2C2825] text-white"
                  }`}
                >
                  {getInitials(fullName)}
                </div>
                <div className="space-y-0.5 w-full">
                  <p className="font-black text-xs text-[#2C2825] leading-snug wrap-break-words">
                    {fullName}
                  </p>
                  <p className="text-[10px] font-bold text-[#6B635B]">
                    {isThisLeader ? "Trưởng nhóm" : "Thành viên"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FBF9F5]/60 flex flex-col items-center text-center space-y-3 opacity-60"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center font-black text-xs">
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className="space-y-0.5 w-full">
                  <p className="font-black text-xs text-gray-400">
                    Thành viên {idx + 1}
                  </p>
                  <p className="text-[10px] text-gray-400">Trống</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thanh tiến trình sĩ số */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx < memberCount ? "bg-emerald-600" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>
          <p className="text-xs text-[#6B635B] font-medium">
            <strong className="text-[#2C2825]">
              {memberCount}/5 thành viên
            </strong>
            . Nhóm hợp lệ khi có từ 3 đến 5 thành viên chính thức.
          </p>
        </div>
      </div>

      {/* 2. CÁC KHỐI CHỨC NĂNG NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thẻ đơn ứng tuyển */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("applications")}
          className="bg-white p-7 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col justify-between space-y-6 cursor-pointer hover:border-[#E65100] transition group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider group-hover:text-[#E65100] transition">
                Đơn ứng tuyển & Lời mời
              </h3>
              <span className="w-6 h-6 rounded-full bg-orange-100 text-[#E65100] text-xs font-black flex items-center justify-center">
                {pendingCount}
              </span>
            </div>
            <p className="text-xs text-[#6B635B] leading-relaxed">
              Quản lý danh sách sinh viên xin gia nhập nhóm. Xét duyệt đơn ứng
              tuyển hoặc gửi lời mời trực tiếp cho các thành viên tiềm năng.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-[#E65100] group-hover:underline">
              Xem chi tiết danh sách đơn →
            </span>
          </div>
        </div>

        {/* Thẻ trạng thái nhóm & Rời nhóm (Có đếm số lượng đơn rời nhóm chờ xử lý) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("management")}
          className="bg-white p-7 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col justify-between space-y-6 cursor-pointer hover:border-[#E65100] transition group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-wider group-hover:text-[#E65100] transition">
                Trạng thái nhóm & Rời nhóm
              </h3>
              {leaveCount > 0 && (
                <span
                  className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center animate-pulse"
                  title="Có đơn xin rời nhóm đang chờ"
                >
                  {leaveCount}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B635B] leading-relaxed">
              Mỗi sinh viên chỉ thuộc một nhóm chính thức trong suốt đợt làm đồ
              án. Quản lý việc khóa nhóm hoặc gửi yêu cầu rời nhóm tại đây.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#E65100] group-hover:underline">
              Quản lý trạng thái nhóm →
            </span>
          </div>
        </div>
      </div>

      {/* 3. KHUNG LƯU Ý QUAN TRỌNG */}
      <div className="bg-amber-50/60 p-7 rounded-3xl border border-amber-200 space-y-3">
        <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">
          Lưu ý trước khi quản trị viên khóa danh sách nhóm
        </h4>
        <ul className="space-y-2 text-xs text-[#6B635B] list-disc pl-4 leading-relaxed">
          <li>
            Mỗi sinh viên chỉ được phép ở tối đa một nhóm chính thức trong cùng
            một đợt làm đồ án tốt nghiệp.
          </li>
          <li>
            Trưởng nhóm có quyền xét duyệt đơn ứng tuyển hoặc gửi lời mời trực
            tiếp cho các thành viên tiềm năng.
          </li>
          <li>
            Hãy đảm bảo duy trì số lượng nhóm ở mức từ 3 đến 5 thành viên chính
            thức trước thời điểm khóa danh sách của bộ môn.
          </li>
        </ul>
      </div>
    </div>
  );
}
