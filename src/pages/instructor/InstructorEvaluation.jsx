import React, { useState } from "react";

export default function InstructorEvaluation() {
    const [selectedGroup, setSelectedGroup] = useState("G2026-01");
    const [evaluation, setEvaluation] = useState({
        progress: "Đạt",
        codeQuality: "Tốt",
        documentation: "Cần cải thiện",
        communication: "Xuất sắc",
        feedback: "Nhóm cần tập trung hoàn thiện phần tài liệu thiết kế kiến trúc hệ thống trước tuần sau.",
        hasWarning: false,
        warningReason: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitEvaluation = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            alert(`Đã gửi kết quả đánh giá 4 tiêu chí cho nhóm ${selectedGroup} thành công!`);
            setSubmitting(false);
        }, 600);
    };

    return (
        <div className="space-y-6 p-8 max-w-4xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                    Instructor · Đánh giá & Cảnh báo (BR-EVAL)
                </span>
                <h1 className="text-xl font-black">Phiếu Đánh Giá Định Kỳ & Gắn Cờ Rủi Ro</h1>
                <p className="text-xs text-[#6B635B]">
                    Đánh giá chất lượng nhóm theo 4 trục (Tiến độ, Code, Tài liệu, Giao tiếp) và ghi nhận cảnh báo nếu cần thiết.
                </p>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                
                {/* Chọn nhóm */}
                <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#2C2825]">Chọn nhóm đồ án đánh giá *</label>
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    >
                        <option value="G2026-01">G2026-01 — Nền tảng Cứu trợ Lũ lụt (RESCUE.NOW)</option>
                        <option value="G2026-02">G2026-02 — Hệ thống Quản lý Đồ án (Capstone Tracking)</option>
                        <option value="G2026-03">G2026-03 — Nền tảng Thương mại Điện tử Đồ gỗ (FurnitureHub)</option>
                    </select>
                </div>

                {/* 4 Tiêu chí đánh giá */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* 1. Progress */}
                    <div className="space-y-1 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
                        <label className="block text-xs font-black text-[#2C2825]">1. Tiến độ (Progress) *</label>
                        <p className="text-[10px] text-[#6B635B]">Mức độ hoàn thành công việc so với cam kết.</p>
                        <select
                            value={evaluation.progress}
                            onChange={(e) => setEvaluation({ ...evaluation, progress: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E8E2D9] rounded-xl outline-none mt-2"
                        >
                            <option value="Xuất sắc">Xuất sắc</option>
                            <option value="Đạt">Đạt chuẩn tiến độ</option>
                            <option value="Cần cải thiện">Cần cải thiện (Chậm)</option>
                            <option value="Không đạt">Không đạt</option>
                        </select>
                    </div>

                    {/* 2. Code Quality */}
                    <div className="space-y-1 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
                        <label className="block text-xs font-black text-[#2C2825]">2. Chất lượng Mã nguồn (Code Quality) *</label>
                        <p className="text-[10px] text-[#6B635B]">Clean code, cấu trúc repository, commit convention.</p>
                        <select
                            value={evaluation.codeQuality}
                            onChange={(e) => setEvaluation({ ...evaluation, codeQuality: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E8E2D9] rounded-xl outline-none mt-2"
                        >
                            <option value="Xuất sắc">Xuất sắc</option>
                            <option value="Tốt">Tốt</option>
                            <option value="Cần cải thiện">Cần cải thiện</option>
                            <option value="Không đạt">Không đạt</option>
                        </select>
                    </div>

                    {/* 3. Documentation */}
                    <div className="space-y-1 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
                        <label className="block text-xs font-black text-[#2C2825]">3. Tài liệu đặc tả (Documentation) *</label>
                        <p className="text-[10px] text-[#6B635B]">SRS, Use Case, sơ đồ thiết kế hệ thống, báo cáo tuần.</p>
                        <select
                            value={evaluation.documentation}
                            onChange={(e) => setEvaluation({ ...evaluation, documentation: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E8E2D9] rounded-xl outline-none mt-2"
                        >
                            <option value="Xuất sắc">Xuất sắc</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Cần cải thiện">Cần cải thiện</option>
                            <option value="Không đạt">Không đạt</option>
                        </select>
                    </div>

                    {/* 4. Communication */}
                    <div className="space-y-1 bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]">
                        <label className="block text-xs font-black text-[#2C2825]">4. Kỹ năng giao tiếp (Communication) *</label>
                        <p className="text-[10px] text-[#6B635B]">Tác phong làm việc nhóm, phản hồi và tinh thần chủ động.</p>
                        <select
                            value={evaluation.communication}
                            onChange={(e) => setEvaluation({ ...evaluation, communication: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E8E2D9] rounded-xl outline-none mt-2"
                        >
                            <option value="Xuất sắc">Xuất sắc</option>
                            <option value="Tốt">Tốt</option>
                            <option value="Cần cải thiện">Cần cải thiện</option>
                            <option value="Không đạt">Không đạt</option>
                        </select>
                    </div>

                </div>

                {/* Nhận xét chi tiết */}
                <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#2C2825]">Nhận xét & Góp ý chi tiết của Giảng viên *</label>
                    <textarea
                        rows={3}
                        required
                        value={evaluation.feedback}
                        onChange={(e) => setEvaluation({ ...evaluation, feedback: e.target.value })}
                        placeholder="Nhập nhận xét để sinh viên nắm bắt và khắc phục..."
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    />
                </div>

                {/* Gắn cờ cảnh báo rủi ro (Warning Flag - BR-EVAL-04) */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="warningFlag"
                            checked={evaluation.hasWarning}
                            onChange={(e) => setEvaluation({ ...evaluation, hasWarning: e.target.checked })}
                            className="w-4 h-4 text-[#E65100] rounded"
                        />
                        <label htmlFor="warningFlag" className="text-xs font-black text-amber-800 cursor-pointer">
                            ⚠️ Gắn cờ cảnh báo nguy cơ rớt đồ án (Warning Flag) cho nhóm này
                        </label>
                    </div>
                    {evaluation.hasWarning && (
                        <input
                            type="text"
                            value={evaluation.warningReason}
                            onChange={(e) => setEvaluation({ ...evaluation, warningReason: e.target.value })}
                            placeholder="Nhập lý do gắn cảnh báo (VD: Vắng mặt không phép, chậm tiến độ 2 tuần)..."
                            className="w-full px-4 py-2.5 text-xs bg-white border border-amber-300 rounded-xl outline-none"
                        />
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                    {submitting ? "Đang gửi kết quả..." : "Xác nhận gửi đánh giá cho nhóm"}
                </button>
            </form>
        </div>
    );
}