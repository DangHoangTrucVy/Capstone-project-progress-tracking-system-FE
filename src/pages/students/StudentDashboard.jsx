import React, { useState, useEffect } from "react";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import ScheduleGroup from "./ScheduleGroup";
import ProgressGroup from "./ProgressGroup";
import DocumentGroup from "./DocumentGroup";
import CreateGroup from "./CreateGroup";
import { getAllGroups, getGroupById } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function StudentDashboard() {
  const [hasGroup, setHasGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupData, setGroupData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const checkUserGroup = async () => {
    try {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes);

      const savedGroupId = localStorage.getItem("groupId");
      if (savedGroupId) {
        try {
          const detailedGroup = await getGroupById(savedGroupId);
          if (detailedGroup) {
            setGroupData(detailedGroup);
            setHasGroup(true);
            return;
          }
        } catch (e) {
          localStorage.removeItem("groupId");
        }
      }

      if (userRes?.groupId) {
        localStorage.setItem("groupId", userRes.groupId);
        const detailedGroup = await getGroupById(userRes.groupId);
        setGroupData(detailedGroup);
        setHasGroup(true);
        return;
      }

      const groupsRes = await getAllGroups();
      const groupList = groupsRes?.content || groupsRes || [];

      let foundGroup = null;
      for (const g of groupList) {
        const detail = await getGroupById(g.id).catch(() => null);
        if (
          detail &&
          detail.members &&
          detail.members.some(
            (m) => m.userId === userRes.id || m.userEmail === userRes.email,
          )
        ) {
          foundGroup = detail;
          break;
        }
      }

      if (foundGroup) {
        localStorage.setItem("groupId", foundGroup.id);
        setGroupData(foundGroup);
        setHasGroup(true);
      } else {
        setHasGroup(false);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] text-xs font-bold">
        Đang kiểm tra thông tin nhóm...
      </div>
    );
  }

  const currentMemberInfo = groupData?.members?.find(
    (m) => m.userId === currentUser?.id || m.userEmail === currentUser?.email,
  );

  const isLeader =
    currentUser?.role === "GROUP_LEADER" ||
    (currentMemberInfo ? currentMemberInfo.isLeader : false);

  const getInitials = (name) => {
    if (!name) return "SV";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans ">
      {/* Sidebar luôn hiển thị cho sinh viên */}
      <aside className="w-72  bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#E65100] rounded-xl flex items-center justify-center text-white font-black shadow-md">
              📦
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

          <div className="bg-[#F8F6F0] p-4 rounded-2xl border border-[#E8E2D9] space-y-2">
            <h3 className="text-xs font-black text-[#2C2825]">
              {hasGroup
                ? groupData?.topicTitle || "Đề tài đồ án nhóm"
                : "Chưa tham gia nhóm"}
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              {hasGroup
                ? `${groupData?.groupCode} • ${groupData?.members?.length || 0}/5 thành viên`
                : "Vui lòng tạo hoặc tham gia nhóm"}
            </p>
            <div
              className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                !hasGroup
                  ? "bg-amber-100 text-amber-700"
                  : isLeader
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-[#E65100]"
              }`}
            >
              {!hasGroup
                ? "Chưa có nhóm"
                : isLeader
                  ? "Trưởng nhóm (Leader)"
                  : "Thành viên"}
            </div>
          </div>

          {hasGroup && (
            <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "overview"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📊</span>
                <span>Tổng quan</span>
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "members"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>👥</span>
                <span>Thành viên nhóm</span>
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "schedule"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📅</span>
                <span>Lịch hẹn</span>
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "progress"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📈</span>
                <span>Tiến độ đồ án</span>
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  activeTab === "documents"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📂</span>
                <span>Tài liệu</span>
              </button>
            </nav>
          )}
        </div>

        <div className="pt-6 border-t border-[#E8E2D9] space-y-4">
          <div className="flex items-center space-x-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs">
                {getInitials(currentUser?.fullName)}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate">
                {currentUser?.fullName || "Đang tải..."}
              </h4>
              <p className="text-[10px] text-[#6B635B] truncate">
                {currentUser?.email}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white border-b border-[#E8E2D9] px-10 md:px-12 flex justify-between items-center text-xs">
          {/* Phần bên trái: Tiêu đề trang rộng rãi hơn */}
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-[#E65100] rounded-full animate-pulse shrink-0"></div>
            <div className="space-y-0.5">
              <h2 className="text-sm md:text-base font-black text-[#2C2825] uppercase tracking-wider">
                {hasGroup ? activeTab : "Quản lý nhóm đồ án"}
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                {hasGroup
                  ? `Hệ thống quản lý tiến độ đồ án • Học kỳ ${groupData?.semester || "Spring2026"}`
                  : "Vui lòng tạo nhóm mới hoặc tham gia nhóm có sẵn để bắt đầu thực hiện đồ án"}
              </p>
            </div>
          </div>

          {/* Phần bên phải: Thông tin user & Badge Role */}
          <div className="flex items-center space-x-5">
            <div className="text-right hidden sm:block">
              <p className="font-extrabold text-[#2C2825] text-sm">
                {currentUser?.fullName || "Đang tải..."}
              </p>
              <p className="text-[11px] text-[#6B635B]">{currentUser?.email}</p>
            </div>

            {/* Huy hiệu hiển thị Role */}
            <span
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-xs ${
                !hasGroup
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : isLeader
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-orange-50 text-[#E65100] border border-orange-200"
              }`}
            >
              {!hasGroup
                ? "🎓 Student"
                : isLeader
                  ? "👑 Group Leader"
                  : "👤 Member"}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {hasGroup ? (
            <>
              {activeTab === "overview" && <Overview groupData={groupData} />}
              {activeTab === "members" && (
                <MemberGroup groupId={groupData?.id} isLeader={isLeader} />
              )}
              {activeTab === "schedule" && (
                <ScheduleGroup groupId={groupData?.id} />
              )}
              {activeTab === "progress" && (
                <ProgressGroup groupId={groupData?.id} />
              )}
              {activeTab === "documents" && (
                <DocumentGroup groupId={groupData?.id} />
              )}
            </>
          ) : (
            // Nếu chưa có nhóm, hiển thị giao diện Tạo nhóm / Join nhóm ngay trong khung Dashboard
            <CreateGroup onGroupCreated={() => checkUserGroup()} />
          )}
        </div>
      </main>
    </div>
  );
}
