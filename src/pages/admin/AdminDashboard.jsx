import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import {
  getTopics,
  createTopic,
  updateTopic,
} from "../../services/topicService";
import { getAllGroups, updateGroup } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("groups"); // Ưu tiên tab quản lý nhóm/duyệt đề tài
  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [instructors, setInstructors] = useState([]);

  // State phục vụ modal duyệt đề tài & phân công GVHD
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "STUDENT",
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [adminProfileForm, setAdminProfileForm] = useState({
    fullName: "",
    avatarUrl: "",
    status: "ACTIVE",
  });

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    topicCode: "",
    title: "",
    description: "",
    category: "",
    status: "PUBLISHED",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setAdminProfileForm({
          fullName: currentUser.fullName || "",
          avatarUrl: currentUser.avatarUrl || "",
          status: currentUser.status || "ACTIVE",
        });
      }

      const groupsRes = await getAllGroups().catch(() => []);
      const groupList = groupsRes?.content || groupsRes || [];
      setGroups(groupList);

      const usersRes = await getUsers().catch(() => []);
      const userList = usersRes?.content || usersRes || [];
      setUsers(userList);

      // Lọc danh sách giảng viên để phân công
      const instructorList = userList.filter(
        (u) => u.role === "INSTRUCTOR" || u.role === "ADMIN",
      );
      setInstructors(instructorList);

      const topicsRes = await getTopics().catch(() => []);
      setTopics(topicsRes?.content || topicsRes || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu quản trị:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- LOGIC DUYỆT ĐỀ TÀI & PHÂN CÔNG GVHD (CÓ CHECK ĐỘC QUYỀN TOPIC) ---
  const handleOpenApproveModal = (group) => {
    setSelectedGroup(group);
    setSelectedInstructorId(group.supervisorId || "");
    setIsApproveModalOpen(true);
  };

  const handleApproveGroupTopic = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (!selectedInstructorId) {
      alert("Vui lòng chọn Giảng viên hướng dẫn trước khi duyệt đề tài!");
      return;
    }

    const targetTopicId = selectedGroup.topicId || selectedGroup.topic?.id;

    if (targetTopicId) {
      const alreadyApprovedGroup = groups.find(
        (g) =>
          g.id !== selectedGroup.id &&
          (g.topicId === targetTopicId || g.topic?.id === targetTopicId) &&
          g.status === "ACTIVE", // Kiểm tra theo status hợp lệ của backend
      );

      if (alreadyApprovedGroup) {
        alert(
          `Đề tài này đã được giao và phê duyệt độc quyền cho nhóm [${alreadyApprovedGroup.groupCode}] trước đó. Vui lòng yêu cầu nhóm này đổi đề tài khác!`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      // Sửa status thành "ACTIVE" theo đúng enum của backend: [ARCHIVED, FORMED, ACTIVE, COMPLETED]
      await updateGroup(selectedGroup.id, {
        groupCode: selectedGroup.groupCode,
        semester: selectedGroup.semester,
        status: "ACTIVE",
        topicId: targetTopicId,
        supervisorId: selectedInstructorId,
      });

      alert("Phê duyệt đề tài và phân công GVHD cho nhóm thành công!");
      setIsApproveModalOpen(false);
      setSelectedGroup(null);
      fetchAdminData();
    } catch (error) {
      alert(
        error.response?.data?.message || "Không thể phê duyệt đề tài cho nhóm.",
      );
    } finally {
      setSubmitting(false);
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
      role: u.role || "STUDENT",
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditingUser) {
        await updateUser(editingUserId, userForm);
        alert("Cập nhật tài khoản thành công!");
      } else {
        await createUser(userForm);
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

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await updateUser(user.id, adminProfileForm);
      setUser({ ...user, ...adminProfileForm });
      alert("Cập nhật hồ sơ cá nhân thành công!");
      setIsEditingProfile(false);
    } catch (error) {
      alert(error.response?.data?.message || "Cập nhật hồ sơ thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTopic(topicForm);
      alert("Tạo đề tài thành công!");
      setIsTopicModalOpen(false);
      setTopicForm({
        topicCode: "",
        title: "",
        description: "",
        category: "",
        status: "PUBLISHED",
      });
      fetchAdminData();
    } catch (error) {
      alert("Tạo đề tài thất bại!");
    } finally {
      setSubmitting(false);
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
      (g.topicTitle &&
        g.topicTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.status && g.status.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const timeA = new Date(a.submittedAt || a.createdAt || 0);
    const timeB = new Date(b.submittedAt || b.createdAt || 0);
    return timeA - timeB;
  });

  const filteredUsers = users.filter((u) => {
    const matchesRole = !selectedRole || u.role === selectedRole;
    const matchesSearch =
      !searchQuery ||
      (u.fullName &&
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const filteredTopics = topics.filter((t) => {
    const matchesStatus = !selectedStatus || t.status === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.topicCode &&
        t.topicCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category &&
        t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
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
      case "REVIEWER":
        return "bg-purple-50 text-purple-600 border border-purple-200";
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
              Tổng quan
            </p>
            <button
              onClick={() => {
                setActiveMenu("overview");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "overview"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊</span>
              <span>Bảng điều khiển</span>
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
              <span>Duyệt đề tài & Nhóm ({groups.length})</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Quản lý danh mục
            </p>
            <button
              onClick={() => {
                setActiveMenu("users");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "users"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👤</span>
              <span>Tài khoản ({users.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("topics");
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === "topics"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📚</span>
              <span>Danh mục Đề tài ({topics.length})</span>
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
          {activeMenu === "overview" && (
            <div className="p-8 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-2xl">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
                  Tổng quan hệ thống
                </span>
                <h1 className="text-2xl font-black text-[#2C2825]">
                  Bảng điều khiển quản trị đồ án
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Kiểm duyệt đề tài, phân công GVHD và theo dõi tiến độ các
                  nhóm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Tổng số nhóm
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {groups.length}
                  </p>
                  <p className="text-[11px] text-amber-600 font-bold pt-2">
                    {
                      groups.filter(
                        (g) => g.status === "PENDING" || !g.supervisorId,
                      ).length
                    }{" "}
                    nhóm đang chờ duyệt
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">Tài khoản</p>
                  <p className="text-3xl font-black text-[#E65100]">
                    {users.length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Sinh viên, Giảng viên & Admin
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1 rounded-2xl">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Đề tài sẵn có
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {topics.filter((t) => t.status === "PUBLISHED").length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Đã phát hành cho sinh viên chọn
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- GROUPS & TOPIC APPROVAL (DUYỆT ĐỀ TÀI & PHÂN CÔNG GVHD) --- */}
          {activeMenu === "groups" && (
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
                              className={`px-3 py-1 font-bold rounded-full text-[10px] ${g.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}
                            >
                              {g.status || "PENDING"}
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
                              className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              🎯 Xét duyệt & Phân công
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
          {activeMenu === "users" && (
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý tài khoản hệ thống
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Phân quyền sinh viên, trưởng nhóm, giảng viên và admin.
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
                    { label: "Giảng viên", value: "INSTRUCTOR" },
                    { label: "Trưởng nhóm", value: "GROUP_LEADER" },
                    { label: "Sinh viên", value: "STUDENT" },
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
                              {u.role || "STUDENT"}
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
          {activeMenu === "topics" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl">
                <div>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý danh mục Đề tài tốt nghiệp
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Thêm và phát hành các đề tài cho sinh viên đăng ký.
                  </p>
                </div>
                <button
                  onClick={() => setIsTopicModalOpen(true)}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + Thêm đề tài mới
                </button>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Mã</th>
                      <th className="p-4 font-black uppercase">Tên đề tài</th>
                      <th className="p-4 font-black uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredTopics.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-[#FBF9F5]/70 transition"
                      >
                        <td className="p-4 font-mono font-bold">
                          {t.topicCode}
                        </td>
                        <td className="p-4 font-extrabold text-[#2C2825]">
                          {t.title}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded-full">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- PROFILE --- */}
          {activeMenu === "profile" && (
            <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
              <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl space-y-2">
                <h1 className="text-2xl font-black text-[#2C2825]">
                  Hồ sơ Quản trị viên
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Cập nhật thông tin định danh cá nhân.
                </p>
              </div>
              <div className="bg-white p-8 border border-[#E8E2D9] rounded-2xl space-y-6">
                <form
                  onSubmit={handleUpdateAdminProfile}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-[#2C2825] block mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={adminProfileForm.fullName}
                      onChange={(e) =>
                        setAdminProfileForm({
                          ...adminProfileForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#E65100] text-white font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL XÉT DUYỆT ĐỀ TÀI & PHÂN CÔNG GVHD --- */}
      {isApproveModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg p-8 border border-[#E8E2D9] rounded-3xl space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3">
              <h3 className="font-black text-base text-[#2C2825]">
                Phê duyệt đề tài cho nhóm: {selectedGroup.groupCode}
              </h3>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleApproveGroupTopic}
              className="space-y-4 text-xs"
            >
              <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-1">
                <p className="text-[10px] text-[#6B635B] font-bold uppercase">
                  Đề tài nhóm đang chọn:
                </p>
                <p className="font-black text-sm text-[#2C2825]">
                  {selectedGroup.topicTitle ||
                    selectedGroup.topic?.title ||
                    "Chưa chọn đề tài cụ thể"}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#2C2825] mb-1">
                  Phân công Giảng viên hướng dẫn (GVHD) *
                </label>
                <select
                  value={selectedInstructorId}
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                  required
                >
                  <option value="">-- Chọn giảng viên hướng dẫn --</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.fullName} ({ins.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6B635B] mt-1">
                  Lưu ý: Hệ thống sẽ khóa độc quyền đề tài này cho nhóm khi bấm
                  duyệt.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submitting ? "Đang xử lý..." : "✓ Xác nhận phê duyệt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
