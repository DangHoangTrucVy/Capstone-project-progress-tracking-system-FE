import React, { useState, useEffect } from "react";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import {
  getSubjectsBySemester,
  getOpenGroupsBySubject,
  applyToGroup,
  getMyApplications,
  withdrawRequest,
  getMyInvites,
  acceptRequest,
  rejectRequest,
  getMyLeaderTransfers,
  acceptLeaderTransfer,
  declineLeaderTransfer,
  cancelLeaderTransfer,
} from "../../services/groupService";
import api from "../../services/api";

export default function StudentProfileAndApply({ onJoinedGroup }) {
  const [profile, setProfile] = useState({
    strengths: "",
    weaknesses: "",
    skills: "",
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [groups, setGroups] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [myInvites, setMyInvites] = useState([]);
  const [leaderTransfers, setLeaderTransfers] = useState([]); // 👈 State lưu danh sách chuyển giao Leader
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const askConfirm = ({ title, message, onConfirm }) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const fetchTransferData = async () => {
    try {
      const transfersRes = await getMyLeaderTransfers().catch(() => []);
      const transferList = Array.isArray(transfersRes) ? transfersRes : transfersRes?.content || [];
      setLeaderTransfers(transferList.filter((item) => item.status === "PENDING"));
    } catch (err) {
      console.error("Lỗi tải leader transfers:", err);
    }
  };

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const semestersRes = await api.get("/semesters").catch(() => ({ data: [] }));
        const semList = semestersRes.data?.content || semestersRes.data || [];
        
        let activeSemesterCode = "Spring2027";
        if (Array.isArray(semList) && semList.length > 0) {
          activeSemesterCode = semList[0].code || semList[0];
        }

        const subRes = await getSubjectsBySemester(activeSemesterCode).catch(() => []);
        const subList = Array.isArray(subRes) ? subRes : subRes?.content || [];
        setSubjects(subList);

        const firstSubId = subList.length > 0 ? (subList[0].id || subList[0].subjectId) : "";
        setSelectedSubjectId(firstSubId);

        const [profileRes, appsRes, invitesRes] = await Promise.all([
          getMyProfile().catch(() => ({})),
          firstSubId ? getMyApplications(firstSubId).catch(() => []) : Promise.resolve([]),
          firstSubId ? getMyInvites(firstSubId).catch(() => []) : Promise.resolve([]),
        ]);

        setProfile(
          profileRes?.data ||
            profileRes || { strengths: "", weaknesses: "", skills: "" },
        );
        setMyApps(Array.isArray(appsRes) ? appsRes : appsRes?.content || []);
        setMyInvites(Array.isArray(invitesRes) ? invitesRes : invitesRes?.content || []);

        await fetchTransferData();

      } catch (err) {
        console.error("Lỗi khởi tạo dữ liệu profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      const fetchGroupsAndApps = async () => {
        try {
          const [resGroups, appsRes, invitesRes] = await Promise.all([
            getOpenGroupsBySubject(selectedSubjectId).catch(() => []),
            getMyApplications(selectedSubjectId).catch(() => []),
            getMyInvites(selectedSubjectId).catch(() => []),
          ]);

          const groupList = Array.isArray(resGroups) ? resGroups : resGroups?.content || [];
          setGroups(
            groupList.filter((g) => {
              const count =
                g.memberCount ??
                g.numberOfMembers ??
                (Array.isArray(g.members) ? g.members.length : 0);
              return count < 5;
            }),
          );

          setMyApps(Array.isArray(appsRes) ? appsRes : appsRes?.content || []);
          setMyInvites(Array.isArray(invitesRes) ? invitesRes : invitesRes?.content || []);
        } catch (err) {
          console.error("Lỗi tải dữ liệu theo môn học:", err);
          setGroups([]);
          setMyInvites([]);
        }
      };
      fetchGroupsAndApps();
    }
  }, [selectedSubjectId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMyProfile(profile);
      showToast("Cập nhật profile cá nhân thành công!", "success");
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật profile thất bại.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApply = async (groupId) => {
    if (!profile.skills || profile.skills.trim() === "") {
      showToast("Bạn phải điền đầy đủ thông tin 'Thế mạnh kỹ năng, ưu điểm & nhược điểm' ở phía trên trước khi gửi đơn Apply!", "error");
      return;
    }

    if (myApps.filter((app) => app.status === "PENDING").length >= 3) {
      showToast(
        "Bạn chỉ được phép gửi tối đa 3 đơn Apply cùng một lúc!",
        "error",
      );
      return;
    }

    askConfirm({
      title: "Xác nhận gửi đơn Apply",
      message: "Bạn có chắc muốn gửi đơn ứng tuyển vào nhóm này không?",
      onConfirm: async () => {
        try {
          await applyToGroup(groupId, { message: profile.skills.trim() });
          showToast("Gửi đơn Apply thành công!", "success");
          
          const appsRes = await getMyApplications(selectedSubjectId).catch(() => []);
          setMyApps(Array.isArray(appsRes) ? appsRes : appsRes?.content || []);
        } catch (err) {
          showToast(
            err.response?.data?.message || "Không thể gửi đơn Apply.",
            "error",
          );
        }
      },
    });
  };

  const handleWithdraw = async (appId) => {
    askConfirm({
      title: "Xác nhận rút đơn",
      message: "Bạn có chắc muốn rút lại đơn Apply này không?",
      onConfirm: async () => {
        try {
          await withdrawRequest(appId);
          showToast("Đã rút đơn thành công!", "success");
          const appsRes = await getMyApplications(selectedSubjectId).catch(() => []);
          setMyApps(Array.isArray(appsRes) ? appsRes : appsRes?.content || []);
        } catch (err) {
          showToast(err.response?.data?.message || "Không thể rút đơn.", "error");
        }
      },
    });
  };

  const handleAcceptInvite = async (inviteId, groupId) => {
    try {
      await acceptRequest(inviteId);
      showToast("Đã chấp nhận lời mời vào nhóm!", "success");
      if (onJoinedGroup) {
        await onJoinedGroup(groupId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể chấp nhận lời mời.", "error");
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await rejectRequest(inviteId, { reason: "Từ chối lời mời" });
      showToast("Đã từ chối lời mời.", "success");
      const invitesRes = await getMyInvites(selectedSubjectId).catch(() => []);
      setMyInvites(Array.isArray(invitesRes) ? invitesRes : invitesRes?.content || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  // 🚀 Xử lý Chấp nhận bàn giao Leader
  const handleAcceptTransfer = async (transferId, groupId) => {
    askConfirm({
      title: "Xác nhận nhận quyền Trưởng nhóm",
      message: "Bạn có chắc chắn muốn nhận vai trò Trưởng nhóm này không?",
      onConfirm: async () => {
        try {
          await acceptLeaderTransfer(transferId);
          showToast("Đã nhận quyền Trưởng nhóm thành công!", "success");
          await fetchTransferData();
          if (onJoinedGroup) {
            await onJoinedGroup(groupId);
          } else {
            window.location.reload();
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Không thể chấp nhận bàn giao.", "error");
        }
      },
    });
  };

  // 🚀 Xử lý Từ chối bàn giao Leader[cite: 31]
  const handleDeclineTransfer = async (transferId) => {
    askConfirm({
      title: "Xác nhận từ chối",
      message: "Bạn có chắc muốn từ chối nhận quyền Trưởng nhóm này không?",
      onConfirm: async () => {
        try {
          await declineLeaderTransfer(transferId);
          showToast("Đã từ chối nhận quyền Trưởng nhóm.", "success");
          await fetchTransferData();
        } catch (err) {
          showToast(err.response?.data?.message || "Thực hiện thất bại.", "error");
        }
      },
    });
  };

  // 🚀 Xử lý Hủy đề xuất bàn giao (dành cho Leader cũ)[cite: 30]
  const handleCancelTransfer = async (transferId) => {
    askConfirm({
      title: "Xác nhận hủy đề xuất",
      message: "Bạn có chắc muốn thu hồi lại đề xuất bàn giao Leader này không?",
      onConfirm: async () => {
        try {
          await cancelLeaderTransfer(transferId);
          showToast("Đã hủy đề xuất bàn giao thành công!", "success");
          await fetchTransferData();
        } catch (err) {
          showToast(err.response?.data?.message || "Không thể hủy đề xuất.", "error");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải thông tin...
      </div>
    );
  }

  const pendingApps = myApps.filter((app) => 
    (!app.status || app.status === "PENDING") && 
    (app.type === "APPLICATION" || app.type === "APPLY")
  );
  const remainingSlots = Math.max(0, 3 - pendingApps.length);

  const filteredGroups = groups.filter((g) => {
    const code = (g.groupCode || g.name || "").toLowerCase();
    const skills = (g.wantedSkills || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return code.includes(query) || skills.includes(query);
  });

  return (
    <div className="space-y-8 animate-fadeIn text-[#2C2825] max-w-7xl mx-auto py-4 px-3 font-sans">
      {/* 1. HỒ SƠ NĂNG LỰC */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#E8E2D9]/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/80 text-[#E65100] text-[10px] font-black uppercase rounded-lg mb-2">
              <span>📄</span> HỒ SƠ NĂNG LỰC
            </div>
            <h2 className="text-lg font-black text-[#2C2825]">Giới thiệu bản thân & Kỹ năng</h2>
            <p className="text-xs text-[#6B635B] mt-0.5">
              Ghi rõ thế mạnh kỹ năng, ưu điểm và nhược điểm để các Trưởng nhóm xem xét khi bạn gửi đơn ứng tuyển.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#2C2825] uppercase tracking-wider">
              THẾ MẠNH KỸ NĂNG, ƯU ĐIỂM & NHƯỢC ĐIỂM
            </label>
            <div className="relative">
              <textarea
                rows={5}
                value={profile.skills || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value,
                    strengths: e.target.value,
                    weaknesses: e.target.value,
                  })
                }
                placeholder="VD: Thế mạnh: Thành thạo ReactJS, Tailwind CSS, REST API..."
                className="w-full p-4 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#E65100] transition font-medium leading-relaxed resize-y"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-[#6B635B] bg-white px-2 py-0.5 rounded-md border border-[#E8E2D9]">
                {(profile.skills || "").length} ký tự
              </span>
            </div>
          </div>
          <div className="pt-0 flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>💾</span> {savingProfile ? "Đang lưu..." : "LƯU PROFILE CÁ NHÂN"}
            </button>
          </div>
        </form>
      </div>

      {/* 👑 KHU VỰC YÊU CẦU CHUYỂN GIAO QUYỀN LEADER */}
      {leaderTransfers.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-[#E65100]">
            <span>👑</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2C2825]">
              Yêu cầu bàn giao quyền Trưởng nhóm ({leaderTransfers.length})
            </h3>
          </div>

          <div className="space-y-3">
            {leaderTransfers.map((item) => (
              <div key={item.id} className="p-5 bg-orange-50/70 rounded-2xl border border-orange-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-black text-sm text-[#2C2825]">
                    Mã nhóm: {item.groupCode || item.groupName || item.groupId}
                  </p>
                  <p className="text-[11px] text-[#6B635B]">
                    Trưởng nhóm <strong className="text-[#2C2825]">{item.fromName || "Cũ"}</strong> muốn bàn giao vị trí Trưởng nhóm cho bạn.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleAcceptTransfer(item.id, item.groupId)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Chấp nhận làm Leader
                  </button>
                  <button
                    onClick={() => handleDeclineTransfer(item.id)}
                    className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl transition cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleCancelTransfer(item.id)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer"
                  >
                    Hủy đề xuất
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LỜI MỜI VÀO NHÓM */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-[#E65100]">
          <span>📬</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2C2825]">
            Lời mời tham gia nhóm từ Trưởng nhóm ({myInvites.length})
          </h3>
        </div>
        
        {myInvites.length > 0 ? (
          <div className="space-y-3">
            {myInvites.map((inv) => (
              <div key={inv.id} className="p-5 bg-orange-50/60 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-black text-sm text-[#2C2825]">
                    Mã nhóm: {inv.groupCode || inv.groupName || inv.groupId}
                  </p>
                  <p className="text-[11px] text-[#6B635B]">
                    Tên nhóm: <strong className="text-[#2C2825]">{inv.groupName || "Nhóm Capstone"}</strong>
                  </p>
                  <p className="text-[11px] text-[#6B635B]">
                    Trạng thái: <span className={`font-bold ${inv.status === "PENDING" ? "text-amber-600" : "text-red-500"}`}>{inv.status}</span>
                  </p>
                </div>
                {inv.status === "PENDING" ? (
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleAcceptInvite(inv.id, inv.groupId)} 
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Chấp nhận
                    </button>
                    <button 
                      onClick={() => handleDeclineInvite(inv.id)} 
                      className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl transition cursor-pointer"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <span className="font-bold px-3 py-1 bg-gray-100 rounded-lg border text-gray-500">Đã hết hạn / Đã xử lý</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">Hiện tại bạn không có lời mời tham gia nhóm nào từ Trưởng nhóm.</p>
        )}
      </div>

      {/* 2. ĐƠN APPLY CỦA TÔI */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">⚡</span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#2C2825]">
                ĐƠN APPLY CỦA TÔI ({pendingApps.length}/3 ĐƠN ĐANG CHỜ)
              </h3>
              <p className="text-[11px] text-[#6B635B] mt-0.5">
                Giới hạn tối đa 3 đơn gửi song song để đảm bảo tỷ lệ phản hồi tốt nhất.
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 bg-[#FBF9F5] text-[#E65100] border border-[#E8E2D9] rounded-xl">
            Còn {remainingSlots} lượt apply
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {[0, 1, 2].map((idx) => {
            const app = pendingApps[idx];
            return app ? (
              <div key={app.id || idx} className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 flex flex-col justify-between space-y-4 shadow-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-black rounded-lg uppercase">⏳ Chờ duyệt</span>
                    <span className="text-[#6B635B] font-medium">Đã gửi</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#2C2825] line-clamp-1">{app.groupCode || app.groupName || app.groupId}</h4>
                    <p className="text-[11px] text-[#6B635B] mt-0.5">Trạng thái: Đang chờ Leader duyệt</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-200/60 flex justify-between items-center text-xs">
                  <span className="text-[#E65100] font-bold">Nguyện vọng #{idx + 1}</span>
                  <button onClick={() => handleWithdraw(app.id)} className="text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer">Hủy đơn</button>
                </div>
              </div>
            ) : (
              <div key={idx} className="p-6 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FBF9F5] flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-gray-400 font-bold text-lg">+</div>
                <p className="text-xs font-black text-[#2C2825]">Vị trí đơn trống {idx + 1}</p>
                <p className="text-[11px] text-[#6B635B] leading-relaxed">Chọn 1 nhóm từ Sàn ghép đôi bên dưới để gửi nguyện vọng.</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SÀN GHÉP ĐÔI (DANH SÁCH NHÓM ĐANG TUYỂN) */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#E8E2D9]/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/80 text-[#E65100] text-[10px] font-black uppercase rounded-lg mb-2">
              <span>👥</span> Chọn nhóm
            </div>
            <h3 className="text-base font-black text-[#2C2825]">Danh sách nhóm đang tuyển theo môn học</h3>
            <p className="text-xs text-[#6B635B] mt-0.5">Khám phá các nhóm sinh viên đang thiếu thành viên và nộp đơn apply trực tiếp.</p>
          </div>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-black text-[#E65100] outline-none cursor-pointer min-w-70"
          >
            {subjects.map((sub) => {
              const subId = sub.id || sub.subjectId;
              const subName = sub.name || sub.code || subId;
              return (
                <option key={subId} value={subId}>
                  {subName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên nhóm, công nghệ (React, Spring...), đề tài..."
              className="w-full pl-10 pr-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#E65100] font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((g) => {
              const memberCount = g.memberCount ?? g.numberOfMembers ?? (Array.isArray(g.members) ? g.members.length : 0);
              const slotsLeft = Math.max(0, 5 - memberCount);
              return (
                <div key={g.id} className="p-6 bg-[#FBF9F5] rounded-3xl border border-[#E8E2D9] flex flex-col justify-between space-y-4 hover:border-[#E65100]/60 transition shadow-2xs">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg">
                        Còn {slotsLeft} vị trí
                      </span>
                      <span className="font-bold text-[#6B635B]">Sĩ số: {memberCount}/5</span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-[#2C2825] line-clamp-1">{g.groupCode || g.name}</h4>
                      <p className="text-[11px] text-[#6B635B] mt-1 line-clamp-2 leading-relaxed">
                        {g.wantedSkills ? `Cần tuyển: ${g.wantedSkills}` : "Nhóm đang hoàn thiện đội ngũ và chào đón thành viên mới."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleApply(g.id)}
                      className="flex-1 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase text-[11px] tracking-wider rounded-xl shadow-md transition cursor-pointer text-center"
                    >
                      🚀 Nộp đơn Apply
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 p-12 text-center bg-[#FBF9F5] rounded-3xl border border-[#E8E2D9]/60 space-y-2">
              <p className="text-sm font-bold text-[#2C2825]">Không tìm thấy nhóm phù hợp</p>
              <p className="text-xs text-[#6B635B] italic">Không có nhóm nào đang mở tuyển trong môn học này hoặc khớp với từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div role="status" aria-live="polite" className="fixed right-5 top-5 z-100 w-[calc(100%-2.5rem)] max-w-sm animate-fadeIn">
          <div className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${toast.type === "error" ? "border-red-200" : "border-emerald-200"}`}>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-black text-[#2C2825]">{toast.type === "error" ? "Có lỗi xảy ra" : "Thành công"}</p>
              <p className="mt-1 text-xs text-[#6B635B]">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#2C2825]/50 p-4" onClick={() => setConfirmDialog(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-7 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-[#2C2825]">{confirmDialog.title}</h3>
            <p className="text-xs text-[#6B635B] leading-relaxed">{confirmDialog.message}</p>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDialog(null)} className="rounded-xl border border-[#E8E2D9] px-5 py-2.5 text-xs font-bold text-[#6B635B] cursor-pointer">Hủy</button>
              <button type="button" onClick={async () => { const action = confirmDialog.onConfirm; setConfirmDialog(null); await action(); }} className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white cursor-pointer">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}