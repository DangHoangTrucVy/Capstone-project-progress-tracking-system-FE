import React, { useState } from "react";

export default function TopicQuestions({ groupId }) {
    const [questions, setQuestions] = useState([
        {
            id: 1,
            content: "Nhóm xin ý kiến GVHD về việc lựa chọn cơ chế Realtime bằng SignalR hay WebSocket cho tính năng cứu trợ khẩn cấp?",
            status: "Đã trả lời",
            instructorAnswer: "Nên ưu tiên dùng SignalR vì tích hợp mượt mà hơn với .NET Backend mà nhóm đang chọn."
        },
        {
            id: 2,
            content: "Thầy xem giúp em cấu trúc bảng phân quyền Storage trong database đã tối ưu chưa ạ?",
            status: "Chờ phản hồi",
            instructorAnswer: ""
        }
    ]);

    const [newQuestion, setNewQuestion] = useState("");

    const handleAddQuestion = (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        const newItem = {
            id: Date.now(),
            content: newQuestion.trim(),
            status: "Chờ phản hồi",
            instructorAnswer: ""
        };

        setQuestions([newItem, ...questions]);
        setNewQuestion("");
        alert("Đã gửi câu hỏi thành công cho GVHD!");
    };

    return (
        <div className="space-y-6 animate-fadeIn font-sans text-[#2C2825]">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                    Pre-meeting Questions · Chuẩn bị họp GVHD
                </span>
                <h1 className="text-xl font-black">Danh sách câu hỏi trước buổi gặp</h1>
                <p className="text-xs text-[#6B635B]">
                    Nhóm ghi lại các vấn đề cần thảo luận để giảng viên chuẩn bị nội dung tư vấn hiệu quả nhất.
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
                <h3 className="text-xs font-black uppercase text-[#6B635B]">Lịch sử câu hỏi của nhóm ({questions.length})</h3>
                
                <div className="space-y-3">
                    {questions.length > 0 ? (
                        questions.map((q) => (
                            <div key={q.id} className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                                        q.status === "Đã trả lời" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {q.status}
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
                        ))
                    ) : (
                        <p className="text-xs text-[#6B635B] italic py-4">Chưa có câu hỏi nào được gửi.</p>
                    )}
                </div>
            </div>
        </div>
    );
}