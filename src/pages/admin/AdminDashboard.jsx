import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../../services/userService";
import { getTopics, createTopic, updateTopic } from "../../services/topicService";
import { getAllGroups } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import TopicQuestions from "./TopicQuestions";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("overview"); 
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
  const [userForm, setUserForm] = useState({ email: "", fullName: "", password: "", role: "STUDENT" });

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({ topicCode: "", title: "", description: "", category: "", status: "PUBLISHED" });
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState(null);
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
    setUserForm({ email: u.email || "", fullName: u.fullName || "", password: "", role: u.role || "STUDENT" });
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
      setTopicForm({ topicCode: "", title: "", description: "", category: "", status: "PUBLISHED" });
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

  const filteredGroups = groups.filter(g => 
    (g.groupCode && g.groupCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (g.topicTitle && g.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(u => !selectedRole || u.role === selectedRole);
  const filteredTopics = topics.filter(t => !selectedStatus || t.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải hệ thống quản trị...
      </div>
    );
  }

  const timeSlots = ["08:00 AM", "09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM"];
  const weekDays = [
    { name: "MON 06.07", key: 0 },
    { name: "TUE 07.07", key: 1 },
    { name: "WED 08.07", key: 2 },
    { name: "THU 09.07", key: 3 },
    { name: "FRI 10.07", key: 4 },
    { name: "SAT 11.07", key: 5 },
  ];

  const cardColors = [
    "bg-sky-50 border-l-4 border-sky-400 text-sky-950",
    "bg-teal-50 border-l-4 border-teal-400 text-teal-950",
    "bg-purple-50 border-l-4 border-purple-400 text-purple-950",
    "bg-pink-50 border-l-4 border-pink-400 text-pink-950",
    "bg-amber-50 border-l-4 border-amber-400 text-amber-950"
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden">
      
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-60 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 rounded-none h-screen">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-none flex items-center justify-center text-white font-black">
              🛡️
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#2C2825]">Quản Trị Đồ Án</h2>
              <p className="text-[10px] text-[#6B635B]">Hệ thống theo dõi tốt nghiệp</p>
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold text-[#6B635B]">
            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mb-2 px-3">Tổng quan</p>
            <button
              onClick={() => { setActiveMenu("overview"); setSelectedTopicForQuestions(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-none transition ${
                activeMenu === "overview" ? "bg-[#E65100] text-white" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📊</span>
              <span>Bảng điều khiển</span>
            </button>
            <button
              onClick={() => { setActiveMenu("groups"); setSelectedTopicForQuestions(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-none transition ${
                activeMenu === "groups" ? "bg-[#E65100] text-white" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👥</span>
              <span>Theo dõi Nhóm ({groups.length})</span>
            </button>
            <button
              onClick={() => { setActiveMenu("schedule"); setSelectedTopicForQuestions(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-none transition ${
                activeMenu === "schedule" ? "bg-[#E65100] text-white" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📅</span>
              <span>Lịch hội đồng chấm thi</span>
            </button>

            <p className="text-[10px] font-black text-[#9E958C] uppercase tracking-wider mt-6 mb-2 px-3">Quản lý danh mục</p>
            <button
              onClick={() => { setActiveMenu("users"); setSelectedTopicForQuestions(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-none transition ${
                activeMenu === "users" ? "bg-[#E65100] text-white" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>👤</span>
              <span>Tài khoản ({users.length})</span>
            </button>
            <button
              onClick={() => { setActiveMenu("topics"); setSelectedTopicForQuestions(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-none transition ${
                activeMenu === "topics" ? "bg-[#E65100] text-white" : "hover:bg-[#F8F6F0]"
              }`}
            >
              <span>📚</span>
              <span>Đề tài & Câu hỏi ({topics.length})</span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-none flex items-center justify-center text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">{user?.fullName || "System Admin"}</h4>
              <p className="text-[10px] text-[#6B635B] truncate">{user?.email || "admin@fpt.edu.vn"}</p>
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

      {/* KHUNG NỘI DUNG CHÍNH KHÔNG KHOẢNG TRỐNG */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto m-0 p-0">
        
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-6 flex justify-between items-center text-xs font-semibold text-[#6B635B] shrink-0 rounded-none m-0">
          <span>Quản Trị Hệ Thống — {activeMenu.toUpperCase()}</span>
          <span className="text-[#E65100] font-bold">Xin chào, {user?.fullName || "Admin"}</span>
        </header>

        <div className="w-full m-0 p-0 flex-1 flex flex-col">
          
          {/* --- OVERVIEW --- */}
          {activeMenu === "overview" && (
            <div className="p-6 space-y-6">
              <div className="bg-white p-6 border border-[#E8E2D9] space-y-2 rounded-none">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold">Tổng quan hệ thống</span>
                <h1 className="text-2xl font-black text-[#2C2825]">Bảng điều khiển quản trị đồ án</h1>
                <p className="text-xs text-[#6B635B]">Theo dõi lịch trình, số lượng nhóm sinh viên và kiểm duyệt thông tin thời gian thực.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 border border-[#E8E2D9] rounded-none space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">Tổng số nhóm đồ án</p>
                  <p className="text-3xl font-black text-[#2C2825]">{groups.length}</p>
                  <p className="text-[11px] text-emerald-600 font-bold pt-2">Đang hoạt động ổn định ✓</p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] rounded-none space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">Tổng tài khoản hệ thống</p>
                  <p className="text-3xl font-black text-[#E65100]">{users.length}</p>
                  <p className="text-[11px] text-[#6B635B] pt-2">Sinh viên, Giảng viên & Admin</p>
                </div>
                <div className="bg-white p-6 border border-[#E8E2D9] rounded-none space-y-1">
                  <p className="text-xs font-bold text-[#6B635B]">Đề tài đã kiểm duyệt</p>
                  <p className="text-3xl font-black text-[#2C2825]">
                    {topics.filter(t => t.status === "PUBLISHED").length}
                  </p>
                  <p className="text-[11px] text-[#6B635B] pt-2">Sẵn sàng cho sinh viên chọn</p>
                </div>
              </div>
            </div>
          )}

          {/* --- GROUPS --- */}
          {activeMenu === "groups" && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-none">
                <div>
                  <h2 className="text-lg font-black text-[#2C2825]">Theo dõi danh sách nhóm</h2>
                  <p className="text-xs text-[#6B635B]">Tra cứu thông tin nhóm, thành viên và giảng viên hướng dẫn.</p>
                </div>
              </div>

              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm theo mã nhóm hoặc tên đề tài..."
                className="w-full px-4 py-3 text-xs bg-white border border-[#E8E2D9] rounded-none focus:outline-none focus:border-[#E65100]"
              />

              <div className="bg-white border border-[#E8E2D9] overflow-hidden rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Mã nhóm</th>
                      <th className="p-4 font-black uppercase">Đề tài đồ án</th>
                      <th className="p-4 font-black uppercase">Thành viên</th>
                      <th className="p-4 font-black uppercase">GV Hướng dẫn</th>
                      <th className="p-4 font-black uppercase">Hội đồng chấm thi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => (
                        <tr key={g.id} className="hover:bg-[#FBF9F5]/60 transition">
                          <td className="p-4 font-bold text-[#2C2825]">{g.groupCode}</td>
                          <td className="p-4 font-semibold text-[#2C2825]">{g.topicTitle || "Chưa có đề tài"}</td>
                          <td className="p-4"><span className="px-3 py-1 bg-orange-50 text-[#E65100] font-bold rounded-none">{g.members?.length || 1}/5 người</span></td>
                          <td className="p-4 font-medium text-[#6B635B]">{g.supervisorName || "Chưa phân công"}</td>
                          <td className="p-4 font-medium text-emerald-600">{g.evaluatorName || "Chưa xếp lịch hội đồng"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="p-8 text-center text-[#6B635B]">Không tìm thấy nhóm đồ án nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SCHEDULE / LỊCH HỘI ĐỒNG (FULL MÀN HÌNH, KHÔNG KHOẢNG TRỐNG) --- */}
          {activeMenu === "schedule" && (
            <div className="w-full m-0 p-0 flex-1 flex flex-col">
              <div className="bg-white px-6 py-4 border-b border-[#E8E2D9] flex justify-between items-center rounded-none shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#E65100]">Lịch trình hội đồng</span>
                  <h2 className="text-xl font-black text-[#2C2825] mt-0.5">Lịch chấm bảo vệ đồ án (Tuần này)</h2>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] text-xs font-bold hover:bg-gray-100 rounded-none">⟨ Tuần trước</button>
                  <button className="px-3 py-1.5 bg-[#E65100] text-white text-xs font-bold rounded-none">This week</button>
                  <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] text-xs font-bold hover:bg-gray-100 rounded-none">Tuần sau ⟩</button>
                </div>
              </div>

              <div className="bg-white border-b border-[#E8E2D9] w-full flex-1 flex flex-col rounded-none m-0">
                
                <div className="grid grid-cols-[90px_repeat(6,minmax(0,1fr))] bg-[#FBF9F5] border-b border-[#E8E2D9] text-center text-xs font-black text-[#2C2825] shrink-0">
                  <div className="p-3 border-r border-[#E8E2D9] text-[#6B635B]">Time</div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="p-3 border-r border-[#E8E2D9] last:border-r-0">
                      {day.name}
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-[#E8E2D9] flex-1 flex flex-col">
                  {timeSlots.map((time, timeIdx) => (
                    <div key={timeIdx} className="grid grid-cols-[90px_repeat(6,minmax(0,1fr))] flex-1 items-stretch min-h-27.5">
                      
                      <div className="p-2 border-r border-[#E8E2D9] text-[10px] font-bold text-[#6B635B] bg-[#FBF9F5]/30 flex items-start justify-center pt-4">
                        {time}
                      </div>

                      {weekDays.map((day, dayIdx) => {
                        const matchedGroup = groups[(timeIdx * 6 + dayIdx) % (groups.length || 1)];
                        const cardColorStyle = cardColors[(timeIdx + dayIdx) % cardColors.length];
                        
                        return (
                          <div key={dayIdx} className="p-0 border-r border-[#E8E2D9] last:border-r-0 relative hover:bg-[#FBF9F5]/30 transition">
                            {matchedGroup && (timeIdx + dayIdx) % 2 === 0 && (
                              <div className={`p-2.5 rounded-none border-0 border-l-4 space-y-1 h-full w-full ${cardColorStyle}`}>
                                <div className="flex justify-between items-center text-[9px] font-bold opacity-75">
                                  <span>{matchedGroup.groupCode}</span>
                                  <span>{time}</span>
                                </div>
                                <p className="text-[11px] font-black leading-tight line-clamp-2">
                                  {matchedGroup.topicTitle || "Đề tài tốt nghiệp"}
                                </p>
                                <div className="text-[9px] opacity-80 pt-1 border-t border-black/5 space-y-0.5">
                                  <p>GVHD: <strong>{matchedGroup.supervisorName || "Chưa phân công"}</strong></p>
                                  <p>Hội đồng: <strong>{matchedGroup.evaluatorName || "Hội đồng CNTT"}</strong></p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* --- USERS --- */}
          {activeMenu === "users" && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-none">
                <div>
                  <h2 className="text-lg font-black text-[#2C2825]">Quản lý tài khoản hệ thống</h2>
                  <p className="text-xs text-[#6B635B]">Thêm mới và phân quyền tài khoản cho sinh viên, giảng viên.</p>
                </div>
                <button onClick={handleOpenCreateUser} className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-none transition">
                  + Thêm tài khoản mới
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white p-4 border border-[#E8E2D9] rounded-none">
                <span className="text-xs font-bold text-[#6B635B] mr-2">Lọc vai trò:</span>
                {["", "ADMIN", "INSTRUCTOR", "STUDENT", "GROUP_LEADER"].map((role) => (
                  <button key={role} onClick={() => setSelectedRole(role)} className={`px-4 py-2 text-xs font-bold rounded-none transition ${selectedRole === role ? "bg-[#E65100] text-white" : "bg-[#FBF9F5] text-[#6B635B] border"}`}>
                    {role || "Tất cả"}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-[#E8E2D9] overflow-hidden rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                      <th className="p-4 font-black uppercase">Họ tên</th>
                      <th className="p-4 font-black uppercase">Email</th>
                      <th className="p-4 font-black uppercase">Vai trò</th>
                      <th className="p-4 font-black uppercase text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FBF9F5]/60 transition">
                        <td className="p-4 font-bold text-[#2C2825]">{u.fullName}</td>
                        <td className="p-4 text-[#6B635B]">{u.email}</td>
                        <td className="p-4"><span className="px-3 py-1 bg-orange-50 text-[#E65100] font-bold rounded-none text-[10px]">{u.role}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleOpenEditUser(u)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#2C2825] font-bold rounded-none text-xs transition">✏️ Sửa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TOPICS --- */}
          {activeMenu === "topics" && (
            <div className="p-6 space-y-6">
              {selectedTopicForQuestions ? (
                <div className="space-y-4">
                  <button onClick={() => setSelectedTopicForQuestions(null)} className="px-4 py-2.5 bg-white border border-[#E8E2D9] text-[#2C2825] font-bold text-xs rounded-none">
                    ← Quay lại danh sách đề tài
                  </button>
                  <TopicQuestions topicId={selectedTopicForQuestions.id} topicTitle={selectedTopicForQuestions.title} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 border border-[#E8E2D9] rounded-none">
                    <div>
                      <h2 className="text-lg font-black text-[#2C2825]">Quản lý đề tài & Ngân hàng câu hỏi</h2>
                      <p className="text-xs text-[#6B635B]">Kiểm duyệt đề tài đồ án tốt nghiệp do giảng viên hoặc admin tạo.</p>
                    </div>
                    <button onClick={() => setIsTopicModalOpen(true)} className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-none transition">
                      + Thêm đề tài mới
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-4 border border-[#E8E2D9] rounded-none">
                    <span className="text-xs font-bold text-[#6B635B] mr-2">Trạng thái:</span>
                    {["", "DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
                      <button key={status} onClick={() => setSelectedStatus(status)} className={`px-4 py-2 text-xs font-bold rounded-none transition ${selectedStatus === status ? "bg-[#E65100] text-white" : "bg-[#FBF9F5] text-[#6B635B] border"}`}>
                        {status || "Tất cả"}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white border border-[#E8E2D9] overflow-hidden rounded-none">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                          <th className="p-4 font-black uppercase">Mã đề tài</th>
                          <th className="p-4 font-black uppercase">Tên đề tài</th>
                          <th className="p-4 font-black uppercase">Thể loại</th>
                          <th className="p-4 font-black uppercase">Trạng thái</th>
                          <th className="p-4 font-black uppercase text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D9]">
                        {filteredTopics.map((t) => (
                          <tr key={t.id} className="hover:bg-[#FBF9F5]/60 transition">
                            <td className="p-4 font-bold text-[#2C2825]">{t.topicCode}</td>
                            <td className="p-4 font-bold text-[#2C2825]">{t.title}</td>
                            <td className="p-4 text-[#6B635B]">{t.category}</td>
                            <td className="p-4"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-extrabold rounded-none text-[10px]">{t.status}</span></td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => setSelectedTopicForQuestions(t)} className="px-4 py-2 bg-[#2C2825] text-white font-bold rounded-none text-xs">❓ Câu hỏi</button>
                              {t.status !== "PUBLISHED" && (
                                <button onClick={() => handleApproveTopic(t)} className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-none text-xs">Duyệt</button>
                              )}
                            </td>
                          </tr>
                        ))}
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
          <div className="bg-white w-full max-w-md rounded-none p-8 border border-[#E8E2D9] space-y-6">
            <h3 className="font-black text-base text-[#2C2825]">{isEditingUser ? "Cập nhật tài khoản" : "Tạo tài khoản hệ thống"}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <input type="text" required value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} placeholder="Họ và tên..." className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-none" />
              <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="Email..." className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-none" />
              {!isEditingUser && <input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Mật khẩu..." className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-none" />}
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-none">
                <option value="ADMIN">ADMIN</option>
                <option value="INSTRUCTOR">INSTRUCTOR</option>
                <option value="STUDENT">STUDENT</option>
                <option value="GROUP_LEADER">GROUP_LEADER</option>
              </select>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-3 bg-gray-100 text-xs font-bold rounded-none">Hủy</button>
                <button type="submit" className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-none">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}