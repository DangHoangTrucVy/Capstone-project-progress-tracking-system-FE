import React from "react";

export default function ProgressGroup({ groupData }) {
    // Lấy dữ liệu tiến độ từ groupData với giá trị mặc định an toàn
    const progressPercentage = groupData?.progressPercentage || 48;
    const currentStageIndex = groupData?.currentStageIndex || 3; // Ví dụ: Giai đoạn hiện tại (1-5)
    const completedStagesCount = groupData?.completedStagesCount || 2;

    // Danh sách các mốc giai đoạn đồ án chuẩn học vụ FPT
    const baseStages = [
        { id: 1, name: "Giai đoạn 1: Đăng ký & Đề xuất đề tài" },
        { id: 2, name: "Giai đoạn 2: Bảo vệ đề cương chi tiết" },
        { id: 3, name: "Giai đoạn 3: Thực hiện & Kiểm tra tiến độ giữa kỳ" },
        { id: 4, name: "Giai đoạn 4: Hoàn thiện tính năng & Báo cáo" },
        { id: 5, name: "Giai đoạn 5: Bảo vệ đồ án trước hội đồng" },
    ];

    // Tự động gán trạng thái dựa trên tiến độ thực tế từ Backend
    const stages = baseStages.map((stage) => {
        let status = "Chưa bắt đầu";
        if (stage.id <= completedStagesCount) {
            status = "Đã hoàn thành";
        } else if (stage.id === currentStageIndex) {
            status = "Đang thực hiện";
        }
        return { ...stage, status };
    });

    const currentStageText = groupData?.currentStage || `Giai đoạn ${currentStageIndex}/5`;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-black text-[#2C2825]">Tiến độ nhóm theo từng giai đoạn</h2>
                <span className="text-xs font-bold text-[#E65100] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                    Học kỳ: {groupData?.semester || "Spring2026"}
                </span>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                {/* Tổng quan tiến độ */}
                <div className="flex items-center space-x-4 p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-[#E65100] text-sm shrink-0 shadow-xs">
                        {progressPercentage}%
                    </div>
                    <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-[#2C2825]">Tổng tiến độ hoàn thành đồ án</h4>
                            <span className="text-[10px] font-bold text-[#E65100]">{completedStagesCount}/5 giai đoạn</span>
                        </div>
                        <p className="text-[11px] text-[#6B635B]">
                            {currentStageText} • Đang thực hiện đúng thời hạn kế hoạch
                        </p>
                        <div className="w-full bg-[#F3EFEA] h-2 rounded-full overflow-hidden mt-1">
                            <div className="bg-[#E65100] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Danh sách các giai đoạn chi tiết */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">Chi tiết các mốc thời gian</h3>
                    <div className="space-y-2.5">
                        {stages.map((stage) => (
                            <div key={stage.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs hover:border-[#E65100]/30 transition">
                                <div className="flex items-center space-x-3">
                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-xs ${
                                        stage.status === "Đã hoàn thành" ? "bg-emerald-100 text-emerald-700" :
                                        stage.status === "Đang thực hiện" ? "bg-[#E65100] text-white" : "bg-gray-200 text-gray-500"
                                    }`}>
                                        {stage.status === "Đã hoàn thành" ? "✓" : stage.id}
                                    </span>
                                    <span className="font-bold text-[#2C2825]">{stage.name}</span>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-xl ${
                                    stage.status === "Đã hoàn thành" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                    stage.status === "Đang thực hiện" ? "bg-orange-50 text-[#E65100] border border-orange-200" : "bg-gray-100 text-gray-500"
                                }`}>
                                    {stage.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}