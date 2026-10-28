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
} from "../../services/groupService";

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
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Thêm state phụ trợ UI lọc/tìm kiếm nhóm (không ảnh hưởng logic gốc)
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

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [profileRes, appsRes, invitesRes] = await Promise.all([
          getMyProfile().catch(() => ({})),
          getMyApplications().catch(() => []),
          getMyInvites().catch(() => []),
        ]);

        setProfile(
          profileRes?.data ||
            profileRes || { strengths: "", weaknesses: "", skills: "" },
        );
        setMyApps(appsRes?.content || appsRes || []);
        setMyInvites(invitesRes?.content || invitesRes || []);

        const subRes = await getSubjectsBySemester("Fall2026").catch(() => []);
        const subList = Array.isArray(subRes) ? subRes : subRes?.content || [];
        setSubjects(subList);
        if (subList.length > 0) {
          setSelectedSubjectId(subList[0].id || subList[0].subjectId);
        }
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
      const fetchGroups = async () => {
        try {
          const res = await getOpenGroupsBySubject(selectedSubjectId).catch(() => []);
          const groupList = Array.isArray(res) ? res : res?.content || [];
          setGroups(
            groupList.filter((g) => {
              const count =
                g.memberCount ??
                g.numberOfMembers ??
                (Array.isArray(g.members) ? g.members.length : 0);
              return count < 5;
            }),
          );
        } catch (err) {
          console.error("Lỗi tải danh sách nhóm mở:", err);
          setGroups([]);
        }
      };
      fetchGroups();
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
          await applyToGroup(groupId, { message: "Xin gia nhập nhóm." });
          showToast("Gửi đơn Apply thành công!", "success");
          const appsRes = await getMyApplications().catch(() => []);
          setMyApps(appsRes?.content || appsRes || []);
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
          const appsRes = await getMyApplications().catch(() => []);
          setMyApps(appsRes?.content || appsRes || []);
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
      const invitesRes = await getMyInvites().catch(() => []);
      setMyInvites(invitesRes?.content || invitesRes || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-[#6B635B]">
        Đang tải thông tin...
      </div>
    );
  }

  const pendingApps = myApps.filter((app) => app.status === "PENDING");
  const remainingSlots = Math.max(0, 3 - pendingApps.length);

  // Lọc nhóm theo từ khóa search (UI phụ trợ)
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
              Ghi rõ thế mạnh kỹ năng, ưu điểm và nhược điểm để các Trưởng nhóm xem xét và phản hồi khi bạn gửi đơn yeetham gia nhóm.
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
                placeholder="VD: Thế mạnh: Thành thạo ReactJS (Hooks, Redux Toolkit, Tailwind CSS)..."
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
              className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-orange-500/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>💾</span> {savingProfile ? "Đang lưu..." : "LƯU PROFILE CÁ NHÂN"}
            </button>
          </div>
        </form>
      </div>

      {/* LỜI MỜI VÀO NHÓM (NẾU CÓ) */}
      {myInvites.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-[#E65100]">
            <span>📬</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2C2825]">
              Lời mời vào nhóm từ Trưởng nhóm ({myInvites.length})
            </h3>
          </div>
          <div className="space-y-3">
            {myInvites.map((inv) => (
              <div key={inv.id} className="p-5 bg-orange-50/60 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div>
                  <p className="font-black text-sm text-[#2C2825]">Mã nhóm: {inv.groupCode || inv.groupId}</p>
                  <p className="text-[11px] text-[#6B635B] mt-0.5">Trưởng nhóm đã gửi lời mời bạn tham gia vào đội ngũ.</p>
                </div>
                {inv.status === "PENDING" ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => handleAcceptInvite(inv.id, inv.groupId)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer">
                      Chấp nhận
                    </button>
                    <button onClick={() => handleDeclineInvite(inv.id)} className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl transition cursor-pointer">
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <span className="font-bold px-3 py-1 bg-white rounded-lg border">{inv.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ĐƠN APPLY CỦA TÔI (HIỂN THỊ DẠNG 3 CARD SONG SONG CHUẨN MẪU) */}
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
          <span className="text-xs font-black px-3.5 py-1.5 bg-[#FBF9F5] text-[#E65100] border border-[#E8E2D9] rounded-xl shadow-2xs">
            Còn {remainingSlots} lượt apply
          </span>
        </div>

        {/* Grid 3 vị trí đơn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Vị trí 1 (Hiển thị đơn đầu tiên nếu có) */}
          {pendingApps.length > 0 ? (
            <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 flex flex-col justify-between space-y-4 shadow-xs relative">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-black rounded-lg uppercase">
                    ⏳ Chờ duyệt
                  </span>
                  <span className="text-[#6B635B] font-medium">Gửi gần đây</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#2C2825] line-clamp-1">
                    {pendingApps[0].groupCode || pendingApps[0].groupId}
                  </h4>
                  <p className="text-[11px] text-[#6B635B] mt-0.5">
                    Trưởng nhóm: <strong className="text-[#2C2825]">Quản lý nhóm</strong>
                  </p>
                </div>
                <div className="inline-block px-2.5 py-1 bg-orange-100 text-[#E65100] text-[10px] font-bold rounded-lg">
                  Frontend / Backend
                </div>
              </div>

              <div className="pt-3 border-t border-amber-200/60 flex justify-between items-center text-xs">
                <span className="text-[#E65100] font-bold cursor-pointer hover:underline">Chi tiết nhóm</span>
                <button
                  onClick={() => handleWithdraw(pendingApps[0].id)}
                  className="text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FBF9F5] flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-gray-400 font-bold text-lg shadow-2xs">
                +
              </div>
              <p className="text-xs font-black text-[#2C2825]">Vị trí đơn trống 1</p>
              <p className="text-[11px] text-[#6B635B] leading-relaxed">
                Chọn 1 nhóm từ Sàn ghép đôi bên dưới để gửi thêm nguyện vọng.
              </p>
            </div>
          )}

          {/* Vị trí 2 */}
          {pendingApps.length > 1 ? (
            <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-black rounded-lg uppercase">⏳ Chờ duyệt</span>
                  <span className="text-[#6B635B] font-medium">Đã gửi</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#2C2825] line-clamp-1">{pendingApps[1].groupCode || pendingApps[1].groupId}</h4>
                  <p className="text-[11px] text-[#6B635B] mt-0.5">Trưởng nhóm: Thành viên</p>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-200/60 flex justify-between items-center text-xs">
                <span className="text-[#E65100] font-bold cursor-pointer hover:underline">Chi tiết nhóm</span>
                <button onClick={() => handleWithdraw(pendingApps[1].id)} className="text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer">Hủy đơn</button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FBF9F5] flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-gray-400 font-bold text-lg shadow-2xs">
                +
              </div>
              <p className="text-xs font-black text-[#2C2825]">Vị trí đơn trống 2</p>
              <p className="text-[11px] text-[#6B635B] leading-relaxed">
                Chọn 1 nhóm từ Sàn ghép đôi bên dưới để gửi thêm nguyện vọng.
              </p>
            </div>
          )}

          {/* Vị trí 3 */}
          {pendingApps.length > 2 ? (
            <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-black rounded-lg uppercase">⏳ Chờ duyệt</span>
                  <span className="text-[#6B635B] font-medium">Đã gửi</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#2C2825] line-clamp-1">{pendingApps[2].groupCode || pendingApps[2].groupId}</h4>
                  <p className="text-[11px] text-[#6B635B] mt-0.5">Trưởng nhóm: Thành viên</p>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-200/60 flex justify-between items-center text-xs">
                <span className="text-[#E65100] font-bold cursor-pointer hover:underline">Chi tiết nhóm</span>
                <button onClick={() => handleWithdraw(pendingApps[2].id)} className="text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer">Hủy đơn</button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FBF9F5] flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-gray-400 font-bold text-lg shadow-2xs">
                +
              </div>
              <p className="text-xs font-black text-[#2C2825]">Vị trí đơn trống 3</p>
              <p className="text-[11px] text-[#6B635B] leading-relaxed">
                Bạn còn {remainingSlots} lượt gửi đơn chờ duyệt song song.
              </p>
            </div>
          )}
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
            className="px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-black text-[#E65100] outline-none cursor-pointer shadow-2xs min-w-70"
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

        {/* Thanh tìm kiếm & lọc kết quả */}
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
          <select className="px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-bold text-[#6B635B] outline-none cursor-pointer">
            <option>Tất cả vị trí tuyển</option>
          </select>
          <button className="px-4 py-3 bg-orange-100/80 hover:bg-orange-200 text-[#E65100] font-black text-xs uppercase rounded-2xl border border-orange-200 transition cursor-pointer flex items-center justify-center gap-2">
            <span>⚙️</span> Lọc kết quả ({filteredGroups.length})
          </button>
        </div>

        {/* Danh sách các card nhóm */}
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

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2.5 py-1 bg-white text-[#E65100] border border-[#E8E2D9] text-[10px] font-bold rounded-lg">
                        Frontend / Backend
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E8E2D9]/60 flex justify-between items-center text-[11px] text-[#6B635B]">
                      <span>Trưởng nhóm: <strong className="text-[#2C2825]">Admin</strong></span>
                      <span className="text-emerald-700 font-bold">GPA: 3.8+</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleApply(g.id)}
                      className="flex-1 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase text-[11px] tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer text-center"
                    >
                      🚀 Nộp đơn Apply
                    </button>
                    <button className="p-3 bg-white hover:bg-orange-50 border border-[#E8E2D9] rounded-xl text-[#6B635B] transition cursor-pointer">
                      ℹ️
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

        {/* Thanh phân trang giả lập theo mẫu */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[#E8E2D9]/60 text-xs text-[#6B635B]">
          <p>Hiển thị {filteredGroups.length} trong tổng số nhóm đang mở tuyển dụng môn học này.</p>
          <div className="flex items-center gap-1.5 mt-2 sm:mt-0 font-bold">
            <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-lg">Trước</button>
            <button className="px-3 py-1.5 bg-[#E65100] text-white rounded-lg">1</button>
            <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-lg">2</button>
            <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-lg">3</button>
            <button className="px-3 py-1.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-lg">Sau</button>
          </div>
        </div>
      </div>

    
      {/* TOAST & CONFIRM MODAL */}
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
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#2C2825]/50 p-4 backdrop-blur-xs" onClick={() => setConfirmDialog(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-7 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-[#2C2825]">{confirmDialog.title}</h3>
            <p className="text-xs text-[#6B635B] leading-relaxed">{confirmDialog.message}</p>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDialog(null)} className="rounded-xl border border-[#E8E2D9] px-5 py-2.5 text-xs font-bold text-[#6B635B] hover:bg-gray-50 cursor-pointer transition">Hủy</button>
              <button type="button" onClick={async () => { const action = confirmDialog.onConfirm; setConfirmDialog(null); await action(); }} className="rounded-xl bg-[#E65100] hover:bg-[#D84315] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md cursor-pointer transition">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}