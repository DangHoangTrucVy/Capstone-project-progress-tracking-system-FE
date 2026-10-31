import { useEffect, useState } from "react";
import {
  getGroupsBySemester,
  getSemesterStatistics,
  exportSemesterExcel,
  dissolveGroupsBatch,
} from "../../services/moderatorService";
import { getSemesters } from "../../services/eligibilityService";
import { getCurrentUser } from "../../services/authService";
import Profile from "../../auth/Profile";
import ModeratorLeaveRequests from "./ModeratorLeaveRequests";
import ModeratorScopes from "./ModeratorScopes";
import ModeratorGroupControl from "./ModeratorGroupControl";
import NotificationBell from "../../components/NotificationBell";

export default function ModeratorDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("groups");
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterUnder3, setFilterUnder3] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

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
      console.error("Lỗi tải dữ liệu Điều phối viên:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModeratorData();
  }, []);

  // Tự động tải lại dữ liệu khi đổi học kỳ hoặc khi chuyển về tab quản lý nhóm
  useEffect(() => {
    if (selectedSemester) {
      loadSemesterData(selectedSemester);
    }
  }, [selectedSemester, activeMenu]);

  const loadSemesterData = async (semester) => {
    try {
      const [groupsRes, statsRes] = await Promise.all([
        getGroupsBySemester(semester).catch(() => []),
        getSemesterStatistics(semester).catch(() => null),
      ]);
      setGroups(
        Array.isArray(groupsRes)
          ? groupsRes
          : groupsRes.content || groupsRes.items || [],
      );
      setStats(statsRes);
    } catch {
      setGroups([]);
      setStats(null);
    }
  };

  const handleDissolveUnder3 = async () => {
    const under3Groups = groups.filter((g) => {
      const count =
        g.memberCount ??
        g.numberOfMembers ??
        (Array.isArray(g.members) ? g.members.length : 0);
      return count < 3;
    });

    if (under3Groups.length === 0) {
      showToast("Không có nhóm nào dưới 3 thành viên để giải tán.", "error");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn giải tán toàn bộ ${under3Groups.length} nhóm dưới 3 người không?`,
      )
    )
      return;

    try {
      const groupIds = under3Groups.map((g) => g.id);
      await dissolveGroupsBatch(groupIds);
      showToast("Đã giải tán các nhóm dưới chuẩn thành công!");
      loadSemesterData(selectedSemester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại.",
        "error",
      );
    }
  };

  const handleExport = async () => {
    try {
      const blobData = await exportSemesterExcel(selectedSemester);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Danh_sach_ghep_nhom_${selectedSemester}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Tải xuống tệp Excel bàn giao thành công!");
    } catch (error) {
      showToast("Không thể xuất tệp lúc này.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };

  const getInitials = (name) => {
    if (!name) return "ĐP";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

  const filteredGroups = groups.filter((g) => {
    const count =
      g.memberCount ??
      g.numberOfMembers ??
      (Array.isArray(g.members) ? g.members.length : 0);
    if (filterUnder3) return count < 3;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải phân vùng Điều phối viên...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden relative">
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-2 animate-bounce ${
            toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"
          }`}
        >
          <span>{toast.type === "error" ? "❌" : "✨"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR ĐIỀU PHỐI VIÊN */}
      <aside className="w-79 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-4 select-none shrink-0 h-screen min-h-0 overflow-hidden shadow-2xs">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-1">
          <div className="flex items-center space-x-3.5 px-2 pt-2">
            <div className="w-9 h-9 rounded-2xl bg-[#E65100] flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black">
              ✓
            </div>
            <div>
              <h2 className="font-black text-sm text-[#2C2825]">
                Điều Phối Viên
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Hệ thống Quản lý Đồ án FPT
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mb-2 px-3">
              Điều hành học kỳ
            </p>
            <button
              onClick={() => setActiveMenu("groups")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "groups"
                  ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚖️</span>
              <span>Điều phối & Nhóm</span>
            </button>
            <button
              onClick={() => setActiveMenu("leave-requests")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "leave-requests"
                  ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>🙋</span>
              <span>Khiếu nại rời nhóm</span>
            </button>
            <button
              onClick={() => setActiveMenu("scopes")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "scopes"
                  ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⏱️</span>
              <span>Phạm vi & Thời hạn ngành</span>
            </button>

            <button
              onClick={() => setActiveMenu("group-control")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "group-control"
                  ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚙️</span>
              <span>Điều phối chi tiết nhóm</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Cá nhân
            </p>

            <button
              onClick={() => setActiveMenu("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeMenu === "profile"
                  ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚙️</span>
              <span>Hồ sơ cá nhân</span>
            </button>
          </div>
        </div>

        <div className="shrink-0 pt-4 mt-3 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            {user?.avatarUrl || user?.avatar ? (
              <img
                src={user.avatarUrl || user.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover shadow-xs border border-[#E8E2D9]"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-xs">
                {getInitials(user?.fullName)}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">
                {user?.fullName || "Điều phối viên"}
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

      {/* CONTENT CHÍNH */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-18 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-[#E65100] bg-orange-50/80 px-3 py-1.5 rounded-xl border border-orange-100/80 shadow-2xs">
              Điều Phối Viên — {activeMenu === "groups" ? "QUẢN LÝ NHÓM" : activeMenu === "leave-requests" ? "KHIẾU NẠI RỜI NHÓM" : activeMenu === "scopes" ? "PHẠM VI & THỜI HẠN" : activeMenu === "group-control" ? "ĐIỀU PHỐI CHI TIẾT" : "HỒ SƠ CÁ NHÂN"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
            >
              {semesters.map((sem, idx) => {
                const code = sem.code || sem;
                return (
                  <option key={idx} value={code}>
                    {code}
                  </option>
                );
              })}
            </select>

            <NotificationBell />

            <div className="text-right hidden sm:block pl-3 border-l border-[#E8E2D9]">
              <p className="font-extrabold text-[#2C2825] text-xs">
                {user?.fullName || "Điều phối viên"}
              </p>
              <p className="text-[10px] text-[#6B635B]">{user?.email}</p>
            </div>
          </div>
        </header>

        <div className="w-full flex-1 flex flex-col">
          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-3xl shadow-sm flex justify-between items-center flex-wrap gap-4">
                <div>
                  <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-lg">
                    ĐIỀU PHỐI VIÊN · QUẢN LÝ HỌC KỲ
                  </span>
                  <h1 className="text-xl font-black text-[#2C2825] mt-1">
                    Quản lý nhóm đồ án & Xuất báo cáo bàn giao
                  </h1>
                </div>
                <div>
                  <button
                    onClick={handleExport}
                    className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition"
                  >
                    ↓ Xuất Excel bàn giao (.xlsx)
                  </button>
                </div>
              </div>

              {stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    <p className="text-xs font-bold text-[#6B635B]">
                      Tổng sinh viên
                    </p>
                    <p className="text-2xl font-black text-[#2C2825] mt-1">
                      {stats.total?.totalStudents || stats.totalStudents || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    <p className="text-xs font-bold text-[#6B635B]">
                      Tổng số nhóm
                    </p>
                    <p className="text-2xl font-black text-[#E65100] mt-1">
                      {stats.total?.totalGroups ||
                        stats.totalGroups ||
                        groups.length}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    <p className="text-xs font-bold text-[#6B635B]">
                      Nhóm dưới 3 người
                    </p>
                    <p className="text-2xl font-black text-red-600 mt-1">
                      {stats?.under3GroupsCount ??
                        stats?.total?.under3GroupsCount ??
                        groups.filter(
                          (g) => (g.members?.length || g.memberCount || 0) < 3,
                        ).length}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    <p className="text-xs font-bold text-[#6B635B]">
                      Sinh viên chưa có nhóm
                    </p>
                    <p className="text-2xl font-black text-amber-600 mt-1">
                      {stats.total?.withoutGroup ||
                        stats.unassignedStudents ||
                        0}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 border border-[#E8E2D9] rounded-3xl flex items-center justify-between shadow-sm flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#6B635B]">
                    Bộ lọc:
                  </span>
                  <button
                    onClick={() => setFilterUnder3(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      !filterUnder3
                        ? "bg-[#E65100] text-white shadow-xs"
                        : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9]"
                    }`}
                  >
                    Tất cả nhóm ({groups.length})
                  </button>
                  <button
                    onClick={() => setFilterUnder3(true)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      filterUnder3
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    ⚠️ Nhóm dưới 3 người
                  </button>
                </div>

                <button
                  onClick={handleDissolveUnder3}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition"
                >
                  💥 Giải tán tất cả nhóm dưới 3 người
                </button>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Tên Nhóm</th>
                      <th className="p-4 font-black uppercase">Sĩ số</th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                      <th className="p-4 font-black uppercase text-right">
                        Quyền điều phối
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => {
                        const count =
                          g.memberCount ??
                          g.numberOfMembers ??
                          (Array.isArray(g.members) ? g.members.length : 0);
                        const isValid = count >= 3 && count <= 5;
                        return (
                          <tr
                            key={g.id}
                            className="hover:bg-[#FBF9F5]/70 transition"
                          >
                            <td className="p-4 font-bold text-[#E65100]">
                              {g.groupCode || g.name}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 font-bold rounded-xl text-[10px] ${isValid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}
                              >
                                {count}/5 người (
                                {isValid ? "Hợp lệ" : "Chưa đạt chuẩn"})
                              </span>
                            </td>
                            <td className="p-4 font-bold">
                              {g.locked || g.isLocked ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[10px]">
                                  Nhóm đã khóa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px]">
                                  Nhóm đang mở
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-xs text-[#6B635B] italic bg-[#FBF9F5] px-3 py-1.5 rounded-xl border border-[#E8E2D9]">
                                Giảng viên điều phối có toàn quyền thêm/bớt/gộp
                                nhóm
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-12 text-center text-[#6B635B] italic"
                        >
                          Không tìm thấy nhóm nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "leave-requests" && (
            <ModeratorLeaveRequests semester={selectedSemester} />
          )}

          {activeMenu === "scopes" && (
            <ModeratorScopes semester={selectedSemester} />
          )}

          {activeMenu === "group-control" && (
            <ModeratorGroupControl semester={selectedSemester} onGroupUpdated={() => loadSemesterData(selectedSemester)} />
          )}

          {activeMenu === "profile" && (
            <div className="p-8 w-full">
              <Profile />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}