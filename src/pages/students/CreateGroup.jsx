import React, { useState, useEffect } from "react";
import {
  createGroup,
  getAllGroups,
  getGroupById,
  addGroupMember,
  joinGroup,
} from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";

export default function CreateGroup({ onGroupCreated }) {
  const [subTab, setSubTab] = useState("create");
  const [currentUser, setCurrentUser] = useState(null);

  // State cho form Tạo nhóm
  const [groupCode, setGroupCode] = useState("");
  const semesterOptions = ["Fall2026", "Spring2027", "Summer2027", "Fall2027"];
  const [semester, setSemester] = useState("Fall2026");
  const [topics, setTopics] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [topicId, setTopicId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  // State cho danh sách nhóm và tìm kiếm/lọc
  const [validGroups, setValidGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userRes = await getCurrentUser();
        setCurrentUser(userRes);

        const topicsRes = await api.get("/topics", {
          params: { page: 0, size: 50 },
        });
        setTopics(topicsRes.data.content || topicsRes.data || []);

        const usersRes = await api
          .get("/users", { params: { page: 0, size: 50 } })
          .catch(() => null);
        if (usersRes) {
          const userList = usersRes.data.content || usersRes.data || [];
          const instructorList = userList.filter(
            (u) =>
              u.role === "INSTRUCTOR" ||
              u.role === "TEACHER" ||
              u.role === "LECTURER",
          );
          setSupervisors(instructorList.length > 0 ? instructorList : userList);
        }

        const groupsRes = await getAllGroups();
        const groupList = groupsRes?.content || groupsRes || [];

        const detailedGroupsPromises = groupList.map(async (g) => {
          try {
            const detail = await getGroupById(g.id);
            return detail || g;
          } catch (err) {
            return g;
          }
        });

        const detailedGroups = await Promise.all(detailedGroupsPromises);
        // Cập nhật giới hạn tối đa < 6 thành viên theo chuẩn BR-GROUP-02
        setValidGroups(
          detailedGroups.filter((g) => (g.members ? g.members.length : 0) < 6),
        );
      } catch (error) {
        console.error("Lỗi tải dữ liệu ban đầu:", error);
      }
    };

    fetchInitialData();
  }, []);

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const groupPayload = {
        groupCode: groupCode.trim(),
        semester: semester.trim(),
        topicId: topicId ? topicId.trim() : null,
        supervisorId: supervisorId ? supervisorId.trim() : null,
      };

      const response = await createGroup(groupPayload);
      if (response && response.id) {
        localStorage.setItem("groupId", response.id);
      }
      alert("Tạo nhóm thành công! Bạn đã trở thành Trưởng nhóm.");
      if (onGroupCreated) onGroupCreated();
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      alert(
        error.response?.data?.message ||
          "Tạo nhóm thất bại! Vui lòng kiểm tra lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!window.confirm("Bạn có chắc chắn muốn tham gia nhóm này không?"))
      return;
    setJoiningId(groupId);
    try {
      await joinGroup(groupId);

      alert("Tham gia nhóm thành công!");
      localStorage.setItem("groupId", groupId);
      if (onGroupCreated) onGroupCreated();
    } catch (err) {
      console.error("Lỗi tham gia nhóm:", err);
      alert(err.response?.data?.message || "Không thể tham gia nhóm này.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const found = validGroups.find(
      (g) => g.groupCode.toLowerCase() === inviteCode.trim().toLowerCase(),
    );
    if (found) {
      handleJoinGroup(found.id);
    } else {
      alert("Không tìm thấy nhóm với mã mời này hoặc nhóm đã đầy!");
    }
  };

  // Lọc danh sách nhóm theo tìm kiếm và category
  const filteredGroups = validGroups.filter((g) => {
    const matchesSearch =
      g.groupCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.topicTitle &&
        g.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "Tất cả" || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isAlreadyLeader = currentUser?.role === "GROUP_LEADER";
  const categories = [
    "Tất cả",
    "Trí tuệ nhân tạo",
    "Công nghệ phần mềm",
    "An toàn thông tin",
  ];

  return (
    <main className="max-w-6xl mx-auto py-10 px-6 space-y-8 animate-fadeIn">
      {/* Header switcher */}
      <div className="flex justify-center">
        <div className="bg-[#F3EFEA] p-1.5 rounded-2xl max-w-md w-full grid grid-cols-2 gap-2 shadow-inner">
          <button
            type="button"
            onClick={() => setSubTab("create")}
            className={`py-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              subTab === "create"
                ? "bg-white text-[#2C2825] shadow-md scale-[1.02]"
                : "text-[#6B635B]"
            }`}
          >
            🚀 Tạo nhóm mới
          </button>
          <button
            type="button"
            onClick={() => setSubTab("join")}
            className={`py-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              subTab === "join"
                ? "bg-white text-[#2C2825] shadow-md scale-[1.02]"
                : "text-[#6B635B]"
            }`}
          >
            👥 Tham gia nhóm có sẵn
          </button>
        </div>
      </div>

      {subTab === "create" ? (
        isAlreadyLeader ? (
          <div className="max-w-xl mx-auto text-center py-12 space-y-3 bg-white rounded-3xl border border-[#E8E2D9] shadow-sm p-8">
            <p className="text-sm font-bold text-amber-600">
              Bạn đã là Trưởng nhóm của một nhóm khác!
            </p>
            <p className="text-xs text-[#6B635B]">
              Không thể khởi tạo thêm nhóm mới trong học kỳ này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
            <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-4xl border border-[#E8E2D9] shadow-lg shadow-stone-200/40">
              <form onSubmit={handleCreateGroupSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-[#2C2825] uppercase">
                      Mã nhóm *
                    </label>
                    <input
                      type="text"
                      value={groupCode}
                      onChange={(e) => setGroupCode(e.target.value)}
                      placeholder="VD: G2026-02"
                      required
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-[#2C2825] uppercase">
                      Học kỳ *
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                    >
                      {semesterOptions.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Chọn Đề tài
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  >
                    <option value="">
                      -- Chọn đề tài (Có thể đăng ký sau) --
                    </option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.topicCode ? `[${t.topicCode}] ` : ""}
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Giảng viên hướng dẫn
                  </label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  >
                    <option value="">
                      -- Chọn giảng viên (Có thể phân công sau) --
                    </option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName || s.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black tracking-wider uppercase rounded-xl shadow-md transition-all flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
                >
                  <span>
                    {loading ? "Đang xử lý..." : "Xác nhận tạo nhóm ngay"}
                  </span>
                  <span className="text-[10px] font-normal normal-case opacity-90">
                    (Khi tạo nhóm, bạn sẽ trở thành Trưởng nhóm)
                  </span>
                </button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-4xl border border-[#E8E2D9] shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-[#E65100] font-black text-xs uppercase">
                  <span>💡</span>
                  <span>Lưu ý quan trọng</span>
                </div>
                <ul className="space-y-2 text-[11px] text-[#6B635B] list-disc pl-4 leading-relaxed">
                  <li>
                    Mỗi sinh viên chỉ được tham gia duy nhất 01 nhóm trong học
                    kỳ.
                  </li>
                  <li>Số lượng thành viên theo quy chế từ 4 đến 6 người.</li>
                  <li>
                    Sau khi tạo nhóm, bạn có thể thêm/xóa thành viên thủ công.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      ) : (
        /* GIAO DIỆN THAM GIA NHÓM */
        <div className="space-y-8">
          {/* Hộp nhập mã mời nhanh */}
          <div className="bg-white p-8 rounded-4xl border border-[#E8E2D9] shadow-sm max-w-4xl mx-auto space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#E65100] flex items-center justify-center font-black">
                🔑
              </div>
              <div>
                <h3 className="text-sm font-black text-[#2C2825]">
                  Tham gia bằng Mã nhóm / Mã mời
                </h3>
                <p className="text-xs text-[#6B635B]">
                  Nhập mã nhóm từ Trưởng nhóm để gia nhập ngay lập tức.
                </p>
              </div>
            </div>
            <form onSubmit={handleJoinByCode} className="flex gap-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Nhập mã nhóm (VD: G2026-01)..."
                className="flex-1 px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Tham gia ngay →
              </button>
            </form>
          </div>

          {/* Danh sách nhóm đang tìm kiếm thành viên */}
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-[#2C2825]">
                  Danh sách nhóm trống ({filteredGroups.length} nhóm)
                </h3>
                <p className="text-xs text-[#6B635B]">
                  Chọn nhóm phù hợp và bấm tham gia để vào nhóm ngay.
                </p>
              </div>
              <div className="w-full md:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Tìm theo mã nhóm, đề tài..."
                  className="w-full px-4 py-2.5 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            {/* Bộ lọc Thể loại */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#2C2825] text-white shadow-sm"
                      : "bg-white text-[#6B635B] border border-[#E8E2D9]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Khung chứa Grid Card Nhóm */}
            {filteredGroups.length > 0 ? (
              <div className="max-h-130 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((g) => {
                    const memberCount = g.members ? g.members.length : 0;
                    const slotsLeft = 6 - memberCount; // Tính số chỗ trống dựa trên tối đa 6 người
                    return (
                      <div
                        key={g.id}
                        className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[10px] font-black rounded-lg">
                              {g.groupCode}
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg">
                              Còn {slotsLeft} chỗ
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#2C2825] line-clamp-2">
                              {g.topicTitle || "Đề tài chưa cập nhật"}
                            </h4>
                            <p className="text-[11px] text-[#6B635B] mt-1">
                              GVHD:{" "}
                              <strong className="text-[#2C2825]">
                                {g.supervisorName || "Chưa phân công"}
                              </strong>
                            </p>
                          </div>
                          <div className="text-[11px] text-[#6B635B] pt-2 border-t border-[#F0EBE1]">
                            <span>Thành viên hiện tại: </span>
                            <strong className="text-[#2C2825]">
                              {memberCount}/6 người
                            </strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinGroup(g.id)}
                          disabled={joiningId === g.id}
                          className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                        >
                          {joiningId === g.id
                            ? "Đang xử lý..."
                            : "Tham gia ngay"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D9] space-y-2">
                <p className="text-xs font-bold text-[#2C2825]">
                  Không tìm thấy nhóm phù hợp
                </p>
                <p className="text-[11px] text-[#6B635B]">
                  Thử thay đổi từ khóa tìm kiếm hoặc tự tạo nhóm mới cho riêng
                  bạn.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}