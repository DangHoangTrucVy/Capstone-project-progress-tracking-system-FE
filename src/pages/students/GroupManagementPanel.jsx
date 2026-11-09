import { useState } from "react";
import {
  lockRoom,
  unlockRoom,
  leaveRoom,
  requestFinalizeRoom,
  withdrawFinalizeRequest,
} from "../../services/roomService";

export default function GroupManagementPanel({
  roomData,
  isLeader,
  onRefresh,
}) {
  const [loading, setLoading] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const roomId = roomData?.id || roomData?.roomId;
  const isLocked = roomData?.locked;

  const isFinalized = Boolean(
    roomData?.finalized ||
    roomData?.status === "FINALIZED" ||
    roomData?.groupCode,
  );

  const hasFinalizeRequest = roomData?.finalizeRequested;

  const handleToggleLock = async () => {
    if (!isLeader) {
      alert("Chỉ có Trưởng nhóm mới có quyền khóa hoặc mở khóa phòng!");
      return;
    }
    if (isFinalized) return;
    setLoading(true);
    try {
      if (isLocked) {
        await unlockRoom(roomId);
        alert("Đã mở khóa phòng thành công!");
      } else {
        await lockRoom(roomId);
        alert("Đã khóa phòng thành công! Thành viên bên ngoài không thể tự do vào phòng.");
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeRequest = async () => {
    if (!isLeader) {
      alert("Chỉ có Trưởng nhóm mới có quyền báo chốt phòng gửi Moderator!");
      return;
    }
    if (isFinalized) return;
    setLoading(true);
    try {
      if (hasFinalizeRequest) {
        await withdrawFinalizeRequest(roomId);
        alert("Đã hủy yêu cầu báo chốt thành công.");
      } else {
        await requestFinalizeRoom(roomId);
        alert("Đã gửi báo chốt phòng thành công đến Moderator!");
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác báo chốt thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (e) => {
    e.preventDefault();
    if (isFinalized) {
      alert("Phòng đã được Moderator duyệt chốt thành Nhóm chính thức. Thành viên không thể rời nhóm!");
      return;
    }
    if (isLeader) {
      alert("Trưởng nhóm không thể rời phòng trực tiếp. Vui lòng nhường quyền Trưởng nhóm cho thành viên khác trước khi rời!");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi phòng này không?")) return;
    setLoading(true);
    try {
      await leaveRoom(roomId, leaveReason);
      alert("Đã rời phòng thành công.");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể rời phòng.");
    } finally {
      setLoading(false);
    }
  };

  if (isFinalized) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm space-y-4 text-xs font-sans text-[#2C2825]">
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-black text-sm">Phòng đã được Moderator duyệt chốt thành Nhóm chính thức!</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Mã nhóm định danh: <strong className="text-emerald-700">{roomData?.groupCode}</strong>. Mọi thao tác quản lý đã bị khóa theo quy chế.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] tracking-wider uppercase">
            Đã chốt nhóm
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-sans text-[#2C2825]">
      {/* ⚠️ THÔNG BÁO CHO THÀNH VIÊN THƯỜNG */}
      {!isLeader && (
        <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 text-orange-900 flex items-center gap-3">
          <span className="text-base">ℹ️</span>
          <div>
            <p className="font-black">Bạn đang đăng nhập với tư cách Thành viên.</p>
            <p className="text-[11px] opacity-90">
              Các chức năng quản trị như <strong>Báo chốt phòng gửi Giảng viên</strong> hoặc <strong>Khóa/Mở khóa phòng</strong> chỉ dành riêng cho Trưởng nhóm.
            </p>
          </div>
        </div>
      )}

      {/* CHỈ TRƯỞNG NHÓM MỚI THẤY CÁC CHỨC NĂNG QUẢN TRỊ NÀY */}
      {isLeader && (
        <>
          {/* BÁO CHỐT CHO GIẢNG VIÊN DUYỆT */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-3 shadow-xs">
            <h3 className="font-black text-sm text-[#2C2825] flex items-center gap-2">
              <span>📌</span> Báo chốt phòng gửi Giảng viên
            </h3>
            <p className="text-[#6B635B]">
              Khi phòng đã đủ số lượng thành viên tối thiểu (từ 3 đến 5 người), Trưởng nhóm bấm báo chốt để hệ thống gửi yêu cầu xét duyệt cấp mã nhóm chính thức đến Giảng viên điều phối (Moderator).
            </p>
            <button
              onClick={handleFinalizeRequest}
              disabled={loading}
              className={`px-5 py-3 font-black uppercase tracking-wider rounded-xl text-white transition cursor-pointer shadow-md ${
                hasFinalizeRequest
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
            >
              {hasFinalizeRequest ? "Hủy yêu cầu Báo chốt" : "Báo chốt Room gửi Moderator"}
            </button>
          </div>

          {/* KHÓA / MỞ KHÓA ROOM */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-3 shadow-xs">
            <h3 className="font-black text-sm text-[#2C2825] flex items-center gap-2">
              <span>🔒</span> Quản lý trạng thái Khóa / Mở khóa phòng
            </h3>
            <p className="text-[#6B635B]">
              Khi khóa phòng, sinh viên bên ngoài sẽ không thể tự do tham gia trực tiếp mà phải gửi đơn xin vào để Trưởng nhóm xét duyệt.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleToggleLock}
                disabled={loading}
                className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-black uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                {isLocked ? "🔓 Mở khóa phòng ngay" : "🔒 Khóa phòng ngay"}
              </button>
              <span className="text-[11px] font-bold text-[#6B635B]">
                Trạng thái hiện tại: <strong className={isLocked ? "text-amber-600" : "text-emerald-600"}>{isLocked ? "Đang Khóa" : "Đang Mở tự do"}</strong>
              </span>
            </div>
          </div>
        </>
      )}

      {/* RỜI PHÒNG (Dành cho thành viên) */}
      {!isLeader && (
        <form
          onSubmit={handleLeave}
          className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-3 shadow-xs"
        >
          <h3 className="font-black text-sm text-red-600 flex items-center gap-2">
            <span>🚪</span> Rời khỏi phòng hiện tại
          </h3>
          <p className="text-[#6B635B]">
            Nếu bạn muốn rời khỏi phòng để tìm kiếm nhóm đồ án khác phù hợp hơn, hãy điền lý do và xác nhận bên dưới.
          </p>
          <textarea
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="Nhập lý do muốn rời phòng..."
            rows={2}
            className="w-full p-3.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl outline-none focus:border-red-500 text-xs"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-red-500/20"
          >
            Xác nhận rời phòng
          </button>
        </form>
      )}
    </div>
  );
}