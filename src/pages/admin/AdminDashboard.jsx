import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import { getAllGroups } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import { getReportsSummary } from "../../services/progressService";
import {
  importEligibilityJson,
  importEligibilityFile,
  updateStudentEligibility,
} from "../../services/eligibilityService";
import api from "../../services/api";
import Profile from "../../auth/Profile";
import RegistrationReview from "./RegistrationReview";

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
  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportsSummary, setReportsSummary] = useState(null);
  const [reportsError, setReportsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);

  // State cho phần Eligibility Import
  const [jsonInput, setJsonInput] = useState("");
  const [eligibilityFile, setEligibilityFile] = useState(null);
  const [eligibilityUserId, setEligibilityUserId] = useState("");
  const [eligibleStatus, setEligibleStatus] = useState(true);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

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

      // Lấy chi tiết từng nhóm để đảm bảo mảng members được nạp đầy đủ sĩ số
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
      const userList = usersRes?.content || usersRes || [];
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

  const fetchReportsSummary = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      // Truyền thêm tham số semester vào request để không bị lỗi 400 Missing required parameter
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
        alert("Cập nhật tài khoản thành công!");
      } else {
        await createUser(payload);
        alert("Tạo tài khoản thành công!");
      }
      setIsUserModalOpen(false);
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Thực hiện thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSystemSettings = (event) => {
    event.preventDefault();
    localStorage.setItem("adminSystemSettings", JSON.stringify(systemSettings));
    alert("Đã lưu cấu hình hệ thống đầu kỳ thành công!");
  };

  const updateSystemSetting = (key, value) => {
    setSystemSettings((current) => ({ ...current, [key]: value }));
  };

  // Các hàm xử lý Eligibility Import
  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    setEligibilityLoading(true);
    try {
      const parsedData = JSON.parse(jsonInput);
      await importEligibilityJson(parsedData);
      alert("Import danh sách sinh viên đủ điều kiện (JSON) thành công!");
      setJsonInput("");
    } catch (err) {
      alert("Lỗi: Định dạng JSON không hợp lệ hoặc lỗi kết nối.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!eligibilityFile) return;
    setEligibilityLoading(true);
    const formData = new FormData();
    formData.append("file", eligibilityFile);

    try {
      await importEligibilityFile(formData);
      alert("Import file danh sách sinh viên thành công!");
      setEligibilityFile(null);
    } catch (err) {
      alert(err.response?.data?.message || "Import file thất bại.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleUpdateEligibilityStatus = async (e) => {
    e.preventDefault();
    if (!eligibilityUserId.trim()) return;
    setEligibilityLoading(true);
    try {
      await updateStudentEligibility(eligibilityUserId.trim(), {
        eligible: eligibleStatus,
      });
      alert("Cập nhật trạng thái cờ điều kiện sinh viên thành công!");
      setEligibilityUserId("");
    } catch (err) {
      alert("Cập nhật thất bại.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Hàm xử lý xuất Excel báo cáo (QT15)
  const handleExportExcel = async (e) => {
    e.preventDefault();
    setExportingExcel(true);
    try {
      const response = await api.get(
        `/reports/export?semester=${exportSemester}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
      link.setAttribute(
        "download",
        `Danh_sach_ghep_nhom_${exportSemester}_${dateStr}_${timeStr}.xlsx`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Xuất file Excel báo cáo thành công!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      alert(
        "Không thể xuất file báo cáo. Vui lòng kiểm tra lại kết nối hoặc dữ liệu.",
      );
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
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 h-screen">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center text-white font-black shadow-sm">
              🛡️
            </div>
            <div>
              <h2 className="font-black text-sm text-[#2C2825]">
                Quản Trị Đầu Kỳ
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
              <span>Duyệt đăng ký sinh viên</span>
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
            <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
              {getInitials(user?.fullName)}
            </div>
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
          <span className="text-[#E65100] font-bold">
            Xin chào, {user?.fullName || "Admin"}
          </span>
        </header>

        <div className="w-full flex-1 flex flex-col">
          {/* --- MONITORING --- */}
          {activeMenu === "monitoring" && (
            <section className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                  Giám sát đầu kỳ
                </span>
                <h1 className="text-xl font-black text-[#2C2825]">
                  Thống kê tổng quan sinh viên & nhóm
                </h1>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Tổng tài khoản", value: manageableUsers.length },
                  { label: "Tổng số nhóm", value: groups.length },
                  {
                    label: "Sinh viên ",
                    value: manageableUsers.filter((u) => u.role === "STUDENT")
                      .length,
                  },
                  {
                    label: "Trưởng nhóm ",
                    value: manageableUsers.filter((u) => u.role === "LEADER")
                      .length,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-[#E8E2D9] bg-white p-5"
                  >
                    <p className="text-xs font-bold text-[#6B635B]">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#2C2825]">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-black text-[#2C2825]">
                  Báo cáo backend
                </h2>
                <button
                  onClick={fetchReportsSummary}
                  className="text-xs font-bold text-[#E65100] underline cursor-pointer"
                >
                  Làm mới
                </button>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reportEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-[#E8E2D9] bg-white p-5"
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
                  Hệ thống vận hành ổn định. Sẵn sàng quản lý sinh viên đầu kỳ.
                </p>
              )}
            </section>
          )}

          {/* --- ELIGIBILITY IMPORT --- */}
          {activeMenu === "eligibility" && (
            <div className="p-8 space-y-6 max-w-4xl">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl space-y-2">
                <h1 className="text-xl font-black text-[#2C2825]">
                  Quản lý danh sách đủ điều kiện
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Admin thực hiện import danh sách sinh viên từ kỳ trước hoặc
                  gắn/gỡ cờ điều kiện tham gia đợt đồ án.
                </p>
              </div>

              {/* 1. Import bằng File Excel / CSV */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Import từ File (CSV / Excel)
                </h3>
                <form onSubmit={handleFileSubmit} className="space-y-3">
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setEligibilityFile(e.target.files[0])}
                    className="w-full text-xs text-[#6B635B] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#E65100] hover:file:bg-orange-100 cursor-pointer"
                    required
                  />
                  <button
                    type="submit"
                    disabled={eligibilityLoading}
                    className="px-6 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {eligibilityLoading
                      ? "Đang xử lý..."
                      : "Tải lên file danh sách"}
                  </button>
                </form>
              </div>

              {/* 2. Import bằng JSON */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Import dữ liệu JSON trực tiếp
                </h3>
                <form onSubmit={handleJsonSubmit} className="space-y-3">
                  <textarea
                    rows={5}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='Dán đoạn JSON danh sách sinh viên (VD: [{"studentCode": "SE12345", ...}])'
                    className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100] font-mono"
                    required
                  />
                  <button
                    type="submit"
                    disabled={eligibilityLoading}
                    className="px-6 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {eligibilityLoading ? "Đang xử lý..." : "Import JSON"}
                  </button>
                </form>
              </div>

              {/* 3. Cập nhật cờ điều kiện từng sinh viên */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Gắn / Gỡ cờ điều kiện cá nhân
                </h3>
                <form
                  onSubmit={handleUpdateEligibilityStatus}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Mã sinh viên / User ID
                    </label>
                    <input
                      type="text"
                      value={eligibilityUserId}
                      onChange={(e) => setEligibilityUserId(e.target.value)}
                      placeholder="Nhập ID sinh viên..."
                      className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Trạng thái điều kiện
                    </label>
                    <select
                      value={eligibleStatus}
                      onChange={(e) =>
                        setEligibleStatus(e.target.value === "true")
                      }
                      className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    >
                      <option value="true">Đủ điều kiện (Eligible)</option>
                      <option value="false">
                        Không đủ điều kiện (Ineligible)
                      </option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={eligibilityLoading}
                    className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    Cập nhật trạng thái
                  </button>
                </form>
              </div>
            </div>
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
                    Import danh sách, gắn/gỡ cờ điều kiện tham gia và phân quyền
                    Student / Leader / Admin.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="bg-white p-4 border border-[#E8E2D9] rounded-2xl flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#6B635B] mr-2">
                    Lọc vai trò:
                  </span>
                  {[
                    { label: "Tất cả", value: "" },
                    { label: "Admin", value: "ADMIN" },
                    { label: "Leader", value: "LEADER" },
                    { label: "Student", value: "STUDENT" },
                  ].map((roleObj) => (
                    <button
                      key={roleObj.value}
                      onClick={() => setSelectedRole(roleObj.value)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        selectedRole === roleObj.value
                          ? "bg-[#E65100] text-white"
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
                      <th className="p-4 font-black uppercase">Họ và tên</th>
                      <th className="p-4 font-black uppercase">Email trường</th>
                      <th className="p-4 font-black uppercase">Vai trò</th>
                      <th className="p-4 font-black uppercase">
                        Trạng thái / Cờ điều kiện
                      </th>
                      <th className="p-4 font-black uppercase text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-[#FBF9F5]/70 transition"
                        >
                          <td className="p-4 font-bold text-[#2C2825]">
                            {u.fullName}
                          </td>
                          <td className="p-4 text-[#6B635B]">{u.email}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 font-extrabold text-[10px] uppercase rounded-lg ${getRoleBadgeStyle(u.role)}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">
                              Đủ điều kiện (ACTIVE)
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer"
                            >
                              ✏️ Sửa / Gắn cờ
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
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
          {activeMenu === "registrations" && <RegistrationReview />}

          {/* --- GROUPS MANAGEMENT (QUẢN LÝ NHÓM & CAN THIỆP SAU KHI KHÓA) --- */}
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
                            <td className="p-4 text-right">
                              <button
                                onClick={() =>
                                  alert(
                                    `Quản lý can thiệp cho nhóm ${g.groupCode}`,
                                  )
                                }
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

          {/* --- EXPORT EXCEL REPORT (QT15) --- */}
          {activeMenu === "export" && (
            <div className="p-8 space-y-6 max-w-3xl">
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                  QT15 · Xuất Excel Báo Cáo Ghép Nhóm
                </span>
                <h1 className="text-xl font-black">Xuất danh sách bàn giao </h1>
                <p className="text-xs text-[#6B635B]">
                  Hệ thống sẽ tạo file Excel chứa 2 sheet:{" "}
                  <strong className="text-[#2C2825]">Danh_sach_nhom</strong> và{" "}
                  <strong className="text-[#2C2825]">Chua_co_nhom</strong> theo
                  đúng chuẩn dữ liệu hiện hành[cite: 33].
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
                <form onSubmit={handleExportExcel} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[#6B635B]">
                      Chọn học kỳ cần xuất báo cáo
                    </label>
                    <select
                      value={exportSemester}
                      onChange={(e) => setExportSemester(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    >
                      <option value="Fall2026">Fall 2026</option>
                      <option value="Spring2027">Spring 2027</option>
                      <option value="Summer2027">Summer 2027</option>
                      <option value="Fall2027">Fall 2027</option>
                    </select>
                  </div>

                  <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 text-xs space-y-2 text-[#6B635B]">
                    <p className="font-black text-[#E65100]">
                      Quy tắc định dạng dữ liệu trong file xuất[cite: 33]:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Sheet Danh_sach_nhom:</strong> Gồm mã nhóm, tên
                        nhóm, sĩ số, trạng thái nhóm, thông tin thành viên
                        (MSSV, họ tên, email, SĐT, vai trò Leader/Member)[cite:
                        33].
                      </li>
                      <li>
                        <strong>Sheet Chua_co_nhom:</strong> Gồm danh sách sinh
                        viên chưa có nhóm, trạng thái điều kiện và lý do chưa có
                        nhóm[cite: 33].
                      </li>
                      <li>
                        MSSV và SĐT được lưu dưới dạng văn bản để giữ nguyên số
                        0 ở đầu; không gộp ô trong bảng dữ liệu[cite: 33].
                      </li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={exportingExcel}
                    className="w-full py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {exportingExcel
                      ? "Đang tạo file Excel..."
                      : "📥 Tải xuống file Excel (.xlsx)"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- SETTINGS & DEADLINES --- */}
          {activeMenu === "settings" && (
            <section className="p-8 space-y-6 max-w-4xl">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <h1 className="text-xl font-black text-[#2C2825]">
                  Cấu hình thời hạn hệ thống
                </h1>
                <p className="mt-2 text-xs text-[#6B635B]">
                  Thiết lập thời hạn phản hồi đơn Apply và Invite (mặc định 48
                  giờ).
                </p>
              </div>
              <form
                onSubmit={handleSaveSystemSettings}
                className="bg-white p-6 border border-[#E8E2D9] rounded-2xl space-y-5"
              >
                <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
                  Học kỳ hiện tại
                  <input
                    value={systemSettings.semester}
                    onChange={(event) =>
                      updateSystemSetting("semester", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
                    required
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-bold text-[#2C2825]">
                    Thời hạn đơn Apply / Invite (Giờ)
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
                      className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold text-[#2C2825]">
                    Quy mô nhóm tối đa (Thành viên)
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
                      className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#E65100] px-5 py-3 text-xs font-bold text-white cursor-pointer"
                >
                  Lưu cấu hình hệ thống
                </button>
              </form>
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
    </div>
  );
}
