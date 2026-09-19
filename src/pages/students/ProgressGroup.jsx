import React from "react";

export default function ProgressGroup() {
    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-black">Tiến độ nhóm theo từng giai đoạn</h2>
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center font-black text-[#E65100]">48%</div>
                    <div>
                        <h4 className="text-xs font-bold">Tổng tiến độ nhóm</h4>
                        <p className="text-[11px] text-[#6B635B]">Giai đoạn 3/5 • 2 giai đoạn đã hoàn thành[cite: 40]</p>
                    </div>
                </div>
            </div>
        </div>
    );
}