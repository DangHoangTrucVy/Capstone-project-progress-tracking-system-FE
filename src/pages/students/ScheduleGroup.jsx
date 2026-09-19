import React from "react";

export default function ScheduleGroup() {
    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-black">Lịch hẹn với GVHD</h2>
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-4">
                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                    <div>
                        <h4 className="text-xs font-bold">Trao đổi tiến độ module cảm biến</h4>
                        <p className="text-[10px] text-[#6B635B]">Với ThS. Nguyễn Thành Long • Online • 22 th9, 09:00</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">Đã xác nhận</span>
                </div>
            </div>
        </div>
    );
}