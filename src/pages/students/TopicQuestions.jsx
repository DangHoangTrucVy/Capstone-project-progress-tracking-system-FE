import React, { useState, useEffect } from "react";
import { getTopicQuestions, addTopicQuestion } from "../../services/topicService";

export default function TopicQuestions({ topicId, topicTitle }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");

    // Gọi API lấy danh sách câu hỏi theo topicId thực tế
    const fetchQuestions = async () => {
        if (!topicId) return;
        setLoading(true);
        try {
            const res = await getTopicQuestions(topicId);
            setQuestions(res.content || res || []);
        } catch (err) {
            console.error("Lỗi tải danh sách câu hỏi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [topicId]);

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        try {
            const payload = { content: newQuestion.trim() };
            await addTopicQuestion(topicId, payload);
            
            alert("Đã gửi câu hỏi thành công cho GVHD!");
            setNewQuestion("");
            fetchQuestions(); // Tải lại danh sách sau khi thêm thành công
        } catch (err) {
            alert("Gửi câu hỏi thất bại!");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn font-sans text-[#2C2825]">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                    Pre-meeting Questions · Ngân hàng câu hỏi đề tài
                </span>
                <h1 className="text-xl font-black">Đề tài: {topicTitle || "Chi tiết đề tài"}</h1>
                <p className="text-xs text-[#6B635B]">
                    Quản lý danh sách câu hỏi thảo luận, phản biện giữa nhóm và giảng viên hướng dẫn.
                </p>
            </div>

            {/* Form thêm câu hỏi mới */}
            <form onSubmit={handleAddQuestion} className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Gửi câu hỏi mới cho Giảng viên</h3>
                <div className="space-y-2">
                    <textarea
                        rows={3}
                        required
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Nhập nội dung thắc mắc, lỗi code, hoặc vấn đề kiến trúc cần trao đổi..."
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                    + Gửi câu hỏi
                </button>
            </form>

            {/* Danh sách câu hỏi */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Lịch sử câu hỏi của đề tài ({questions.length})</h3>
                
                {loading ? (
                    <p className="text-xs text-[#6B635B] py-4 text-center">Đang tải dữ liệu...</p>
                ) : questions.length > 0 ? (
                    <div className="space-y-3">
                        {questions.map((q) => (
                            <div key={q.id} className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-emerald-100 text-emerald-700">
                                        {q.status || "Đã tiếp nhận"}
                                    </span>
                                </div>
                                <p className="font-bold text-[#2C2825] text-sm">
                                    ❓ {q.content}
                                </p>
                                {q.instructorAnswer && (
                                    <div className="p-3 bg-white rounded-xl border border-orange-100 space-y-1">
                                        <p className="font-bold text-[#E65100]">💡 Phản hồi từ GVHD:</p>
                                        <p className="text-[#6B635B]">{q.instructorAnswer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#6B635B] italic py-4">Chưa có câu hỏi nào trong ngân hàng câu hỏi của đề tài này.</p>
                )}
            </div>
        </div>
    );
}