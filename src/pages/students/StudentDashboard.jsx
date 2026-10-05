import React, { useState, useEffect } from "react";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import CreateGroup from "./CreateGroup";
import StudentProfileAndApply from "./StudentProfileAndApply";
import GroupApplications from "./GroupApplications";
import GroupManagementPanel from "./GroupManagementPanel";
import Profile from "../../auth/Profile";
import { getAllGroups, getGroupById } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hasGroup, setHasGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupData, setGroupData] = useState(null);

  const checkUserGroup = async () => {
    try {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes);

      // 1. Quét ngay danh sách nhóm từ API để lấy chính xác ID và groupCode
      try {
        const groupsRes = await getAllGroups();
        const groupList = groupsRes?.content || groupsRes || [];
        
        if (groupList.length > 0) {
          // Tìm nhóm do user làm leader hoặc user là thành viên, nếu không thấy và là leader thì lấy nhóm đầu tiên
          let targetGroup = groupList.find(g => 
            g.leaderId === userRes?.id || 
            g.leader?.id === userRes?.id || 
            g.leader?.email === userRes?.email ||
            g.leaderEmail === userRes?.email ||
            (g.members && g.members.some(m => m.userId === userRes?.id || m.id === userRes?.id || m.email === userRes?.email))
          );

          if (!targetGroup && ["LEADER", "GROUP_LEADER"].includes(userRes?.role)) {
            targetGroup = groupList[0]; // Lấy nhóm đầu tiên có sẵn trên hệ thống (ví dụ: SWD392)
          }

          if (targetGroup && targetGroup.id) {
            localStorage.setItem("groupId", targetGroup.id);
            // Sửa lại: Phải gọi getGroupById để lấy đầy đủ danh sách members chi tiết
            const detailed = await getGroupById(targetGroup.id).catch(() => targetGroup);
            setGroupData(detailed);
            setHasGroup(true);
            return;
          }
        }
      } catch (err) {
        console.warn("Không thể quét danh sách nhóm:", err);
      }

      setHasGroup(false);
    } catch (err) {
      console.warn("Lỗi kiểm tra nhóm:", err);
      setHasGroup(false);
    }
  };

  useEffect(() => {
    checkUserGroup();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (hasGroup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] text-xs font-bold text-[#6B635B]">
        Đang kiểm tra thông tin nhóm đồ án...
      </div>
    );
  }

  const currentMemberInfo = groupData?.members?.find(
    (m) =>
      m.userId === currentUser?.id ||
      m.userEmail === currentUser?.email ||
      m.id === currentUser?.id,
  );

  const isLeader =
    ["LEADER", "GROUP_LEADER"].includes(currentUser?.role) ||
    (currentMemberInfo ? currentMemberInfo.isLeader : false);
  const groupMemberCount = groupData?.members?.length ?? 0;
  const isValidTeamSize = groupMemberCount >= 3 && groupMemberCount <= 5;

  const getInitials = (name) => {
    if (!name) return "SV";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              <div className="w-4 h-4 border-2 border-white rounded-lg flex items-center justify-center text-[9px]">
                ✓
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-[#2C2825]">
                Lịch Đồ Án
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Khoa Công nghệ thông tin
              </p>
            </div>
          </div>

          <div className="bg-[#F8F6F0] p-4 rounded-2xl border border-[#E8E2D9] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">Mã nhóm:</span>
              <span className="font-black text-[#E65100]">
                {hasGroup ? groupData?.groupCode || "SE-GROUP" : "Chưa có"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">Thành viên:</span>
              <span className="font-bold text-[#2C2825]">
                {hasGroup
                  ? `${groupMemberCount}/5 người`
                  : "0/5 (Cần 3–5 người)"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E8E2D9] flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">Chức vụ:</span>
              <span
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                  !hasGroup
                    ? "bg-amber-100 text-amber-700"
                    : isLeader
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-[#E65100]"
                }`}
              >
                {!hasGroup
                  ? "Chưa tham gia"
                  : isLeader
                    ? "👑 Leader"
                    : "👤 Member"}
              </span>
            </div>
          </div>

          {hasGroup || isLeader ?(
            <nav className="space-y-1 text-xs font-bold text-[#6B635B]">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📊</span>
                <span>Tổng quan nhóm</span>
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "members"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>👥</span>
                <span>Thành viên nhóm (3–5 người)</span>
              </button>

              {isLeader && (
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                    activeTab === "applications"
                      ? "bg-[#E65100] text-white shadow-md"
                      : "hover:bg-[#F8F6F0]"
                  }`}
                >
                  <span>📝</span>
                  <span>Xét duyệt đơn Apply</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("management")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "management"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>🔒</span>
                <span>Quản lý trạng thái & Rời nhóm</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>⚙️</span>
                <span>Hồ sơ cá nhân</span>
              </button>
            </nav>
          ) : (
            <nav className="space-y-1 text-xs font-bold text-[#6B635B]">
              <button
                onClick={() => setActiveTab("create")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "create"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>🚀</span>
                <span>Tạo / Tìm nhóm & Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>⚙️</span>
                <span>Hồ sơ cá nhân</span>
              </button>
            </nav>
          )}
        </div>

        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
                {getInitials(currentUser?.fullName)}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate text-[#2C2825]">
                {currentUser?.fullName || "Đang tải..."}
              </h4>
              <p className="text-[10px] text-[#6B635B] truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all duration-200 text-center cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH BÊN PHẢI */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white border-b border-[#E8E2D9] px-10 flex justify-between items-center text-xs shrink-0">
          <div className="flex items-center space-x-4">
            <span className="font-extrabold text-[#E65100] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
              Đợt Lập Nhóm Đầu Kỳ
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-bold text-[#2C2825]">
              Khoa CNTT - Đại học FPT
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block pl-2 border-l border-[#E8E2D9]">
              <p className="font-extrabold text-[#2C2825] text-xs">
                {currentUser?.fullName || "Đang tải..."}
              </p>
              <p className="text-[10px] text-[#6B635B]">{currentUser?.email}</p>
            </div>

            <span
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                !hasGroup
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : isLeader
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-orange-50 text-[#E65100] border border-orange-200"
              }`}
            >
              {!hasGroup ? "🎓 STUDENT" : isLeader ? "👑 LEADER" : "👤 MEMBER"}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {hasGroup || isLeader ? (
            <>
              {/* Nếu là Leader nhưng chưa có groupData (chưa có nhóm chính thức), ta khởi tạo groupData giả lập hoặc hiển thị giao diện quản lý Leader */}
              {/* Banner cảnh báo sĩ số nhóm */}
              <div
                className={`mb-6 rounded-3xl border p-5 shadow-sm ${isValidTeamSize ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" : "bg-amber-50/60 border-amber-200 text-amber-900"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">
                      Trạng thái sĩ số nhóm
                    </p>
                    <h2 className="mt-1 text-sm font-black">
                      {isValidTeamSize
                        ? `Nhóm đã đạt sĩ số hợp lệ (${groupMemberCount}/5 thành viên)`
                        : `Nhóm hiện có ${groupMemberCount}/5 thành viên (Yêu cầu tối thiểu 3 thành viên)`}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-xl ${isValidTeamSize ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}
                  >
                    {isValidTeamSize
                      ? "✓ Đạt chuẩn"
                      : "⚠️ Cần bổ sung thành viên"}
                  </span>
                </div>
              </div>

              {activeTab === "overview" && (
                <Overview
                  groupData={groupData}
                  onGroupUpdated={checkUserGroup}
                  isLeader={isLeader}
                />
              )}
              {activeTab === "members" && (
                <MemberGroup
                  groupId={groupData?.id}
                  isLeader={isLeader}
                  onGroupUpdated={checkUserGroup}
                />
              )}
              {activeTab === "applications" && isLeader && (
                <GroupApplications groupId={groupData?.id} />
              )}
              {activeTab === "management" && (
                <GroupManagementPanel
                  groupData={groupData}
                  isLeader={isLeader}
                  onGroupUpdated={checkUserGroup}
                />
              )}
              {activeTab === "settings" && <Profile />}
            </>
          ) : (
            // Giao diện cho sinh viên thường chưa có nhóm...
            <>
              {activeTab === "settings" ? (
                <Profile />
              ) : (
                <div className="space-y-6">
                  {/* Tab chuyển đổi cho sinh viên chưa có nhóm: gom thành 3 mục trên 1 dòng */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-[#F3EFEA] p-1.5 rounded-2xl max-w-2xl w-full grid grid-cols-2 gap-2 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setActiveTab("create")}
                        className={`py-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                          activeTab === "create"
                            ? "bg-white text-[#2C2825] shadow-md"
                            : "text-[#6B635B]"
                        }`}
                      >
                        🚀 Tạo nhóm mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile_apply")}
                        className={`py-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                          activeTab === "profile_apply"
                            ? "bg-white text-[#2C2825] shadow-md"
                            : "text-[#6B635B]"
                        }`}
                      >
                        📝 Profile & Apply nhóm
                      </button>
                   
                    </div>
                  </div>

                  {activeTab === "profile_apply" ? (
                    <StudentProfileAndApply
                      onJoinedGroup={() => checkUserGroup()}
                    />
                  ) : (
                    <CreateGroup onGroupCreated={() => checkUserGroup()} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
