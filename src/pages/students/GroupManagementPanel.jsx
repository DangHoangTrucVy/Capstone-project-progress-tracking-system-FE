import { useState, useEffect, useCallback } from "react";
import { apiError } from "../../utils/apiError";
import {
  lockGroup,
  unlockGroup,
  requestLeaveGroup,
  getMyLeaveRequests,
  withdrawLeaveRequest,
} from "../../services/groupService";

export default function GroupManagementPanel({
  groupData,
  isLeader,
  onGroupUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [activeLeaveReq, setActiveLeaveReq] = useState(null);

  const fetchMyLeaveRequests = useCallback(async () => {
    try {
      const requests = await getMyLeaveRequests();
      const list = Array.isArray(requests) ? requests : requests?.content || [];
      const currentReq = list.find(
        (req) => String(req.groupId) === String(groupData?.id) && req.status === "PENDING"
      );
      setActiveLeaveReq(currentReq || null);
    } catch (err) {
      console.error("Lỗi kiểm tra trạng thái đơn rời nhóm:", err);
    }
  }, [groupData?.id]);

  useEffect(() => {
    if (groupData?.id) {
      fetchMyLeaveRequests();
    }
  }, [groupData?.id, fetchMyLeaveRequests]);

  const handleLockGroup = async () => {
    if (!groupData?.id) return;
    try {
      setLoading(true);
      await lockGroup(groupData.id);
      setNotice({
        type: "success",
        message: "Đã khóa nhóm thành công! Hệ thống sẽ tạm ngưng nhận đơn ứng tuyển mới.",
      });
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể khóa nhóm."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockGroup = async () => {
    if (!groupData?.id) return;
    try {
      setLoading(true);
      await unlockGroup(groupData.id);
      setNotice({ type: "success", message: "Đã mở khóa nhóm thành công!" });
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể mở khóa nhóm."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupData?.id || !leaveReason.trim()) return;
    try {
      setLoading(true);
      
      await requestLeaveGroup(groupData.id, { reason: leaveReason.trim() });
      
      setNotice({
        type: "success",
        message: "Đã rời khỏi nhóm thành công!",
      });
      setConfirmingLeave(false);
      setLeaveReason("");

      localStorage.removeItem("groupId");

      if (onGroupUpdated) {
        await onGroupUpdated();
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể thực hiện rời nhóm."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (requestId) => {
    if (!requestId) return;
    try {
      setLoading(true);
      await withdrawLeaveRequest(requestId);
      setNotice({
        type: "success",
        message: "Đã thu hồi yêu cầu rời nhóm thành công.",
      });
      setActiveLeaveReq(null);
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      setNotice({
        type: "error",
        message: apiError(err, "Không thể thu hồi yêu cầu."),
      });
    } finally {
      setLoading(false);
    }
  };

  const isLocked = groupData?.locked;
  const memberCount = groupData?.members?.length || 0;

  return (
    <div className="space-y-6 text-[#2C2825] font-sans">
      {/* 1. THÔNG TIN CHUNG VỀ TRẠNG THÁI NHÓM */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">
          Tổng quan trạng thái nhóm
        </h3>
        <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] text-xs space-y-1.5">
          <p className="font-black text-sm text-[#2C2825]">
            Mã nhóm: {groupData?.groupCode || groupData?.name || "N/A"}
          </p>
          <p className="text-[#6B635B]">
            Sĩ số hiện tại: <strong className="text-[#E65100]">{memberCount}/5 thành viên</strong>
          </p>
          <p className="text-[#6B635B]">
            Vai trò của bạn: <strong className="text-[#2C2825]">{isLeader ? "👑 Trưởng nhóm" : "👤 Thành viên"}</strong>
          </p>
        </div>
      </div>

      {/* 2. KHU VỰC DÀNH RIÊNG CHO TRƯỞNG NHÓM: KHÓA / MỞ KHÓA NHÓM */}
      {isLeader && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">
            Quản lý trạng thái khóa nhóm
          </h3>
          <p className="text-xs text-[#6B635B]">
            Trạng thái hiện tại:{" "}
            <strong className={isLocked ? "text-red-600" : "text-emerald-600"}>
              {isLocked
                ? "🔒 Đang khóa (Tạm ngưng nhận đơn ứng tuyển mới)"
                : "🔓 Đang mở (Cho phép nhận đơn ứng tuyển)"}
            </strong>
          </p>
          <div className="flex gap-3">
            {isLocked ? (
              <button
                disabled={loading}
                onClick={handleUnlockGroup}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
              >
                Mở khóa nhóm
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleLockGroup}
                className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-red-700 disabled:opacity-50"
              >
                Khóa nhóm
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. KHU VỰC GỬI VÀ QUẢN LÝ YÊU CẦU RỜI NHÓM */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-red-600">
          Yêu cầu rời khỏi nhóm
        </h3>
        
        {activeLeaveReq ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800">
                ⏳ Đang chờ hệ thống xử lý đơn xin rời nhóm
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                CHỜ XỬ LÝ
              </span>
            </div>
            <p className="text-xs text-[#6B635B]">
              <strong>Lý do đã gửi:</strong> {activeLeaveReq.reason}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleWithdrawRequest(activeLeaveReq.id)}
                className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                {loading ? "Đang xử lý..." : "Thu hồi đơn xin rời nhóm"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#6B635B] leading-relaxed">
              {isLeader
                ? "Vì bạn là Trưởng nhóm, yêu cầu rời nhóm sẽ được ghi nhận. Hệ thống sẽ hỗ trợ chuyển giao quyền Trưởng nhóm sang thành viên tiếp theo để nhóm hoạt động ổn định."
                : "Nếu bạn có nhu cầu rời khỏi nhóm, vui lòng điền lý do chi tiết và gửi yêu cầu."}
            </p>

            {!confirmingLeave ? (
              <button
                onClick={() => setConfirmingLeave(true)}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer"
              >
                {isLeader ? "Gửi đơn rời nhóm" : "Gửi đơn xin rời nhóm"}
              </button>
            ) : (
              <form onSubmit={handleLeaveGroupSubmit} className="p-4 bg-red-50/50 rounded-2xl border border-red-200 space-y-3">
                <p className="text-xs font-black text-red-700">Nhập lý do xin rời nhóm</p>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full p-3 bg-white border border-red-200 rounded-xl text-xs outline-none focus:border-red-500"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmingLeave(false)}
                    className="px-4 py-2 text-xs font-bold text-[#6B635B] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Đang gửi..." : "Xác nhận gửi yêu cầu"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 max-w-sm w-full">
            <h3 className="text-sm font-black">
              {notice.type === "success" ? "Thành công" : "Lỗi"}
            </h3>
            <p className="text-xs text-[#6B635B]">{notice.message}</p>
            <button
              onClick={() => {
                setNotice(null);
                window.location.reload(); 
              }}
              className="w-full py-2 bg-[#E65100] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}