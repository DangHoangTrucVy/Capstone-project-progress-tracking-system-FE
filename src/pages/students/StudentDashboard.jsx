import React, { useState, useEffect } from "react";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import ScheduleGroup from "./ScheduleGroup";
import ProgressGroup from "./ProgressGroup";
import DocumentGroup from "./DocumentGroup";
import JoinGroup from "./JoinGroup";
import { getAllGroups, getGroupById } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function StudentDashboard() {
  const [hasGroup, setHasGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupData, setGroupData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Đoạn logic check trong StudentDashboard.jsx
  const checkUserGroup = async () => {
    try {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes);

      // 1. Kiểm tra nhanh trong localStorage
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
          // Nếu id lưu trong localStorage không hợp lệ thì xóa đi để quét lại
          localStorage.removeItem("groupId");
        }
      }

      // 2. Kiểm tra nếu object user trả về từ /auth/me đã chứa thông tin nhóm (ví dụ: userRes.groupId hoặc userRes.group)
      if (userRes?.groupId) {
        localStorage.setItem("groupId", userRes.groupId);
        const detailedGroup = await getGroupById(userRes.groupId);
        setGroupData(detailedGroup);
        setHasGroup(true);
        return;
      }

      // 3. Nếu không có sẵn, tiến hành quét danh sách nhóm
      const groupsRes = await getAllGroups();
      const groupList = groupsRes?.content || groupsRes || [];

      // Tìm nhóm mà user đang tham gia bằng cách gọi chi tiết hoặc so sánh an toàn hơn
      let foundGroup = null;
      for (const g of groupList) {
        // Nếu API trả về danh sách members cơ bản hoặc cần fetch chi tiết
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

  if (!hasGroup) {
    return <JoinGroup onJoined={() => checkUserGroup()} />;
  }

  const currentMemberInfo = groupData?.members?.find(
    (m) => m.userId === currentUser?.id || m.userEmail === currentUser?.email,
  );
  const isLeader = currentMemberInfo ? currentMemberInfo.isLeader : false;

  const getInitials = (name) => {
    if (!name) return "SV";
    const words = name.trim().split(" ");
    return words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans">
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0">
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
              {groupData?.topicTitle || "Đề tài đồ án nhóm"}
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              {groupData?.groupCode} • {groupData?.members?.length || 0}/5 thành
              viên
            </p>
            <div
              className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md ${isLeader ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-[#E65100]"}`}
            >
              {isLeader ? "Trưởng nhóm (Leader)" : "Thành viên"}
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "overview" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>📊</span>
              <span>Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "members" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>👥</span>
              <span>Thành viên nhóm</span>
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "schedule" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>📅</span>
              <span>Lịch hẹn</span>
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "progress" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>📈</span>
              <span>Tiến độ đồ án</span>
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "documents" ? "bg-[#E65100] text-white shadow-md" : "hover:bg-[#F8F6F0]"}`}
            >
              <span>📂</span>
              <span>Tài liệu</span>
            </button>
          </nav>
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

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs font-semibold text-[#6B635B]">
          <span>Lịch Đồ Án — {activeTab.toUpperCase()}</span>
          <span className="text-orange-600 font-bold">
            Xin chào, {currentUser?.fullName} ({isLeader ? "Leader" : "Member"})
          </span>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
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
        </div>
      </main>
    </div>
  );
}
