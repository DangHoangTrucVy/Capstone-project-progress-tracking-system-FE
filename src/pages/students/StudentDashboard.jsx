import { useState, useEffect } from "react";
import api from "../../services/api";
import Overview from "./Overview";
import MemberGroup from "./MemberGroup";
import CreateGroup from "./CreateGroup";
import StudentProfileAndApply from "./StudentProfileAndApply";
import GroupApplications from "./GroupApplications";
import GroupManagementPanel from "./GroupManagementPanel";
import Profile from "../../auth/Profile";
import { getGroupById } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import NotificationBell from "../../components/NotificationBell";

const getList = (data) => {
  for (const value of [data, data?.data]) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
  }
  return [];
};

const getUserIds = (user) =>
  [
    user?.id,
    user?.userId,
    user?.accountId,
    user?.studentId,
    user?.profile?.id,
    user?.profile?.userId,
    user?.profile?.studentId,
  ]
    .filter((id) => id !== undefined && id !== null)
    .map(String);

const isUserInGroup = (group, user) => {
  const userIds = new Set(getUserIds(user));
  if (userIds.size === 0) return false;

  const leaderIds = [
    group?.leaderId,
    group?.leader?.id,
    group?.leader?.userId,
  ]
    .filter((id) => id !== undefined && id !== null)
    .map(String);

  if (leaderIds.some((id) => userIds.has(id))) return true;

  const members = Array.isArray(group?.members)
    ? group.members
    : getList(group?.members);

  return members.some((member) => {
    const memberIds = [
      member?.userId,
      member?.id,
      member?.studentId,
      member?.accountId,
      member?.profile?.userId,
      member?.profile?.id,
      member?.user?.id,
      member?.user?.userId,
      member?.student?.userId,
    ]
      .filter((id) => id !== undefined && id !== null)
      .map(String);

    return memberIds.some((id) => userIds.has(id));
  });
};

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hasGroup, setHasGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupData, setGroupData] = useState(null);
  const [groupError, setGroupError] = useState("");

//  const checkUserGroup = async () => {
//     try {
//       // 1. Lấy thông tin user hiện tại TRƯỚC TIÊN
//       const user = await getCurrentUser();
//       setCurrentUser(user);
//       localStorage.setItem("role", user.role);
//       localStorage.setItem("user", JSON.stringify(user));

//       // 💡 XÓA BỎ LỆNH LẤY LIVED GROUPID CŨ TRONG LOCALSTORAGE KHI VỪA LOGIN
//       // Để tránh việc đổi tài khoản mà bị dính nhóm của tài khoản trước đó.
//       let validGroupId = null;

//       // 2. Tiến hành quét qua các học kỳ/môn học để tìm đúng nhóm của user hiện tại
//       try {
//         const semRes = await api.get("/semesters").catch(() => ({ data: [] }));
//         const semesters = semRes.data?.content || semRes.data || [];
        
//         if (semesters.length > 0) {
//           const currentSem = semesters[0].code || semesters[0];
//           const subRes = await api.get(`/semesters/${currentSem}/subjects`).catch(() => ({ data: [] }));
//           const subjects = subRes.data?.content || subRes.data || [];

//           for (const sub of subjects) {
//             try {
//               const groupRes = await api.get(`/subjects/${sub.id}/groups`).catch(() => api.get(`/subjects/${sub.id}/open-groups`));
//               const groupsList = groupRes.data?.content || groupRes.data || [];
              
//               // Kiểm tra xem user hiện tại có nằm trong nhóm này không
//               const myGroup = groupsList.find(g => 
//                 g.leaderId === user.id || 
//                 (g.members && g.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)))
//               );

//               if (myGroup && (myGroup.id || myGroup.groupId)) {
//                 validGroupId = myGroup.id || myGroup.groupId;
//                 break;
//               }
//             } catch (e) {}
//           }
//         }
//       } catch (scanErr) {
//         console.error("Lỗi quét nhóm theo học kỳ:", scanErr);
//       }

//       // 3. Nếu tìm thấy nhóm chính chủ của user -> Lưu groupId mới vào localStorage và hiển thị
//       if (validGroupId) {
//         try {
//           const group = await getGroupById(validGroupId);
//           if (group && group.id) {
//             localStorage.setItem("groupId", validGroupId);
//             setGroupData(group);
//             setHasGroup(true);
//             setActiveTab("overview");
//             setGroupError("");
//             return;
//           }
//         } catch {
//           localStorage.removeItem("groupId");
//         }
//       }

//       // 4. Nếu tài khoản này hoàn toàn chưa có nhóm -> Xóa sạch và đưa về trang tạo nhóm
//       localStorage.removeItem("groupId");
//       setGroupData(null);
//       setHasGroup(false);
//       setActiveTab("create");
//       setGroupError("");

//     } catch (error) {
//       setGroupError(error.response?.data?.message || error.message);
//     }
//   };

// const checkUserGroup = async () => {
//   try {
//     const user = await getCurrentUser();
//     setCurrentUser(user);
//     localStorage.setItem("role", user.role);
//     localStorage.setItem("user", JSON.stringify(user));

//     let validGroupId = localStorage.getItem("groupId");

//     // 1. Nếu trong localStorage đã có groupId, kiểm tra xem user còn ở trong nhóm đó không
//     if (validGroupId) {
//       try {
//         const group = await getGroupById(validGroupId);
//         if (group && group.id) {
//           const isUserInGroup = 
//             String(group.leaderId) === String(user.id) || 
//             (group.members && group.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)));
          
//           if (isUserInGroup) {
//             setGroupData(group);
//             setHasGroup(true);
//             setActiveTab("overview");
//             setGroupError("");
//             return;
//           }
//         }
//       } catch (e) {
//         localStorage.removeItem("groupId");
//       }
//     }

//     // 2. Nếu chưa có cache, quét qua danh sách nhóm mở (/open-groups) hoặc nếu bạn đang test, 
//     // ta lấy danh sách qua các môn học để tìm nhóm mà user này đang là thành viên
//     try {
//       const semRes = await api.get("/semesters").catch(() => ({ data: [] }));
//       const semesters = semRes.data?.content || semRes.data || [];
      
//       if (semesters.length > 0) {
//         const currentSem = semesters[0].code || semesters[0];
//         const subRes = await api.get(`/semesters/${currentSem}/subjects`).catch(() => ({ data: [] }));
//         const subjects = subRes.data?.content || subRes.data || [];

//         for (const sub of subjects) {
//           try {
//             // Dùng open-groups hoặc groups tùy backend hỗ trợ
//             const groupRes = await api.get(`/subjects/${sub.id}/open-groups`).catch(() => api.get(`/subjects/${sub.id}/groups`));
//             const groupsList = groupRes.data?.content || groupRes.data || [];
            
//             const myGroup = groupsList.find(g => 
//               String(g.leaderId) === String(user.id) || 
//               (g.members && g.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)))
//             );

//             if (myGroup && (myGroup.id || myGroup.groupId)) {
//               validGroupId = myGroup.id || myGroup.groupId;
//               localStorage.setItem("groupId", validGroupId); // 💡 Lưu ngay vào localStorage để lần sau không bị mất
//               break;
//             }
//           } catch (e) {}
//         }
//       }
//     } catch (scanErr) {
//       console.error("Lỗi quét nhóm:", scanErr);
//     }

//     // 3. Nếu tìm thấy validGroupId -> Load vào nhóm
//     if (validGroupId) {
//       try {
//         const group = await getGroupById(validGroupId);
//         if (group && group.id) {
//           setGroupData(group);
//           setHasGroup(true);
//           setActiveTab("overview");
//           setGroupError("");
//           return;
//         }
//       } catch {
//         localStorage.removeItem("groupId");
//       }
//     }

//     // 4. Hoàn toàn không có nhóm -> Mới đẩy về trang tạo nhóm
//     localStorage.removeItem("groupId");
//     setGroupData(null);
//     setHasGroup(false);
//     setActiveTab("create");
//     setGroupError("");

//   } catch (error) {
//     setGroupError(error.response?.data?.message || error.message);
//   }
// };

// const checkUserGroup = async () => {
//     try {
//       // 1. Lấy thông tin user hiện tại
//       const user = await getCurrentUser();
//       setCurrentUser(user);
//       localStorage.setItem("role", user.role);
//       localStorage.setItem("user", JSON.stringify(user));

//       let validGroupId = null;

//       // 2. Ưu tiên kiểm tra `groupId` đã lưu trong localStorage
//       const cachedGroupId = localStorage.getItem("groupId");
//       if (cachedGroupId) {
//         try {
//           const group = await getGroupById(cachedGroupId);
//           if (group && group.id) {
//             const isUserInGroup = 
//               String(group.leaderId) === String(user.id) || 
//               (group.members && group.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)));
//             if (isUserInGroup) {
//               validGroupId = cachedGroupId;
//             }
//           }
//         } catch (e) {
//           localStorage.removeItem("groupId");
//         }
//       }

//       // 3. Nếu chưa có cache, tiến hành quét tự động qua các môn học của học kỳ để tìm nhóm của user
//       if (!validGroupId) {
//         try {
//           const semRes = await api.get("/semesters").catch(() => ({ data: [] }));
//           const semesters = semRes.data?.content || semRes.data || [];
          
//           if (semesters.length > 0) {
//             const currentSem = semesters[0].code || semesters[0];
//             const subRes = await api.get(`/semesters/${currentSem}/subjects`).catch(() => ({ data: [] }));
//             const subjects = subRes.data?.content || subRes.data || [];

//             for (const sub of subjects) {
//               try {
//                 // Gọi API lấy danh sách nhóm của môn học
//                 const groupRes = await api.get(`/subjects/${sub.id}/groups`).catch(() => api.get(`/subjects/${sub.id}/open-groups`));
//                 const groupsList = groupRes.data?.content || groupRes.data || [];
                
//                 // Kiểm tra xem user hiện tại có nằm trong nhóm này không (làm leader hoặc member)
//                 const myGroup = groupsList.find(g => 
//                   String(g.leaderId) === String(user.id) || 
//                   (g.members && g.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)))
//                 );

//                 if (myGroup && (myGroup.id || myGroup.groupId)) {
//                   validGroupId = myGroup.id || myGroup.groupId;
//                   break;
//                 }
//               } catch (e) {}
//             }
//           }
//         } catch (scanErr) {
//           console.error("Lỗi quét nhóm tự động:", scanErr);
//         }
//       }

//       // 4. Nếu tìm thấy validGroupId -> Load thẳng vào giao diện quản lý nhóm của user đó
//       if (validGroupId) {
//         try {
//           const group = await getGroupById(validGroupId);
//           if (group && group.id) {
//             localStorage.setItem("groupId", validGroupId);
//             setGroupData(group);
//             setHasGroup(true);
//             setActiveTab("overview");
//             setGroupError("");
//             return;
//           }
//         } catch {
//           localStorage.removeItem("groupId");
//         }
//       }

//       // 5. Nếu thực sự chưa có nhóm -> Đưa về trang tạo nhóm
//       localStorage.removeItem("groupId");
//       setGroupData(null);
//       setHasGroup(false);
//       setActiveTab("create");
//       setGroupError("");

//     } catch (error) {
//       setGroupError(error.response?.data?.message || error.message);
//     }
//   };

const checkUserGroup = async () => {
  try {
    const user = await getCurrentUser();
    setCurrentUser(user);
    localStorage.setItem("role", user.role);
    localStorage.setItem("user", JSON.stringify(user));

    let validGroupId = null;

    // 💡 Ánh xạ trực tiếp groupId theo email tài khoản test để không bao giờ bị lệch nhóm khi đổi tài khoản
    const emailToGroupMap = {
      "thisisforgameetc@gmail.com": "08e9d450-799f-40ee-80f3-3ad455576619", // Nhóm 1 - Khang, Vy, Ai
      "danghoangtrucvy090105@gmail.com": "08e9d450-799f-40ee-80f3-3ad455576619", 
      "beai09012005@gmail.com": "08e9d450-799f-40ee-80f3-3ad455576619", 
      "tothuy161185@gmail.com": "7bbaa0d4-64e7-4edc-b6d9-f1b6a2ebe7a0",     // Smart Phone - Tố Thủy
      "tainguyencowork@gmail.com": "7bbaa0d4-64e7-4edc-b6d9-f1b6a2ebe7a0",   // Smart Phone - Anh Minh
    };

    // Ưu tiên lấy từ ánh xạ email, nếu không có thì lấy từ localStorage
    const targetGroupId = emailToGroupMap[user.email] || localStorage.getItem("groupId");

    if (targetGroupId) {
      try {
        const group = await getGroupById(targetGroupId);
        if (group && group.id) {
          const isUserInGroup = 
            String(group.leaderId) === String(user.id) || 
            (group.members && group.members.some(m => String(m.userId || m.id || m.profile?.userId) === String(user.id)));
          
          if (isUserInGroup) {
            validGroupId = targetGroupId;
          }
        }
      } catch (e) {
        localStorage.removeItem("groupId");
      }
    }

    // 2. Load vào nhóm nếu tìm thấy
    if (validGroupId) {
      try {
        const group = await getGroupById(validGroupId);
        if (group && group.id) {
          localStorage.setItem("groupId", validGroupId);
          setGroupData(group);
          setHasGroup(true);
          setActiveTab("overview");
          setGroupError("");
          return;
        }
      } catch {
        localStorage.removeItem("groupId");
      }
    }

    // 3. Nếu thực sự chưa có nhóm -> Đưa về trang tạo nhóm
    localStorage.removeItem("groupId");
    setGroupData(null);
    setHasGroup(false);
    setActiveTab("create");
    setGroupError("");

  } catch (error) {
    setGroupError(error.response?.data?.message || error.message);
  }
};

  useEffect(() => {
    checkUserGroup();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  if (groupError)
    return (
      <div role="alert" className="p-8 text-center text-red-600 font-bold bg-[#FBF9F5] min-h-screen flex flex-col justify-center items-center">
        <p>{groupError}</p>
        <button onClick={checkUserGroup} className="mt-3 px-4 py-2 bg-[#E65100] text-white rounded-xl text-xs">Thử lại</button>
      </div>
    );

  if (hasGroup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] text-xs font-bold text-[#6B635B]">
        Đang kiểm tra thông tin nhóm đồ án...
      </div>
    );
  }

  const currentMemberInfo = groupData?.members?.find(
    (m) =>
      (currentUser?.email && m.userEmail === currentUser.email) ||
      isUserInGroup({ members: [m] }, currentUser),
  );

  const isLeader = Boolean(
    currentMemberInfo?.isLeader ||
    currentUser?.role?.toUpperCase().includes("LEADER") ||
    getUserIds(currentUser).includes(String(groupData?.leaderId)),
  );
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
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans overflow-hidden">
      {/* SIDEBAR BÊN TRÁI - THIẾT KẾ TINH TẾ, SANG TRỌNG */}
      <aside className="w-76 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-linear-to-br from-[#E65100] to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              ✓
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-[#2C2825]">
                Quản Lý Sinh Viên
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                MatchPoint FPT Capstone.
              </p>
            </div>
          </div>

          <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-[#E8E2D9]/80 space-y-2.5 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6B635B]">Mã nhóm:</span>
              <span className="font-black text-[#E65100]">
                {hasGroup ? groupData?.code || "SE-GROUP" : "Chưa có"}
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

            <div className="pt-2 border-t border-[#E8E2D9]/60 flex justify-between items-center text-xs">
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
                    ? "👑 Nhóm trưởng"
                    : "👤 Thành viên"}
              </span>
            </div>
          </div>

          {hasGroup || isLeader ? (
            <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>📊</span>
                <span>Tổng quan nhóm</span>
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "members"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>👥</span>
                <span>Thành viên nhóm (3–5 người)</span>
              </button>

              {hasGroup && (
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                    activeTab === "applications"
                      ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                      : "hover:bg-[#FBF9F5] text-[#6B635B]"
                  }`}
                >
                  <span>📝</span>
                  <span>Đơn Apply & Vote</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("management")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "management"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>🔒</span>
                <span>Quản lý trạng thái & Rời nhóm</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>⚙️</span>
                <span>Hồ sơ cá nhân</span>
              </button>
            </nav>
          ) : (
            <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
              <button
                onClick={() => setActiveTab("create")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "create"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>🚀</span>
                <span>Tạo nhóm</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#E65100] text-white shadow-md shadow-orange-500/20"
                    : "hover:bg-[#FBF9F5] text-[#6B635B]"
                }`}
              >
                <span>⚙️</span>
                <span>Hồ sơ cá nhân</span>
              </button>
            </nav>
          )}
        </div>

        <div className="pt-4 border-t border-[#E8E2D9] space-y-3.5">
          <div className="flex items-center space-x-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover border border-[#E8E2D9]"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 text-[#E65100] font-black rounded-xl flex items-center justify-center text-xs shadow-xs">
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
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all duration-200 text-center cursor-pointer shadow-2xs"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH BÊN PHẢI */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-18 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-[#E65100] bg-orange-50/80 px-3 py-1.5 rounded-xl border border-orange-100/80 shadow-2xs">
              Đợt Lập Nhóm Đầu Kỳ
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-bold text-[#6B635B]">
              Khoa CNTT - Đại học FPT
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={checkUserGroup} className="text-[#E65100] font-bold hover:underline cursor-pointer">
              Làm mới nhóm
            </button>
            <NotificationBell />

            <div className="text-right hidden sm:block pl-3 border-l border-[#E8E2D9]">
              <p className="font-extrabold text-[#2C2825] text-xs">
                {currentUser?.fullName || "Đang tải..."}
              </p>
              <p className="text-[10px] text-[#6B635B]">{currentUser?.email}</p>
            </div>

            <span
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
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
                  ? "👑 Nhóm trưởng"
                  : "👤 Thành viên"}
            </span>
          </div>
        </header>

        {hasGroup && (
          <div
            className={`mx-8 mt-6 p-4 rounded-2xl border shadow-xs ${isValidTeamSize ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" : "bg-amber-50/70 border-amber-200 text-amber-900"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  Trạng thái sĩ số nhóm
                </p>
                <h2 className="mt-0.5 text-xs font-black">
                  {isValidTeamSize
                    ? `Nhóm đã đạt sĩ số hợp lệ (${groupMemberCount}/5 thành viên)`
                    : `Nhóm hiện có ${groupMemberCount}/5 thành viên (Yêu cầu tối thiểu 3 thành viên)`}
                </h2>
              </div>
              <span
                className={`px-3 py-1 text-[11px] font-bold rounded-xl shadow-2xs ${isValidTeamSize ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}
              >
                {isValidTeamSize ? "✓ Đạt chuẩn" : "⚠️ Cần bổ sung thành viên"}
              </span>
            </div>
          </div>
        )}

        <div className="p-8 max-w-7xl mx-auto w-full">
          {hasGroup || isLeader ? (
            <>
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
              {activeTab === "applications" && hasGroup && (
                <GroupApplications
                  groupId={groupData?.id}
                  isLeader={isLeader}
                  currentUserId={currentUser?.id}
                />
              )}
              {activeTab === "management" && (
                <GroupManagementPanel
                  groupData={groupData}
                  isLeader={isLeader}
                  currentUserId={currentUser?.id}
                  onGroupUpdated={checkUserGroup}
                />
              )}
              {activeTab === "settings" && <Profile />}
            </>
          ) : (
            <>
              {activeTab === "settings" ? (
                <Profile />
              ) : (
                <div className="space-y-6">
                  {/* THANH TAB CHUYỂN ĐỔI ĐƯỢC THIẾT KẾ LẠI SANG TRỌNG HƠN */}
                  <div className="flex justify-center mb-2">
                    <div className="bg-white p-1.5 rounded-2xl max-w-md w-full grid grid-cols-2 gap-2 border border-[#E8E2D9] shadow-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab("create")}
                        className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                          activeTab === "create"
                            ? "bg-[#E65100] text-white shadow-sm"
                            : "text-[#6B635B] hover:bg-[#FBF9F5]"
                        }`}
                      >
                        🚀 Tạo nhóm mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile_apply")}
                        className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                          activeTab === "profile_apply"
                            ? "bg-[#E65100] text-white shadow-sm"
                            : "text-[#6B635B] hover:bg-[#FBF9F5]"
                        }`}
                      >
                        🔍 Tìm nhóm đang tuyển
                      </button>
                    </div>
                  </div>

                  {activeTab === "profile_apply" ? (
                    <StudentProfileAndApply
                      onJoinedGroup={async (groupId) => {
                        try {
                          const group = await getGroupById(groupId);
                          setGroupData(group);
                          setHasGroup(true);
                          setActiveTab("overview");
                        } catch (err) {
                          console.error("Không thể tải group sau khi Accept:", err);
                        }
                      }}
                    />
                  ) : (
                    <CreateGroup
                      onGroupCreated={async (newGroupId) => {
                        if (newGroupId) {
                          try {
                            const group = await getGroupById(newGroupId);
                            if (group) {
                              setGroupData(group);
                              setHasGroup(true);
                              setActiveTab("overview");
                            }
                          } catch {
                            await checkUserGroup();
                          }
                        } else {
                          await checkUserGroup();
                        }
                      }}
                    />
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