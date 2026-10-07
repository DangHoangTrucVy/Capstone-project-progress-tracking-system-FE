import React, { useState, useEffect } from "react";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import {
  getAllGroups,
  applyToGroup,
  getMyApplications,
  withdrawApplication,
  getMyInvites,
  acceptInvite,
  declineInvite,
} from "../../services/groupService";

export default function StudentProfileAndApply({ onJoinedGroup }) {
  const [profile, setProfile] = useState({
    strengths: "",
    weaknesses: "",
    skills: "",
  });
  const [groups, setGroups] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [myInvites, setMyInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, groupsRes, appsRes, invitesRes] = await Promise.all([
        getMyProfile().catch(() => ({})),
        getAllGroups().catch(() => []),
        getMyApplications().catch(() => []),
        getMyInvites().catch(() => []),
      ]);

      setProfile(
        profileRes?.data ||
          profileRes || { strengths: "", weaknesses: "", skills: "" },
      );

      const groupList = groupsRes?.content || groupsRes || [];

      // Lọc trực tiếp từ danh sách nhóm công khai và hỗ trợ lấy số lượng thành viên linh hoạt
      setGroups(
        groupList.filter((g) => {
          const count =
            g.memberCount ??
            g.numberOfMembers ??
            g.currentMembers ??
            g.totalMembers ??
            (Array.isArray(g.members) ? g.members.length : 0) ??
            (Array.isArray(g.studentIds) ? g.studentIds.length : 0);
          return count < 5;
        }),
      );

      setMyApps(appsRes?.content || appsRes || []);
      setMyInvites(invitesRes?.content || invitesRes || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu profile và đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMyProfile(profile);
      alert("Cập nhật profile cá nhân thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật profile thất bại.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApply = async (groupId) => {
    if (myApps.length >= 3) {
      alert("Bạn chỉ được phép gửi tối đa 3 đơn Apply cùng một lúc!");
      return;
    }
    if (
      !window.confirm("Bạn có chắc muốn gửi đơn ứng tuyển vào nhóm này không?")
    )
      return;

    try {
      await applyToGroup(groupId, { message: "Xin gia nhập nhóm." });
      alert("Gửi đơn Apply thành công!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi đơn apply.");
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm("Bạn có muốn rút lại đơn apply này không?")) return;
    try {
      await withdrawApplication(appId);
      alert("Đã rút đơn thành công!");
      fetchData();
    } catch (err) {
      alert("Không thể rút đơn.");
    }
  };

const handleAcceptInvite = async (inviteId, groupId) => {
  try {
    await acceptInvite(inviteId);

    alert("Đã chấp nhận lời mời vào nhóm!");

    // Chuyển thẳng sang Group Dashboard
    if (onJoinedGroup) {
      await onJoinedGroup(groupId);
    }
  } catch (err) {
    console.error("Accept invite error:", err?.response?.data || err);

    alert("Không thể chấp nhận lời mời.");
  }
};

  const handleDeclineInvite = async (inviteId) => {
    try {
      await declineInvite(inviteId);
      alert("Đã từ chối lời mời.");
      fetchData();
    } catch (err) {
      alert("Thực hiện thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-xs font-bold text-[#6B635B]">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-[#2C2825] max-w-5xl mx-auto p-6">
      {/* 1. Phần Quản lý Profile cá nhân */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-black">
            Hồ sơ năng lực (Profile cá nhân)
          </h2>
          <p className="text-xs text-[#6B635B]">
            Ghi rõ thế mạnh kỹ năng, ưu điểm và nhược điểm để các Trưởng nhóm
            xem xét khi bạn apply.
          </p>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold">
              Thế mạnh kỹ năng, ưu điểm & nhược điểm
            </label>
            <textarea
              rows={4}
              value={profile.skills || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  skills: e.target.value,
                  strengths: e.target.value,
                  weaknesses: e.target.value,
                })
              }
              placeholder="VD: Thế mạnh: ReactJS, NodeJS. Ưu điểm: Chăm chỉ, đúng giờ. Nhược điểm: Còn rụt rè khi thuyết trình..."
              className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? "Đang lưu..." : "Lưu Profile cá nhân"}
          </button>
        </form>
      </div>

      {/* 2. Lời mời từ các nhóm (Invites) */}
      {myInvites.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Lời mời vào nhóm từ Trưởng nhóm ({myInvites.length})
          </h3>
          <div className="space-y-3">
            {myInvites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-bold">
                    Nhóm: {inv.groupCode || inv.groupId}
                  </p>
                  <p className="text-[#6B635B]">
                    Trưởng nhóm đã gửi lời mời bạn tham gia.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.id, inv.groupId)}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    className="px-4 py-2 bg-gray-100 text-red-600 font-bold rounded-xl cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Danh sách đơn Apply đang chờ (Tối đa 3) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Đơn Apply của tôi ({myApps.length}/3 đơn đang chờ)
          </h3>
        </div>
        {myApps.length > 0 ? (
          <div className="space-y-3">
            {myApps.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-bold">
                    Mã nhóm ứng tuyển: {app.groupCode || app.groupId}
                  </p>
                  <p className="text-[11px] text-[#6B635B]">
                    Trạng thái:{" "}
                    <strong
                      className={
                        String(app.status).toUpperCase() === "REJECTED"
                          ? "text-red-600"
                          : "text-orange-600"
                      }
                    >
                      {app.status || "PENDING"}
                    </strong>
                  </p>

                  {/* Hiển thị lý do nếu đơn bị từ chối */}
                  {String(app.status).toUpperCase() === "REJECTED" &&
                    (app.reason || app.message) && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[11px] font-black text-red-700 mb-1">
                          ❌ Lý do từ chối
                        </p>

                        <p className="text-[11px] text-red-600 leading-relaxed">
                          {app.reason || app.message}
                        </p>
                      </div>
                    )}
                </div>
                {String(app.status).toUpperCase() === "PENDING" && (
                  <button
                    onClick={() => handleWithdraw(app.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg cursor-pointer hover:bg-red-100"
                  >
                    Rút đơn
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">
            Bạn chưa gửi đơn apply vào nhóm nào.
          </p>
        )}
      </div>

      {/* 4. Danh sách các nhóm để chọn và Apply */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Danh sách nhóm đang tuyển thành viên ({groups.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => {
            const memberCount =
              g.memberCount ??
              g.numberOfMembers ??
              g.currentMembers ??
              g.totalMembers ??
              (Array.isArray(g.members) ? g.members.length : 0) ??
              (Array.isArray(g.studentIds) ? g.studentIds.length : 0);

            return (
              <div
                key={g.id}
                className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-black text-sm">{g.groupCode}</p>
                  <p className="text-[11px] text-[#6B635B]">
                    Thành viên:{" "}
                    <strong className="text-[#2C2825]">
                      {memberCount}/5 người
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => handleApply(g.id)}
                  className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315]"
                >
                  Gửi đơn Apply
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
