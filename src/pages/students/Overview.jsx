import React from "react";

export default function Overview({ groupData }) {
    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Banner chào mừng & Thông tin đề tài */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-full">
                        Học kỳ: {groupData?.semester || "Spring2026"}
                    </span>
                    <h1 className="text-2xl font-black text-[#2C2825]">
                        {groupData?.topicTitle || "Đồ án tốt nghiệp chưa chọn đề tài"}
                    </h1>
                    <p className="text-xs text-[#6B635B]">
                        Mã nhóm: <strong className="text-[#2C2825]">{groupData?.groupCode || "N/A"}</strong> · GVHD: <strong className="text-[#2C2825]">{groupData?.supervisorName || "Chưa phân công"}</strong>
                    </p>
                </div>
                <div className="bg-[#FBF9F5] px-6 py-4 rounded-2xl border border-[#E8E2D9] text-center shrink-0">
                    <p className="text-[11px] font-bold text-[#6B635B]">Trạng thái nhóm</p>
                    <p className="text-sm font-extrabold text-[#E65100] mt-0.5">{groupData?.status || "FORMED"}</p>
                </div>
            </div>

            {/* Thống kê nhanh (Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
                    <p className="text-xs font-bold text-[#6B635B]">Tiến độ tổng thể</p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-[#2C2825]">46%</span>
                        <span className="text-xs text-green-600 font-bold">Đúng hạn ✓</span>
                    </div>
                    <div className="w-full bg-[#F3EFEA] h-2 rounded-full overflow-hidden mt-3">
                        <div className="bg-[#E65100] h-full rounded-full w-[46%]"></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
                    <p className="text-xs font-bold text-[#6B635B]">Thời gian còn lại</p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-[#E65100]">46 ngày</span>
                        <span className="text-xs text-[#6B635B]">Đến hạn bảo vệ</span>
                    </div>
                    <p className="text-[11px] text-[#9E958C] pt-2">Hạn chót: 15/06/2026</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
                    <p className="text-xs font-bold text-[#6B635B]">Thành viên nhóm</p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-[#2C2825]">{groupData?.members?.length || 1}/5</span>
                        <span className="text-xs text-[#E65100] font-bold">Thành viên</span>
                    </div>
                    <p className="text-[11px] text-[#9E958C] pt-2">Đã tối ưu phân quyền</p>
                </div>
            </div>

            {/* Mốc thời gian & Nhiệm vụ gần đây */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="font-bold text-base text-[#2C2825]">Các mốc đồ án quan trọng</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                            <div>
                                <p className="font-bold text-xs text-[#2C2825]">Nộp đề cương chi tiết (Milestone 1)</p>
                                <p className="text-[11px] text-[#6B635B]">Đã được GVHD phê duyệt ngày 10/03/2026</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">Đã hoàn thành</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-200">
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-[#E65100] text-white flex items-center justify-center text-xs font-bold">⏱️</span>
                            <div>
                                <p className="font-bold text-xs text-[#2C2825]">Kiểm tra tiến độ giữa kỳ (Milestone 2)</p>
                                <p className="text-[11px] text-[#6B635B]">Hạn chót nộp tài liệu: 30/03/2026</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-[#E65100] bg-white px-3 py-1 rounded-lg border border-orange-200">Đang thực hiện</span>
                    </div>
                </div>
            </div>
        </div>
    );
}