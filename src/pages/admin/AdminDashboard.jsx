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
import { exportSemesterExcel } from "../../services/moderatorService";
import Profile from "../../auth/Profile";
import EligibilityPanel from "./EligibilityPanel";
import LeaderLeaveRequests from "./LeaderLeaveRequests";
import SemesterSettings from "./SemesterSettings";
import api from "../../services/api";
import MajorPanel from "./MajorPanel";
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

  // 🌟 State quản lý thu gọn / mở rộng Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newLeaderId, setNewLeaderId] = useState("");
  const [changingLeader, setChangingLeader] = useState(false);

  // 🌟 State quản lý hiển thị Modal chi tiết nhóm
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);

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
      const detail = await getGroupById(groupId).catch(() => null);

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
      showToast("Vui lòng chọn Trưởng nhóm mới.", "error");
      return;
    }

    const members = selectedGroup.members || [];
    const nextLeader = members.find(
      (member) =>
        String(member.userId || member.profile?.userId) ===
          String(newLeaderId) && !member.leader,
    );

    if (!nextLeader) {
      showToast("Thành viên được chọn không hợp lệ.", "error");
      return;
    }

    const memberName =
      nextLeader.fullName || nextLeader.profile?.fullName || "Thành viên";
    const confirmed = window.confirm(
      `Đổi Trưởng nhóm ${selectedGroup.groupCode} sang ${memberName}?`,
    );
    if (!confirmed) return;

    setChangingLeader(true);
    try {
      const targetUserId = nextLeader.userId || nextLeader.profile?.userId;
      await replaceGroupLeader(selectedGroup.id, {
        userId: targetUserId,
      });
      setLeaderModalOpen(false);
      setSelectedGroup(null);
      setNewLeaderId("");
      await fetchAdminData();
      showToast(`Đổi Trưởng nhóm ${selectedGroup.groupCode} thành công.`);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Đổi Trưởng nhóm thất bại.",
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
          const mappedList = list.map((g) => ({
            ...g,
            semester: g.semester || semCode,
            semesterModerator: sem.moderator,
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
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-xs font-bold text-[#1A1816]">
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
    <div className="min-h-screen relative flex text-[#1A1816] font-sans overflow-hidden">
      {/* Thêm CSS keyframes nội tuyến để hiệu ứng chuyển động mượt mà */}
    <style>{`
        @keyframes smoothFadeIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-smooth-fade {
          animation: smoothFadeIn 1.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, transform;
        }
      `}</style>

      {/* 🌟 1. BACKGROUND SÁNG SẢU, TƯƠI TẮN HƠN */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat filter brightness-110 contrast-95 scale-105"
        style={{
          backgroundImage: `url('https://cdn-lab.fpt.edu.vn/innovationlab/media/2026/04/P.Zo-9862-scaled-1.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[3px]"></div>
      </div>

      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all duration-300 flex items-center gap-2 animate-bounce ${
            toast.type === "error" ? "bg-red-600" : "bg-[#1A1816]"
          }`}
        >
          <span>{toast.type === "error" ? "❌" : "✨"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 🌟 2. SIDEBAR KÍNH SÁNG MỜ CÓ NÚT 3 GẠCH (HAMBURGER) BẤM RA BẤM VÔ */}
      <aside 
        className={`transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-2xl border-r border-white flex flex-col justify-between p-3.5 select-none shrink-0 h-screen min-h-0 overflow-hidden z-10 shadow-xl ${
          isSidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-0.5">
          {/* Header Sidebar kèm nút 3 gạch */}
          <div className="flex items-center justify-between bg-white/70 p-2.5 rounded-2xl border border-white shadow-xs">
            <div className={`flex items-center space-x-2.5 overflow-hidden ${!isSidebarOpen && "justify-center w-full"}`}>
              <div className="w-9 h-9 shrink-0 rounded-full bg-[#E65100] flex items-center justify-center text-white shadow-md shadow-orange-500/30 font-black">
                ✓
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <h2 className="font-black text-xs text-[#1A1816] truncate">
                    Quản Trị Hệ Thống
                  </h2>
                  <p className="text-[10px] text-[#554D44] font-semibold truncate">
                    Hệ thống Quản lý Đồ án
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-orange-50 text-[#E65100] font-bold flex items-center justify-center cursor-pointer shadow-xs border border-white shrink-0"
              title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
            >
              <div className="flex flex-col gap-1 items-center justify-center w-4">
                <span className="block w-4 h-0.5 bg-[#040404] rounded-full"></span>
                <span className="block w-4 h-0.5 bg-[#000000] rounded-full"></span>
                <span className="block w-4 h-0.5 bg-[#020202] rounded-full"></span>
              </div>
            </button>
          </div>

          {/* Danh sách Menu Items */}
          <div className="space-y-1 text-xs font-bold text-[#3A3530]">
            {isSidebarOpen && (
              <p className="text-[10px] font-black text-[#7A7065] uppercase tracking-wider mb-2 px-3">
                Điều hành chung
              </p>
            )}
            <button
              onClick={() => {
                setActiveMenu("monitoring");
                setSearchQuery("");
              }}
              title="Giám sát tổng quan"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "monitoring"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">📊</span>
              {isSidebarOpen && <span className="truncate">Giám sát tổng quan</span>}
            </button>

            {isSidebarOpen && (
              <p className="text-[10px] font-black text-[#7A7065] uppercase tracking-wider mt-5 mb-2 px-3">
                Quản lý học kỳ & sinh viên
              </p>
            )}

            <button
              onClick={() => setActiveMenu("majors")}
              title="Chuyên ngành"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "majors"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">🏛️</span>
              {isSidebarOpen && <span className="truncate">Chuyên ngành</span>}
            </button>

            <button
              onClick={() => {
                setActiveMenu("eligibility");
                setSearchQuery("");
              }}
              title="Import Sinh viên & Điều kiện"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "eligibility"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">📂</span>
              {isSidebarOpen && <span className="truncate">Import Sinh viên & Điều kiện</span>}
            </button>

            <button
              onClick={() => {
                setActiveMenu("semesters");
                setSearchQuery("");
              }}
              title="Quản lý học kỳ"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "semesters"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">🗓️</span>
              {isSidebarOpen && <span className="truncate">Quản lý học kỳ</span>}
            </button>

            <button
              onClick={() => {
                setActiveMenu("accounts");
                setSearchQuery("");
              }}
              title="Tài khoản"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "accounts"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">👤</span>
              {isSidebarOpen && <span className="truncate">Tài khoản</span>}
            </button>

            <button
              onClick={() => {
                setSelectedLeaveId(null);
                setActiveMenu("leader-leave");
              }}
              title="Yêu cầu rời nhóm"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "leader-leave"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">🙋</span>
              {isSidebarOpen && <span className="truncate">Yêu cầu rời nhóm</span>}
            </button>

            <button
              onClick={() => {
                setActiveMenu("groups");
                setSearchQuery("");
              }}
              title="Danh sách nhóm"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "groups"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">👥</span>
              {isSidebarOpen && <span className="truncate">Danh sách nhóm</span>}
            </button>

            {isSidebarOpen && (
              <p className="text-[10px] font-black text-[#7A7065] uppercase tracking-wider mt-5 mb-2 px-3">
                Cá nhân
              </p>
            )}

            <button
              onClick={() => {
                setActiveMenu("profile");
                setSearchQuery("");
              }}
              title="Hồ sơ Admin"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition cursor-pointer font-bold ${
                activeMenu === "profile"
                  ? "bg-[#E65100] text-white shadow-lg shadow-orange-600/30 font-black"
                  : "hover:bg-white/90 text-[#1A1816]"
              } ${!isSidebarOpen && "justify-center px-0"}`}
            >
              <span className="text-base shrink-0">⚙️</span>
              {isSidebarOpen && <span className="truncate">Hồ sơ Admin</span>}
            </button>
          </div>
        </div>

        {/* Phần dưới Sidebar: User Info & Đăng xuất */}
        <div className="shrink-0 pt-3 mt-2 border-t border-white space-y-2.5">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-3 bg-white/70 p-2.5 rounded-2xl border border-white shadow-xs">
              {user?.avatarUrl || user?.avatar ? (
                <img
                  src={user.avatarUrl || user.avatar}
                  alt="Avatar"
                  className="w-9 h-9 rounded-xl object-cover shadow-sm border border-white shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-sm shrink-0">
                  {getInitials(user?.fullName)}
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="text-xs font-black truncate text-[#1A1816]">
                  {user?.fullName || "Admin"}
                </h4>
                <p className="text-[10px] text-[#554D44] truncate font-semibold">
                  {user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={user?.fullName || "Admin"}>
              <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-sm">
                {getInitials(user?.fullName)}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className={`w-full py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-extrabold rounded-xl text-xs transition cursor-pointer border border-red-200 shadow-xs flex items-left justify-left gap-2 ${!isSidebarOpen && "px-0"}`}
          >
            <span>⏻</span>
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* CONTENT CHÍNH SÁNG SỦA, RÕ NÉT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto z-10">
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white px-6 flex justify-between items-center text-xs font-bold text-[#3A3530] shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span>Quản Trị Hệ Thống</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              onOpenLeaderRequest={(id) => {
                setSelectedLeaveId(id);
                setActiveMenu("leader-leave");
              }}
            />
            <span className="text-[#E65100] font-black text-sm">
              Xin chào, {user?.fullName || "Admin"}
            </span>
          </div>
        </header>

        {/* 🌟 ỨNG DỤNG HIỆU ỨNG TỪ TRÊN XUỐNG DƯỚI TỪNG KHỐI (STAGGERED SLIDE DOWN) */}
        <div className="w-full flex-1 flex flex-col">
          {activeMenu === "monitoring" && (
            <section className="pt-2 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
              {/* Khối 1: Banner */}
              <div className="bg-[#E65100]/80 backdrop-blur-xl p-6 border border-white space-y-2 rounded-2xl flex justify-between items-center shadow-lg shadow-black/5 animate-smooth-fade" style={{ animationDelay: "0.01s" }}>
                <div>
                  <span className="px-3 py-1 bg-orange-100 text-[#E65100] text-[11px] font-black rounded-md border border-orange-200">
                    Giám sát tổng quan toàn hệ thống
                  </span>
                  <h1 className="text-2xl font-black text-[rgb(255,245,235)] mt-1">
                    Thống kê tổng hợp toàn bộ các kỳ
                  </h1>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="px-4 py-2 bg-white hover:bg-orange-50 text-[#E65100] text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-white shadow-sm"
                >
                   Làm mới dữ liệu
                </button>
              </div>

              {/* Khối 2: Các thẻ metric card */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Tổng tài khoản",
                    value: manageableUsers.length,
                    icon: "👤",
                    bg: "bg-blue-100 text-blue-700 border border-blue-200",
                    delay: "0.1s",
                  },
                  {
                    label: "Tổng số nhóm đồ án",
                    value: semesters.reduce(
                      (sum, sem) => sum + (sem.groupCount || 0),
                      0,
                    ),
                    icon: "👥",
                    bg: "bg-orange-100 text-[#E65100] border border-orange-200",
                    delay: "0.15s",
                  },
                  {
                    label: "Sinh viên",
                    value: manageableUsers.filter((u) => u.role === "STUDENT")
                      .length,
                    icon: "🎓",
                    bg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
                    delay: "0.2s",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white bg-white/80 backdrop-blur-xl p-5 flex items-center justify-between shadow-lg shadow-black/5 transition-transform duration-200 hover:-translate-y-1 animate-smooth-fade opacity-0"
                    style={{ animationDelay: metric.delay, animationFillMode: "forwards" }}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#554D44]">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#1A1816]">
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

              {/* Khối 3: Moderator phụ trách */}
              <div 
                className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-lg shadow-black/5 space-y-4 animate-smooth-fade opacity-0"
                style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-[#1A1816]">
                      👑 Giảng viên hướng dẫn và quản lý nhóm theo học kỳ
                    </h3>
                    <p className="text-[11px] text-[#554D44] font-semibold">
                      Danh sách giảng viên được phân công phụ trách quản lý các
                      nhóm đồ án trong từng học kỳ.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-black rounded-lg border border-purple-200">
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
                          className="p-4 rounded-xl border border-white bg-white/60 backdrop-blur-md space-y-2 shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-[#E65100]">
                              {code} — {name}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-900 text-[10px] font-black rounded">
                              {groupCount} nhóm
                            </span>
                          </div>
                          <div className="text-xs space-y-1 pt-1 border-t border-white">
                            <p className="text-[#554D44] font-bold">
                              Giảng viên phụ trách:
                            </p>
                            {mod?.fullName ? (
                              <p className="font-black text-[#1A1816] flex items-center gap-1.5">
                                <span>👤</span> {mod.fullName}{" "}
                                <span className="text-[10px] text-gray-600 font-semibold">
                                  ({mod.email})
                                </span>
                              </p>
                            ) : (
                              <p className="text-amber-800 font-bold italic">
                                ⚠️ Chưa phân công giảng viên
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center text-[#554D44] italic text-xs">
                      Chưa có dữ liệu học kỳ.
                    </div>
                  )}
                </div>
              </div>

              {/* Khối 4: Biểu đồ thống kê */}
              <div 
                className="grid gap-6 lg:grid-cols-2 animate-smooth-fade opacity-0"
                style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
              >
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-lg shadow-black/5 space-y-4">
                  <h3 className="text-sm font-black text-[#1A1816]">
                    📊 Tỷ lệ phân bổ vai trò tài khoản hệ thống
                  </h3>
                  <div className="h-80 w-full pt-2 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Sinh viên",
                              value: manageableUsers.filter(
                                (u) => u.role === "STUDENT",
                              ).length,
                              fill: "#2563EB",
                            },
                            {
                              name: "Giảng viên",
                              value: manageableUsers.filter(
                                (u) => u.role === "MODERATOR",
                              ).length,
                              fill: "#7C3AED",
                            },
                            {
                              name: "Quản trị viên",
                              value: manageableUsers.filter(
                                (u) => u.role === "ADMIN",
                              ).length,
                              fill: "#DC2626",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {["#2563EB", "#7C3AED", "#DC2626"].map(
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

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-lg shadow-black/5 space-y-5">
                  <h3 className="text-sm font-black text-[#1A1816]">
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
                            <div className="flex justify-between text-xs font-extrabold">
                              <span className="text-emerald-800">
                                Nhóm đạt chuẩn sĩ số (3 - 5 người)
                              </span>
                              <span>
                                {validGroups} nhóm ({validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-white">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                                style={{ width: `${validPercent}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-extrabold">
                              <span className="text-amber-900">
                                Nhóm chưa đạt chuẩn (&lt; 3 hoặc &gt; 5)
                              </span>
                              <span>
                                {invalidGroups} nhóm ({100 - validPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-white">
                              <div
                                className="bg-amber-600 h-full rounded-full transition-all duration-700"
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
          {activeMenu === "majors" && <MajorPanel />}
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

          {/* TAB QUẢN LÝ HỌC KỲ */}
          {activeMenu === "semesters" && (
            <div className="p-8 space-y-6 animate-smooth-fade">
              <div className="flex justify-between items-center bg-[#E65100]/90 backdrop-blur-xl p-6 border border-white rounded-2xl shadow-lg shadow-black/5 flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#fdfdfd]">
                    Danh sách Học kỳ trong hệ thống
                  </h2>
                  <p className="text-xs text-[#efe9e3] font-semibold">
                    Theo dõi các kỳ học, mốc thời gian chi tiết và trạng thái.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {semesters.length > 0 && (
                    <select
                      className="p-3 text-xs bg-white/90 backdrop-blur-md border border-white rounded-xl font-bold text-[#E65100] outline-none cursor-pointer shadow-sm"
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
                    className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition"
                  >
                    + Tạo học kỳ mới
                  </button>
                </div>
              </div>

              {/* Bảng hiển thị danh sách học kỳ */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/60 border-b border-white text-[#3A3530]">
                      <th className="p-4 font-black uppercase w-12 text-center">
                        STT
                      </th>
                      <th className="p-4 font-black uppercase">Mã kỳ</th>
                      <th className="p-4 font-black uppercase">Học Kỳ</th>
                      <th className="p-4 font-black uppercase">
                        Thời gian bắt đầu
                      </th>
                      <th className="p-4 font-black uppercase">
                        Thời gian kết thúc
                      </th>
                      <th className="p-4 font-black uppercase">Mở nhóm</th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                      <th className="p-4 font-black uppercase text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
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
                            className="hover:bg-white/50 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#554D44]">
                              {index + 1}
                            </td>
                            <td className="p-4 font-bold font-mono text-[#E65100]">
                              {code}
                            </td>
                            <td className="p-4 font-extrabold text-[#1A1816]">
                              {name}
                            </td>
                            <td className="p-4 text-[#3A3530] font-semibold">
                              {formatDateTimeStr(sem.startDate)}
                            </td>
                            <td className="p-4 text-[#3A3530] font-semibold">
                              {formatDateTimeStr(sem.endDate)}
                            </td>
                            <td className="p-4 text-[11px] text-[#3A3530] font-semibold space-y-0.5">
                              <div>
                                Mở: {formatDateTimeStr(sem.formationOpensAt)}
                              </div>
                              <div>
                                Đóng: {formatDateTimeStr(sem.defaultDeadline)}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 font-bold rounded-lg text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                                className="px-3 py-1.5 bg-white hover:bg-orange-50 font-bold rounded-lg cursor-pointer border border-white shadow-xs"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSemester(code)}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg cursor-pointer border border-red-200 shadow-xs"
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
                          className="p-12 text-center text-[#554D44] italic"
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
            <div className="p-8 space-y-6 animate-smooth-fade">
              <div className="flex justify-between items-center bg-[#E65100]/90 backdrop-blur-xl p-6 border border-white rounded-2xl shadow-lg shadow-black/5">
                <div>
                  <h2 className="text-2xl font-black text-[#fffdfb]">
                    Quản lý toàn bộ tài khoản hệ thống
                  </h2>
                  <p className="text-xs text-[#fefefe] font-semibold">
                    Quản lý tất cả tài khoản Quản trị, Giảng viên, Trưởng nhóm
                    và Sinh viên.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition"
                >
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-xl p-4 border border-white rounded-2xl flex justify-between items-center gap-4 flex-wrap shadow-lg shadow-black/5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-[#554D44]">
                    Lọc vai trò:
                  </span>
                  {[
                    { label: "Tất cả", value: "" },
                    { label: "Sinh viên", value: "STUDENT" },
                    { label: "Giảng viên", value: "MODERATOR" },
                    { label: "Quản trị viên", value: "ADMIN" },
                  ].map((roleObj) => (
                    <button
                      key={roleObj.value}
                      onClick={() => setSelectedRole(roleObj.value)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ${
                        selectedRole === roleObj.value
                          ? "bg-[#E65100] text-white shadow-md font-black"
                          : "bg-white text-[#3A3530] border border-white hover:bg-orange-50"
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
                    className="w-full px-4 py-2.5 text-xs bg-white backdrop-blur-md border border-white rounded-xl focus:outline-none focus:border-[#E65100] shadow-sm font-semibold text-[#1A1816]"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/60 border-b border-white text-[#3A3530]">
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
                  <tbody className="divide-y divide-white/60">
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
                            className="hover:bg-white/50 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#554D44]">
                              {index + 1}
                            </td>
                            <td className="p-4 font-extrabold text-[#1A1816]">
                              {u.fullName || u.name || "—"}
                            </td>
                            <td className="p-4 text-[#3A3530] font-semibold">{u.email}</td>
                            <td className="p-4 text-[#3A3530] font-semibold">
                              {u.phone || "—"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                                  u.role === "ADMIN"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : u.role === "MODERATOR"
                                      ? "bg-purple-100 text-purple-900 border border-purple-200"
                                      : u.role === "LEADER"
                                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                        : "bg-blue-100 text-blue-900 border border-blue-200"
                                }`}
                              >
                                {u.role === "ADMIN"
                                  ? "Quản trị viên"
                                  : u.role === "MODERATOR"
                                    ? "Giảng viên"
                                    : u.role === "LEADER"
                                      ? "Trưởng nhóm"
                                      : "Sinh viên"}
                              </span>
                            </td>
                            <td className="p-4 text-left">
                              <span className="text-[11px] text-[#554D44] italic">
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
                              className="p-12 text-center text-[#554D44] italic"
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
            <div className="p-8 space-y-6 animate-smooth-fade">
              <div className="bg-[#E65100]/90 backdrop-blur-xl p-6 border border-white rounded-2xl flex justify-between items-center shadow-lg shadow-black/5 flex-wrap gap-4">
                <div>
                  <span className="px-3 py-1 bg-orange-100 text-[#E65100] text-[11px] font-black rounded border border-orange-200">
                    QUẢN TRỊ HỆ THỐNG NHÓM
                  </span>
                  <h2 className="text-2xl font-black text-[#fdfdfd] mt-1">
                    Quản lý danh sách nhóm đồ án 
                  </h2>
                  <p className="text-xs text-[#efe9e3] font-semibold">
                    Bấm vào mã nhóm để xem chi tiết thành viên, đề tài Capstone
                    và giảng viên hướng dẫn.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#f4f2f1]">
                    Tổng số nhóm:
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-[#E65100] font-black text-xs rounded-xl border border-orange-200">
                    {filteredGroups.length} nhóm
                  </span>
                </div>
              </div>

              {/* Thanh tìm kiếm nhanh */}
              <div className="bg-white/80 backdrop-blur-xl p-4 border border-white rounded-2xl shadow-lg shadow-black/5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Tìm kiếm nhanh theo mã nhóm (VD: SE-G01), tên đề tài hoặc học kỳ..."
                  className="w-full px-4 py-3 text-xs bg-white backdrop-blur-md border border-white rounded-xl focus:outline-none focus:border-[#E65100] font-semibold shadow-sm text-[#1A1816]"
                />
              </div>

              {/* Bảng danh sách nhóm đồ án */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/60 border-b border-white text-[#3A3530]">
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
                        Thao tác / Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
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
                            className="hover:bg-white/50 transition"
                          >
                            <td className="p-4 text-center font-bold text-[#554D44]">
                              {index + 1}
                            </td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const groupId = g.id || g.groupId;
                                    const detailRes = await getGroupById(
                                      groupId,
                                    ).catch(() => null);
                                    setSelectedGroupDetail({
                                      ...g,
                                      ...(detailRes || {}),
                                      members:
                                        detailRes?.members || g.members || [],
                                    });
                                  } catch {
                                    setSelectedGroupDetail(g);
                                  }
                                }}
                                className="font-extrabold text-[#E65100] hover:underline text-sm text-left cursor-pointer"
                              >
                                {g.groupCode || g.name || "Chưa có mã"}
                              </button>
                              {g.name && g.groupCode && (
                                <p className="text-[11px] text-[#554D44] font-semibold mt-0.5">
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
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    : "bg-amber-100 text-amber-900 border border-amber-200"
                                }`}
                              >
                                {count}/5 thành viên (
                                {isValidSize ? "Đạt chuẩn" : "Chưa đạt"})
                              </span>
                            </td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openLeaderModal(g)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-xl text-[11px] border border-purple-200 cursor-pointer shadow-sm"
                              >
                                👑 Đổi Trưởng nhóm
                              </button>
                              <span className="px-3 py-1.5 bg-white text-[#3A3530] font-bold rounded-xl text-[11px] border border-white shadow-sm">
                                {g.locked ? "🔒 Đã khóa" : "🔓 Đang mở"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-12 text-center text-[#554D44] italic"
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
            <div className="p-8 w-full animate-smooth-fade">
              <SemesterSettings />
            </div>
          )}

          {activeMenu === "profile" && (
            <div className="p-8 w-full animate-smooth-fade">
              <Profile />
            </div>
          )}
        </div>
      </main>

      {/* 🌟 MODAL HIỂN THỊ CHI TIẾT THÀNH VIÊN VÀ THÔNG TIN NHÓM */}
      {selectedGroupDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white p-7 space-y-6 text-xs my-8 animate-smooth-fade">
            <div className="flex justify-between items-center border-b border-white/80 pb-4">
              <div>
                <span className="px-3 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black rounded-lg uppercase border border-orange-200">
                  Thông tin chi tiết nhóm
                </span>
                <h3 className="text-base font-black text-[#1A1816] mt-1">
                  Nhóm: {selectedGroupDetail.groupCode} 
                  {selectedGroupDetail.name || "Chưa đặt tên"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupDetail(null)}
                className="w-8 h-8 rounded-xl bg-white text-gray-800 hover:bg-orange-50 font-bold flex items-center justify-center cursor-pointer shadow-sm border border-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-[#554D44] uppercase">
                  Tên đề tài Capstone:
                </p>
                <p className="font-extrabold text-[#1A1816] mt-0.5 text-sm">
                  {selectedGroupDetail.topicName ||
                    selectedGroupDetail.capstoneName ||
                    selectedGroupDetail.name ||
                    "Chưa đăng ký đề tài"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#554D44] uppercase">
                  Giảng viên hướng dẫn:
                </p>
                <p className="font-extrabold text-[#E65100] mt-0.5 text-sm">
                  {selectedGroupDetail.semesterModerator?.fullName ||
                    selectedGroupDetail.moderator?.fullName ||
                    selectedGroupDetail.moderatorName ||
                    selectedGroupDetail.instructorName ||
                    selectedGroupDetail.lecturerName ||
                    selectedGroupDetail.lecturer?.fullName ||
                    "Chưa phân công"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-xs text-[#1A1816] uppercase tracking-wider">
                Danh sách thành viên ({selectedGroupDetail.members?.length || 0}
                /5)
              </h4>

              <div className="border border-white bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/80 border-b border-white text-[#3A3530]">
                      <th className="p-3 font-black uppercase w-12 text-center">
                        STT
                      </th>
                      <th className="p-3 font-black uppercase">MSSV</th>
                      <th className="p-3 font-black uppercase">Họ và tên</th>
                      <th className="p-3 font-black uppercase">Gmail</th>
                      <th className="p-3 font-black uppercase text-right">
                        Vai trò
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {selectedGroupDetail.members &&
                    selectedGroupDetail.members.length > 0 ? (
                      selectedGroupDetail.members.map((m, idx) => {
                        const isLeader = Boolean(
                          m.isLeader ||
                          m.leader ||
                          m.role === "LEADER" ||
                          m.position === "LEADER",
                        );
                        const mCode =
                          m.studentCode ||
                          m.code ||
                          m.userCode ||
                          m.profile?.studentCode ||
                          "—";
                        const mName =
                          m.fullName ||
                          m.userFullName ||
                          m.profile?.fullName ||
                          "—";
                        const mEmail =
                          m.email || m.userEmail || m.profile?.email || "—";

                        return (
                          <tr
                            key={m.userId || m.id || idx}
                            className="hover:bg-white/50"
                          >
                            <td className="p-3 text-center font-bold text-[#554D44]">
                              {idx + 1}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#E65100]">
                              {mCode}
                            </td>
                            <td className="p-3 font-extrabold text-[#1A1816]">
                              {mName}
                            </td>
                            <td className="p-3 text-[#3A3530] font-semibold">{mEmail}</td>
                            <td className="p-3 text-right">
                              {isLeader ? (
                                <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold rounded-lg text-[10px] border border-purple-200">
                                  👑 Trưởng nhóm
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-white text-gray-800 font-bold rounded-lg text-[10px] border border-white">
                                  Thành viên
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-[#554D44] italic"
                        >
                          Chưa có thành viên nào trong nhóm này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedGroupDetail(null)}
                className="px-6 py-2.5 bg-[#1A1816] hover:bg-black text-white font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA HỌC KỲ */}
      {semesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <form
            onSubmit={handleSaveSemesterFromModal}
            className="w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white p-6 space-y-4 text-xs my-8 animate-smooth-fade"
          >
            <div className="flex justify-between items-center border-b border-white/80 pb-3">
              <h3 className="text-sm font-black text-[#1A1816]">
                {isEditingSemester
                  ? "✏️ Cập nhật thông tin học kỳ"
                  : "⚙️ Tạo học kỳ mới & Phân công Giảng viên"}
              </h3>
              <button
                type="button"
                onClick={() => setSemesterModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-white text-gray-800 hover:bg-orange-50 font-bold flex items-center justify-center cursor-pointer shadow-sm border border-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#3A3530]">
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] disabled:opacity-50 shadow-sm text-[#1A1816]"
                />
              </div>
              <div>
                <label className="font-bold text-[#3A3530]">
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] shadow-sm text-[#1A1816]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#3A3530]">Ngày bắt đầu</label>
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] shadow-sm text-[#1A1816]"
                />
              </div>
              <div>
                <label className="font-bold text-[#3A3530]">
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] shadow-sm text-[#1A1816]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#3A3530]">
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] shadow-sm text-[#1A1816]"
                />
              </div>
              <div>
                <label className="font-bold text-[#3A3530]">
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
                  className="w-full p-3 bg-white border border-white rounded-xl font-bold mt-1 focus:outline-none focus:border-[#E65100] shadow-sm text-[#1A1816]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#3A3530]">
                Phân công Giảng viên phụ trách kỳ
              </label>
              <select
                value={semesterForm.moderatorId}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    moderatorId: e.target.value,
                  })
                }
                className="w-full p-3 bg-white border border-white rounded-xl font-bold text-[#1A1816] outline-none cursor-pointer focus:border-[#E65100] shadow-sm"
              >
                <option value="">-- Chọn Giảng viên (Tuỳ chọn) --</option>
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

            <div className="bg-orange-100 backdrop-blur-md border border-orange-200 p-3.5 rounded-xl text-orange-950 space-y-1">
              <p className="font-black">📌 Ghi chú hướng dẫn:</p>
              <p className="text-[11px] font-semibold leading-relaxed">
                • Quản lý mốc thời gian và cấu hình ghép nhóm theo chuẩn v2.9.
                <br />• Bạn có thể thay đổi thông tin hoặc gán lại Giảng viên
                phụ trách học kỳ bất cứ lúc nào.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/80 pt-3">
              <button
                type="button"
                onClick={() => setSemesterModalOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-orange-50 font-bold rounded-xl cursor-pointer shadow-sm border border-white"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submittingSemester}
                className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <form
            onSubmit={handleSaveUser}
            className="w-full max-w-lg space-y-5 rounded-3xl border border-white bg-white/90 backdrop-blur-2xl p-6 shadow-2xl animate-smooth-fade"
          >
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <h3 className="text-base font-black text-[#1A1816]">
                {isEditingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="font-bold text-gray-800 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-1 text-xs font-bold text-[#1A1816]">
              Họ và tên
              <input
                value={userForm.fullName}
                onChange={(event) =>
                  setUserForm({ ...userForm, fullName: event.target.value })
                }
                required
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold shadow-sm text-[#1A1816]"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#1A1816]">
              Số điện thoại
              <input
                type="text"
                value={userForm.phone}
                onChange={(event) =>
                  setUserForm({ ...userForm, phone: event.target.value })
                }
                placeholder="Nhập số điện thoại..."
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold shadow-sm text-[#1A1816]"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#1A1816]">
              Email
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm({ ...userForm, email: event.target.value })
                }
                required
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold shadow-sm text-[#1A1816]"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#1A1816]">
              Mật khẩu {isEditingUser && "(để trống nếu không đổi)"}
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm({ ...userForm, password: event.target.value })
                }
                required={!isEditingUser}
                minLength={8}
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold shadow-sm text-[#1A1816]"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#1A1816]">
              Vai trò (Role)
              <select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm({ ...userForm, role: event.target.value })
                }
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold shadow-sm cursor-pointer text-[#1A1816]"
              >
                <option value="MODERATOR">Giảng viên</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t border-white/80 pt-4">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-xl bg-white border border-white px-5 py-2.5 text-xs font-bold cursor-pointer shadow-sm hover:bg-orange-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {submitting ? "Đang lưu..." : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ĐỔI TRƯỞNG NHÓM */}
      {leaderModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <form
            onSubmit={handleReplaceGroupLeader}
            className="w-full max-w-lg space-y-5 rounded-3xl border border-white bg-white/90 backdrop-blur-2xl p-6 shadow-2xl animate-smooth-fade"
          >
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <h3 className="text-lg font-black text-[#1A1816]">
                Đổi Trưởng nhóm {selectedGroup.groupCode}
              </h3>
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="font-bold text-gray-800"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-2 text-sm font-bold text-[#1A1816]">
              Chọn Trưởng nhóm mới
              <select
                value={newLeaderId}
                onChange={(event) => setNewLeaderId(event.target.value)}
                required
                className="w-full rounded-xl border border-white bg-white px-4 py-3 font-semibold text-xs shadow-sm cursor-pointer text-[#1A1816]"
              >
                <option value="">-- Chọn thành viên mới --</option>
                {(selectedGroup?.members || [])
                  .filter(
                    (member) =>
                      !member.leader &&
                      (member.userId || member.profile?.userId),
                  )
                  .map((member) => {
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
            <div className="flex justify-end gap-3 border-t border-white/80 pt-4">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-xl bg-white border border-white px-5 py-2.5 text-xs font-bold shadow-sm cursor-pointer hover:bg-orange-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={changingLeader || !newLeaderId}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
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