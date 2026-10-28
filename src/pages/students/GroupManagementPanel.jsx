import { useState } from "react";
import { apiError } from "../../utils/apiError";
import {
  lockGroup,
  unlockGroup,
  requestLeaveGroup,
  getGroupLeaveRequests,
  leaderDecisionLeaveRequest,
} from "../../services/groupService";

export default function GroupManagementPanel({
  groupData,
  isLeader,
  currentUserId,
  onGroupUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Xử lý khóa nhóm
  const handleLockGroup = async () => {
    if (!groupData?.id) return;
    try {
      await lockGroup(groupData.id);
      setNotice({
        type: "success",
        message: "Đã khóa nhóm thành công! Không nhận đơn ứng tuyển mới.",
      });
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể khóa nhóm."),
      });
    }
  };

  // Xử lý mở khóa nhóm
  const handleUnlockGroup = async () => {
    if (!groupData?.id) return;
    try {
      await unlockGroup(groupData.id);
      setNotice({ type: "success", message: "Đã mở khóa nhóm thành công!" });
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể mở khóa nhóm."),
      });
    }
  };

  const isLocked = groupData?.locked;

  return (
    <div className="space-y-6 text-[#2C2825]">
      {/* KHU VỰC DÀNH CHO TRƯỞNG NHÓM: KHÓA / MỞ KHÓA NHÓM */}
      {isLeader && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Quản lý trạng thái khóa nhóm
          </h3>
          <p className="text-xs text-[#6B635B]">
            Trạng thái hiện tại:{" "}
            <strong className={isLocked ? "text-red-600" : "text-emerald-600"}>
              {isLocked
                ? "🔒 Đang khóa (Không nhận đơn mới)"
                : "🔓 Đang mở (Cho phép nhận đơn)"}
            </strong>
          </p>
          <div className="flex gap-3">
            {isLocked ? (
              <button
                onClick={handleUnlockGroup}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-emerald-700"
              >
                Mở khóa nhóm (Unlock)
              </button>
            ) : (
              <button
                onClick={handleLockGroup}
                className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-red-700"
              >
                Khóa nhóm (Lock)
              </button>
            )}
          </div>
        </div>
      )}

      {/* THÔNG BÁO MODAL */}
      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 max-w-sm w-full">
            <h3 className="text-sm font-black">
              {notice.type === "success" ? "Thành công" : "Lỗi"}
            </h3>
            <p className="text-xs text-[#6B635B]">{notice.message}</p>
            <button
              onClick={() => setNotice(null)}
              className="w-full py-2 bg-[#E65100] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
