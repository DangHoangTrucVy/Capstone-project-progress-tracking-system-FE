import { useEffect, useState } from "react";
import {
  getSemesterRoomsForMod,
  getSemesterStatistics,
  exportSemesterExcel,
  dissolveSubMinimumRooms,
  getPendingFinalizeRequests,
} from "../../services/moderatorService";
import { decideFinalizeRequest } from "../../services/roomService";
import { getSemesters } from "../../services/semesterService";
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";
import Profile from "../../auth/Profile";
import ModeratorLeaveRequests from "./ModeratorLeaveRequests";
import ModeratorTimeline from "./ModeratorTimeline";
import ModeratorGroupControl from "./ModeratorGroupControl";
import NotificationBell from "../../components/NotificationBell";

const StatBar = ({ value, total, color }) => {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="w-full bg-[#F3EFEA] h-3 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const SEMESTER_STAGES = [
  { id: 1, key: "OPEN", title: "1. Mở học kỳ", desc: "Khởi tạo dữ liệu danh sách sinh viên" },
  { id: 2, key: "FORMING", title: "2. Lập nhóm", desc: "Sinh viên tự do ghép phòng" },
  { id: 3, key: "ADJUSTING", title: "3. Bổ sung", desc: "Điều phối & Gộp phòng" },
  { id: 4, key: "FINISHED", title: "4. Kết thúc ghép nhóm", desc: "Khóa & Bàn giao" },
];

const getCurrentStageIndex = (phase) => {
  const p = (phase || "").toUpperCase();
  if (p === "OPEN" || p === "INIT") return 1;
  if (p === "FORMING" || p === "ROUND1") return 2;
  if (p === "ADJUSTING" || p === "ROUND2" || p === "FINALIZING") return 3;
  if (p === "FINISHED" || p === "LOCKED" || p === "DEADLINE_LOCKED" || p === "FINALIZED") return 4;
  return 2;
};

export default function ModeratorDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("groups");
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [controlFilterStatus, setControlFilterStatus] = useState("ALL");

  // Modal danh sách phòng chờ duyệt chốt chuẩn Swagger
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [pendingFinalizeList, setPendingFinalizeList] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState("ALL");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const fetchModeratorData = async () => {
      try {
        const currentUser = await getCurrentUser().catch(() => null);
        setUser(currentUser);

        const semRes = await getSemesters({ size: 1000 }).catch(() => []);
        const semList = Array.isArray(semRes) ? semRes : semRes.content || [];
        setSemesters(semList);
        if (semList.length > 0 && !selectedSemester) {
          const firstCode = semList[0].code || semList[0].name || semList[0];
          setSelectedSemester(firstCode);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchModeratorData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadSemesterData(selectedSemester);
    }
  }, [selectedSemester, activeMenu]);

  const loadSemesterData = async (semester) => {
    try {
      const [roomsRes, statsRes] = await Promise.all([
        getSemesterRoomsForMod(semester).catch(() => []),
        getSemesterStatistics(semester).catch(() => null),
      ]);
      setRooms(Array.isArray(roomsRes) ? roomsRes : roomsRes.content || roomsRes.items || []);
      setStats(statsRes);
    } catch {
      setRooms([]);
      setStats(null);
    }
  };

  const handleOpenStudentsModal = async (filterType = "ALL") => {
    setStudentFilter(filterType);
    setStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const res = await api.get(`/semesters/${selectedSemester}/students`).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : res.data?.content || res.data?.items || [];
      setStudentList(list);
    } catch {
      setStudentList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleNavigateToGroupControl = (filterStatus = "ALL") => {
    setControlFilterStatus(filterStatus);
    setActiveMenu("group-control");
  };

  // Mở modal danh sách phòng chờ duyệt chốt chuẩn Swagger
  const handleOpenFinalizeModal = async () => {
    setFinalizeModalOpen(true);
    setLoadingPending(true);
    try {
      const res = await getPendingFinalizeRequests(selectedSemester).catch(() => []);
      const list = Array.isArray(res) ? res : res.data || res.content || [];
      setPendingFinalizeList(list);
    } catch {
      setPendingFinalizeList([]);
    } finally {
      setLoadingPending(false);
    }
  };

  // Xử lý Duyệt hoặc Từ chối chốt phòng lẻ
  const handleApproveRoomFinalize = async (roomId, approved) => {
    try {
      await decideFinalizeRequest(roomId, {
        approved,
        reason: approved ? "" : "Chưa đạt yêu cầu của Người điều phối",
      });
      showToast(approved ? "Đã duyệt chốt phòng thành Nhóm chính thức!" : "Đã từ chối báo chốt.");
      // Tải lại danh sách chờ chốt và dữ liệu học kỳ
      handleOpenFinalizeModal();
      loadSemesterData(selectedSemester);
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  const handleDissolveSubMin = async () => {
    if (!window.confirm("Xác nhận giải tán tất cả các Phòng có sĩ số dưới mức tối thiểu?")) return;
    try {
      await dissolveSubMinimumRooms(selectedSemester, { allBelowMinimum: true });
      showToast("Đã giải tán các Phòng dưới sĩ số tối thiểu!");
      loadSemesterData(selectedSemester);
    } catch (error) {
      showToast(error.response?.data?.message || "Giải tán thất bại.", "error");
    }
  };

  const handleExport = async () => {
    try {
      const blobData = await exportSemesterExcel(selectedSemester);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Bao_cao_ghep_nhom_${selectedSemester}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Tải file Excel bàn giao thành công!");
    } catch {
      showToast("Không thể xuất file lúc này.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải phân vùng Người điều phối...
      </div>
    );
  }

  const totalObj = stats?.total || stats || {};
  const currentPhase = stats?.phase || totalObj?.phase || "FORMING";
  const currentStageIdx = getCurrentStageIndex(currentPhase);

  const totalStudents = totalObj.totalStudents ?? 0;
  const totalRoomsCount = totalObj.totalRooms ?? rooms.length;
  const subMinCount = totalObj.roomsBelowMinimum ?? totalObj.underMinCount ?? 0;
  const withGroupCount = totalObj.withGroup ?? 0;
  const unassignedCount = totalObj.withoutGroup ?? totalObj.unassignedCount ?? 0;

  const filteredStudentList = studentList.filter((s) => {
    const matchesSearch =
      (s.fullName || "").toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (s.studentCode || s.code || "").toLowerCase().includes(studentSearchTerm.toLowerCase());
    
    const isIneligible = s.eligibility === "INELIGIBLE" || s.eligible === false;
    const hasRoom = Boolean(s.hasGroup || s.roomId || s.roomName);

    if (studentFilter === "HAS_GROUP") return matchesSearch && hasRoom && !isIneligible;
    if (studentFilter === "NO_GROUP") return matchesSearch && !hasRoom && !isIneligible;
    if (studentFilter === "INELIGIBLE") return matchesSearch && isIneligible;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden relative">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}>
          {toast.message}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-68 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-4 shrink-0 h-screen overflow-hidden shadow-2xs select-none">
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center space-x-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-2xl bg-[#E65100] flex items-center justify-center text-white font-black shadow-md">
              ✓
            </div>
            <div>
              <h2 className="font-black text-sm text-[#2C2825]">Người Điều Phối</h2>
              <p className="text-[10px] text-[#6B635B]">Hệ thống Quản lý Đồ án</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <p className="text-[11px] font-black text-[#E65100] uppercase tracking-wider mb-2 px-3">
              Quản lý Học kỳ
            </p>
            <button
              onClick={() => setActiveMenu("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "groups" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊 Trang Tổng quan</span>
            </button>
            <button
              onClick={() => handleNavigateToGroupControl("ALL")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "group-control" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>🚪 Danh sách & Điều phối Phòng</span>
            </button>
            <button
              onClick={() => setActiveMenu("timeline")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "timeline" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⏱ Lịch trình & Giai đoạn</span>
            </button>
            <button
              onClick={() => setActiveMenu("leave-requests")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "leave-requests" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📝 Khiếu nại rời Phòng</span>
            </button>

            <p className="text-[11px] font-black text-[#E65100] uppercase tracking-wider mt-6 mb-2 px-3">
              Cá nhân
            </p>
            <button
              onClick={() => setActiveMenu("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "profile" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👤 Hồ sơ cá nhân</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
              {user?.fullName?.slice(0, 2).toUpperCase() || "ĐP"}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">{user?.fullName || "Người điều phối"}</h4>
              <p className="text-[10px] text-[#6B635B] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs cursor-pointer">
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-18 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs shrink-0 shadow-2xs">
          <span className="font-extrabold text-[#E65100] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 uppercase">
            Người Điều Phối — {activeMenu === "groups" ? "TRANG TỔNG QUAN HỌC KỲ" : activeMenu === "group-control" ? "DANH SÁCH & ĐIỀU PHỐI PHÒNG" : activeMenu === "timeline" ? "LỊCH TRÌNH & GIAI ĐOẠN" : activeMenu === "leave-requests" ? "KHIẾU NẠI RỜI PHÒNG" : "HỒ SƠ CÁ NHÂN"}
          </span>

          <div className="flex items-center space-x-4">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
            >
              {semesters.map((sem, idx) => (
                <option key={idx} value={sem.code || sem.name || sem}>
                  Học kỳ: {sem.code || sem.name || sem}
                </option>
              ))}
            </select>
            <NotificationBell />
          </div>
        </header>

        <div className="w-full flex-1 flex flex-col">
          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              
              {/* TIMELINE GIAI ĐOẠN */}
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-3xl shadow-xs space-y-5">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-base font-black text-[#2C2825]"> Tiến trình Giai đoạn Học kỳ {selectedSemester}</h2>
                    <p className="text-[11px] text-[#6B635B]">Hệ thống đang chạy theo cột mốc 4 giai đoạn chuẩn của học kỳ</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenFinalizeModal}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
                    >
                      📋 Duyệt Phòng Chờ Chốt
                    </button>
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
                    >
                      ↓ Xuất Excel (.xlsx)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative pt-2">
                  {SEMESTER_STAGES.map((stage) => {
                    const isCurrent = stage.id === currentStageIdx;
                    const isPassed = stage.id < currentStageIdx;
                    return (
                      <div
                        key={stage.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-2 ${
                          isCurrent
                            ? "bg-orange-50 border-[#E65100] shadow-sm ring-2 ring-orange-200"
                            : isPassed
                            ? "bg-emerald-50 border-emerald-200 opacity-90"
                            : "bg-[#FAF8F5] border-[#E8E2D9] opacity-60"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                              isCurrent
                                ? "bg-[#E65100] text-white"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-300 text-gray-700"
                            }`}
                          >
                            {isPassed ? "✓" : stage.id}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-[#E65100] text-white text-[9px] font-black rounded-full animate-pulse">
                              ĐANG DIỄN RA
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className={`font-black text-xs ${isCurrent ? "text-[#E65100]" : "text-[#2C2825]"}`}>
                            {stage.title}
                          </h4>
                          <p className="text-[10px] text-[#6B635B] mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD THỐNG KÊ */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                <div
                  onClick={() => handleOpenStudentsModal("ALL")}
                  className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1 cursor-pointer hover:border-[#E65100] hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-[#6B635B] group-hover:text-[#E65100]">Tổng số Sinh viên</p>
                    <span className="text-[10px] text-[#6B635B] opacity-0 group-hover:opacity-100 transition">Xem danh sách ↗</span>
                  </div>
                  <p className="text-3xl font-black text-[#2C2825]">{totalStudents}</p>
                  <StatBar value={totalStudents} total={totalStudents} color="bg-blue-600" />
                </div>

                <div
                  onClick={() => handleNavigateToGroupControl("HAS_MEMBERS")}
                  className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1 cursor-pointer hover:border-emerald-500 hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-emerald-700">Sinh viên đã vào Phòng</p>
                    <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition">Chuyển sang tab ↗</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600">{withGroupCount}</p>
                  <StatBar value={withGroupCount} total={totalStudents} color="bg-emerald-500" />
                </div>

                <div
                  onClick={() => handleNavigateToGroupControl("ALL")}
                  className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1 cursor-pointer hover:border-orange-500 hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-[#6B635B] group-hover:text-[#E65100]">Tổng số Phòng hiện tại</p>
                    <span className="text-[10px] text-[#E65100] opacity-0 group-hover:opacity-100 transition">Quản lý phòng ↗</span>
                  </div>
                  <p className="text-3xl font-black text-[#E65100]">{totalRoomsCount}</p>
                  <StatBar value={totalRoomsCount} total={totalRoomsCount} color="bg-orange-500" />
                </div>

                <div
                  onClick={() => handleNavigateToGroupControl("ALL")}
                  className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1 cursor-pointer hover:border-red-500 hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-red-600">Phòng dưới sĩ số min</p>
                    <span className="text-[10px] text-red-600 opacity-0 group-hover:opacity-100 transition">Xử lý ngay ↗</span>
                  </div>
                  <p className="text-3xl font-black text-red-600">{subMinCount}</p>
                  <StatBar value={subMinCount} total={totalRoomsCount} color="bg-red-500" />
                </div>

                <div
                  onClick={() => handleOpenStudentsModal("NO_GROUP")}
                  className="bg-[#FAF8F5] p-5 rounded-3xl border border-amber-200 shadow-xs space-y-1 cursor-pointer hover:border-amber-500 hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-amber-800">Sinh viên chưa có Phòng</p>
                    <span className="text-[10px] text-amber-800 opacity-0 group-hover:opacity-100 transition">Xem chi tiết ↗</span>
                  </div>
                  <p className="text-3xl font-black text-amber-600">{unassignedCount}</p>
                  <StatBar value={unassignedCount} total={totalStudents} color="bg-amber-500" />
                </div>
              </div>

              {/* PHÂN BỔ TRẠNG THÁI PHÒNG */}
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-3xl shadow-xs space-y-4">
                <h3 className="font-black text-sm text-[#2C2825]">📊 Biểu đồ phân bổ Trạng thái Phòng</h3>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-700">Phòng Đủ Đạt Chuẩn (Sĩ số từ 3 - 5 sinh viên)</span>
                      <span>{totalRoomsCount - subMinCount} Phòng</span>
                    </div>
                    <StatBar value={totalRoomsCount - subMinCount} total={totalRoomsCount} color="bg-emerald-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-red-600">Phòng Dưới 3 người (Cần giải tán / gộp)</span>
                      <span>{subMinCount} Phòng</span>
                    </div>
                    <StatBar value={subMinCount} total={totalRoomsCount} color="bg-red-500" />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleDissolveSubMin}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    💥 Giải tán nhanh tất cả Phòng dưới 3 thành viên
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "group-control" && (
            <ModeratorGroupControl
              semester={selectedSemester}
              initialFilter={controlFilterStatus}
              onGroupUpdated={() => loadSemesterData(selectedSemester)}
            />
          )}

          {activeMenu === "timeline" && (
            <ModeratorTimeline semester={selectedSemester} onRefresh={() => loadSemesterData(selectedSemester)} />
          )}

          {activeMenu === "leave-requests" && (
            <ModeratorLeaveRequests semester={selectedSemester} />
          )}

          {activeMenu === "profile" && (
            <div className="p-8 w-full">
              <Profile />
            </div>
          )}
        </div>
      </main>

      {/* MODAL DUYỆT PHÒNG CHỜ CHỐT CHUẨN SWAGGER */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-[#2C2825]">Danh sách Phòng đang chờ duyệt Chốt</h3>
                <p className="text-[11px] text-[#6B635B]">Các phòng đã gửi yêu cầu báo chốt lên Người điều phối</p>
              </div>
              <button onClick={() => setFinalizeModalOpen(false)} className="px-3 py-1 bg-gray-100 rounded-xl font-bold cursor-pointer">
                ✕ Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingPending ? (
                <div className="text-center py-12 text-[#6B635B] font-bold">Đang tải danh sách chờ chốt...</div>
              ) : pendingFinalizeList.length > 0 ? (
                pendingFinalizeList.map((req) => {
                  const rId = req.id || req.roomId;
                  const rName = req.name || req.roomName || "Phòng đồ án";
                  const membersCount = req.members?.length || req.memberCount || 0;
                  return (
                    <div key={rId} className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm text-[#E65100]">{rName}</p>
                        <p className="text-[10px] text-[#6B635B]">
                          Ngành: {req.majorCode || req.majorName || "---"} • Sĩ số: {membersCount} thành viên
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRoomFinalize(rId, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          onClick={() => handleApproveRoomFinalize(rId, false)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl cursor-pointer"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-[#6B635B] italic">
                  Hiện không có phòng nào đang gửi yêu cầu chờ duyệt chốt.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DANH SÁCH SINH VIÊN KÈM LÝ DO KHÔNG ĐỦ ĐIỀU KIỆN */}
      {studentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-[#2C2825]">Danh sách Sinh viên Học kỳ {selectedSemester}</h3>
                <p className="text-[11px] text-[#6B635B]">Chi tiết điều kiện tham gia ghép nhóm đồ án</p>
              </div>
              <button onClick={() => setStudentsModalOpen(false)} className="px-3 py-1 bg-gray-100 rounded-xl text-xs font-bold hover:bg-gray-200">
                ✕ Đóng
              </button>
            </div>

            <div className="flex gap-2 flex-wrap items-center justify-between">
              <input
                type="text"
                placeholder="Tìm theo Tên sinh viên hoặc MSSV..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="flex-1 min-w-55 p-2.5 rounded-xl border border-[#E8E2D9] text-xs bg-[#FBF9F5] outline-none"
              />
              <div className="flex gap-1 bg-[#FBF9F5] p-1 rounded-xl border border-[#E8E2D9] text-xs font-bold">
                <button
                  onClick={() => setStudentFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg ${studentFilter === "ALL" ? "bg-white shadow-xs text-[#E65100]" : "text-[#6B635B]"}`}
                >
                  Tất cả ({studentList.length})
                </button>
                <button
                  onClick={() => setStudentFilter("HAS_GROUP")}
                  className={`px-3 py-1.5 rounded-lg ${studentFilter === "HAS_GROUP" ? "bg-white shadow-xs text-emerald-600" : "text-[#6B635B]"}`}
                >
                  🟢 Đã vào phòng
                </button>
                <button
                  onClick={() => setStudentFilter("NO_GROUP")}
                  className={`px-3 py-1.5 rounded-lg ${studentFilter === "NO_GROUP" ? "bg-white shadow-xs text-amber-600" : "text-[#6B635B]"}`}
                >
                  🟡 Chưa có phòng
                </button>
                <button
                  onClick={() => setStudentFilter("INELIGIBLE")}
                  className={`px-3 py-1.5 rounded-lg ${studentFilter === "INELIGIBLE" ? "bg-white shadow-xs text-red-600" : "text-[#6B635B]"}`}
                >
                  🔴 Không đủ điều kiện
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingStudents ? (
                <div className="text-center py-12 text-[#6B635B] text-xs font-bold">Đang tải danh sách sinh viên...</div>
              ) : filteredStudentList.length > 0 ? (
                filteredStudentList.map((s, idx) => {
                  const isIneligible = s.eligibility === "INELIGIBLE" || s.eligible === false;
                  const hasRoom = Boolean(s.hasGroup || s.roomId || s.roomName);
                  const ineligibilityReason = s.ineligibleReason || s.reason || "Nợ môn điều kiện / Thiếu tín chỉ tích lũy";

                  return (
                    <div
                      key={s.userId || s.id || idx}
                      className={`p-3.5 border rounded-2xl flex justify-between items-center text-xs ${
                        isIneligible ? "bg-red-50/50 border-red-200" : "bg-[#FBF9F5] border-[#E8E2D9]"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-[#2C2825] flex items-center gap-2">
                          <span>{s.fullName}</span>
                          {isIneligible && (
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">
                              Không đủ điều kiện
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#6B635B] mt-0.5">
                          MSSV: {s.studentCode || s.code || "---"} • Ngành: {s.majorCode || s.majorName || "---"}
                        </p>
                        {isIneligible && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            ⚠️ Lý do: {ineligibilityReason}
                          </p>
                        )}
                      </div>

                      <div>
                        {isIneligible ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-lg text-[10px] font-bold">
                            🚫 Không đủ điều kiện
                          </span>
                        ) : hasRoom ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                            ✓ {s.roomName ? `Phòng: ${s.roomName}` : "Đã vào phòng"}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                            ⚠️ Chưa có phòng
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-[#6B635B] italic text-xs">Không tìm thấy sinh viên nào phù hợp.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}