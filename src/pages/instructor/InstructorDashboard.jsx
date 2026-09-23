import React, { useState, useEffect } from "react";
import { getSlots, createSlot } from "../../services/scheduleService";
import { getCurrentUser } from "../../services/authService";

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("slots");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form tạo Slot
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    durationMinutes: 30,
    capacity: 1,
    locationType: "ONLINE",
    meetingUrl: "",
  });

  const fetchInstructorData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Bắt lỗi an toàn để tránh crash khi backend lỗi SQL
      const resSlots = await getSlots().catch(() => []);
      setSlots(resSlots.content || resSlots || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu giảng viên:", err);
      setSlots([]); // Gán mảng rỗng khi lỗi 500
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
        capacity: Number(form.capacity),
        locationType: form.locationType,
        meetingUrl: form.meetingUrl.trim(),
      };

      await createSlot(payload);
      alert("Tạo khung giờ rảnh thành công!");
      setForm({
        startTime: "",
        endTime: "",
        durationMinutes: 30,
        capacity: 1,
        locationType: "ONLINE",
        meetingUrl: "",
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

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#E65100] rounded-xl flex items-center justify-center text-white font-black shadow-md">
              👨‍🏫
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "slots" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>📅</span>
              <span>Quản lý Khung Giờ (Slots)</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "groups" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>👥</span>
              <span>Nhóm Hướng Dẫn</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
          <div className="overflow-hidden">
            <h4 className="text-xs font-black truncate">
              {user?.fullName || "Giảng viên"}
            </h4>
            <p className="text-[10px] text-[#6B635B] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-xs font-bold text-red-500 hover:underline"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs font-semibold text-[#6B635B]">
          <span>Giảng Viên Dashboard — {activeTab.toUpperCase()}</span>
          <span className="text-orange-600 font-bold">
            Xin chào, {user?.fullName}
          </span>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {activeTab === "slots" && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <h1 className="text-2xl font-black text-[#2C2825]">
                  Tạo & Quản lý lịch rảnh (Schedule Slots)
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Thiết lập các khung giờ trống để sinh viên tiến hành đặt lịch
                  hướng dẫn.
                </p>
              </div>

              {/* Form tạo slot */}
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Tạo khung giờ rảnh mới
                </h3>
                <form
                  onSubmit={handleCreateSlot}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-[#6B635B] mb-1">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({ ...form, startTime: e.target.value })
                      }
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B635B] mb-1">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({ ...form, endTime: e.target.value })
                      }
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B635B] mb-1">
                      Sức chứa tối đa (Số nhóm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={form.capacity}
                      onChange={(e) =>
                        setForm({ ...form, capacity: e.target.value })
                      }
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B635B] mb-1">
                      Đường dẫn họp (Meeting URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/..."
                      value={form.meetingUrl}
                      onChange={(e) =>
                        setForm({ ...form, meetingUrl: e.target.value })
                      }
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Tạo khung giờ rảnh
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách slot */}
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Danh sách khung giờ đã tạo
                </h3>
                <div className="divide-y divide-[#E8E2D9]">
                  {loading ? (
                    <p className="text-xs text-[#6B635B] py-4">Đang tải...</p>
                  ) : slots.length > 0 ? (
                    slots.map((s) => (
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
                            Sức chứa: {s.bookedCount || 0}/{s.capacity} nhóm •
                            Link: {s.meetingUrl || "Online"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 font-bold rounded-full text-[10px] ${s.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B635B] italic py-4">
                      Bạn chưa tạo khung giờ rảnh nào.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#2C2825]">
                Danh sách nhóm hướng dẫn
              </h2>
              <p className="text-xs text-[#6B635B]">
                Theo dõi các nhóm đồ án đang đăng ký giảng viên làm hướng dẫn.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
