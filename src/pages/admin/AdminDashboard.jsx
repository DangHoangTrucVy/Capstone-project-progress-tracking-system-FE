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
import { getReportsSummary } from "../../services/progressService";
import {
  updateStudentEligibility,
  getIneligibleStudents,
} from "../../services/eligibilityService";
import {
  getRegistrations,
  getPendingRegistrationCount,
} from "../../services/registrationService";
import { downloadGroupsReport } from "../../utils/downloadGroupsReport";
import Profile from "../../auth/Profile";
import RegistrationReview from "./RegistrationReview";
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

  const [pendingCount, setPendingCount] = useState(0);

  const handleReviewRoster = async (approved) => {
    if (!rosterReviewGroup || reviewingRoster) return;

    setReviewingRoster(true);

    try {
      await reviewRoster(rosterReviewGroup.id, {
        approved,
        note: rosterReviewNote.trim(),
      });

      if (!approved) {
        // Admin từ chối: mở khóa để Leader chỉnh sửa danh sách.
        await unlockGroup(rosterReviewGroup.id);
      }

      const groupCode = rosterReviewGroup.groupCode;

      setRosterReviewGroup(null);
      setRosterReviewNote("");

      await fetchAdminData();

      showToast(
        approved
          ? `Đã duyệt danh sách nhóm ${groupCode}.`
          : `Đã từ chối danh sách nhóm ${groupCode}. Nhóm đã được mở khóa để bổ sung thành viên.`,
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Không thể xử lý danh sách nhóm. Vui lòng thử lại.",
        "error",
      );
    } finally {
      setReviewingRoster(false);
    }
  };

  const loadPendingRegistrationCount = async () => {
    try {
      const count = await getPendingRegistrationCount();
      setPendingCount(count);
    } catch (error) {
      console.error("Không tải được số đăng ký chờ duyệt:", error);
    }
  };

  useEffect(() => {
    loadPendingRegistrationCount();

    const intervalId = setInterval(loadPendingRegistrationCount, 30000);

    return () => clearInterval(intervalId);
  }, []);

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
      showToast(
        "Thành viên được chọn không còn hoạt động hoặc không hợp lệ.",
        "error",
      );
      return;
    }

    const confirmed = window.confirm(
      `Đổi Leader nhóm ${selectedGroup.groupCode} sang ${nextLeader.userFullName}?\n\n` +
        "Hệ thống sẽ cập nhật vai trò Leader. Việc rời nhóm của Leader cũ được xử lý theo luồng xin rời nhóm.",
    );

    if (!confirmed) return;

    setChangingLeader(true);

    try {
      // Chỉ đổi Leader; không tự xóa Leader cũ ở frontend.
      await replaceGroupLeader(selectedGroup.id, {
        userId: nextLeader.userId,
      });

      setLeaderModalOpen(false);
      setSelectedGroup(null);
      setNewLeaderId("");

      // Lấy lại dữ liệu mới nhất từ Backend.
      await fetchAdminData();

      showToast(
        `Đã đổi Leader nhóm ${selectedGroup.groupCode} thành ${nextLeader.userFullName}.`,
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Đổi Leader thất bại.",
        "error",
      );
    } finally {
      setChangingLeader(false);
    }
  };

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
    }, 3000); // Tự động tắt sau 3 giây
  };

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [ineligibleUsers, setIneligibleUsers] = useState([]);
  const [reportsSummary, setReportsSummary] = useState(null);
  const [reportsError, setReportsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);

  // State cho phần Eligibility Import
  // State cho phần Xuất Excel (QT15)
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

      // Lấy danh sách sinh viên không đủ điều kiện từ API chuẩn của backend
      try {
        const ineligibleRes = await getIneligibleStudents().catch(() => []);
        setIneligibleUsers(ineligibleRes?.content || ineligibleRes || []);
      } catch (err) {
        console.warn(
          "Không thể tải danh sách sinh viên không đủ điều kiện:",
          err,
        );
      }

      const leaderIdentifiers = new Set();
      detailedGroups.forEach((g) => {
        if (g.leaderId) leaderIdentifiers.add(g.leaderId);
        if (g.leader?.id) leaderIdentifiers.add(g.leader.id);
        if (g.leader?.email)
          leaderIdentifiers.add(g.leader.email.toLowerCase());
        if (g.leaderEmail) leaderIdentifiers.add(g.leaderEmail.toLowerCase());
        if (Array.isArray(g.members)) {
          g.members.forEach((m) => {
            if (m.isLeader) {
              if (m.userId) leaderIdentifiers.add(m.userId);
              if (m.id) leaderIdentifiers.add(m.id);
              if (m.email || m.userEmail)
                leaderIdentifiers.add((m.email || m.userEmail).toLowerCase());
            }
          });
        }
      });

      try {
        const approvedRegsRes = await getRegistrations({
          status: "ACTIVE",
          size: 100,
        }).catch(() => ({ content: [] }));
        const approvedRegs = approvedRegsRes?.content || approvedRegsRes || [];

        const mappedRegUsers = approvedRegs.map((reg) => {
          const regId = reg.id || reg.studentCode;
          const regEmail = (reg.email || "").toLowerCase();
          const isGroupLeader =
            leaderIdentifiers.has(regId) || leaderIdentifiers.has(regEmail);

          return {
            id: regId,
            fullName: reg.fullName,
            email: reg.email,
            role: isGroupLeader ? "LEADER" : "STUDENT",
            eligible: reg.eligible ?? true,
          };
        });

        const existingEmails = new Set(userList.map((u) => u.email));
        for (const regUser of mappedRegUsers) {
          if (!existingEmails.has(regUser.email)) {
            userList.push(regUser);
          }
        }
      } catch (err) {
        console.warn("Không thể tải danh sách đăng ký đã duyệt:", err);
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

  const handleToggleEligibility = async (u) => {
    const targetId = u.id || u.studentCode;

    if (!targetId) {
      showToast("Không tìm thấy ID sinh viên.", "error");
      return;
    }

    const currentStatus = u.eligible !== false;
    const newStatus = !currentStatus;

    const confirmed = window.confirm(
      newStatus
        ? `Gỡ cờ không đủ điều kiện cho ${u.fullName || u.email}?`
        : `Đánh cờ không đủ điều kiện cho ${u.fullName || u.email}?\n\n` +
            "Nếu sinh viên này đang là Leader, Backend sẽ tự chọn thành viên ACTIVE khác làm Leader và cập nhật vai trò.",
    );

    if (!confirmed) return;

    try {
      // Chỉ cập nhật cờ. Backend chịu trách nhiệm xử lý thành viên và Leader.
      await updateStudentEligibility(targetId, {
        eligible: newStatus,
      });

      // Tải lại nhóm, thành viên, vai trò và danh sách cờ từ Backend.
      await fetchAdminData();

      showToast(
        newStatus
          ? `Đã gỡ cờ điều kiện cho ${u.fullName || u.email}.`
          : `Đã đánh cờ không đủ điều kiện cho ${u.fullName || u.email}. Nếu đây là Leader, hệ thống sẽ áp dụng cơ chế tự động chuyển Leader của Backend.`,
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Cập nhật trạng thái đủ điều kiện thất bại.",
        "error",
      );
    }
  };

  const fetchReportsSummary = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const semesterToFetch = systemSettings?.semester || "Fall2026";
      const response = await getReportsSummary({ semester: semesterToFetch });
      setReportsSummary(response?.data ?? response);
    } catch (error) {
      setReportsError(
        error.response?.data?.message || "Không thể tải báo cáo tổng hợp.",
      );
      setReportsSummary(null);
    } finally {
      setReportsLoading(false);
    }
  };

  const reportEntries = Object.entries(
    reportsSummary?.summary ?? reportsSummary ?? {},
  ).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value),
  );

  const formatReportValue = (value) => {
    if (typeof value === "number") return value.toLocaleString("vi-VN");
    if (typeof value === "boolean") return value ? "Có" : "Không";
    return value;
  };

  const formatReportLabel = (key) =>
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^./, (character) => character.toLocaleUpperCase("vi-VN"));

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

  const handleSaveSystemSettings = (event) => {
    event.preventDefault();
    localStorage.setItem("adminSystemSettings", JSON.stringify(systemSettings));
    showToast("Đã lưu cấu hình hệ thống đầu kỳ thành công!");
  };

  const updateSystemSetting = (key, value) => {
    setSystemSettings((current) => ({ ...current, [key]: value }));
  };

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
    localStorage.clear();
    window.location.href = "/login";
  };

  const filteredGroups = groups.filter(
    (g) =>
      (g.groupCode &&
        g.groupCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.semester &&
        g.semester.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const manageableRoles = ["STUDENT", "LEADER", "ADMIN"];
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

  // Nếu chọn tab "Không đủ điều kiện", lấy trực tiếp từ danh sách chuyên biệt của API getIneligibleStudents
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
        Đang tải hệ thống quản trị đầu kỳ...
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-600 border border-red-200";
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
      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-2 animate-bounce ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}
        >
          <span>{toast.type === "error" ? "❌" : "✨"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 h-screen">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E65100] flex items-center justify-center text-white shadow-md shadow-orange-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12 2.3 2.3 4.7-4.7" />
              </svg>
            </div>

            <div>
              <h2 className="font-black text-sm text-[#2C2825]">
                Quản Lý Sinh Viên
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Hệ thống Quản lý Đồ án
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
                fetchReportsSummary();
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
              Quản lý sinh viên & nhóm
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
              <span>Import Sinh viên </span>
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
                setActiveMenu("registrations");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "registrations"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📝</span>

              <span className="flex-1 text-left">Duyệt đăng ký sinh viên</span>

              {pendingCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedLeaveId(null);
                setActiveMenu("leader-leave");
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-orange-50"
            >
              🙋 Yêu cầu rời nhóm của Leader
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
              <span>Danh sách nhóm </span>
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
              <span>Xuất Excel Báo cáo </span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Cấu hình đợt
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
              <span>Cấu hình thời hạn</span>
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

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
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
                {user?.fullName || "Admin hệ thống"}
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
          {/* --- MONITORING --- */}
          {activeMenu === "monitoring" && (
            <section className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                    Giám sát đầu kỳ
                  </span>
                  <h1 className="text-xl font-black text-[#2C2825] mt-1">
                    Thống kê tổng quan sinh viên & nhóm đồ án
                  </h1>
                </div>
                <button
                  onClick={fetchReportsSummary}
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
                    className="rounded-2xl border border-[#E8E2D9] bg-white p-5 flex items-center justify-between shadow-xs hover:shadow-md transition"
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-[#2C2825]">
                      📊 Tỷ lệ phân bổ vai trò tài khoản
                    </h3>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-bold">
                      Hệ thống
                    </span>
                  </div>
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
                              name: "Admin",
                              value: manageableUsers.filter(
                                (u) => u.role === "ADMIN",
                              ).length,
                              fill: "#EF4444",
                            },
                          ]}
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {["#3B82F6", "#10B981", "#EF4444"].map(
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-[#2C2825]">
                      📈 Thống kê sĩ số nhóm đồ án
                    </h3>
                    <span className="text-[10px] bg-orange-50 text-[#E65100] px-2.5 py-1 rounded-lg font-bold">
                      Quy chuẩn 3-5 người
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    {(() => {
                      const validGroups = groups.filter((g) => {
                        const count =
                          g.memberCount ??
                          g.numberOfMembers ??
                          g.currentMembers ??
                          g.totalMembers ??
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
                                Nhóm đạt chuẩn sĩ số (3 - 5 thành viên)
                              </span>
                              <span>
                                {validGroups} nhóm ({validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${validPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-amber-700">
                                Nhóm chưa đạt chuẩn sĩ số (&lt; 3 hoặc &gt; 5)
                              </span>
                              <span>
                                {invalidGroups} nhóm ({100 - validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${100 - validPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-4 p-4 bg-[#FBF9F5] rounded-xl border border-[#E8E2D9] text-xs text-[#6B635B] space-y-1">
                            <p className="font-bold text-[#2C2825]">
                              💡 Gợi ý vận hành:
                            </p>
                            <p>
                              Toàn bộ hệ thống hiện đang có{" "}
                              <strong>{groups.length} nhóm</strong> đăng ký hoạt
                              động trong học kỳ này. Admin có thể kiểm tra chi
                              tiết tại tab{" "}
                              <em>
                                {" "}
                                <strong>Danh sách nhóm</strong>
                              </em>
                              .
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-black text-[#2C2825]">
                    📑 Chỉ số hoạt động Backend
                  </h2>
                </div>
                {reportsLoading ? (
                  <p className="text-xs text-[#6B635B]">Đang tải báo cáo...</p>
                ) : reportsError ? (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    <p>{reportsError}</p>
                    <button
                      onClick={fetchReportsSummary}
                      className="font-bold underline cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : reportEntries.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {reportEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-xs"
                      >
                        <p className="text-xs font-bold text-[#6B635B]">
                          {formatReportLabel(key)}
                        </p>
                        <p className="mt-2 text-2xl font-black text-[#2C2825]">
                          {formatReportValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B635B]">
                    Hệ thống vận hành ổn định. Sẵn sàng quản lý sinh viên đầu
                    kỳ.
                  </p>
                )}
              </div> */}
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

          {/* --- ACCOUNTS & CONDITION FLAGS --- */}
          {activeMenu === "accounts" && (
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý tài khoản & Cờ điều kiện sinh viên
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Bao gồm tài khoản hệ thống và các sinh viên đăng ký bằng
                    email cá nhân đã được duyệt.
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
                      <th className="p-4 font-black uppercase">
                        Trạng thái / Cờ điều kiện
                      </th>
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
                                className={`px-3 py-1 font-extrabold text-[10px] uppercase rounded-lg ${getRoleBadgeStyle(
                                  getManagedRole(u.role),
                                )}`}
                              >
                                {getManagedRole(u.role)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${isEligible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600 border border-red-200"}`}
                              >
                                {isEligible
                                  ? "Đủ điều kiện "
                                  : "📌 Không đủ điều kiện "}
                              </span>
                            </td>
                            <td className="p-4 text-left">
                              <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                                {/* Nút sửa */}
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-3 py-1.5 bg-white border border-[#E8E2D9] hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <span>✏️</span> Sửa
                                </button>

                                {/* Chỉ hiển thị nút gắn/gỡ cờ nếu tài khoản KHÔNG PHẢI là ADMIN */}
                                {getManagedRole(u.role) !== "ADMIN" && (
                                  <button
                                    onClick={() => handleToggleEligibility(u)}
                                    className={`px-3 py-1.5 font-bold rounded-xl text-xs transition cursor-pointer border shadow-xs flex items-center gap-1 ${
                                      isEligible
                                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                  >
                                    <span>{isEligible ? "📌" : "🟢"}</span>
                                    <span>
                                      {isEligible
                                        ? "Gắn cờ không đủ điều kiện"
                                        : "Gỡ cờ đủ điều kiện"}
                                    </span>
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

          {/* --- STUDENT SIGN-UPS WITH A PERSONAL EMAIL --- */}
          {activeMenu === "registrations" && (
            <RegistrationReview
              onChanged={() => {
                fetchAdminData();
                loadPendingRegistrationCount();
              }}
            />
          )}

          {/* --- GROUPS MANAGEMENT --- */}
          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý danh sách nhóm đồ án
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Theo dõi toàn bộ các nhóm, kiểm tra sĩ số và can thiệp thay
                    đổi Leader hoặc thành viên khi cần thiết.
                  </p>
                </div>
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
                      <th className="p-4 font-black uppercase">
                        Trạng thái nhóm
                      </th>
                      <th className="p-4 font-black uppercase">
                        Trạng thái duyệt
                      </th>
                      <th className="p-4 font-black uppercase text-right">
                        Can thiệp Admin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => {
                        const count =
                          g.memberCount ??
                          g.numberOfMembers ??
                          g.currentMembers ??
                          g.totalMembers ??
                          (Array.isArray(g.members) ? g.members.length : 0) ??
                          (Array.isArray(g.studentIds)
                            ? g.studentIds.length
                            : 0);
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
                            <td className="p-4 font-medium text-[#6B635B]">
                              Hoạt động
                            </td>

                            <td className="p-4">
                              {g.rosterStatus === "SUBMITTED" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRosterReviewGroup(g);
                                    setRosterReviewNote("");
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  Chờ duyệt
                                </button>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                                    g.rosterStatus === "APPROVED"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : g.rosterStatus === "REJECTED"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : g.rosterStatus === "DRAFT"
                                          ? "border-orange-200 bg-orange-50 text-[#B96943]"
                                          : "border-gray-200 bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      g.rosterStatus === "APPROVED"
                                        ? "bg-emerald-500"
                                        : g.rosterStatus === "REJECTED"
                                          ? "bg-red-500"
                                          : g.rosterStatus === "DRAFT"
                                            ? "bg-[#C9784F]"
                                            : "bg-gray-400"
                                    }`}
                                  />

                                  {g.rosterStatus === "APPROVED"
                                    ? "Đã duyệt"
                                    : g.rosterStatus === "REJECTED"
                                      ? "Đã từ chối"
                                      : g.rosterStatus === "DRAFT"
                                        ? "Chưa gửi duyệt"
                                        : g.rosterStatus || "Chưa xác định"}
                                </span>
                              )}
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
                          colSpan="5"
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

          {/* --- EXPORT EXCEL REPORT --- */}

          {activeMenu === "export" && (
            <div className="min-h-full w-full bg-[#FBF8F4] p-5 text-[#020202] sm:p-7 xl:p-10">
              <div className="mx-auto w-full max-w-[1600px] space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-5 p-6 sm:p-8 md:flex-row md:items-center">
                    <div className="max-w-2xl">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#F8EAE0] px-3 py-1.5 text-[11px] font-bold text-[#A96745]">
                        <span className="h-2 w-2 rounded-full bg-[#C98C68]" />
                        QT15 · BÁO CÁO BÀN GIAO
                      </span>

                      <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                        Xuất báo cáo ghép nhóm
                      </h1>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-[#81766D]">
                        Tổng hợp thông tin nhóm và tình trạng sinh viên thành
                        file Excel, hỗ trợ kiểm tra và bàn giao dữ liệu nhanh
                        chóng.
                      </p>
                    </div>

                    <div className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-[#F8EAE0] md:flex">
                      <div className="flex h-20 w-16 flex-col gap-2 rounded-xl border border-[#E8D5C5] bg-white p-3 shadow-sm">
                        <div className="h-3 rounded bg-[#D9A27F]" />
                        <div className="h-2 rounded bg-[#EFE4DB]" />
                        <div className="h-2 rounded bg-[#EFE4DB]" />
                        <div className="h-2 rounded bg-[#EFE4DB]" />
                        <div className="mt-auto h-2 w-7 rounded bg-[#D9A27F]" />
                      </div>
                    </div>
                  </div>

                  <div className="h-1 bg-linear-to-r from-[#D9A27F] via-[#EBD3C2] to-[#F8EAE0]" />
                </section>

                {/* Three sheet cards */}
                <section className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#B47C5C]">
                      Tổng quan dữ liệu
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold">
                      Nội dung trong file Excel
                    </h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        number: "01",
                        title: "Danh sách nhóm",
                        sheet: "Danh_sach_nhom",
                        description:
                          "Mã nhóm, học kỳ, trạng thái, sĩ số và thông tin từng thành viên.",
                        icon: "▤",
                      },
                      {
                        number: "02",
                        title: "Chưa có nhóm",
                        sheet: "Chua_co_nhom",
                        description:
                          "Sinh viên đủ điều kiện nhưng chưa tham gia nhóm.",
                        icon: "♧",
                      },
                      {
                        number: "03",
                        title: "Không đủ điều kiện",
                        sheet: "Khong_du_dieu_kien",
                        description:
                          "Sinh viên chưa đủ điều kiện và lý do tương ứng.",
                        icon: "▧",
                      },
                    ].map((item) => (
                      <article
                        key={item.sheet}
                        className="rounded-2xl border border-[#E9DED4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8EAE0] text-xl text-[#A96745]">
                            {item.icon}
                          </div>
                          <span className="text-xs font-bold tracking-widest text-[#B9A99D]">
                            {item.number}
                          </span>
                        </div>

                        <h3 className="mt-4 font-extrabold">{item.title}</h3>
                        <p className="mt-2 min-h-15 text-sm leading-5 text-[#81766D]">
                          {item.description}
                        </p>

                        <div className="mt-4 border-t border-[#F0E8E1] pt-3">
                          <span className="font-mono text-[11px] text-[#B47C5C]">
                            {item.sheet}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Export area */}
                <section className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-3xl border border-[#E9DED4] bg-white p-6 shadow-sm sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8EAE0] text-2xl text-[#A96745]">
                        ↓
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold">
                          Tạo file báo cáo
                        </h2>
                        <p className="mt-1 text-sm text-[#81766D]">
                          Chọn học kỳ trước khi tải file.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleExportExcel}
                      className="mt-6 space-y-5"
                    >
                      <div className="space-y-2">
                        <label
                          htmlFor="export-semester"
                          className="text-xs font-bold uppercase tracking-wide text-[#6B635B]"
                        >
                          Học kỳ cần xuất báo cáo
                        </label>

                        <select
                          id="export-semester"
                          value={exportSemester}
                          onChange={(e) => setExportSemester(e.target.value)}
                          className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 text-sm outline-none transition focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
                        >
                          <option value="">Tất cả học kỳ</option>
                          <option value="Fall2026">Fall 2026</option>
                          <option value="Spring2027">Spring 2027</option>
                          <option value="Summer2027">Summer 2027</option>
                          <option value="Fall2027">Fall 2027</option>
                        </select>

                        <p className="text-xs text-[#968A80]">
                          {exportSemester
                            ? `Học kỳ đang chọn: ${exportSemester}`
                            : "Xuất dữ liệu của tất cả học kỳ."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#EFE1D5] bg-[#FCF7F2] p-4">
                        <p className="text-sm font-bold text-[#A96745]">
                          Lưu ý khi xuất dữ liệu
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-5 text-[#756B63]">
                          <li>
                            ✓ Thông tin được chia thành ba sheet riêng biệt.
                          </li>
                          <li>✓ MSSV được lưu dưới dạng văn bản.</li>
                          <li>
                            ✓ Có thể sử dụng bộ lọc trong Excel để tra cứu.
                          </li>
                        </ul>
                      </div>

                      <button
                        type="submit"
                        disabled={exportingExcel}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6f27] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {exportingExcel ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Đang tạo file Excel...
                          </>
                        ) : (
                          <>↓ &nbsp; Tải xuống báo cáo (.xlsx)</>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Quick guide */}
                  <aside className="rounded-3xl border border-[#E9DED4] bg-[#fcefe3] p-6 sm:p-7">
                    <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A96745]">
                      Hướng dẫn nhanh
                    </span>

                    <h2 className="mt-4 text-xl font-extrabold">
                      3 bước đơn giản
                    </h2>

                    <div className="mt-6 space-y-5">
                      {[
                        [
                          "01",
                          "Chọn học kỳ",
                          "Chọn một học kỳ hoặc tất cả học kỳ.",
                        ],
                        [
                          "02",
                          "Xuất báo cáo",
                          "Nhấn nút tải xuống để tạo file Excel.",
                        ],
                        [
                          "03",
                          "Kiểm tra dữ liệu",
                          "Mở file và đối chiếu ba sheet.",
                        ],
                      ].map(([number, title, description]) => (
                        <div key={number} className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7D5C5] bg-white text-xs font-extrabold text-[#B77954]">
                            {number}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">{title}</h3>
                            <p className="mt-1 text-sm leading-5 text-[#81766D]">
                              {description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 rounded-xl border border-[#E7D5C5] bg-white/70 p-4">
                      <p className="text-xs font-bold text-[#8E684F]">Gợi ý</p>
                      <p className="mt-1 text-xs leading-5 text-[#81766D]">
                        Kiểm tra học kỳ và thông tin sinh viên trước khi sử dụng
                        báo cáo cho việc bàn giao.
                      </p>
                    </div>
                  </aside>
                </section>
              </div>
            </div>
          )}

          {/* --- SETTINGS --- */}

          {activeMenu === "settings" && (
            <section className="min-h-full w-full bg-[#FBF8F4] p-5 text-[#352D28] sm:p-7 xl:p-10">
              <div className="mx-auto w-full max-w-[1600px] space-y-7">
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-5 p-6 sm:p-8 md:flex-row md:items-center">
                    <div className="max-w-3xl">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#F8EAE0] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A96745]">
                        <span className="h-2 w-2 rounded-full bg-[#C98C68]" />
                        Cấu hình hệ thống
                      </span>
                      <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                        Quản lý thời hạn & quy mô nhóm
                      </h1>
                      <p className="mt-2 text-sm leading-6 text-[#81766D]">
                        Thiết lập học kỳ hiện tại, thời gian phản hồi đơn
                        Apply/Invite và số lượng thành viên tối đa trong mỗi
                        nhóm.
                      </p>
                    </div>

                    <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-[#F8EAE0] md:flex">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-12 w-12 text-[#B77954]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path
                          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 3.12-.09-.02a1.7 1.7 0 0 0-1.75.64l-.05.08h-3.6l-.04-.08a1.7 1.7 0 0 0-1.76-.64l-.08.02-1.8-3.12.06-.06A1.7 1.7 0 0 0 9.2 15l-.08-.04v-3.6l.08-.04a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.8-3.12.08.02a1.7 1.7 0 0 0 1.76-.64l.04-.08h3.6l.05.08a1.7 1.7 0 0 0 1.75.64l.09-.02 1.8 3.12-.06.06A1.7 1.7 0 0 0 19.4 11l.08.04v3.6z"
                          transform="translate(-2 -2) scale(1.16)"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="h-1 bg-linear-to-r from-[#D9A27F] via-[#EBD3C2] to-[#F8EAE0]" />
                </div>

                {/* Overview cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-2xl border border-[#E9DED4] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#81766D]">
                        Học kỳ hiện tại
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                        ▦
                      </span>
                    </div>
                    <p className="mt-4 wrap-break-words text-xl font-black">
                      {systemSettings.semester || "Chưa thiết lập"}
                    </p>
                    <p className="mt-1 text-xs text-[#968A80]">
                      Học kỳ áp dụng cho hệ thống
                    </p>
                  </article>

                  <article className="rounded-2xl border border-[#E9DED4] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#81766D]">
                        Thời hạn Apply / Invite
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                        ◷
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-black">
                      {systemSettings.applyDeadlineHours}{" "}
                      <span className="text-sm font-semibold text-[#81766D]">
                        giờ
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#968A80]">
                      Thời gian phản hồi yêu cầu
                    </p>
                  </article>

                  <article className="rounded-2xl border border-[#E9DED4] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#81766D]">
                        Quy mô nhóm tối đa
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                        ♧
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-black">
                      {systemSettings.maxGroupSize}{" "}
                      <span className="text-sm font-semibold text-[#81766D]">
                        thành viên
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#968A80]">
                      Số thành viên tối đa mỗi nhóm
                    </p>
                  </article>
                </div>

                {/* Configuration form */}
                <form
                  onSubmit={handleSaveSystemSettings}
                  className="overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm"
                >
                  <div className="border-b border-[#F0E8E1] p-6 sm:p-8">
                    <h2 className="text-xl font-extrabold">
                      Thiết lập cấu hình
                    </h2>
                    <p className="mt-1 text-sm text-[#81766D]">
                      Thay đổi giá trị bên dưới rồi lưu để áp dụng cấu hình mới.
                    </p>
                  </div>

                  <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
                    {/* Semester */}
                    <div className="space-y-4 lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                          ▦
                        </div>
                        <div>
                          <h3 className="font-bold">Thông tin học kỳ</h3>
                          <p className="mt-1 text-sm text-[#81766D]">
                            Xác định học kỳ đang được sử dụng trong hệ thống.
                          </p>
                        </div>
                      </div>

                      <label className="block space-y-2 text-sm font-semibold text-[#51463F]">
                        Học kỳ hiện tại
                        <input
                          value={systemSettings.semester}
                          onChange={(event) =>
                            updateSystemSetting("semester", event.target.value)
                          }
                          placeholder="Ví dụ: Fall2026"
                          className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-[#B6AAA0] focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
                          required
                        />
                        <span className="block text-xs font-normal text-[#968A80]">
                          Nhập mã học kỳ theo định dạng hệ thống đang sử dụng.
                        </span>
                      </label>
                    </div>

                    <div className="hidden lg:col-span-2 lg:block">
                      <div className="border-t border-[#F0E8E1]" />
                    </div>

                    {/* Deadline */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                          ◷
                        </div>
                        <div>
                          <h3 className="font-bold">Thời hạn phản hồi</h3>
                          <p className="mt-1 text-sm leading-5 text-[#81766D]">
                            Thời gian xử lý các yêu cầu Apply và Invite.
                          </p>
                        </div>
                      </div>

                      <label className="block space-y-2 text-sm font-semibold text-[#51463F]">
                        Thời hạn đơn Apply / Invite (giờ)
                        <input
                          type="number"
                          min="1"
                          value={systemSettings.applyDeadlineHours}
                          onChange={(event) =>
                            updateSystemSetting(
                              "applyDeadlineHours",
                              Number(event.target.value),
                            )
                          }
                          className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 text-sm font-normal outline-none transition focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
                          required
                        />
                      </label>

                      <div className="rounded-xl border border-[#EFE1D5] bg-[#FCF7F2] p-4 text-xs leading-5 text-[#81766D]">
                        <span className="font-bold text-[#A96745]">Lưu ý:</span>{" "}
                        Thời hạn được tính bằng giờ. Kiểm tra quy tắc xử lý thời
                        gian trong Backend trước khi thay đổi giá trị đang áp
                        dụng.
                      </div>
                    </div>

                    {/* Group size */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EAE0] text-lg text-[#A96745]">
                          ♧
                        </div>
                        <div>
                          <h3 className="font-bold">Quy mô nhóm</h3>
                          <p className="mt-1 text-sm leading-5 text-[#81766D]">
                            Giới hạn số lượng thành viên trong một nhóm ( từ 3 -
                            5 thành viên ).
                          </p>
                        </div>
                      </div>

                      <label className="block space-y-2 text-sm font-semibold text-[#51463F]">
                        Số thành viên tối đa
                        <input
                          type="number"
                          min="3"
                          max="5"
                          value={systemSettings.maxGroupSize}
                          onChange={(event) =>
                            updateSystemSetting(
                              "maxGroupSize",
                              Number(event.target.value),
                            )
                          }
                          className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 text-sm font-normal outline-none transition focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
                          required
                        />
                      </label>

                      <div className="rounded-xl border border-[#EFE1D5] bg-[#FCF7F2] p-4 text-xs leading-5 text-[#81766D]">
                        <span className="font-bold text-[#A96745]">Lưu ý:</span>{" "}
                        Quy mô tối đa phải phù hợp với quy định ghép nhóm của dự
                        án.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#F0E8E1] bg-[#FCFAF7] p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="text-xs leading-5 text-[#968A80]">
                      Vui lòng kiểm tra các giá trị trước khi lưu cấu hình.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9784F] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943] hover:shadow-md"
                    >
                      <span>✓</span>
                      Lưu cấu hình hệ thống
                    </button>
                  </div>
                </form>

                {/* Footer note */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#E9DED4] bg-[#F5EEE7] p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#A96745]">
                    i
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">Lưu ý quản trị</h3>
                    <p className="mt-1 text-sm leading-5 text-[#81766D]">
                      Chỉ thay đổi các thông số khi đã xác nhận quy định học kỳ
                      và chính sách ghép nhóm. Việc lưu thành công phụ thuộc vào
                      xử lý của hàm cấu hình hệ thống hiện tại.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* --- PROFILE --- */}
          {activeMenu === "profile" && (
            <div className="p-8 w-full">
              <Profile />
            </div>
          )}
        </div>
      </main>

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
              Email trường
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

      {leaderModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleReplaceLeader}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-[#2C2825]">
                  Đổi Leader nhóm {selectedGroup.groupCode}
                </h3>
                <p className="mt-1 text-xs text-[#6B635B]">
                  Chọn một thành viên đang hoạt động làm Leader mới.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                disabled={changingLeader}
                className="font-bold text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-orange-50 p-4 text-sm">
              <p className="font-bold text-[#E65100]">Leader hiện tại</p>
              <p className="mt-1">
                {selectedGroup.members?.find((member) => member.isLeader)
                  ?.userFullName || "Chưa xác định"}
              </p>
            </div>

            <label className="block space-y-2 text-sm font-bold">
              Leader mới
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
                    <option key={member.id} value={member.userId}>
                      {member.userFullName} ({member.userEmail})
                    </option>
                  ))}
              </select>
            </label>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Admin chọn một thành viên đang hoạt động làm Leader mới. Việc
              Leader cũ rời nhóm sẽ được xử lý theo quy trình xin rời nhóm,
              không tự động xóa thành viên trong thao tác đổi Leader.
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                disabled={changingLeader}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={changingLeader || !newLeaderId}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {changingLeader ? "Đang xử lý..." : "Xác nhận đổi Leader"}
              </button>
            </div>
          </form>
        </div>
      )}

      {rosterReviewGroup && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#2C2825]">
                Duyệt danh sách nhóm
              </h3>

              <button
                type="button"
                onClick={() => setRosterReviewGroup(null)}
                disabled={reviewingRoster}
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Nhóm:{" "}
              <strong className="text-[#E65100]">
                {rosterReviewGroup.groupCode}
              </strong>
            </p>

            <label className="mb-2 block text-sm font-bold">
              Ghi chú / Lý do từ chối
            </label>

            <textarea
              value={rosterReviewNote}
              onChange={(e) => setRosterReviewNote(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú nếu cần..."
              className="w-full rounded-xl border border-[#E8E2D9] p-3 text-sm outline-none focus:border-[#E65100]"
              disabled={reviewingRoster}
            />

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRosterReviewGroup(null)}
                disabled={reviewingRoster}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={() => handleReviewRoster(false)}
                disabled={reviewingRoster || !rosterReviewNote.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Từ chối
              </button>

              <button
                type="button"
                onClick={() => handleReviewRoster(true)}
                disabled={reviewingRoster}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {reviewingRoster ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
