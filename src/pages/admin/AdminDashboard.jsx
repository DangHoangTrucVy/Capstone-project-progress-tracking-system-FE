import React, { useEffect, useState } from "react";
import { getUsers, createUser } from "../../services/userService";
import {
  getTopics,
  createTopic,
  updateTopic,
} from "../../services/topicService";
import { getCurrentUser } from "../../services/authService";
import MainLayout from "../../components/MainLayout";
import TopicQuestions from "./TopicQuestions";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // 'users' hoặc 'topics'
  const [loading, setLoading] = useState(true);

  // State cho Users
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "STUDENT",
  });

  // State cho Topics
  const [topics, setTopics] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    topicCode: "",
    title: "",
    description: "",
    category: "",
    status: "PUBLISHED",
  });

  const [submitting, setSubmitting] = useState(false);
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        await fetchUsersList(selectedRole);
        await fetchTopicsList(selectedStatus);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [selectedRole, selectedStatus]);

  const fetchUsersList = async (roleFilter) => {
    try {
      const params = roleFilter ? { role: roleFilter } : {};
      const res = await getUsers(params);
      setUsers(res.content || res);
    } catch (error) {
      console.error("Lỗi lấy danh sách người dùng:", error);
    }
  };

  const fetchTopicsList = async (statusFilter) => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getTopics(params);
      setTopics(res.content || res);
    } catch (error) {
      console.error("Lỗi lấy danh sách đề tài:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(userForm);
      alert("Tạo tài khoản thành công!");
      setIsUserModalOpen(false);
      setUserForm({ email: "", fullName: "", password: "", role: "STUDENT" });
      fetchUsersList(selectedRole);
    } catch (error) {
      console.error("Lỗi tạo user:", error.response?.data);
      alert(error.response?.data?.message || "Tạo tài khoản thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        topicCode: topicForm.topicCode.trim(),
        title: topicForm.title.trim(),
        description: topicForm.description.trim(),
        category: topicForm.category.trim(),
        status: topicForm.status,
      };

      await createTopic(payload);
      alert("Tạo đề tài thành công!");
      setIsTopicModalOpen(false);
      setTopicForm({
        topicCode: "",
        title: "",
        description: "",
        category: "",
        status: "PUBLISHED",
      });
      fetchTopicsList(selectedStatus);
    } catch (error) {
      console.error("Lỗi chi tiết khi tạo đề tài:", error.response?.data);
      const errorMsg =
        error.response?.data?.message ||
        "Tạo đề tài thất bại! Vui lòng kiểm tra lại các trường.";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm xử lý duyệt đề tài nhanh
  const handleApproveTopic = async (topic) => {
    try {
      await updateTopic(topic.id, {
        topicCode: topic.topicCode,
        title: topic.title,
        description: topic.description || "",
        category: topic.category,
        status: "PUBLISHED",
      });
      alert(`Đã duyệt đề tài ${topic.topicCode} thành công!`);
      fetchTopicsList(selectedStatus);
    } catch (error) {
      console.error("Lỗi duyệt đề tài:", error);
      alert("Duyệt đề tài thất bại!");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center text-xs text-[#6B635B]">
        Đang tải trang quản trị...
      </div>
    );
  }

  return (
    <MainLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
        
        {/* Header chung */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-50 text-[#E65100] rounded-full text-[11px] font-bold mb-2">
              <span>🛡️ Academic Admin Panel</span>
            </div>
            <h1 className="text-2xl font-black text-[#2C2825]">Quản lý Hệ thống Đồ Án</h1>
            <p className="text-xs text-[#6B635B] mt-0.5">Quản lý tài khoản, duyệt đề tài và ngân hàng câu hỏi.</p>
          </div>
        </div>

        {/* Nếu đang chọn xem câu hỏi của 1 đề tài thì hiển thị trang TopicQuestions kèm nút Quay lại */}
        {selectedTopicForQuestions ? (
          <div className="space-y-4">
            <button 
              onClick={() => setSelectedTopicForQuestions(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#2C2825] font-bold text-xs rounded-xl transition flex items-center space-x-2"
            >
              <span>← Quay lại danh sách đề tài</span>
            </button>
            
            <TopicQuestions 
              topicId={selectedTopicForQuestions.id} 
              topicTitle={selectedTopicForQuestions.title} 
            />
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex space-x-3 border-b border-[#E8E2D9] pb-3">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === "users" ? "bg-[#2C2825] text-white shadow-sm" : "bg-white text-[#6B635B] border border-[#E8E2D9]"
                }`}
              >
                Quản lý Người dùng
              </button>
              <button
                onClick={() => setActiveTab("topics")}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === "topics" ? "bg-[#2C2825] text-white shadow-sm" : "bg-white text-[#6B635B] border border-[#E8E2D9]"
                }`}
              >
                Quản lý & Duyệt Đề tài
              </button>
            </div>

            {/* --- TAB 1: QUẢN LÝ NGƯỜI DÙNG --- */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#6B635B] mr-2">Lọc vai trò:</span>
                    {["", "ADMIN", "INSTRUCTOR", "STUDENT", "GROUP_LEADER"].map((roleOption) => (
                      <button
                        key={roleOption}
                        onClick={() => setSelectedRole(roleOption)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                          selectedRole === roleOption ? "bg-[#E65100] text-white" : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9]"
                        }`}
                      >
                        {roleOption || "Tất cả"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsUserModalOpen(true)} className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-sm">
                    + Thêm tài khoản mới
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                        <th className="p-4 font-bold">Họ và tên</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Vai trò</th>
                        <th className="p-4 font-bold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FBF9F5]/60">
                          <td className="p-4 font-bold text-[#2C2825]">{u.fullName}</td>
                          <td className="p-4 text-[#6B635B]">{u.email}</td>
                          <td className="p-4"><span className="px-2.5 py-1 bg-orange-50 text-[#E65100] font-bold rounded-lg text-[10px]">{u.role}</span></td>
                          <td className="p-4"><span className="px-2.5 py-1 bg-green-50 text-green-600 font-bold rounded-lg text-[10px]">{u.status || "ACTIVE"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB 2: QUẢN LÝ & DUYỆT ĐỀ TÀI --- */}
            {activeTab === "topics" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#6B635B] mr-2">Lọc trạng thái:</span>
                    {["", "DRAFT", "PUBLISHED", "ARCHIVED"].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => setSelectedStatus(statusOption)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                          selectedStatus === statusOption ? "bg-[#E65100] text-white" : "bg-[#FBF9F5] text-[#6B635B] border border-[#E8E2D9]"
                        }`}
                      >
                        {statusOption || "Tất cả"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsTopicModalOpen(true)} className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-sm">
                    + Thêm đề tài mới
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                        <th className="p-4 font-bold">Mã đề tài</th>
                        <th className="p-4 font-bold">Tên đề tài</th>
                        <th className="p-4 font-bold">Thể loại</th>
                        <th className="p-4 font-bold">Trạng thái</th>
                        <th className="p-4 font-bold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {topics && topics.length > 0 ? (
                        topics.map((t) => (
                          <tr key={t.id} className="hover:bg-[#FBF9F5]/60">
                            <td className="p-4 font-bold text-[#2C2825]">{t.topicCode}</td>
                            <td className="p-4 text-[#2C2825] font-semibold">{t.title}</td>
                            <td className="p-4 text-[#6B635B]">{t.category}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                                t.status === "PUBLISHED" ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#E65100]"
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {/* Nút mở Ngân hàng câu hỏi */}
                              <button
                                onClick={() => setSelectedTopicForQuestions(t)}
                                className="px-3 py-1.5 bg-[#2C2825] hover:bg-black text-white font-bold rounded-xl text-[11px] transition shadow-sm"
                              >
                                ❓ Câu hỏi
                              </button>

                              {t.status !== "PUBLISHED" && (
                                <button
                                  onClick={() => handleApproveTopic(t)}
                                  className="px-3 py-1.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl text-[11px] transition shadow-sm"
                                >
                                  Duyệt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-[#6B635B]">Không tìm thấy đề tài nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal Tạo User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-[#E8E2D9] shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#F0EBE1]">
              <h3 className="font-black text-lg text-[#2C2825]">Tạo tài khoản hệ thống</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6B635B]">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Họ và tên</label>
                <input type="text" required value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="Nhập họ tên..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Email</label>
                <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="name@fpt.edu.vn" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Mật khẩu</label>
                <input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Vai trò</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl">
                  <option value="ADMIN">ADMIN</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-3 bg-gray-100 text-[#6B635B] text-xs font-bold rounded-xl">Hủy</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-xl">Xác nhận tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Đề Tài */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-[#E8E2D9] shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#F0EBE1]">
              <h3 className="font-black text-lg text-[#2C2825]">Thêm đề tài mới</h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6B635B]">✕</button>
            </div>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Mã đề tài (Topic Code)</label>
                <input type="text" required value={topicForm.topicCode} onChange={(e) => setTopicForm({ ...topicForm, topicCode: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="VD: TOPIC01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Tên đề tài</label>
                <input type="text" required value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="Nhập tên đề tài..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Mô tả</label>
                <textarea rows="2" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="Mô tả chi tiết đề tài..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Thể loại (Category)</label>
                <input type="text" required value={topicForm.category} onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl" placeholder="VD: Front-End, IoT, AI..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635B] mb-1">Trạng thái (Status)</label>
                <select value={topicForm.status} onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })} className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl">
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-5 py-3 bg-gray-100 text-[#6B635B] text-xs font-bold rounded-xl">Hủy</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-xl">Xác nhận tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminDashboard;