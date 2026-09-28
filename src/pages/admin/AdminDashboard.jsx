import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import { getAllGroups } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import { getReportsSummary } from "../../services/progressService";
import Profile from "../../auth/Profile";

const defaultSystemSettings = {
  semester: "Spring2026",
  maxTopicAttempts: 4,
  firstAttemptDays: 14,
  retryAttemptDays: 10,
  topicSubmissionOpen: false,
  currentAttempt: 1,
};

const getManagedRole = (role) => {
  const normalizedRole = String(role || "").trim().toUpperCase();
  const aliases = {
    GROUP_LEADER: "LEADER",
    LECTURER: "INSTRUCTOR",
    TEACHER: "INSTRUCTOR",
    REVIEWER: "COUNCIL",
    COUNCIL_MEMBER: "COUNCIL",
    COUNCILCHAIR: "COUNCIL",
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
    role: "LEADER",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const groupsRes = await getAllGroups().catch(() => []);
      const groupList = groupsRes?.content || groupsRes || [];
      setGroups(groupList);

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
      const response = await getReportsSummary();
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
  ).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value));

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
    setUserForm({ email: "", fullName: "", password: "", role: "LEADER" });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setIsEditingUser(true);
    setEditingUserId(u.id);
    setUserForm({
      email: u.email || "",
      fullName: u.fullName || "",
      password: "",
      role: getManagedRole(u.role) || "LEADER",
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
    alert("Đã lưu cấu hình trên trình duyệt này. Cần API cấu hình backend để áp dụng toàn hệ thống.");
  };

  const updateSystemSetting = (key, value) => {
    setSystemSettings((current) => ({ ...current, [key]: value }));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const filteredGroups = groups.filter(
    (g) =>
      (g.groupCode &&
        g.groupCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.topicTitle &&
        g.topicTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.status && g.status.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const timeA = new Date(a.submittedAt || a.createdAt || 0);
    const timeB = new Date(b.submittedAt || b.createdAt || 0);
    return timeA - timeB;
  });

  const manageableRoles = ["LEADER", "INSTRUCTOR", "COUNCIL", "ADMIN"];
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
        Đang tải hệ thống quản trị...
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-600 border border-red-200";
      case "INSTRUCTOR":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "COUNCIL":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "LEADER":
      case "GROUP_LEADER":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
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
                Quản Trị Đồ Án
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Hệ thống theo dõi tốt nghiệp
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mb-2 px-3">
              Quản trị hệ thống
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
              <span>Giám sát toàn cục</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Tài khoản & cấu hình
            </p>
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
              <span>Tài khoản ({users.length})</span>
            </button>
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
              <span>Cấu hình hệ thống</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("gate");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "gate"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>🚦</span>
              <span>Cổng nộp đề tài</span>
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
                {user?.fullName || "System Admin"}
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
          {/* --- OVERVIEW --- */}
          {activeMenu === "__legacyOverview" && (
            <div className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                  Tổng quan hệ thống · 6 giai đoạn
                </span>
                <h1 className="text-2xl font-black text-[#2C2825]">
                  Bảng điều khiển quản trị toàn bộ quy trình đồ án
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Admin theo dõi toàn bộ chuỗi: đăng nhập & xác thực, đề tài, lịch tư vấn, tiến độ, review và bảo vệ cuối kỳ, đồng thời mở/đóng các đợt duyệt theo quy chế.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Giai đoạn 1–2 · Đăng nhập & Đề tài
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {groups.length}
                  </p>
                  <p className="text-[11px] text-amber-600 font-bold pt-2">
                    {
                      groups.filter(
                        (g) =>
                          Boolean(g.topicId || g.topic?.id) &&
                          g.status === "FORMED",
                      ).length
                    }{" "}
                    nhóm đang gửi/đợi duyệt
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Giai đoạn 3–4 · Tư vấn & Tiến độ
                  </p>
                  <p className="text-3xl font-black text-[#E65100]">
                    {users.length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Theo dõi lịch hẹn, pre-meeting và warning flags
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Giai đoạn 5–6 · Review & Bảo vệ
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {groups.filter((group) => group.status === "ACTIVE").length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Đánh giá tiến độ, hội đồng kín và chấm bảo vệ cuối kỳ
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#E65100]">KPI chính</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">40 nhóm / luồng đồng bộ</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Hệ thống đảm bảo chạy theo giai đoạn để tránh dồn lịch cùng lúc.</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Quy chế</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">Tối đa 4 lần duyệt</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Lần 1: 14 ngày, từ lần 2: 10 ngày do Admin mở cổng.</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Bảo vệ</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">Lần 1 & Lần 2</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Một nhóm chỉ vào lịch bảo vệ khi đã qua hội đồng kín và đủ điều kiện.</p>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "monitoring" && (
            <section className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                  Giám sát toàn cục
                </span>
                <h1 className="text-xl font-black text-[#2C2825]">
                  Tình hình hệ thống
                </h1>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Tài khoản", value: manageableUsers.length },
                  { label: "Nhóm đồ án", value: groups.length },
                  { label: "Đề tài đã duyệt", value: groups.filter((group) => group.status === "ACTIVE").length },
                  { label: "Nhóm chờ duyệt", value: groups.filter((group) => group.status === "FORMED").length },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-[#E8E2D9] bg-white p-5">
                    <p className="text-xs font-bold text-[#6B635B]">{metric.label}</p>
                    <p className="mt-2 text-2xl font-black text-[#2C2825]">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-black text-[#2C2825]">Báo cáo backend</h2>
                <button onClick={fetchReportsSummary} className="text-xs font-bold text-[#E65100] underline">Làm mới</button>
              </div>
              {reportsLoading ? (
                <p className="text-xs text-[#6B635B]">Đang tải báo cáo...</p>
              ) : reportsError ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  <p>{reportsError}</p>
                  <button
                    onClick={fetchReportsSummary}
                    className="font-bold underline"
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
                      <p className="mt-2 wrap-break-word text-2xl font-black text-[#2C2825]">
                        {formatReportValue(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B635B]">
                  API chưa trả về dữ liệu tổng hợp.
                </p>
              )}
            </section>
          )}

          {/* --- GROUPS & TOPIC APPROVAL (DUYỆT ĐỀ TÀI & PHÂN CÔNG GVHD) --- */}
          {activeMenu === "__inactiveGroups" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <div>
                  <h2 className="text-lg font-black text-[#2C2825]">
                    Phê duyệt đề tài & Phân công Giảng viên hướng dẫn
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Mỗi đề tài độc quyền 1 nhóm. Nhóm đăng ký trước (dựa vào
                    thời gian) sẽ được ưu tiên duyệt trước.
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm theo mã nhóm, tên đề tài hoặc trạng thái..."
                className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
              />

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Mã nhóm</th>
                      <th className="p-4 font-black uppercase">
                        Đề tài đăng ký
                      </th>
                      <th className="p-4 font-black uppercase">
                        Thời gian gửi
                      </th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                      <th className="p-4 font-black uppercase">GVHD</th>
                      <th className="p-4 font-black uppercase text-right">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {sortedGroups.length > 0 ? (
                      sortedGroups.map((g) => (
                        <tr
                          key={g.id}
                          className="hover:bg-[#FBF9F5]/60 transition"
                        >
                          <td className="p-4 font-bold text-[#2C2825]">
                            {g.groupCode}
                          </td>
                          <td className="p-4 font-semibold text-[#2C2825]">
                            {g.topicTitle ||
                              g.topic?.title ||
                              "Chưa chọn đề tài"}
                          </td>
                          <td className="p-4 font-mono text-[#6B635B]">
                            {g.submittedAt || g.createdAt
                              ? new Date(
                                  g.submittedAt || g.createdAt,
                                ).toLocaleString("vi-VN")
                              : "Chưa cập nhật"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 font-bold rounded-full text-[10px] ${g.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}
                            >
                              {g.status === "ACTIVE"
                                ? "Đã duyệt"
                                : g.topicId || g.topic?.id
                                  ? "Chờ duyệt"
                                  : "Chưa gửi đề tài"}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-[#6B635B]">
                            {g.supervisorName ||
                              g.supervisor?.fullName ||
                              "Chưa phân công"}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenApproveModal(g)}
                              disabled={!(g.topicId || g.topic?.id)}
                              title={g.topicId || g.topic?.id ? "" : "Leader chưa gửi đề tài"}
                              className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {g.topicId || g.topic?.id
                                ? "🎯 Xét duyệt & Phân công"
                                : "Chưa có đề tài"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
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

          {/* --- USERS --- */}
          {activeMenu === "accounts" && (
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý tài khoản hệ thống
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Quản lý tài khoản và phân quyền Leader, Instructor, Council, Admin.
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
                    { label: "Instructor", value: "INSTRUCTOR" },
                    { label: "Council", value: "COUNCIL" },
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
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Họ và tên</th>
                      <th className="p-4 font-black uppercase">Email</th>
                      <th className="p-4 font-black uppercase">Vai trò</th>
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
                              className={`px-3 py-1 font-extrabold text-[10px] uppercase rounded-lg ${getRoleBadgeStyle(
                                u.role,
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer"
                            >
                              ✏️ Sửa
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
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

          {/* --- TOPICS --- */}
          {activeMenu === "settings" && (
            <section className="p-8 space-y-6 max-w-4xl">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <h1 className="text-xl font-black text-[#2C2825]">Cấu hình hệ thống</h1>
                <p className="mt-2 text-xs text-[#6B635B]">Thiết lập học kỳ và quy chế nộp lại đề tài.</p>
              </div>
              <form onSubmit={handleSaveSystemSettings} className="bg-white p-6 border border-[#E8E2D9] rounded-2xl space-y-5">
                <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
                  Học kỳ hiện tại
                  <input value={systemSettings.semester} onChange={(event) => updateSystemSetting("semester", event.target.value)} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" required />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1 text-xs font-bold text-[#2C2825]">
                    Số lần nộp tối đa
                    <input type="number" min="1" max="10" value={systemSettings.maxTopicAttempts} onChange={(event) => updateSystemSetting("maxTopicAttempts", Number(event.target.value))} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
                  </label>
                  <label className="space-y-1 text-xs font-bold text-[#2C2825]">
                    Hạn lần đầu (ngày)
                    <input type="number" min="1" value={systemSettings.firstAttemptDays} onChange={(event) => updateSystemSetting("firstAttemptDays", Number(event.target.value))} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
                  </label>
                  <label className="space-y-1 text-xs font-bold text-[#2C2825]">
                    Hạn nộp lại (ngày)
                    <input type="number" min="1" value={systemSettings.retryAttemptDays} onChange={(event) => updateSystemSetting("retryAttemptDays", Number(event.target.value))} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
                  </label>
                </div>
                <button type="submit" className="rounded-xl bg-[#E65100] px-5 py-3 text-xs font-bold text-white">Lưu cấu hình</button>
                <p className="text-[11px] text-amber-700">Backend hiện chưa có endpoint lưu cấu hình; các giá trị này chỉ lưu trên trình duyệt hiện tại, chưa áp dụng toàn hệ thống.</p>
              </form>
            </section>
          )}

          {activeMenu === "gate" && (
            <section className="p-8 space-y-6 max-w-4xl">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <h1 className="text-xl font-black text-[#2C2825]">Cổng nộp đề tài</h1>
                <p className="mt-2 text-xs text-[#6B635B]">Điều khiển đợt nộp tiếp theo theo chính sách học kỳ.</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#6B635B]">Đợt nộp hiện tại</p>
                    <p className="mt-1 text-lg font-black text-[#2C2825]">Lần {systemSettings.currentAttempt} / {systemSettings.maxTopicAttempts}</p>
                  </div>
                  <label className="flex items-center gap-3 text-xs font-bold text-[#2C2825]">
                    <input type="checkbox" checked={systemSettings.topicSubmissionOpen} onChange={(event) => updateSystemSetting("topicSubmissionOpen", event.target.checked)} className="h-4 w-4 accent-[#E65100]" />
                    {systemSettings.topicSubmissionOpen ? "Cổng đang mở" : "Cổng đang đóng"}
                  </label>
                </div>
                <label className="block max-w-xs space-y-1 text-xs font-bold text-[#2C2825]">
                  Chọn lần nộp cần mở
                  <select value={systemSettings.currentAttempt} onChange={(event) => updateSystemSetting("currentAttempt", Number(event.target.value))} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3">
                    {Array.from({ length: systemSettings.maxTopicAttempts }, (_, index) => index + 1).map((attempt) => <option key={attempt} value={attempt}>Lần {attempt}</option>)}
                  </select>
                </label>
                <button onClick={handleSaveSystemSettings} type="button" className="rounded-xl bg-[#E65100] px-5 py-3 text-xs font-bold text-white">Lưu trạng thái cổng</button>
                <p className="text-[11px] text-amber-700">Backend hiện chưa có endpoint mở/đóng cổng; trạng thái chỉ lưu trên trình duyệt hiện tại và chưa khóa/mở quyền nộp ở các tài khoản khác.</p>
              </div>
            </section>
          )}

          {/* --- PROFILE --- */}
          {activeMenu === "profile" && (
            <div className="p-8 w-full"><Profile /></div>
          )}
        </div>
      </main>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveUser} className="w-full max-w-lg space-y-5 rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h3 className="text-base font-black text-[#2C2825]">
                {isEditingUser ? "Cập nhật tài khoản" : "Tạo tài khoản"}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="font-bold text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Họ và tên
              <input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} required className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Email
              <input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Mật khẩu {isEditingUser && "(để trống nếu không đổi)"}
              <input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required={!isEditingUser} minLength={8} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal" />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#2C2825]">
              Vai trò
              <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })} className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 font-normal">
                <option value="LEADER">Leader</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="COUNCIL">Council</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t border-[#F0EBE1] pt-4">
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold">Hủy</button>
              <button type="submit" disabled={submitting} className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                {submitting ? "Đang lưu..." : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
