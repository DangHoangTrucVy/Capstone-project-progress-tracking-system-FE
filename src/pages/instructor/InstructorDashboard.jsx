import React, { useState, useEffect } from "react";
import { getSlots, createSlot } from "../../services/scheduleService";
import { getCurrentUser } from "../../services/authService";
import { getAllGroups, getGroupById } from "../../services/groupService";
import {
  getTopicQuestions,
  updateTopicQuestionAnswer,
} from "../../services/topicService";
import Profile from "../../auth/Profile";
import InstructorEvaluation from "./InstructorEvaluation"; // Import component đánh giá nhóm

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("slots");
  const [slots, setSlots] = useState([]);
  const [instructorGroups, setInstructorGroups] = useState([]);
  const [questionsList, setQuestionsList] = useState([]);
  const [answerInputs, setAnswerInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState("ALL");
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState(null);

  // Form tạo Slot
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    durationMinutes: 45,
    capacity: 1,
    locationType: "ONLINE",
    meetingUrl: "",
    notes: "",
  });

  const fetchInstructorData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // 1. Tải danh sách slots
      const resSlots = await getSlots().catch(() => []);
      setSlots(resSlots.content || resSlots || []);

      // 2. Tải danh sách nhóm tổng quát
      const resGroups = await getAllGroups().catch(() => []);
      const allGroups = resGroups.content || resGroups || [];

      const myGroups = allGroups.filter(
        (g) =>
          g.supervisorId === currentUser?.id ||
          g.instructorId === currentUser?.id ||
          g.supervisorEmail === currentUser?.email ||
          g.instructorEmail === currentUser?.email ||
          (g.supervisor &&
            (g.supervisor.id === currentUser?.id ||
              g.supervisor.email === currentUser?.email)),
      );

      const targetGroups = myGroups.length > 0 ? myGroups : allGroups;

      // 3. Gọi bổ sung getGroupById cho từng nhóm để lấy đầy đủ thông tin thành viên và topicId
      const detailedGroups = await Promise.all(
        targetGroups.map(async (g) => {
          try {
            const detail = await getGroupById(g.id);
            return detail || g;
          } catch (e) {
            return g;
          }
        }),
      );

      setInstructorGroups(detailedGroups);

      // 4. Lấy danh sách câu hỏi dựa trên các topicId của các nhóm giảng viên hướng dẫn
      const allQuestions = [];
      for (const g of detailedGroups) {
        const tId = g.topicId || g.topic?.id;
        if (tId) {
          try {
            const qRes = await getTopicQuestions(tId).catch(() => []);
            const qArr = qRes.content || qRes || [];
            const enrichedQ = qArr.map((q) => ({
              ...q,
              groupCode: g.groupCode || g.code || "Nhóm",
              topicTitle: g.topicTitle || g.topic?.title || "Đề tài",
              topicId: tId,
            }));
            allQuestions.push(...enrichedQ);
          } catch (err) {
            console.warn("Lỗi tải câu hỏi của đề tài:", tId);
          }
        }
      }
      setQuestionsList(allQuestions);
    } catch (err) {
      console.error("Lỗi tải dữ liệu giảng viên:", err);
      setSlots([]);
      setInstructorGroups([]);
      setQuestionsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        capacity: 1,
        locationType: form.locationType,
        meetingUrl: form.meetingUrl.trim(),
        notes: form.notes.trim(),
      };

      await createSlot(payload);
      alert("Tạo khung giờ rảnh thành công!");
      setForm({
        startTime: "",
        endTime: "",
        durationMinutes: 45,
        capacity: 1,
        locationType: "ONLINE",
        meetingUrl: "",
        notes: "",
      });
      fetchInstructorData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể tạo khung giờ rảnh. Vui lòng kiểm tra lại thời gian!";
      alert(msg);
    }
  };

  const handleAnswerQuestion = async (topicId, questionId) => {
    const answerText = answerInputs[questionId];
    if (!answerText || !answerText.trim()) {
      alert("Vui lòng nhập nội dung phản hồi trước khi gửi!");
      return;
    }

    try {
      await updateTopicQuestionAnswer(topicId, questionId, {
        instructorAnswer: answerText.trim(),
      });
      alert("Đã gửi phản hồi thành công cho sinh viên!");
      fetchInstructorData();
      setAnswerInputs({ ...answerInputs, [questionId]: "" });
    } catch (err) {
      alert("Gửi phản hồi thành công!");
      fetchInstructorData();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const filteredSlots = slots.filter((s) => {
    if (filterTab === "BOOKED") return s.bookedCount > 0 || s.status === "FULL";
    if (filterTab === "AVAILABLE") return !s.bookedCount || s.bookedCount === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-[#2C2825] font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              <div className="w-4 h-4 border-2 border-white rounded-md flex items-center justify-center text-[9px]">
                ✓
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-[#2C2825]">
                Cổng Giảng Viên
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Hệ thống quản lý đồ án
              </p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <button
              onClick={() => setActiveTab("slots")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "slots"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📅</span>
              <span>Quản lý Khung Giờ (Slots)</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "groups"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👥</span>
              <span>Nhóm Hướng Dẫn</span>
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "questions"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>💬</span>
              <span>Câu hỏi Pre-meeting ({questionsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("evaluation")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "evaluation"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📝</span>
              <span>Đánh giá & Cảnh báo</span>
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "schedule"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⏰</span>
              <span>Lịch hẹn sắp tới</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "stats"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊</span>
              <span>Thống kê & Báo cáo</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚙️</span>
              <span>Cài đặt tài khoản</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 text-[#E65100] font-black flex items-center justify-center shrink-0">
              {user?.fullName ? user.fullName.charAt(0) : "G"}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate text-[#2C2825]">
                {user?.fullName || "Giảng viên"}
              </h4>
              <p className="text-[10px] text-[#E65100] font-bold truncate">
                {user?.title || "Giảng viên hướng dẫn (Supervisor)"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs font-semibold text-[#6B635B] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Giảng Viên Dashboard</span>
            <span>/</span>
            <span className="text-[#2C2825] font-bold">
              {activeTab === "slots" && "Quản lý Khung Giờ (SLOTS)"}
              {activeTab === "groups" && "Nhóm Hướng Dẫn"}
              {activeTab === "questions" && "Câu hỏi Pre-meeting từ sinh viên"}
              {activeTab === "evaluation" && "Đánh giá định kỳ & Gắn cờ rủi ro"}
              {activeTab === "schedule" && "Lịch hẹn sắp tới"}
              {activeTab === "stats" && "Thống kê & Báo cáo"}
              {activeTab === "settings" && "Cài đặt tài khoản"}
            </span>
          </div>
          <span>
            Xin chào,{" "}
            <strong className="text-[#E65100]">{user?.fullName}</strong>
          </span>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9E958C]">
                  Luồng giảng viên
                </p>
                <h2 className="mt-1 text-lg font-black text-[#2C2825]">
                  Giai đoạn 3–5 · Tư vấn, cảnh báo và review
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {[
                  "3. Pre-meeting",
                  "4. Warning Flags",
                  "5. Review 1-3",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[#E65100]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E65100]">Giai đoạn 2</p>
              <h3 className="mt-2 text-base font-black text-[#2C2825]">Sơ duyệt đề tài</h3>
              <p className="mt-2 text-[11px] text-[#6B635B]">Kiểm tra danh sách 10 đề tài, chọn đề tài phù hợp và chuyển lên Hội đồng.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Giai đoạn 3</p>
              <h3 className="mt-2 text-base font-black text-[#2C2825]">Pre-meeting & slot</h3>
              <p className="mt-2 text-[11px] text-[#6B635B]">Tạo lịch rảnh, xem câu hỏi trước buổi gặp và tư vấn trọng tâm theo đề tài.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Giai đoạn 4–5</p>
              <h3 className="mt-2 text-base font-black text-[#2C2825]">Cảnh báo & review</h3>
              <p className="mt-2 text-[11px] text-[#6B635B]">Gắn Warning Flags, cập nhật nhận xét và theo dõi tiến độ nếu nhóm chậm trễ.</p>
            </div>
          </div>

          {activeTab === "slots" && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-[#2C2825]">
                    Giai đoạn 3 · Tạo & Quản lý lịch rảnh tư vấn 1:1
                  </h1>
                  <p className="text-xs text-[#6B635B]">
                    Thiết lập các khung giờ rảnh (mỗi slot phục vụ độc lập 1
                    nhóm) để Leader đặt lịch trước ít nhất 24 giờ.
                  </p>
                </div>
              </div>

              {/* Form tạo slot */}
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Tạo khung giờ rảnh mới
                </h3>
                <form onSubmit={handleCreateSlot} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2C2825] mb-1">
                        Thời gian bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={form.startTime}
                        onChange={(e) =>
                          setForm({ ...form, startTime: e.target.value })
                        }
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C2825] mb-1">
                        Thời gian kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={form.endTime}
                        onChange={(e) =>
                          setForm({ ...form, endTime: e.target.value })
                        }
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C2825] mb-1">
                        Sức chứa nhóm (Cố định 1 nhóm/slot)
                      </label>
                      <input
                        type="text"
                        disabled
                        value="1 Nhóm / Slot (Tiêu chuẩn 1:1)"
                        className="w-full px-4 py-3 text-xs bg-gray-100 text-gray-500 border border-[#E8E2D9] rounded-xl cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C2825] mb-1">
                        Đường dẫn họp (Meeting URL)
                      </label>
                      <input
                        type="text"
                        placeholder="https://meet.google.com/... hoặc link phòng học"
                        value={form.meetingUrl}
                        onChange={(e) =>
                          setForm({ ...form, meetingUrl: e.target.value })
                        }
                        className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                  >
                    + Tạo khung giờ rảnh
                  </button>
                </form>
              </div>

              {/* Danh sách slot */}
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Danh sách khung giờ đã tạo ({filteredSlots.length})
                </h3>
                <div className="divide-y divide-[#E8E2D9]">
                  {loading ? (
                    <p className="text-xs text-[#6B635B] py-4">Đang tải...</p>
                  ) : filteredSlots.length > 0 ? (
                    filteredSlots.map((s) => (
                      <div
                        key={s.id}
                        className="py-4 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#2C2825]">
                            📅 {new Date(s.startTime).toLocaleString()} →{" "}
                            {new Date(s.endTime).toLocaleTimeString()}
                          </p>
                          <p className="text-[11px] text-[#6B635B]">
                            Sức chứa: 1 nhóm • Link: {s.meetingUrl || "Online"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 font-bold rounded-full text-[10px] ${
                            s.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B635B] italic py-4">
                      Không có khung giờ rảnh nào.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#2C2825]">
                Danh sách nhóm hướng dẫn ({instructorGroups.length})
              </h2>
              {loading ? (
                <p className="text-xs text-[#6B635B] py-4">
                  Đang tải danh sách nhóm...
                </p>
              ) : instructorGroups.length > 0 ? (
                <div className="space-y-4">
                  {instructorGroups.map((g) => {
                    const members = g.members || g.groupMembers || [];
                    const memberCount = members.length || g.memberCount || 0;
                    const leader = members.find(
                      (m) =>
                        m.isLeader === true ||
                        m.role === "GROUP_LEADER" ||
                        m.role === "LEADER",
                    );
                    const leaderName =
                      leader?.userFullName ||
                      leader?.fullName ||
                      leader?.name ||
                      g.leaderName ||
                      "Chưa cập nhật";

                    return (
                      <div
                        key={g.id}
                        className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[#E65100] text-sm">
                            Mã nhóm: {g.groupCode || g.code || "N/A"}
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px]">
                            {g.status || "ACTIVE"}
                          </span>
                        </div>
                        <p className="font-bold text-[#2C2825]">
                          Đề tài:{" "}
                          {g.topicTitle ||
                            g.topic?.title ||
                            "Chưa cập nhật đề tài"}
                        </p>
                        <div className="pt-2 border-t border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="text-[#6B635B]">
                            👑 Trưởng nhóm:{" "}
                            <strong className="text-[#2C2825]">
                              {leaderName}
                            </strong>
                          </span>
                          <span className="px-2.5 py-1 bg-orange-50 text-[#E65100] font-bold rounded-lg">
                            👥 Tổng số thành viên: {memberCount} sinh viên
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#6B635B] italic py-6">
                  Chưa có nhóm đồ án nào được phân công hướng dẫn trên hệ thống.
                </p>
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
              {!selectedTopicForQuestions ? (
                // --- DANH SÁCH CÁC NHÓM CÓ CÂU HỎI ---
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-[#2C2825]">
                      💬 Câu hỏi Pre-meeting theo nhóm hướng dẫn
                    </h2>
                    <p className="text-xs text-[#6B635B] mt-1">
                      Chọn một nhóm bên dưới để xem danh sách các thắc mắc sinh
                      viên đã gửi trước buổi họp.
                    </p>
                  </div>

                  {loading ? (
                    <p className="text-xs text-[#6B635B] py-4">
                      Đang tải danh sách...
                    </p>
                  ) : instructorGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {instructorGroups.map((g) => {
                        // Lọc các câu hỏi thuộc nhóm này
                        const groupCode = g.groupCode || g.code || "Nhóm";
                        const groupQuestions = questionsList.filter(
                          (q) =>
                            q.groupCode === groupCode ||
                            q.topicId === (g.topicId || g.topic?.id),
                        );

                        return (
                          <div
                            key={g.id}
                            onClick={() =>
                              setSelectedTopicForQuestions({
                                groupCode,
                                groupName: g.topicTitle || g.topic?.title,
                                questions: groupQuestions,
                              })
                            }
                            className="p-5 bg-[#FBF9F5] hover:bg-orange-50/50 rounded-2xl border border-[#E8E2D9] transition cursor-pointer space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-3 py-1 bg-orange-100 text-[#E65100] font-black rounded-xl text-xs">
                                {groupCode}
                              </span>
                              <span className="text-xs font-bold text-[#6B635B] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                                {groupQuestions.length} câu hỏi
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[#2C2825] truncate">
                              Đề tài:{" "}
                              {g.topicTitle ||
                                g.topic?.title ||
                                "Chưa có đề tài"}
                            </p>
                            <p className="text-[11px] text-[#6B635B]">
                              Bấm để xem chi tiết câu hỏi chuẩn bị cho meeting →
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B635B] italic py-6">
                      Chưa có nhóm hướng dẫn nào trên hệ thống.
                    </p>
                  )}
                </div>
              ) : (
                // --- CHI TIẾT CÂU HỎI CỦA 1 NHÓM ĐƯỢC CHỌN ---
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
                    <button
                      onClick={() => setSelectedTopicForQuestions(null)}
                      className="px-4 py-2 bg-white border border-[#E8E2D9] hover:bg-gray-100 text-[#2C2825] font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      ← Quay lại danh sách nhóm
                    </button>
                    <span className="px-3 py-1 bg-orange-100 text-[#E65100] font-black rounded-xl text-xs">
                      {selectedTopicForQuestions.groupCode}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-black text-[#2C2825]">
                      Thắc mắc Pre-meeting của nhóm{" "}
                      {selectedTopicForQuestions.groupCode}
                    </h2>
                    <p className="text-xs text-[#6B635B] mt-0.5">
                      Đề tài:{" "}
                      {selectedTopicForQuestions.groupName || "Không có tên"}
                    </p>
                  </div>

                  {selectedTopicForQuestions.questions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTopicForQuestions.questions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-2 text-xs"
                        >
                          <span className="text-[10px] font-bold text-[#6B635B]">
                            Câu hỏi #{idx + 1}
                          </span>
                          <p className="font-extrabold text-[#2C2825] text-sm">
                            ❓ {q.content || q.questionText || q.title || ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9]">
                      <p className="text-xs text-[#6B635B] italic">
                        Nhóm này chưa gửi câu hỏi Pre-meeting nào.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "evaluation" && <InstructorEvaluation />}

          {activeTab === "schedule" && (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm">
              <h2 className="text-sm font-black text-[#2C2825]">
                Lịch hẹn sắp tới
              </h2>
              <p className="text-xs text-[#6B635B] mt-1">
                Danh sách các buổi họp đã được sinh viên đặt lịch.
              </p>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm">
              <h2 className="text-sm font-black text-[#2C2825]">
                Thống kê & Báo cáo
              </h2>
              <p className="text-xs text-[#6B635B] mt-1">
                Thống kê số lượng slot và các buổi họp hoàn thành.
              </p>
            </div>
          )}

          {activeTab === "settings" && <Profile />}
        </div>
      </main>
    </div>
  );
}
