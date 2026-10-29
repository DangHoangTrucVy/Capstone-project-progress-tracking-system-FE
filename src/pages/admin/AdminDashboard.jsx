import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  createModerator,
} from "../../services/userService";
import NotificationBell from "../../components/NotificationBell";
import {
  getAllGroups,
  getGroupById,
  replaceGroupLeader,
} from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import {
  getSemesters,
  updateStudentEligibility,
} from "../../services/eligibilityService";
import {
  createSemester,
  updateSemester,
  deleteSemester,
  assignModerator,
} from "../../services/semesterService";
import { exportSemesterExcel } from "../../services/moderatorService"; // 👈 Thêm service xuất Excel
import Profile from "../../auth/Profile";
import EligibilityPanel from "./EligibilityPanel";
import LeaderLeaveRequests from "./LeaderLeaveRequests";
import SemesterSettings from "./SemesterSettings";
import api from "../../services/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const getManagedRole = (role) => {
  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase()
    .replace("ROLE_", "");

  const aliases = {
    GROUP_LEADER: "LEADER",
    SYSTEM_ADMIN: "ADMIN",
    LECTURER: "MODERATOR",
    STUDENT: "STUDENT",
    ADMIN: "ADMIN",
    MODERATOR: "MODERATOR",
    LEADER: "LEADER",
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

  // States cho quản lý tài khoản & học kỳ
  const [semesters, setSemesters] = useState([]);
  const [accountSemester, setAccountSemester] = useState("");
  const [semesterStudents, setSemesterStudents] = useState([]);
  const [loadingSemesterStudents, setLoadingSemesterStudents] = useState(false);

  // Danh sách Moderator phục vụ phân công
  const [moderators, setModerators] = useState([]);

  // States cho Modal Tạo/Sửa học kỳ
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [submittingSemester, setSubmittingSemester] = useState(false);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const openingDate = new Date();
  openingDate.setDate(now.getDate() - 1);
  const deadlineDate = new Date();
  deadlineDate.setDate(now.getDate() + 5);
  const toLocalISOString = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [semesterForm, setSemesterForm] = useState({
    code: "SU27",
    name: "Summer 2027",
    startDate: formatDate(now),
    endDate: formatDate(deadlineDate),
    formationOpensAt: toLocalISOString(openingDate),
    defaultDeadline: toLocalISOString(deadlineDate),
    moderatorId: "",
  });

  // Toast thông báo
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

  // 💡 Hàm xử lý xuất Excel theo học kỳ
  const handleExportSemester = async (semesterCode) => {
    if (!semesterCode) {
      showToast("Vui lòng chọn học kỳ để xuất file.", "error");
      return;
    }
    try {
      const blobData = await exportSemesterExcel(semesterCode);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Danh_sach_ghep_nhom_${semesterCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Tải xuống file Excel kỳ ${semesterCode} thành công!`);
    } catch (error) {
      showToast(`Không thể xuất file Excel cho kỳ ${semesterCode}.`, "error");
    }
  };

  const openLeaderModal = async (group) => {
    try {
      const groupId = group.id || group.groupId;
      // 1. Lấy chi tiết nhóm
      const detail = await getGroupById(groupId).catch(() => null);

      // 2. Dự phòng gọi thêm API lấy danh sách thành viên riêng nếu object detail chưa có mảng members
      let membersList = detail?.members || group.members || [];
      if (membersList.length === 0 && groupId) {
        try {
          const membersRes = await api
            .get(`/groups/${groupId}/members`)
            .catch(() => null);
          membersList = Array.isArray(membersRes?.data)
            ? membersRes.data
            : membersRes?.data?.content || [];
        } catch (e) {
          console.error("Không thể tải danh sách thành viên:", e);
        }
      }

      setSelectedGroup({
        ...(detail || group),
        members: membersList,
      });
      setNewLeaderId("");
      setLeaderModalOpen(true);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể tải thông tin nhóm.",
        "error",
      );
    }
  };

  const handleReplaceGroupLeader = async (event) => {
    event.preventDefault();
    if (!selectedGroup || !newLeaderId) {
      showToast("Vui lòng chọn Leader mới.", "error");
      return;
    }

    const members = selectedGroup.members || [];

    // Tìm thành viên dựa vào ID (hỗ trợ cả cấu trúc member.userId hoặc member.profile?.userId)
    const nextLeader = members.find(
      (member) =>
        String(member.userId || member.profile?.userId) ===
          String(newLeaderId) && !member.leader, // Kiểm tra không phải là leader hiện tại
    );

    if (!nextLeader) {
      showToast("Thành viên được chọn không hợp lệ.", "error");
      return;
    }

    const memberName =
      nextLeader.fullName || nextLeader.profile?.fullName || "Thành viên";
    const confirmed = window.confirm(
      `Đổi Leader nhóm ${selectedGroup.groupCode} sang ${memberName}?`,
    );
    if (!confirmed) return;

    setChangingLeader(true);
    try {
      // Gửi đúng ID của thành viên được chọn lên backend
      const targetUserId = nextLeader.userId || nextLeader.profile?.userId;
      await replaceGroupLeader(selectedGroup.id, {
        userId: targetUserId,
      });
      setLeaderModalOpen(false);
      setSelectedGroup(null);
      setNewLeaderId("");
      await fetchAdminData();
      showToast(`Đổi Leader nhóm ${selectedGroup.groupCode} thành công.`);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    phone: "",
    role: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch dữ liệu tổng quan cho toàn hệ thống
  const fetchAdminData = async () => {
    try {
      const currentUser = await getCurrentUser().catch(() => null);
      setUser(currentUser);

      const usersRes = await getUsers({ size: 1000 }).catch(() => []);
      const userList = usersRes?.content || usersRes || [];
      setUsers(userList);

      const modList = userList.filter((u) => {
        const r = String(u.role || "").toUpperCase();
        return r.includes("MODERATOR") || r.includes("LECTURER");
      });
      setModerators(modList);

      const groupsRes = await getAllGroups().catch(() => []);
      const groupList = Array.isArray(groupsRes)
        ? groupsRes
        : groupsRes?.content || groupsRes?.items || groupsRes?.data || [];
      setGroups(groupList);

      const semRes = await getSemesters({ size: 1000 }).catch(() => []);
      const semList = Array.isArray(semRes)
        ? semRes
        : semRes?.data || semRes?.content || semRes?.items || [];
      const finalSemList = Array.isArray(semList)
        ? semList
        : [semList].filter(Boolean);
      setSemesters(finalSemList);

      let allGroupsList = [];
      for (const sem of finalSemList) {
        const semCode = sem.code || sem;
        try {
          const groupRes = await api
            .get(`/semesters/${semCode}/groups`)
            .catch(() => ({ data: [] }));
          const list = Array.isArray(groupRes.data)
            ? groupRes.data
            : groupRes.data?.content || groupRes.data?.items || [];
          // Gắn thêm thuộc tính semester vào từng nhóm nếu chưa có để dễ phân loại
          const mappedList = list.map((g) => ({
            ...g,
            semester: g.semester || semCode,
          }));
          allGroupsList = [...allGroupsList, ...mappedList];
        } catch (e) {
          console.error(`Không thể tải nhóm của kỳ ${semCode}:`, e);
        }
      }
      setGroups(allGroupsList);
    } catch (error) {
      console.error("Lỗi tải dữ liệu quản trị:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveSemesterFromModal = async (e) => {
    e.preventDefault();
    if (submittingSemester) return;
    setSubmittingSemester(true);
    try {
      const payload = {
        code: semesterForm.code,
        name: semesterForm.name,
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate,
        formationOpensAt: new Date(semesterForm.formationOpensAt).toISOString(),
        defaultDeadline: new Date(semesterForm.defaultDeadline).toISOString(),
      };

      if (isEditingSemester) {
        await updateSemester(semesterForm.code, payload);
        showToast(
          `Đã cập nhật thông tin học kỳ ${semesterForm.code} thành công!`,
        );
      } else {
        await createSemester(payload);
        showToast(`Đã tạo học kỳ mới ${semesterForm.code} thành công!`);
      }

      if (semesterForm.moderatorId) {
        await assignModerator(semesterForm.code, {
          moderatorId: semesterForm.moderatorId,
        });
      }

      setSemesterModalOpen(false);
      await fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || "Thực hiện thất bại.", "error");
    } finally {
      setSubmittingSemester(false);
    }
  };

  const handleDeleteSemester = async (code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học kỳ ${code} không?`))
      return;
    try {
      await deleteSemester(code);
      showToast(`Đã xóa học kỳ ${code} thành công.`);
      await fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || "Xóa học kỳ thất bại.", "error");
    }
  };

  useEffect(() => {
    if (activeMenu === "accounts" && accountSemester) {
      setLoadingSemesterStudents(true);
      api
        .get(`/semesters/${accountSemester}/students`)
        .then((res) => {
          const list = Array.isArray(res.data)
            ? res.data
            : res.data.content || res.data.items || [];
          setSemesterStudents(list);
        })
        .catch(() => setSemesterStudents([]))
        .finally(() => setLoadingSemesterStudents(false));
    }
  }, [activeMenu, accountSemester]);

  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserForm({ email: "", fullName: "", password: "", role: "MODERATOR" });
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
        const { role, ...moderatorPayload } = payload;
        await createModerator(moderatorPayload);
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

  const handleLogout = () => {
    localStorage.clear();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải hệ thống quản trị...
      </div>
    );
  }

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
                MatchPoint FPT Capstone v2.9
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
                setActiveMenu("semesters");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "semesters"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>🗓️</span>
              <span>Quản lý học kỳ</span>
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
              <span>Tài khoản </span>
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
                    Giám sát tổng quan toàn hệ thống
                  </span>
                  <h1 className="text-xl font-black text-[#2C2825] mt-1">
                    Thống kê tổng hợp toàn bộ các kỳ
                  </h1>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="px-4 py-2 bg-orange-50 text-[#E65100] hover:bg-orange-100 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span> Làm mới dữ liệu
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Tổng tài khoản",
                    value: manageableUsers.length,
                    icon: "👤",
                    bg: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "Tổng số nhóm đồ án ",
                    value: semesters.reduce(
                      (sum, sem) => sum + (sem.groupCount || 0),
                      0,
                    ),
                    icon: "👥",
                    bg: "bg-orange-50 text-[#E65100]",
                  },
                  {
                    label: "Sinh viên",
                    value: manageableUsers.filter((u) => u.role === "STUDENT")
                      .length,
                    icon: "🎓",
                    bg: "bg-emerald-50 text-emerald-600",
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

              {/* MODERATOR PHỤ TRÁCH QUẢN LÝ NHÓM */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-[#2C2825]">
                      👑 Giảng viên hướng dẫn và quản lý nhóm theo học kỳ
                    </h3>
                    <p className="text-[11px] text-[#6B635B]">
                      Danh sách giảng viên được phân công phụ trách quản lý các
                      nhóm đồ án trong từng học kỳ.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                    {semesters.length} Kỳ hoạt động
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {semesters.length > 0 ? (
                    semesters.map((sem, idx) => {
                      const code = sem.code || sem;
                      const name = sem.name || code;
                      const mod = sem.moderator;
                      const groupCount = sem.groupCount || 0;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-[#E65100]">
                              {code} — {name}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded">
                              {groupCount} nhóm
                            </span>
                          </div>
                          <div className="text-xs space-y-1 pt-1 border-t border-[#E8E2D9]">
                            <p className="text-[#6B635B] font-bold">
                              Giảng viên phụ trách:
                            </p>
                            {mod?.fullName ? (
                              <p className="font-black text-[#2C2825] flex items-center gap-1.5">
                                <span>👤</span> {mod.fullName}{" "}
                                <span className="text-[10px] text-gray-500 font-normal">
                                  ({mod.email})
                                </span>
                              </p>
                            ) : (
                              <p className="text-amber-600 font-bold italic">
                                ⚠️ Chưa phân công giảng viên
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center text-[#6B635B] italic text-xs">
                      Chưa có dữ liệu học kỳ.
                    </div>
                  )}
                </div>
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
                    📈 Thống kê sĩ số nhóm đồ án (3 - 5 người)
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

          {/* TAB QUẢN LÝ HỌC KỲ - CÓ NÚT XUẤT EXCEL TỪNG KỲ Ở TRÊN CÙNG */}
          {activeMenu === "semesters" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl shadow-xs flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Danh sách Học kỳ trong hệ thống
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Theo dõi các kỳ học, mốc thời gian chi tiết và trạng thái.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {semesters.length > 0 && (
                    <select
                      className="p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
                      onChange={(e) => {
                        handleExportSemester(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        ↓ Xuất Excel theo kỳ...
                      </option>
                      {semesters.map((sem, idx) => {
                        const code = sem.code || sem;
                        return (
                          <option key={idx} value={code}>
                            Kỳ {code}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <button
                    onClick={() => {
                      setIsEditingSemester(false);
                      setSemesterForm({
                        code: "SU27",
                        name: "Summer 2027",
                        startDate: formatDate(now),
                        endDate: formatDate(deadlineDate),
                        formationOpensAt: toLocalISOString(openingDate),
                        defaultDeadline: toLocalISOString(deadlineDate),
                        moderatorId: "",
                      });
                      setSemesterModalOpen(true);
                    }}
                    className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    + Tạo học kỳ mới
                  </button>
                </div>
              </div>

              {/* Bảng hiển thị danh sách học kỳ */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase w-12 text-center">
                        STT
                      </th>
                      <th className="p-4 font-black uppercase">Mã kì</th>
                      <th className="p-4 font-black uppercase">Học Kỳ</th>
                      <th className="p-4 font-black uppercase">
                        Thời gian bắt đầu
                      </th>
                      <th className="p-4 font-black uppercase">
                        Thời gian kết thúc
                      </th>
                      <th className="p-4 font-black uppercase">Mở nhóm </th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                      <th className="p-4 font-black uppercase text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {semesters.length > 0 ? (
                      semesters.map((sem, index) => {
                        const code = sem.code || sem;
                        const name = sem.name || code;
                        const formatDateTimeStr = (dt) => {
                          if (!dt) return "—";
                          try {
                            const d = new Date(dt);
                            if (isNaN(d.getTime())) return dt;
                            return d.toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            });
                          } catch {
                            return dt;
                          }
                        };

                        return (
                          <tr
                            key={index}
                            className="hover:bg-[#FBF9F5]/70 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#6B635B]">
                              {index + 1}
                            </td>
                            <td className="p-4 font-bold font-mono text-[#E65100]">
                              {code}
                            </td>
                            <td className="p-4 font-bold text-[#2C2825]">
                              {name}
                            </td>
                            <td className="p-4 text-[#6B635B] font-medium">
                              {formatDateTimeStr(sem.startDate)}
                            </td>
                            <td className="p-4 text-[#6B635B] font-medium">
                              {formatDateTimeStr(sem.endDate)}
                            </td>
                            <td className="p-4 text-[11px] text-[#6B635B] space-y-0.5">
                              <div>
                                Mở: {formatDateTimeStr(sem.formationOpensAt)}
                              </div>
                              <div>
                                Đóng: {formatDateTimeStr(sem.defaultDeadline)}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 font-bold rounded-lg text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Hoạt động
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSemester(true);
                                  setSemesterForm({
                                    code: sem.code || code,
                                    name: sem.name || name,
                                    startDate: sem.startDate
                                      ? sem.startDate.slice(0, 10)
                                      : "",
                                    endDate: sem.endDate
                                      ? sem.endDate.slice(0, 10)
                                      : "",
                                    formationOpensAt: sem.formationOpensAt
                                      ? sem.formationOpensAt.slice(0, 16)
                                      : toLocalISOString(now),
                                    defaultDeadline: sem.defaultDeadline
                                      ? sem.defaultDeadline.slice(0, 16)
                                      : toLocalISOString(deadlineDate),
                                    moderatorId:
                                      sem.moderator?.id ||
                                      sem.moderator?.userId ||
                                      "",
                                  });
                                  setSemesterModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg cursor-pointer"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSemester(code)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg cursor-pointer"
                              >
                                🗑️ Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="p-12 text-center text-[#6B635B] italic"
                        >
                          Chưa có học kỳ nào trong hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "accounts" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý toàn bộ tài khoản hệ thống
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Quản lý tất cả tài khoản Admin, Moderator, Leader và
                    Student.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="bg-white p-4 border border-[#E8E2D9] rounded-2xl flex justify-between items-center gap-4 flex-wrap shadow-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-[#6B635B]">
                    Lọc vai trò:
                  </span>
                  {[
                    { label: "Tất cả", value: "" },
                    { label: "Student", value: "STUDENT" },
                    { label: "Moderator", value: "MODERATOR" },
                    { label: "Admin", value: "ADMIN" },
                  ].map((roleObj) => (
                    <button
                      key={roleObj.value}
                      onClick={() => setSelectedRole(roleObj.value)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
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
                    placeholder="🔍 Tìm tên, email, số điện thoại..."
                    className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase w-16 text-center">
                        STT
                      </th>
                      <th className="p-4 font-black uppercase">Họ và tên</th>
                      <th className="p-4 font-black uppercase">Email</th>
                      <th className="p-4 font-black uppercase">
                        Số điện thoại
                      </th>
                      <th className="p-4 font-black uppercase">
                        Vai trò (Role)
                      </th>
                      <th className="p-4 font-black uppercase text-left">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {(() => {
                      const filteredUsers = manageableUsers.filter((u) => {
                        const matchesSearch =
                          !searchQuery ||
                          (u.fullName &&
                            u.fullName
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())) ||
                          (u.email &&
                            u.email
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())) ||
                          (u.phone &&
                            u.phone
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()));

                        const matchesRole =
                          !selectedRole || u.role === selectedRole;
                        return matchesSearch && matchesRole;
                      });

                      if (filteredUsers.length > 0) {
                        return filteredUsers.map((u, index) => (
                          <tr
                            key={u.id || u.email}
                            className="hover:bg-[#FBF9F5]/70 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#6B635B]">
                              {index + 1}
                            </td>
                            <td className="p-4 font-bold text-[#2C2825]">
                              {u.fullName || u.name || "—"}
                            </td>
                            <td className="p-4 text-[#6B635B]">{u.email}</td>
                            <td className="p-4 text-[#6B635B]">
                              {u.phone || "—"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                                  u.role === "ADMIN"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : u.role === "MODERATOR"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : u.role === "LEADER"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {u.role || "STUDENT"}
                              </span>
                            </td>
                            <td className="p-4 text-left">
                              <span className="text-[11px] text-[#6B635B] italic">
                                Hệ thống
                              </span>
                            </td>
                          </tr>
                        ));
                      } else {
                        return (
                          <tr>
                            <td
                              colSpan="6"
                              className="p-12 text-center text-[#6B635B] italic"
                            >
                              Không tìm thấy tài khoản nào phù hợp.
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl flex justify-between items-center shadow-xs flex-wrap gap-4">
                <div>
                  <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                    QUẢN TRỊ HỆ THỐNG NHÓM
                  </span>
                  <h2 className="text-xl font-black text-[#2C2825] mt-1">
                    Quản lý danh sách nhóm đồ án Capstone
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Theo dõi mã nhóm, học kỳ và sĩ số thành viên toàn hệ thống.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6B635B]">
                    Tổng số nhóm:
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-[#E65100] font-black text-xs rounded-xl">
                    {filteredGroups.length} nhóm
                  </span>
                </div>
              </div>

              {/* Thanh tìm kiếm nhanh */}
              <div className="bg-white p-4 border border-[#E8E2D9] rounded-2xl shadow-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Tìm kiếm nhanh theo mã nhóm (VD: SE-G01), tên đề tài hoặc học kỳ..."
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-medium"
                />
              </div>

              {/* Bảng danh sách nhóm đồ án */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase w-16 text-center">
                        STT
                      </th>
                      <th className="p-4 font-black uppercase">
                        Mã nhóm / Tên dự án
                      </th>
                      <th className="p-4 font-black uppercase">Học kỳ</th>
                      <th className="p-4 font-black uppercase">
                        Sĩ số thành viên
                      </th>
                      <th className="p-4 font-black uppercase text-right">
                        Trạng thái nhóm
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g, index) => {
                        const count =
                          g.memberCount ??
                          g.numberOfMembers ??
                          (Array.isArray(g.members) ? g.members.length : 0);
                        const isValidSize = count >= 3 && count <= 5;
                        return (
                          <tr
                            key={g.id || g.groupId}
                            className="hover:bg-[#FBF9F5]/70 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#6B635B]">
                              {index + 1}
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-[#2C2825] text-sm">
                                {g.groupCode || g.name || "Chưa có mã"}
                              </p>
                              {g.name && g.groupCode && (
                                <p className="text-[11px] text-[#6B635B] mt-0.5">
                                  {g.name}
                                </p>
                              )}
                            </td>
                            <td className="p-4 font-bold font-mono text-[#E65100]">
                              {g.semester || "SU27"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                                  isValidSize
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {count}/5 thành viên (
                                {isValidSize ? "Đạt chuẩn" : "Chưa đạt"})
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="px-3 py-1 bg-gray-100 text-[#6B635B] font-bold rounded-xl text-[11px]">
                                {g.locked ? " Đã khóa nhóm" : " Đang mở nhóm"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-12 text-center text-[#6B635B] italic"
                        >
                          Không tìm thấy nhóm đồ án nào phù hợp trong hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === "settings" && (
            <div className="p-8 w-full">
              <SemesterSettings />
            </div>
          )}

          {activeMenu === "profile" && (
            <div className="p-8 w-full">
              <Profile />
            </div>
          )}
        </div>
      </main>

      {/* MODAL TẠO / SỬA HỌC KỲ */}
      {semesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <form
            onSubmit={handleSaveSemesterFromModal}
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] p-6 space-y-4 text-xs my-8"
          >
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                {isEditingSemester
                  ? "✏️ Cập nhật thông tin học kỳ"
                  : "⚙️ Tạo học kỳ mới & Phân công Moderator"}
              </h3>
              <button
                type="button"
                onClick={() => setSemesterModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#6B635B]">
                  Mã học kỳ (Code)
                </label>
                <input
                  type="text"
                  value={semesterForm.code}
                  disabled={isEditingSemester}
                  onChange={(e) =>
                    setSemesterForm({ ...semesterForm, code: e.target.value })
                  }
                  required
                  placeholder="VD: SU27"
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="font-bold text-[#6B635B]">
                  Tên học kỳ (Name)
                </label>
                <input
                  type="text"
                  value={semesterForm.name}
                  onChange={(e) =>
                    setSemesterForm({ ...semesterForm, name: e.target.value })
                  }
                  required
                  placeholder="VD: Summer 2027"
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#6B635B]">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={semesterForm.startDate}
                  onChange={(e) =>
                    setSemesterForm({
                      ...semesterForm,
                      startDate: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="font-bold text-[#6B635B]">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={semesterForm.endDate}
                  onChange={(e) =>
                    setSemesterForm({
                      ...semesterForm,
                      endDate: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#6B635B]">
                  Thời điểm mở nhóm
                </label>
                <input
                  type="datetime-local"
                  value={semesterForm.formationOpensAt}
                  onChange={(e) =>
                    setSemesterForm({
                      ...semesterForm,
                      formationOpensAt: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="font-bold text-[#6B635B]">
                  Deadline mặc định
                </label>
                <input
                  type="datetime-local"
                  value={semesterForm.defaultDeadline}
                  onChange={(e) =>
                    setSemesterForm({
                      ...semesterForm,
                      defaultDeadline: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#6B635B]">
                Phân công Moderator phụ trách kỳ
              </label>
              <select
                value={semesterForm.moderatorId}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    moderatorId: e.target.value,
                  })
                }
                className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#2C2825] outline-none cursor-pointer focus:border-[#E65100]"
              >
                <option value="">-- Chọn Moderator (Tuỳ chọn) --</option>
                {moderators.map((mod) => (
                  <option
                    key={mod.id || mod.userId}
                    value={mod.id || mod.userId}
                  >
                    {mod.fullName} ({mod.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-xl text-orange-900 space-y-1">
              <p className="font-black">📌 Ghi chú hướng dẫn:</p>
              <p className="text-[11px] leading-relaxed">
                • Quản lý mốc thời gian và cấu hình ghép nhóm theo chuẩn v2.9.
                <br />• Bạn có thể thay đổi thông tin hoặc gán lại Moderator phụ
                trách học kỳ bất cứ lúc nào.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E2D9] pt-3">
              <button
                type="button"
                onClick={() => setSemesterModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submittingSemester}
                className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {submittingSemester
                  ? "Đang xử lý..."
                  : isEditingSemester
                    ? "💾 Lưu thay đổi"
                    : "🚀 Xác nhận tạo học kỳ"}
              </button>
            </div>
          </form>
        </div>
      )}

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
              Số điện thoại
              <input
                type="text"
                value={userForm.phone}
                onChange={(event) =>
                  setUserForm({ ...userForm, phone: event.target.value })
                }
                placeholder="Nhập số điện thoại..."
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
                <option value="MODERATOR">Moderator</option>
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
            onSubmit={handleReplaceGroupLeader}
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
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal text-xs"
              >
                <option value="">-- Chọn thành viên mới --</option>
                {(selectedGroup?.members || [])
                  .filter(
                    (member) =>
                      // Kiểm tra điều kiện: không phải là leader hiện tại và có ID
                      !member.leader &&
                      (member.userId || member.profile?.userId),
                  )
                  .map((member) => {
                    // Lấy đúng các trường dữ liệu từ JSON response thực tế
                    const mId = member.userId || member.profile?.userId;
                    const mName =
                      member.fullName ||
                      member.profile?.fullName ||
                      "Thành viên";
                    const mEmail = member.profile?.email || member.email || "";
                    const mCode =
                      member.studentCode || member.profile?.studentCode || "";

                    return (
                      <option key={mId} value={mId}>
                        {mName} {mCode ? `(${mCode})` : ""}{" "}
                        {mEmail ? `- ${mEmail}` : ""}
                      </option>
                    );
                  })}
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
