import React from "react";

export default function Overview({ groupData }) {
    if (!groupData) {
        return <div className="p-8 text-center text-xs text-[#6B635B]">Đang tải dữ liệu tổng quan từ server...</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                    <div className="text-xs font-extrabold text-[#E65100] uppercase">MÃ NHÓM: {groupData.groupCode} • HỌC KỲ: {groupData.semester}</div>
                    <h1 className="text-2xl font-black text-[#2C2825]">{groupData.topicTitle || "Chưa cập nhật tên đề tài"}</h1>
                    <p className="text-xs text-[#6B635B]">GVHD: {groupData.supervisorName || "Đang phân công"} • Trạng thái: {groupData.status}</p>
                </div>
                <div className="bg-[#FFF9F5] border border-orange-200 px-6 py-4 rounded-2xl text-center shrink-0">
                    <span className="text-3xl font-black text-[#E65100]">{groupData.members?.length || 0}</span>
                    <p className="text-[10px] uppercase font-bold text-[#6B635B] mt-0.5">thành viên nhóm</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h3 className="font-black text-xs text-[#2C2825] uppercase">Thông tin giảng viên</h3>
                    <div className="p-3.5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                        <h4 className="text-xs font-bold text-[#2C2825]">{groupData.supervisorName || "Chưa có"}</h4>
                        <p className="text-[10px] text-[#6B635B]">Giảng viên hướng dẫn chính</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h3 className="font-black text-xs text-[#2C2825] uppercase">Trạng thái nhóm</h3>
                    <div className="p-3.5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                        <h4 className="text-xs font-bold text-[#2C2825]">{groupData.status}</h4>
                        <p className="text-[10px] text-[#6B635B]">Hệ thống quản lý đồ án</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h3 className="font-black text-xs text-[#2C2825] uppercase">Học kỳ</h3>
                    <div className="p-3.5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                        <h4 className="text-xs font-bold text-[#2C2825]">{groupData.semester}</h4>
                        <p className="text-[10px] text-[#6B635B]">Niên khóa hiện tại</p>
                    </div>
                </div>
            </div>
        </div>
    );
}