import React, { useEffect, useState } from "react";
import { getTopicQuestions, createTopicQuestion } from "../../services/topicService";

const TopicQuestions = ({ topicId, topicTitle }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState({ category: "Technical", questionText: "", guidanceNotes: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (topicId) {
            fetchQuestions();
        }
    }, [topicId]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await getTopicQuestions(topicId, { page: 0, size: 20 });
            setQuestions(data.content || data);
        } catch (error) {
            console.error("Lỗi khi tải ngân hàng câu hỏi:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createTopicQuestion(topicId, newQuestion);
            alert("Thêm câu hỏi thành công!");
            setNewQuestion({ category: "Technical", questionText: "", guidanceNotes: "" });
            fetchQuestions();
        } catch (error) {
            alert("Thêm câu hỏi thất bại, vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    if (!topicId) {
        return (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] text-center text-xs text-[#6B635B]">
                Vui lòng chọn một đề tài cụ thể để quản lý ngân hàng câu hỏi.
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
            <div className="border-b border-[#F0EBE1] pb-4">
                <h3 className="text-lg font-black text-[#2C2825]">Ngân hàng câu hỏi</h3>
                <p className="text-xs text-[#6B635B] mt-1">Đề tài: <span className="font-bold text-[#E65100]">{topicTitle || topicId}</span></p>
            </div>

            {/* Form thêm câu hỏi mới */}
            <form onSubmit={handleAddQuestion} className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E8E2D9] space-y-4">
                <h4 className="font-bold text-xs text-[#2C2825]">Thêm câu hỏi mới vào ngân hàng</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Phân loại (Category)</label>
                        <select 
                            value={newQuestion.category}
                            onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                            required
                            className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                        >
                            <option value="Technical">Technical (Kỹ thuật, Công nghệ, Database)</option>
                            <option value="Requirement">Requirement (Phạm vi, Luồng nghiệp vụ)</option>
                            <option value="General">General (Tiến độ, Tài liệu, Quy chế)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Ghi chú hướng dẫn (Guidance Notes)</label>
                        <input 
                            type="text" 
                            placeholder="Ghi chú dành cho giảng viên/hội đồng..." 
                            value={newQuestion.guidanceNotes}
                            onChange={(e) => setNewQuestion({...newQuestion, guidanceNotes: e.target.value})}
                            className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-[#6B635B] mb-1">Nội dung câu hỏi (Question Text)</label>
                    <textarea 
                        rows="2"
                        placeholder="Nhập nội dung câu hỏi chi tiết..." 
                        value={newQuestion.questionText}
                        onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                        required
                        className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                    {submitting ? "Đang xử lý..." : "Thêm câu hỏi"}
                </button>
            </form>

            {/* Danh sách câu hỏi */}
            <div className="space-y-4">
                <h4 className="font-bold text-xs text-[#2C2825]">Danh sách câu hỏi hiện có ({questions.length})</h4>
                {loading ? (
                    <div className="text-center py-6 text-xs text-[#6B635B]">Đang tải danh sách câu hỏi...</div>
                ) : questions.length > 0 ? (
                    <div className="space-y-3">
                        {questions.map((q, index) => (
                            <div key={q.id || index} className="p-5 bg-white border border-[#E8E2D9] rounded-2xl space-y-2 text-xs shadow-xs hover:border-[#E65100]/40 transition">
                                <div className="flex justify-between items-center">
                                    <span className="px-3 py-1 bg-orange-50 text-[#E65100] font-bold rounded-lg text-[10px] uppercase">
                                        🏷️ {q.category}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#6B635B] bg-[#FBF9F5] px-2 py-1 rounded-md">{q.status || "DRAFT"}</span>
                                </div>
                                <p className="font-bold text-[#2C2825] text-sm">{q.questionText}</p>
                                {q.guidanceNotes && (
                                    <p className="text-[#6B635B] italic bg-[#FBF9F5] p-2.5 rounded-xl border border-[#E8E2D9]/60">
                                        💡 <span className="font-semibold">Ghi chú:</span> {q.guidanceNotes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-[#FBF9F5] rounded-2xl border border-dashed border-[#E8E2D9] text-xs text-[#6B635B]">
                        Chưa có câu hỏi nào trong ngân hàng của đề tài này.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicQuestions;