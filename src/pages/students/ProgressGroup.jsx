import React, { useState, useEffect } from "react";
import { getGroupBookings } from "../../services/scheduleService";
import { getTopicQuestions } from "../../services/topicService";

export default function ProgressGroup({ groupId, topicId, groupData }) {
    const [bookings, setBookings] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRealProgressData = async () => {
            setLoading(true);
            try {
                // Gọi API lấy lịch sử đặt lịch thực tế của nhóm
                if (groupId) {
                    const resBookings = await getGroupBookings(groupId).catch(() => []);
                    setBookings(resBookings.content || resBookings || []);
                }
                // Gọi API lấy danh sách câu hỏi thực tế của đề tài
                if (topicId) {
                    const resQuestions = await getTopicQuestions(topicId).catch(() => []);
                    setQuestions(resQuestions.content || resQuestions || []);
                }
            } catch (err) {
                console.error("Lỗi tải dữ liệu tiến trình thực tế:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRealProgressData();
    }, [groupId, topicId]);

    return (
        <div className="space-y-6 animate-fadeIn text-[#2C2825]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-[#2C2825]">Tiến trình hoạt động & Lịch sử nhóm</h2>
                    <p className="text-xs text-[#6B635B]">Theo dõi các mốc lịch hẹn và câu hỏi thảo luận thực tế trên hệ thống.</p>
                </div>
                <span className="text-xs font-bold text-[#E65100] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                    Nhóm: {groupData?.groupCode || "N/A"}
                </span>
            </div>

            {loading ? (
                <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] text-center text-xs text-[#6B635B]">
                    Đang đồng bộ dữ liệu thực tế từ server...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Lịch sử các buổi meeting thực tế từ API Bookings */}
                    <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                                Lịch sử buổi gặp GVHD
                            </h3>
                            <span className="text-[11px] font-bold text-[#E65100]">{bookings.length} buổi</span>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="space-y-3">
                                {bookings.map((b) => (
                                    <div key={b.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-1 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-[#2C2825]">{b.title || b.notes || "Buổi tư vấn định hướng"}</span>
                                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg">
                                                {b.status || "BOOKED"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#6B635B]">
                                            🕒 {new Date(b.startTime || b.slotTime || Date.now()).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[#6B635B] italic py-8 text-center bg-[#FBF9F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                                Chưa ghi nhận lịch hẹn thực tế nào trên hệ thống.
                            </p>
                        )}
                    </div>

                    {/* 2. Danh sách câu hỏi thực tế từ API Question Bank */}
                    <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                                Câu hỏi thảo luận đã gửi
                            </h3>
                            <span className="text-[11px] font-bold text-[#E65100]">{questions.length} câu hỏi</span>
                        </div>

                        {questions.length > 0 ? (
                            <div className="space-y-3">
                                {questions.map((q) => (
                                    <div key={q.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="px-2.5 py-0.5 bg-orange-100 text-[#E65100] font-bold rounded text-[10px]">
                                                {q.category || "Technical"}
                                            </span>
                                            <span className="text-[10px] text-[#6B635B]">{q.status || "PUBLISHED"}</span>
                                        </div>
                                        <p className="font-bold text-[#2C2825]">❓ {q.questionText || q.content}</p>
                                        {q.guidanceNotes && (
                                            <p className="text-[11px] text-[#6B635B] italic bg-white p-2 rounded-xl border border-[#E8E2D9]">
                                                💡 Ghi chú: {q.guidanceNotes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[#6B635B] italic py-8 text-center bg-[#FBF9F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                                Chưa có câu hỏi thảo luận nào được gửi thực tế cho đề tài này.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}