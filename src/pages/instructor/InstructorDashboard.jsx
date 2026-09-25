import React, { useState, useEffect } from "react";
import { getSlots, createSlot } from "../../services/scheduleService";
import { getCurrentUser } from "../../services/authService";

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("slots");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState("ALL"); // ALL, BOOKED, AVAILABLE

  // Form tạo Slot (Đã cố định capacity = 1 theo BR-BOOKING-02)
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

      const resSlots = await getSlots().catch(() => []);
      setSlots(resSlots.content || resSlots || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu giảng viên:", err);
      setSlots([]);
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
        capacity: 1, // Luôn chuẩn hóa bằng 1 theo nguyên tắc 1:1
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${
                activeTab === "groups"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👥</span>
              <span>Nhóm Hướng Dẫn</span>
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${
                activeTab === "stats"
                  ? "bg-[#E65100] text-white shadow-md font-extrabold"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊</span>
              <span>Thống kê & Báo cáo</span>
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
              <p className="text-[10px] text-[#6B635B] truncate">
                {user?.email}
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
              Quản lý Khung Giờ (SLOTS)
            </span>
          </div>
          <span>Xin chào, <strong className="text-[#E65100]">{user?.fullName}</strong></span>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {activeTab === "slots" && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-[#2C2825]">
                    Tạo & Quản lý lịch rảnh (Schedule Slots)
                  </h1>
                  <p className="text-xs text-[#6B635B]">
                    Thiết lập các khung giờ rảnh (mỗi slot phục vụ độc lập 1 nhóm) để sinh viên đặt lịch.
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
                            Sức chứa: 1 nhóm • Link:{" "}
                            {s.meetingUrl || "Online"}
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
        </div>
      </main>
    </div>
  );
}