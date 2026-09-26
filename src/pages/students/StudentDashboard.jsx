import React, { useState, useEffect } from "react";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import ScheduleGroup from "./ScheduleGroup";
import ProgressGroup from "./ProgressGroup";
import DocumentGroup from "./DocumentGroup";
import CreateGroup from "./CreateGroup";
import Profile from "../../auth/Profile"; // <-- Import component Profile từ thư mục auth
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
          const isMember = detailedGroup?.members?.some(
            (m) =>
              m.userId === userRes.id ||
              m.userEmail === userRes.email ||
              m.id === userRes.id,
          );

          if (detailedGroup && isMember) {
            setGroupData(detailedGroup);
            setHasGroup(true);
            return;
          } else {
            localStorage.removeItem("groupId");
          }
        } catch (e) {
          localStorage.removeItem("groupId");
        }
      }

      if (userRes?.groupId) {
        const detailedGroup = await getGroupById(userRes.groupId).catch(
          () => null,
        );
        if (detailedGroup) {
          localStorage.setItem("groupId", userRes.groupId);
          setGroupData(detailedGroup);
          setHasGroup(true);
          return;
        }
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
            (m) =>
              m.userId === userRes.id ||
              m.userEmail === userRes.email ||
              m.id === userRes.id,
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
        localStorage.removeItem("groupId");
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
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-6">
          {/* Logo chuẩn "Lịch Đồ Án" */}
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

          {/* Card thông tin nhóm */}
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
                  ? `${groupData?.members?.length || 4}/6 người`
                  : "0/6 (Yêu cầu 4-6)"}
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

          {/* Menu Điều Hướng */}
          {hasGroup && (
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
                <span>Tổng quan</span>
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
                <span>Thành viên nhóm</span>
              </button>

              <button
                onClick={() => setActiveTab("schedule")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "schedule"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📅</span>
                <span>Lịch hẹn GVHD</span>
              </button>

              <button
                onClick={() => setActiveTab("progress")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "progress"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📈</span>
                <span>Tiến độ & Milestones</span>
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === "documents"
                    ? "bg-[#E65100] text-white shadow-md"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <span>📂</span>
                <span>Tài liệu & Báo cáo</span>
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

        {/* Footer Profile & Đăng xuất */}
        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center space-x-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-2xs">
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
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all duration-200 text-center shadow-2xs cursor-pointer"
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
              Spring 2026
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-bold text-[#2C2825]">Khoa K19 CNTT</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-[#FBF9F5] border border-[#E8E2D9] hover:bg-gray-100 text-[#2C2825] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <span>📖</span>
              <span>Hướng dẫn đồ án</span>
            </button>

            <div className="text-right hidden sm:block pl-2 border-l border-[#E8E2D9]">
              <p className="font-extrabold text-[#2C2825] text-xs">
                {currentUser?.fullName || "Đang tải..."}
              </p>
              <p className="text-[10px] text-[#6B635B]">{currentUser?.email}</p>
            </div>

            <span
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                !hasGroup
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : isLeader
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-orange-50 text-[#E65100] border border-orange-200"
              }`}
            >
              {!hasGroup
                ? "🎓 STUDENT"
                : isLeader
                  ? "👑 GROUP LEADER"
                  : "👤 MEMBER"}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {hasGroup ? (
            <>
              {activeTab === "overview" && <Overview groupData={groupData} />}
              {activeTab === "topics" && <Overview groupData={groupData} />}
              {activeTab === "members" && (
                <MemberGroup groupId={groupData?.id} isLeader={isLeader} />
              )}
              {activeTab === "schedule" && (
                <ScheduleGroup
                  groupId={groupData?.id}
                  topicId={groupData?.topicId || groupData?.topic?.id}
                />
              )}
              {activeTab === "progress" && (
                <ProgressGroup groupId={groupData?.id} />
              )}
              {activeTab === "documents" && (
                <DocumentGroup groupId={groupData?.id} />
              )}
              {activeTab === "settings" && <Profile />}{" "}
              {/* <-- Hiển thị component Profile tại đây */}
            </>
          ) : (
            <CreateGroup onGroupCreated={() => checkUserGroup()} />
          )}
        </div>
      </main>
    </div>
  );
}
