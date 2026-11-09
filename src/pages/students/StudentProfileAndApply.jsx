import React, { useState, useEffect } from "react";
import {
  searchRooms,
  joinRoom,
  getMyRequestsAndInvites,
  acceptRequest,
  rejectRequest,
} from "../../services/roomService";
import { getMyProfile, updateMyProfile } from "../../services/userService";

export default function RoomSearchAndJoin({ semester, onJoined }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState({ skills: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [myInvites, setMyInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (semester) {
      loadData();
    }
  }, [semester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, profileRes, reqsRes] = await Promise.all([
        searchRooms(semester, { available: true }).catch(() => []),
        getMyProfile().catch(() => ({})),
        getMyRequestsAndInvites(semester).catch(() => []),
      ]);

      setRooms(Array.isArray(roomsRes) ? roomsRes : roomsRes.content || []);
      setProfile(profileRes?.data || profileRes || { skills: "" });

      // Lọc lấy danh sách lời mời (INVITATION) từ các trưởng nhóm khác
      const allReqs = Array.isArray(reqsRes) ? reqsRes : reqsRes.content || [];
      const invites = allReqs.filter(
        (item) =>
          (!item.status || item.status === "PENDING") &&
          (item.type === "INVITATION" ||
            item.type === "INVITE" ||
            item.type === "OFFER")
      );
      setMyInvites(invites);
    } catch (err) {
      console.error("Lỗi tải dữ liệu phòng và lời mời:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (roomId, isLocked) => {
    try {
      await joinRoom(roomId);
      if (isLocked) {
        showToast(
          "Đã gửi yêu cầu vào Room đang khóa tới Trưởng nhóm!",
          "success",
        );
      } else {
        showToast("Vào Room thành công!", "success");
        if (onJoined) onJoined();
      }
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể vào Room.", "error");
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await acceptRequest(inviteId);
      showToast("Đã chấp nhận lời mời vào phòng thành công!", "success");
      if (onJoined) onJoined();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Không thể chấp nhận lời mời.",
        "error",
      );
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await rejectRequest(inviteId, { reason: "Từ chối lời mời" });
      showToast("Đã từ chối lời mời.", "success");
      loadData();
    } catch (err) {
      showToast("Thực hiện thất bại.", "error");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateMyProfile(profile);
      showToast("Đã lưu thông tin kỹ năng hồ sơ!", "success");
    } catch (err) {
      showToast("Lưu hồ sơ thất bại.", "error");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const query = searchTerm.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.wantedSkills && r.wantedSkills.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 font-sans text-[#2C2825] text-xs">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl text-white font-bold shadow-xl ${
            toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. KHU VỰC HIỂN THỊ LỜI MỜI NHẬN ĐƯỢC TỪ CÁC TRƯỞNG NHÓM KHÁC */}
      {/* ========================================================= */}
      <div className="bg-orange-50/20 p-6 rounded-3xl border border-orange-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">📬</span>
          <h3 className="font-black text-sm text-[#E65100] uppercase tracking-wider">
            Lời mời tham gia phòng từ các Trưởng nhóm khác ({myInvites.length})
          </h3>
        </div>

        {myInvites.length > 0 ? (
          <div className="space-y-3">
            {myInvites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-white rounded-2xl border border-orange-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <p className="font-black text-sm text-[#2C2825]">
                    Phòng:{" "}
                    {inv.groupName ||
                      inv.roomName ||
                      inv.groupCode ||
                      "Phòng đồ án"}
                  </p>
                  <p className="text-[11px] text-[#6B635B] mt-0.5">
                    Trưởng nhóm đã gửi lời mời bạn gia nhập đội ngũ. Hãy phản hồi
                    bên dưới.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    ✓ Chấp nhận
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl cursor-pointer"
                  >
                    ✕ Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B635B] italic">
            Bạn chưa nhận được lời mời tham gia phòng nào từ các Trưởng nhóm
            khác.
          </p>
        )}
      </div>

      {/* HỒ SƠ KỸ NĂNG CÁ NHÂN */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-3 shadow-xs"
      >
        <h3 className="font-black text-sm text-[#2C2825]">
          📄 Hồ sơ & Kỹ năng cá nhân
        </h3>
        <textarea
          rows={3}
          value={profile.skills || ""}
          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          placeholder="Nhập kỹ năng của bạn (VD: ReactJS, Tailwind, Spring Boot...)"
          className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
        >
          Lưu hồ sơ
        </button>
      </form>

      {/* BẢNG TÌM ROOM TRONG NGÀNH */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-4 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-3 border-b pb-3">
          <div>
            <h3 className="text-sm font-black text-[#2C2825]">
              🔍 Tìm Phòng trong Ngành học
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              Vào Phòng trống sẽ trở thành Trưởng nhóm. Phòng mở tự do vào ngay,
              Phòng khóa cần Trưởng nhóm duyệt.
            </p>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên Phòng hoặc kỹ năng cần tuyển..."
            className="px-4 py-2 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none min-w-64"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-8 text-[#6B635B]">
              Đang tải danh sách Phòng...
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((r) => {
              const count =
                r.memberCount ??
                (Array.isArray(r.members) ? r.members.length : 0);
              const isEmpty = count === 0;
              const isLocked = r.locked;

              return (
                <div
                  key={r.id || r.roomId}
                  className="p-5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-3xl space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-black text-sm text-[#E65100]">
                        {r.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-gray-200 font-bold rounded text-[10px]">
                        {count}/{r.maxSize || 5} người
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B635B] line-clamp-2">
                      Kỹ năng cần: {r.wantedSkills || "Chưa cập nhật"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleJoin(r.id || r.roomId, isLocked)}
                    className={`w-full py-2.5 font-bold rounded-xl text-white transition cursor-pointer ${
                      isEmpty
                        ? "bg-purple-600 hover:bg-purple-700"
                        : isLocked
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-[#E65100] hover:bg-[#D84315]"
                    }`}
                  >
                    {isEmpty
                      ? "👑 Vào và làm Trưởng nhóm"
                      : isLocked
                      ? "🔒 Gửi đơn xin vào"
                      : "🚀 Vào ngay"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-[#6B635B] italic">
              Không tìm thấy Room nào phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}