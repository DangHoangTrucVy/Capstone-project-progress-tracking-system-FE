import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import NotificationBell from "../../components/NotificationBell";
import {
  getAllGroups,
  getGroupById,
  replaceGroupLeader,
  reviewRoster,
  unlockGroup,
} from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import {
  updateStudentEligibility,
  getIneligibleStudents,
} from "../../services/eligibilityService";
import { downloadGroupsReport } from "../../utils/downloadGroupsReport";
import Profile from "../../auth/Profile";
import EligibilityPanel from "./EligibilityPanel";
import LeaderLeaveRequests from "./LeaderLeaveRequests";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const defaultSystemSettings = {
  semester: "Fall2026",
  applyDeadlineHours: 48,
  groupRegistrationHours: 48,
  maxGroupSize: 5,
  minGroupSize: 3,
  submissionOpen: true,
};

const getManagedRole = (role) => {
  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase();
  const aliases = {
    GROUP_LEADER: "LEADER",
    SYSTEM_ADMIN: "ADMIN",
    LECTURER: "MODERATOR",
  };
  return aliases[normalizedRole] || normalizedRole;
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("monitoring");
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newLeaderId, setNewLeaderId] = useState("");
  const [changingLeader, setChangingLeader] = useState(false);

  const [rosterReviewGroup, setRosterReviewGroup] = useState(null);
  const [rosterReviewNote, setRosterReviewNote] = useState("");
  const [reviewingRoster, setReviewingRoster] = useState(false);

  const [eligibilityConfirmUser, setEligibilityConfirmUser] = useState(null);
  const [updatingEligibility, setUpdatingEligibility] = useState(false);

  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semesterCalendarLoading, setSemesterCalendarLoading] = useState(false);
  const [savingSemesterDate, setSavingSemesterDate] = useState(false);

  // State cho Toast Notification tự động tắt
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

  const handleReviewRoster = async (approved) => {
    if (!rosterReviewGroup || reviewingRoster) return;
    setReviewingRoster(true);
    try {
      await reviewRoster(rosterReviewGroup.id, {
        approved,
        note: rosterReviewNote.trim(),
      });
      if (!approved) {
        await unlockGroup(rosterReviewGroup.id);
      }
      const groupCode = rosterReviewGroup.groupCode;
      setRosterReviewGroup(null);
      setRosterReviewNote("");
      await fetchAdminData();
      showToast(
        approved
          ? `Đã duyệt danh sách nhóm ${groupCode}.`
          : `Đã từ chối danh sách nhóm ${groupCode}. Nhóm đã được mở khóa.`,
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể xử lý danh sách nhóm.",
        "error",
      );
    } finally {
      setReviewingRoster(false);
    }
  };

  const openLeaderModal = async (group) => {
    try {
      const detail = await getGroupById(group.id);
      setSelectedGroup(detail || group);
      setNewLeaderId("");
      setLeaderModalOpen(true);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể tải thông tin nhóm.",
        "error",
      );
    }
  };

  const handleReplaceLeader = async (event) => {
    event.preventDefault();
    if (!selectedGroup || !newLeaderId) {
      showToast("Vui lòng chọn Leader mới.", "error");
      return;
    }

    const members = selectedGroup.members || [];
    const nextLeader = members.find(
      (member) =>
        String(member.userId) === String(newLeaderId) &&
        member.status === "ACTIVE" &&
        !member.isLeader,
    );

    if (!nextLeader) {
      showToast("Thành viên được chọn không hợp lệ.", "error");
      return;
    }

    const confirmed = window.confirm(
      `Đổi Leader nhóm ${selectedGroup.groupCode} sang ${nextLeader.userFullName}?`,
    );
    if (!confirmed) return;

    setChangingLeader(true);
    try {
      await replaceGroupLeader(selectedGroup.id, {
        userId: nextLeader.userId,
      });
      setLeaderModalOpen(false);
      setSelectedGroup(null);
      setNewLeaderId("");
      await fetchAdminData();
      showToast(`Đã đổi Leader nhóm ${selectedGroup.groupCode} thành công.`);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Đổi Leader thất bại.",
        "error",
      );
    } finally {
      setChangingLeader(false);
    }
  };

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [ineligibleUsers, setIneligibleUsers] = useState([]);
  const [reportsSummary, setReportsSummary] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [exportSemester, setExportSemester] = useState("Fall2026");
  const [exportingExcel, setExportingExcel] = useState(false);

  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      return {
        ...defaultSystemSettings,
        ...JSON.parse(localStorage.getItem("adminSystemSettings") || "{}"),
      };
    } catch {
      return defaultSystemSettings;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "STUDENT",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const groupsRes = await getAllGroups().catch(() => []);
      const groupList = groupsRes?.content || groupsRes || [];

      const detailedGroups = await Promise.all(
        groupList.map(async (g) => {
          try {
            const detail = await getGroupById(g.id);
            return detail || g;
          } catch (err) {
            return g;
          }
        }),
      );
      setGroups(detailedGroups);

      const usersRes = await getUsers().catch(() => []);
      let userList = usersRes?.content || usersRes || [];

      try {
        const ineligibleRes = await getIneligibleStudents().catch(() => []);
        setIneligibleUsers(ineligibleRes?.content || ineligibleRes || []);
      } catch (err) {
        console.warn(
          "Không thể tải danh sách sinh viên không đủ điều kiện:",
          err,
        );
      }

      setUsers(userList);
    } catch (error) {
      console.error("Lỗi tải dữ liệu quản trị:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleEligibility = (u) => {
    const targetId = u.id || u.studentCode;
    if (!targetId) {
      showToast("Không tìm thấy ID sinh viên.", "error");
      return;
    }
    setEligibilityConfirmUser(u);
  };

  const confirmToggleEligibility = async () => {
    const u = eligibilityConfirmUser;
    if (!u || updatingEligibility) return;
    const targetId = u.id || u.studentCode;
    const newStatus = u.eligible === false;

    setUpdatingEligibility(true);
    try {
      await updateStudentEligibility(targetId, {
        eligible: newStatus,
      });
      setEligibilityConfirmUser(null);
      await fetchAdminData();
      showToast(
        newStatus
          ? `Đã gỡ cờ điều kiện cho ${u.fullName || u.email}.`
          : `Đã đánh cờ không đủ điều kiện cho ${u.fullName || u.email}.`,
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Cập nhật trạng thái thất bại.",
        "error",
      );
    } finally {
      setUpdatingEligibility(false);
    }
  };

  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserForm({ email: "", fullName: "", password: "", role: "STUDENT" });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setIsEditingUser(true);
    setEditingUserId(u.id);
    setUserForm({
      email: u.email || "",
      fullName: u.fullName || "",
      password: "",
      role: getManagedRole(u.role) || "STUDENT",
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...userForm };
      if (isEditingUser && !payload.password) delete payload.password;
      if (isEditingUser) {
        await updateUser(editingUserId, payload);
        showToast("Cập nhật tài khoản thành công!");
      } else {
        await createUser(payload);
        showToast("Tạo tài khoản thành công!");
      }
      setIsUserModalOpen(false);
      fetchAdminData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại!",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadSemesterCalendar = async (semester) => {
    if (!semester?.trim()) {
      setSemesterStartDate("");
      return;
    }
    setSemesterCalendarLoading(true);
    try {
      const data = await getSemesterCalendar(semester.trim());
      setSemesterStartDate(data.startDate ?? "");
    } catch (error) {
      setSemesterStartDate("");
      showToast(
        error.response?.data?.message || "Không thể tải lịch học kỳ.",
        "error",
      );
    } finally {
      setSemesterCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === "settings") {
      loadSemesterCalendar(systemSettings.semester);
    }
  }, [activeMenu, systemSettings.semester]);

  const handleExportExcel = async (e) => {
    e.preventDefault();
    if (exportingExcel) return;
    setExportingExcel(true);
    try {
      await downloadGroupsReport(exportSemester);
      showToast("Đã tải báo cáo Excel thành công!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleLogout = () => {
    // Xóa toàn bộ thông tin đăng nhập trong LocalStorage
    localStorage.clear();

    // Dùng replace để thay thế lịch sử trình duyệt và chuyển hướng thẳng về trang login
    window.location.replace("/login");
  };

  const filteredGroups = groups.filter(
    (g) =>
      (g.groupCode &&
        g.groupCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.semester &&
        g.semester.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const manageableRoles = ["STUDENT", "LEADER", "ADMIN", "MODERATOR"];
  const manageableUsers = users
    .map((account) => ({ ...account, role: getManagedRole(account.role) }))
    .filter((account) => manageableRoles.includes(account.role));

  const filteredUsers = manageableUsers.filter((u) => {
    const matchesRole = !selectedRole || u.role === selectedRole;
    const matchesSearch =
      !searchQuery ||
      (u.fullName &&
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const displayedUsers =
    selectedRole === "NOT_ELIGIBLE"
      ? ineligibleUsers.filter(
          (u) =>
            !searchQuery ||
            (u.fullName &&
              u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email &&
              u.email.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      : filteredUsers;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải hệ thống quản trị...
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-600 border border-red-200";
      case "MODERATOR":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "LEADER":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "STUDENT":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      default:
        return "bg-orange-50 text-[#E65100] border border-orange-200";
    }
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

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

      {/* SIDEBAR */}
      <aside className="w-79 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-4 select-none shrink-0 h-screen min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-1">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E65100] flex items-center justify-center text-white shadow-md shadow-orange-200">
              ✓
            </div>
            <div>
              <h2 className="font-black text-sm text-[#2C2825]">
                Quản Trị Hệ Thống
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                MatchPoint FPT Capstone
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mb-2 px-3">
              Điều hành chung
            </p>
            <button
              onClick={() => {
                setActiveMenu("monitoring");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "monitoring"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊</span>
              <span>Giám sát tổng quan</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Quản lý học kỳ & sinh viên
            </p>
            <button
              onClick={() => {
                setActiveMenu("eligibility");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "eligibility"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📂</span>
              <span>Import Sinh viên & Điều kiện</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("accounts");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "accounts"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👤</span>
              <span>Tài khoản & Cờ điều kiện</span>
            </button>
            <button
              onClick={() => {
                setSelectedLeaveId(null);
                setActiveMenu("leader-leave");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "leader-leave"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>🙋</span>
              <span>Yêu cầu rời nhóm</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("groups");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "groups"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👥</span>
              <span>Danh sách nhóm</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("export");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "export"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📥</span>
              <span>Xuất Excel Báo cáo</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Cấu hình
            </p>
            <button
              onClick={() => {
                setActiveMenu("settings");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "settings"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚙️</span>
              <span>Cấu hình học kỳ</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Cá nhân
            </p>
            <button
              onClick={() => {
                setActiveMenu("profile");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "profile"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>⚙️</span>
              <span>Hồ sơ Admin</span>
            </button>
          </div>
        </div>

        <div className="shrink-0 pt-4 mt-3 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            {user?.avatarUrl || user?.avatar ? (
              <img
                src={user.avatarUrl || user.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-[#E8E2D9]"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-sm">
                {getInitials(user?.fullName)}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">
                {user?.fullName || "Admin"}
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
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-6 flex justify-between items-center text-xs font-semibold text-[#6B635B] shrink-0">
          <span>Quản Trị Hệ Thống — {activeMenu.toUpperCase()}</span>
          <div className="flex items-center gap-4">
            <NotificationBell
              onOpenLeaderRequest={(id) => {
                setSelectedLeaveId(id);
                setActiveMenu("leader-leave");
              }}
            />
            <span className="text-[#E65100] font-bold">
              Xin chào, {user?.fullName || "Admin"}
            </span>
          </div>
        </header>

        <div className="w-full flex-1 flex flex-col">
          {activeMenu === "monitoring" && (
            <section className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                    Giám sát đầu kỳ
                  </span>
                  <h1 className="text-xl font-black text-[#2C2825] mt-1">
                    Thống kê tổng quan sinh viên & nhóm đồ án Capstone
                  </h1>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="px-4 py-2 bg-orange-50 text-[#E65100] hover:bg-orange-100 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span> Làm mới dữ liệu
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Tổng tài khoản",
                    value: manageableUsers.length,
                    icon: "👤",
                    bg: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "Tổng số nhóm",
                    value: groups.length,
                    icon: "👥",
                    bg: "bg-orange-50 text-[#E65100]",
                  },
                  {
                    label: "Sinh viên (Student)",
                    value: manageableUsers.filter((u) => u.role === "STUDENT")
                      .length,
                    icon: "🎓",
                    bg: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label: "Trưởng nhóm (Leader)",
                    value: manageableUsers.filter((u) => u.role === "LEADER")
                      .length,
                    icon: "⭐",
                    bg: "bg-purple-50 text-purple-600",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-[#E8E2D9] bg-white p-5 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#6B635B]">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#2C2825]">
                        {metric.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${metric.bg}`}
                    >
                      {metric.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-[#2C2825]">
                    📊 Tỷ lệ phân bổ vai trò tài khoản
                  </h3>
                  <div className="h-84 w-full pt-4 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Student",
                              value: manageableUsers.filter(
                                (u) => u.role === "STUDENT",
                              ).length,
                              fill: "#3B82F6",
                            },
                            {
                              name: "Leader",
                              value: manageableUsers.filter(
                                (u) => u.role === "LEADER",
                              ).length,
                              fill: "#10B981",
                            },
                            {
                              name: "Moderator",
                              value: manageableUsers.filter(
                                (u) => u.role === "MODERATOR",
                              ).length,
                              fill: "#8B5CF6",
                            },
                            {
                              name: "Admin",
                              value: manageableUsers.filter(
                                (u) => u.role === "ADMIN",
                              ).length,
                              fill: "#EF4444",
                            },
                          ]}
                          cx="50%"
                          cy="42%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          label
                        >
                          {["#3B82F6", "#10B981", "#8B5CF6", "#EF4444"].map(
                            (color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-xs space-y-5">
                  <h3 className="text-sm font-black text-[#2C2825]">
                    📈 Thống kê sĩ số nhóm đồ án
                  </h3>
                  <div className="space-y-4 pt-2">
                    {(() => {
                      const validGroups = groups.filter((g) => {
                        const count =
                          g.memberCount ??
                          g.numberOfMembers ??
                          (Array.isArray(g.members) ? g.members.length : 0);
                        return count >= 3 && count <= 5;
                      }).length;
                      const invalidGroups = groups.length - validGroups;
                      const validPercent = groups.length
                        ? Math.round((validGroups / groups.length) * 100)
                        : 0;

                      return (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-emerald-700">
                                Nhóm đạt chuẩn sĩ số (3 - 5 người)
                              </span>
                              <span>
                                {validGroups} nhóm ({validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${validPercent}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-amber-700">
                                Nhóm chưa đạt chuẩn (&lt; 3 hoặc &gt; 5)
                              </span>
                              <span>
                                {invalidGroups} nhóm ({100 - validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${100 - validPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeMenu === "eligibility" && (
            <EligibilityPanel onChanged={fetchAdminData} />
          )}
          {activeMenu === "leader-leave" && (
            <LeaderLeaveRequests
              key={selectedLeaveId || "inbox"}
              selectedId={selectedLeaveId}
              onChanged={fetchAdminData}
            />
          )}

          {activeMenu === "accounts" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý tài khoản & Cờ điều kiện
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Quản lý tài khoản sinh viên, leader, moderator và admin.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="bg-white p-4 border border-[#E8E2D9] rounded-2xl flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#6B635B] mr-2">
                    Lọc vai trò:
                  </span>
                  {[
                    { label: "Tất cả", value: "" },
                    { label: "Admin", value: "ADMIN" },
                    { label: "Moderator", value: "MODERATOR" },
                    { label: "Leader", value: "LEADER" },
                    { label: "Student", value: "STUDENT" },
                    { label: "Không đủ điều kiện", value: "NOT_ELIGIBLE" },
                  ].map((roleObj) => (
                    <button
                      key={roleObj.value}
                      onClick={() => setSelectedRole(roleObj.value)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        selectedRole === roleObj.value
                          ? "bg-[#E65100] text-white shadow-sm"
                          : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9]"
                      }`}
                    >
                      {roleObj.label}
                    </button>
                  ))}
                </div>
                <div className="w-full md:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Tìm kiếm theo tên, email..."
                    className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase w-16 text-center">
                        STT
                      </th>
                      <th className="p-4 font-black uppercase">Họ và tên</th>
                      <th className="p-4 font-black uppercase">Email</th>
                      <th className="p-4 font-black uppercase">Vai trò</th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                      <th className="p-4 font-black uppercase text-left">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {displayedUsers.length > 0 ? (
                      displayedUsers.map((u, index) => {
                        const isEligible =
                          selectedRole === "NOT_ELIGIBLE"
                            ? false
                            : u.eligible !== false;
                        return (
                          <tr
                            key={u.id || u.email}
                            className="hover:bg-[#FBF9F5]/70 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#6B635B]">
                              {index + 1}
                            </td>
                            <td className="p-4 font-bold text-[#2C2825]">
                              {u.fullName}
                            </td>
                            <td className="p-4 text-[#6B635B]">{u.email}</td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 font-extrabold text-[10px] uppercase rounded-lg ${getRoleBadgeStyle(getManagedRole(u.role))}`}
                              >
                                {getManagedRole(u.role)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${isEligible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600 border border-red-200"}`}
                              >
                                {isEligible
                                  ? "Đủ điều kiện"
                                  : "📌 Không đủ điều kiện"}
                              </span>
                            </td>
                            <td className="p-4 text-left">
                              <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-3 py-1.5 bg-white border border-[#E8E2D9] hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                                >
                                  ✏️ Sửa
                                </button>
                                {getManagedRole(u.role) !== "ADMIN" && (
                                  <button
                                    onClick={() => handleToggleEligibility(u)}
                                    className={`px-3 py-1.5 font-bold rounded-xl text-xs transition cursor-pointer border shadow-xs ${
                                      isEligible
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {isEligible ? "📌 Gắn cờ" : "🟢 Gỡ cờ"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-12 text-center text-[#6B635B] italic"
                        >
                          Không tìm thấy tài khoản phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <h2 className="text-xl font-black text-[#2C2825]">
                  Quản lý danh sách nhóm đồ án
                </h2>
                <p className="text-xs text-[#6B635B]">
                  Theo dõi toàn bộ các nhóm Capstone Project.
                </p>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm theo mã nhóm, học kỳ..."
                className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
              />

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Mã nhóm</th>
                      <th className="p-4 font-black uppercase">Học kỳ</th>
                      <th className="p-4 font-black uppercase">
                        Sĩ số thành viên
                      </th>
                      <th className="p-4 font-black uppercase text-right">
                        Thao tác
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
                        const isValidSize = count >= 3 && count <= 5;
                        return (
                          <tr
                            key={g.id}
                            className="hover:bg-[#FBF9F5]/60 transition"
                          >
                            <td className="p-4 font-bold text-[#2C2825]">
                              {g.groupCode}
                            </td>
                            <td className="p-4 font-semibold text-[#6B635B]">
                              {g.semester || "Fall2026"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${isValidSize ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {count}/5 người (
                                {isValidSize ? "Hợp lệ" : "Chưa đạt chuẩn"})
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => openLeaderModal(g)}
                                className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer"
                              >
                                ⚙️ Sửa / Đổi Leader
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-8 text-center text-[#6B635B] italic"
                        >
                          Không tìm thấy nhóm đồ án nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "export" && (
            <div className="min-h-full w-full bg-[#FBF8F4] p-5 text-[#020202] sm:p-7 xl:p-10">
              <div className="mx-auto w-full max-w-[1600px] space-y-8">
                <section className="relative overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm p-6 sm:p-8">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#F8EAE0] px-3 py-1.5 text-[11px] font-bold text-[#A96745]">
                    QT15 · BÁO CÁO BÀN GIAO
                  </span>
                  <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    Xuất báo cáo ghép nhóm
                  </h1>
                  <p className="mt-2 text-sm text-[#81766D]">
                    Tổng hợp thông tin nhóm và sinh viên thành file Excel.
                  </p>
                </section>

                <section className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-3xl border border-[#E9DED4] bg-white p-6 shadow-sm sm:p-7">
                    <form onSubmit={handleExportExcel} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-[#6B635B]">
                          Học kỳ cần xuất báo cáo
                        </label>
                        <select
                          value={exportSemester}
                          onChange={(e) => setExportSemester(e.target.value)}
                          className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 text-sm outline-none"
                        >
                          <option value="Fall2026">Fall 2026</option>
                          <option value="Spring2027">Spring 2027</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={exportingExcel}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6f27] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943]"
                      >
                        {exportingExcel
                          ? "Đang tạo file Excel..."
                          : "↓ Tải xuống báo cáo (.xlsx)"}
                      </button>
                    </form>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeMenu === "settings" && (
            <section className="p-6 space-y-6 lg:p-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#E65100]">
                  CẤU HÌNH HỆ THỐNG
                </span>
                <h1 className="mt-3 text-2xl font-black text-[#2C2825]">
                  Cấu hình học kỳ
                </h1>
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-sm sm:p-7">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#51463F]">
                      Mã học kỳ
                    </label>
                    <input
                      type="text"
                      value={systemSettings.semester}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          semester: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#51463F]">
                      Ngày bắt đầu học kỳ
                    </label>
                    <input
                      type="date"
                      value={semesterStartDate}
                      onChange={(e) => setSemesterStartDate(e.target.value)}
                      disabled={semesterCalendarLoading || savingSemesterDate}
                      className="w-full rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] px-4 py-3 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={savingSemesterDate || !semesterStartDate}
                    onClick={async () => {
                      setSavingSemesterDate(true);
                      try {
                        await updateSemesterStartDate(
                          systemSettings.semester.trim(),
                          semesterStartDate,
                        );
                        showToast("Đã lưu ngày bắt đầu học kỳ thành công!");
                      } catch (error) {
                        showToast(
                          "Không thể lưu ngày bắt đầu học kỳ.",
                          "error",
                        );
                      } finally {
                        setSavingSemesterDate(false);
                      }
                    }}
                    className="rounded-xl bg-[#E65100] px-5 py-3 text-sm font-bold text-white"
                  >
                    {savingSemesterDate ? "Đang lưu..." : "Lưu ngày bắt đầu"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeMenu === "profile" && (
            <div className="p-8 w-full">
              <Profile />
            </div>
          )}
        </div>
      </main>

      {/* MODAL THÊM/SỬA USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveUser}
            className="w-full max-w-lg space-y-5 rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h3 className="text-base font-black text-[#2C2825]">
                {isEditingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="font-bold text-gray-400 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Họ và tên
              <input
                value={userForm.fullName}
                onChange={(event) =>
                  setUserForm({ ...userForm, fullName: event.target.value })
                }
                required
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Email
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm({ ...userForm, email: event.target.value })
                }
                required
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Mật khẩu {isEditingUser && "(để trống nếu không đổi)"}
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm({ ...userForm, password: event.target.value })
                }
                required={!isEditingUser}
                minLength={8}
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Vai trò (Role)
              <select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm({ ...userForm, role: event.target.value })
                }
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
              >
                <option value="STUDENT">Student</option>
                <option value="LEADER">Leader</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t border-[#F0EBE1] pt-4">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Đang lưu..." : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ĐỔI LEADER */}
      {leaderModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleReplaceLeader}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-[#2C2825]">
                Đổi Leader nhóm {selectedGroup.groupCode}
              </h3>
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="font-bold text-gray-400"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-2 text-sm font-bold">
              Chọn Leader mới
              <select
                value={newLeaderId}
                onChange={(event) => setNewLeaderId(event.target.value)}
                required
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
              >
                <option value="">-- Chọn thành viên --</option>
                {(selectedGroup.members || [])
                  .filter(
                    (member) =>
                      member.status === "ACTIVE" &&
                      !member.isLeader &&
                      member.userId,
                  )
                  .map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userFullName} ({member.userEmail})
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={changingLeader || !newLeaderId}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white"
              >
                {changingLeader ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
