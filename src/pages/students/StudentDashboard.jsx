import { useState, useEffect } from "react";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import RoomSearchAndJoin from "./StudentProfileAndApply";
import GroupManagementPanel from "./GroupManagementPanel";
import ActivityHistory from "./ActivityHistory"; // <-- Thêm import component nhật ký hoạt động
import Profile from "../../auth/Profile";
import NotificationBell from "../../components/NotificationBell";
import { getCurrentUser } from "../../services/authService";
import { getSemesterRooms } from "../../services/roomService";
import { getSemesters } from "../../services/semesterService";

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [myRoom, setMyRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const semRes = await getSemesters().catch(() => []);
      const semList = Array.isArray(semRes) ? semRes : semRes.content || [];
      setSemesters(semList);

      let currentSem = selectedSemester;
      if (!currentSem && semList.length > 0) {
        currentSem = semList[0].code || semList[0].name || semList[0];
        setSelectedSemester(currentSem);
      }

      if (currentSem) {
        const roomsRes = await getSemesterRooms(currentSem).catch(() => []);
        const roomList = Array.isArray(roomsRes)
          ? roomsRes
          : roomsRes.content || [];

        const foundRoom = roomList.find((r) =>
          r.members?.some(
            (m) => String(m.userId || m.id) === String(user.id || user.userId),
          ),
        );

        if (foundRoom) {
          setMyRoom(foundRoom);
        } else {
          setMyRoom(null);
          setActiveTab("search");
        }
      }
    } catch (err) {
      console.error("Lỗi tải thông tin sinh viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [selectedSemester]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] text-xs font-bold text-[#6B635B] font-sans">
        Đang kiểm tra trạng thái Room đồ án...
      </div>
    );
  }

  const isLeader = Boolean(
    myRoom?.members?.find(
      (m) =>
        String(m.userId || m.id) ===
        String(currentUser?.id || currentUser?.userId),
    )?.isLeader || myRoom?.leaderId === currentUser?.id,
  );

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 shrink-0 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-linear-to-br from-[#E65100] to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              ✓
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#2C2825]">
                Hệ thống Ghép nhóm
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                Hệ thống Quản lý Đồ án
              </p>
            </div>
          </div>

          <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">Phòng:</span>
              <span
                className={`font-black text-xs ${myRoom ? "text-emerald-600" : "text-amber-600"}`}
              >
                {myRoom
                  ? myRoom.groupCode
                    ? ` ${myRoom.groupCode}`
                    : ` ${(myRoom.name || "").replace(/^(Room|Phòng)\s*/i, "")}`
                  : "Chưa vào phòng"}
              </span>
            </div>
            {myRoom && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B635B]">Vai trò:</span>
                <span className="font-bold text-[#E65100]">
                  {isLeader ? "Trưởng nhóm" : "Thành viên"}
                </span>
              </div>
            )}
          </div>

          <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            {myRoom ? (
              <>
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-[#E65100] text-white shadow-md"
                      : "hover:bg-[#FBF9F5]"
                  }`}
                >
                  <span>📊</span>
                  <span>Tổng quan phòng</span>
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer ${
                    activeTab === "members"
                      ? "bg-[#E65100] text-white shadow-md"
                      : "hover:bg-[#FBF9F5]"
                  }`}
                >
                  <span>👥</span>
                  <span>Thành viên trong phòng</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab("search")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer ${
                  activeTab === "search"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#FBF9F5]"
                }`}
              >
                <span>🔍</span>
                <span>Tìm & Vào Phòng</span>
              </button>
            )}

            {/* Nút Nhật ký hoạt động mới được thêm vào Sidebar */}
            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#FBF9F5]"
              }`}
            >
              <span>📜</span>
              <span>Nhật ký hoạt động</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#FBF9F5]"
              }`}
            >
              <span>⚙️</span>
              <span>Hồ sơ cá nhân</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
              {currentUser?.fullName?.slice(0, 2).toUpperCase() || "SV"}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate text-[#2C2825]">
                {currentUser?.fullName}
              </h4>
              <p className="text-[10px] text-[#6B635B] truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH BÊN PHẢI */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-18 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-[#E65100] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
              Học kỳ: {selectedSemester}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
            >
              {semesters.map((s, idx) => (
                <option key={idx} value={s.code || s.name || s}>
                  {s.code || s.name || s}
                </option>
              ))}
            </select>
            <button
              onClick={fetchStudentData}
              className="text-[#E65100] font-bold hover:underline cursor-pointer"
            >
              Làm mới
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && myRoom && (
            <Overview
              roomData={myRoom}
              isLeader={isLeader}
              onRefresh={fetchStudentData}
            />
          )}
          {activeTab === "members" && myRoom && (
            <MemberGroup
              roomData={myRoom}
              isLeader={isLeader}
              onRefresh={fetchStudentData}
            />
          )}
          {activeTab === "management" && myRoom && (
            <GroupManagementPanel
              roomData={myRoom}
              isLeader={isLeader}
              onRefresh={fetchStudentData}
            />
          )}
          {activeTab === "search" && (
            <RoomSearchAndJoin
              semester={selectedSemester}
              onJoined={fetchStudentData}
            />
          )}
          {activeTab === "history" && (
            <ActivityHistory semester={selectedSemester} />
          )}
          {activeTab === "profile" && <Profile />}
        </div>
      </main>
    </div>
  );
}