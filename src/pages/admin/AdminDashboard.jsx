import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import {
  getTopics,
  createTopic,
  updateTopic,
} from "../../services/topicService";
import { getAllGroups } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import TopicQuestions from "./TopicQuestions";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("topics");
  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);

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

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    topicCode: "",
    title: "",
    description: "",
    category: "",
    status: "PUBLISHED",
  });
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] =
    useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const groupsRes = await getAllGroups().catch(() => []);
        setGroups(groupsRes?.content || groupsRes || []);

        const usersRes = await getUsers().catch(() => []);
        setUsers(usersRes?.content || usersRes || []);

        const topicsRes = await getTopics().catch(() => []);
        setTopics(topicsRes?.content || topicsRes || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu quản trị:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

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
      const usersRes = await getUsers();
      setUsers(usersRes?.content || usersRes || []);
    } catch (error) {
      alert(error.response?.data?.message || "Thực hiện thất bại!");
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
      const topicsRes = await getTopics();
      setTopics(topicsRes?.content || topicsRes || []);
    } catch (error) {
      alert("Tạo đề tài thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveTopic = async (topic) => {
    try {
      await updateTopic(topic.id, { ...topic, status: "PUBLISHED" });
      alert(`Đã duyệt đề tài ${topic.topicCode} thành công!`);
      const topicsRes = await getTopics();
      setTopics(topicsRes?.content || topicsRes || []);
    } catch (error) {
      alert("Duyệt đề tài thất bại!");
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
        g.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  const getTopicStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "DRAFT":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden">
      {/* SIDEBAR BÊN TRÁI */}
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
                setSelectedTopicForQuestions(null);
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
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
                setSelectedTopicForQuestions(null);
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeMenu === "groups"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👥</span>
              <span>Theo dõi Nhóm ({groups.length})</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">
              Quản lý danh mục
            </p>
            <button
              onClick={() => {
                setActiveMenu("users");
                setSelectedTopicForQuestions(null);
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
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
                setSelectedTopicForQuestions(null);
                setSearchQuery("");
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeMenu === "topics"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📚</span>
              <span>Đề tài & Câu hỏi ({topics.length})</span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">
                {user?.fullName || "System Admin"}
              </h4>
              <p className="text-[10px] text-[#6B635B] truncate">
                {user?.email || "admin@fpt.edu.vn"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-xs font-bold text-red-500 hover:underline"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* KHUNG NỘI DUNG CHÍNH */}
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
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold">
                  Tổng quan hệ thống
                </span>
                <h1 className="text-2xl font-black text-[#2C2825]">
                  Bảng điều khiển quản trị đồ án
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Theo dõi số lượng nhóm sinh viên, tài khoản và kiểm duyệt thông
                  tin thời gian thực.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Tổng số nhóm đồ án
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {groups.length}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold pt-2">
                    Đang hoạt động ổn định ✓
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Tổng tài khoản hệ thống
                  </p>
                  <p className="text-3xl font-black text-[#E65100]">
                    {users.length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Sinh viên, Giảng viên & Admin
                  </p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">
                    Đề tài đã kiểm duyệt
                  </p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {topics.filter((t) => t.status === "PUBLISHED").length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">
                    Sẵn sàng cho sinh viên chọn
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- GROUPS --- */}
          {activeMenu === "groups" && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9]">
                <div>
                  <h2 className="text-lg font-black text-[#2C2825]">
                    Theo dõi danh sách nhóm
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Tra cứu thông tin nhóm, thành viên (4-6 SV) và giảng viên
                    hướng dẫn.
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm theo mã nhóm hoặc tên đề tài..."
                className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
              />

              <div className="bg-white border border-[#E8E2D9] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Mã nhóm</th>
                      <th className="p-4 font-black uppercase">Đề tài đồ án</th>
                      <th className="p-4 font-black uppercase">Thành viên</th>
                      <th className="p-4 font-black uppercase">GV Hướng dẫn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => (
                        <tr
                          key={g.id}
                          className="hover:bg-[#FBF9F5]/60 transition"
                        >
                          <td className="p-4 font-bold text-[#2C2825]">
                            {g.groupCode}
                          </td>
                          <td className="p-4 font-semibold text-[#2C2825]">
                            {g.topicTitle || "Chưa có đề tài"}
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-orange-50 text-[#E65100] font-bold">
                              {g.members?.length || 4}/6 người
                            </span>
                          </td>
                          <td className="p-4 font-medium text-[#6B635B]">
                            {g.supervisorName || "Chưa phân công"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-8 text-center text-[#6B635B]"
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] gap-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-orange-100 text-[#E65100] text-[10px] font-black uppercase">
                    Hệ thống RBAC
                  </span>
                  <h2 className="text-xl font-black text-[#2C2825]">
                    Quản lý tài khoản hệ thống
                  </h2>
                  <p className="text-xs text-[#6B635B]">
                    Phân quyền sinh viên, trưởng nhóm, giảng viên, reviewer và
                    admin.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold shadow-sm transition shrink-0"
                >
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="bg-white p-4 border border-[#E8E2D9] flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <span className="text-xs font-bold text-[#6B635B] mr-2">
                    Lọc vai trò:
                  </span>
                  {[
                    { label: "Tất cả", value: "" },
                    { label: "Admin", value: "ADMIN" },
                    { label: "Giảng viên", value: "INSTRUCTOR" },
                    { label: "Reviewer", value: "REVIEWER" },
                    { label: "Trưởng nhóm", value: "GROUP_LEADER" },
                    { label: "Sinh viên", value: "STUDENT" },
                  ].map((roleObj) => (
                    <button
                      key={roleObj.value}
                      onClick={() => setSelectedRole(roleObj.value)}
                      className={`px-3.5 py-2 text-xs font-bold transition ${
                        selectedRole === roleObj.value
                          ? "bg-[#E65100] text-white shadow-xs"
                          : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9] hover:bg-gray-100"
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
                    placeholder="🔍 Tìm tên hoặc email..."
                    className="w-full px-4 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8E2D9] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Họ và tên</th>
                      <th className="p-4 font-black uppercase">
                        Email định danh
                      </th>
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
                          <td className="p-4 text-[#6B635B] font-medium">
                            {u.email}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 font-extrabold text-[10px] uppercase tracking-wider inline-block ${getRoleBadgeStyle(
                                u.role
                              )}`}
                            >
                              {u.role || "STUDENT"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:bg-[#FBF9F5] text-[#2C2825] font-bold text-xs transition"
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

          {/* --- TOPICS & QUESTION BANK --- */}
          {activeMenu === "topics" && (
            <div className="p-8 space-y-6">
              {selectedTopicForQuestions ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedTopicForQuestions(null)}
                    className="px-4 py-2.5 bg-white border border-[#E8E2D9] text-[#2C2825] font-bold text-xs hover:bg-[#FBF9F5] transition"
                  >
                    ← Quay lại danh sách đề tài
                  </button>
                  <TopicQuestions
                    topicId={selectedTopicForQuestions.id}
                    topicTitle={selectedTopicForQuestions.title}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] gap-4">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-orange-100 text-[#E65100] text-[10px] font-black uppercase">
                        Academic Topics
                      </span>
                      <h2 className="text-xl font-black text-[#2C2825]">
                        Quản lý đề tài & Ngân hàng câu hỏi
                      </h2>
                      <p className="text-xs text-[#6B635B]">
                        Kiểm duyệt đề tài đồ án tốt nghiệp và cấu hình câu hỏi
                        đánh giá.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTopicModalOpen(true)}
                      className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold shadow-sm transition shrink-0"
                    >
                      + Thêm đề tài mới
                    </button>
                  </div>

                  <div className="bg-white p-4 border border-[#E8E2D9] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                      <span className="text-xs font-bold text-[#6B635B] mr-2">
                        Trạng thái:
                      </span>
                      {[
                        { label: "Tất cả", value: "" },
                        { label: "Draft", value: "DRAFT" },
                        { label: "Published", value: "PUBLISHED" },
                        { label: "Archived", value: "ARCHIVED" },
                      ].map((statusObj) => (
                        <button
                          key={statusObj.value}
                          onClick={() => setSelectedStatus(statusObj.value)}
                          className={`px-4 py-2 text-xs font-bold transition ${
                            selectedStatus === statusObj.value
                              ? "bg-[#E65100] text-white shadow-xs"
                              : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9] hover:bg-gray-100"
                          }`}
                        >
                          {statusObj.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-full md:w-72">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Tìm tên đề tài, mã, thể loại..."
                        className="w-full px-4 py-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E2D9] overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                          <th className="p-4 font-black uppercase">Mã đề tài</th>
                          <th className="p-4 font-black uppercase">
                            Tên đề tài & Thể loại
                          </th>
                          <th className="p-4 font-black uppercase">
                            Trạng thái
                          </th>
                          <th className="p-4 font-black uppercase text-right">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D9]">
                        {filteredTopics.length > 0 ? (
                          filteredTopics.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-[#FBF9F5]/70 transition"
                            >
                              <td className="p-4 font-bold text-[#2C2825]">
                                <span className="px-2.5 py-1 bg-[#FBF9F5] border border-[#E8E2D9] font-mono text-[11px]">
                                  {t.topicCode}
                                </span>
                              </td>
                              <td className="p-4 space-y-1">
                                <span className="font-extrabold text-[#2C2825] block text-sm">
                                  {t.title}
                                </span>
                                <span className="px-2 py-0.5 bg-orange-50 text-[#E65100] text-[10px] font-bold inline-block">
                                  📂 {t.category || "General"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-3 py-1 font-extrabold text-[10px] uppercase tracking-wider inline-block ${getTopicStatusBadge(
                                    t.status
                                  )}`}
                                >
                                  {t.status || "DRAFT"}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() =>
                                    setSelectedTopicForQuestions(t)
                                  }
                                  className="px-3.5 py-1.5 bg-[#2C2825] hover:bg-black text-white font-bold text-xs transition inline-flex items-center space-x-1"
                                >
                                  <span>❓ Câu hỏi</span>
                                </button>
                                {t.status !== "PUBLISHED" && (
                                  <button
                                    onClick={() => handleApproveTopic(t)}
                                    className="px-3.5 py-1.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs transition inline-flex items-center space-x-1"
                                  >
                                    <span>✓ Duyệt</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="p-12 text-center text-[#6B635B] italic"
                            >
                              Không tìm thấy đề tài nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Tạo/Sửa User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md p-8 border border-[#E8E2D9] space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3">
              <h3 className="font-black text-base text-[#2C2825]">
                {isEditingUser
                  ? "Cập nhật tài khoản hệ thống"
                  : "Tạo tài khoản hệ thống mới"}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, fullName: e.target.value })
                  }
                  placeholder="VD: Nguyễn Văn A..."
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Email định danh
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  placeholder="name@fpt.edu.vn..."
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                />
              </div>
              {!isEditingUser && (
                <div>
                  <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                >
                  <option value="STUDENT">STUDENT (Sinh viên)</option>
                  <option value="GROUP_LEADER">
                    GROUP_LEADER (Trưởng nhóm)
                  </option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                  <option value="REVIEWER">REVIEWER (Giảng viên phản biện)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold shadow-sm"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Đề Tài */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md p-8 border border-[#E8E2D9] space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3">
              <h3 className="font-black text-base text-[#2C2825]">
                Thêm đề tài đồ án mới
              </h3>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Mã đề tài (Topic Code)
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.topicCode}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, topicCode: e.target.value })
                  }
                  placeholder="VD: TOPIC-01"
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Tên đề tài
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.title}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, title: e.target.value })
                  }
                  placeholder="Nhập tên đề tài tốt nghiệp..."
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Thể loại (Category)
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.category}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, category: e.target.value })
                  }
                  placeholder="VD: Front-End, AI, IoT..."
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B635B] mb-1">
                  Trạng thái
                </label>
                <select
                  value={topicForm.status}
                  onChange={(e) =>
                    setTopicForm({ ...topicForm, status: e.target.value })
                  }
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] focus:outline-none focus:border-[#E65100]"
                >
                  <option value="DRAFT">DRAFT (Bản nháp)</option>
                  <option value="PUBLISHED">PUBLISHED (Đã phát hành)</option>
                  <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold shadow-sm"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}