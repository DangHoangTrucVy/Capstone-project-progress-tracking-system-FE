import React, { useState, useEffect } from "react";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import {
  getSubjectsBySemester,
  getOpenGroupsBySubject,
  applyToGroup,
  getMyApplications,
  withdrawRequest, // Dùng withdrawRequest thay cho withdrawApplication
  getMyInvites,
  acceptRequest,   // Dùng acceptRequest thay cho acceptInvite
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

        // Mặc định lấy danh sách môn học của học kỳ hiện tại (VD: Fall2026)
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

  // Khi chọn môn học, tải danh sách nhóm mở của môn đó theo đúng chuẩn Swagger GET /api/v1/subjects/{subjectId}/open-groups
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
          await withdrawApplication(appId);
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
      await acceptInvite(inviteId);
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
      await declineInvite(inviteId);
      showToast("Đã từ chối lời mời.", "success");
      const invitesRes = await getMyInvites().catch(() => []);
      setMyInvites(invitesRes?.content || invitesRes || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Thực hiện thất bại.", "error");
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
          <h2 className="text-base font-black">Hồ sơ năng lực (Profile cá nhân)</h2>
          <p className="text-xs text-[#6B635B]">
            Ghi rõ thế mạnh kỹ năng, ưu điểm và nhược điểm để các Trưởng nhóm xem xét khi bạn apply.
          </p>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold">Thế mạnh kỹ năng, ưu điểm & nhược điểm</label>
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
              placeholder="VD: Thế mạnh: ReactJS, NodeJS. Ưu điểm: Chăm chỉ, đúng giờ..."
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
              <div key={inv.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold">Nhóm: {inv.groupCode || inv.groupId}</p>
                  <p className="text-[#6B635B]">Trưởng nhóm đã gửi lời mời bạn tham gia.</p>
                </div>
                {inv.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvite(inv.id, inv.groupId)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                      Chấp nhận
                    </button>
                    <button onClick={() => handleDeclineInvite(inv.id)} className="px-4 py-2 bg-gray-100 text-red-600 font-bold rounded-xl cursor-pointer">
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <span>{inv.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Danh sách đơn Apply đang chờ */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Đơn Apply của tôi ({myApps.filter((app) => app.status === "PENDING").length}/3 đơn đang chờ)
        </h3>
        {myApps.length > 0 ? (
          <div className="space-y-3">
            {myApps.map((app) => (
              <div key={app.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold">Mã nhóm ứng tuyển: {app.groupCode || app.groupId}</p>
                  <p className="text-[11px] text-[#6B635B]">
                    Trạng thái: <strong className="text-orange-600">{app.status || "PENDING"}</strong>
                  </p>
                </div>
                {String(app.status).toUpperCase() === "PENDING" && (
                  <button onClick={() => handleWithdraw(app.id)} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg cursor-pointer">
                    Rút đơn
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">Bạn chưa gửi đơn apply vào nhóm nào.</p>
        )}
      </div>

      {/* 4. Chọn môn học để xem danh sách nhóm mở và Apply */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Danh sách nhóm đang tuyển theo môn học
          </h3>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="p-2 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length > 0 ? (
            groups.map((g) => {
              const memberCount = g.memberCount ?? g.numberOfMembers ?? (Array.isArray(g.members) ? g.members.length : 0);
              return (
                <div key={g.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs">
                  <div>
                    <p className="font-black text-sm">{g.groupCode}</p>
                    <p className="text-[11px] text-[#6B635B]">Thành viên: <strong>{memberCount}/5 người</strong></p>
                  </div>
                  <button onClick={() => handleApply(g.id)} className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#D84315]">
                    Gửi đơn Apply
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[#6B635B] italic col-span-2">Không có nhóm nào đang mở tuyển trong môn học này.</p>
          )}
        </div>
      </div>

      {/* TOAST & CONFIRM MODAL */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed right-5 top-5 z-100 w-[calc(100%-2.5rem)] max-w-sm animate-fadeIn">
          <div className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${toast.type === "error" ? "border-red-200" : "border-emerald-200"}`}>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-black">{toast.type === "error" ? "Có lỗi xảy ra" : "Thành công"}</p>
              <p className="mt-1 text-sm text-[#6B635B]">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#2C2825]/45 p-4 backdrop-blur-[2px]" onClick={() => setConfirmDialog(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-[#2C2825]">{confirmDialog.title}</h3>
            <p className="mt-3 text-sm text-[#6B635B]">{confirmDialog.message}</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDialog(null)} className="rounded-xl border px-5 py-3 text-sm font-bold">Hủy</button>
              <button type="button" onClick={async () => { const action = confirmDialog.onConfirm; setConfirmDialog(null); await action(); }} className="rounded-xl bg-[#E65100] px-5 py-3 text-sm font-bold text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}