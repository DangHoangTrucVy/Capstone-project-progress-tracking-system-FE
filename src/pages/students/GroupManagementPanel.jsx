import { useState, useEffect, useCallback } from "react";
import { apiError } from '../../utils/apiError';
import { 
  lockGroup, 
  unlockGroup, 
  submitRoster, 
  requestLeaveGroup, 
  getGroupLeaveRequests, 
  approveLeaveRequest, 
  rejectLeaveRequest 
} from "../../services/groupService";

export default function GroupManagementPanel({ groupData, isLeader, currentUserId, onGroupUpdated }) {
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasPendingRequest = leaveRequests.some(r => r.status === 'PENDING' && String(r.userId) === String(currentUserId));

  const fetchLeaveRequests = useCallback(async () => {
    if (!groupData?.id) return;
    try {
      const res = await getGroupLeaveRequests(groupData.id);
      setLeaveRequests(res?.content || res || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được yêu cầu rời nhóm.');
    }
  }, [groupData]);

  useEffect(() => {
    const initial = setTimeout(fetchLeaveRequests, 0);
    const timer = setInterval(fetchLeaveRequests, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [fetchLeaveRequests]);

  // Leader khóa nhóm (Locked)
  const handleLockGroup = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa nhóm ? Thành viên sẽ không thể tự ý rời nhóm nếu không được duyệt.")) return;
    try {
      await lockGroup(groupData.id);
      alert("Đã khóa nhóm thành công!");
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      alert(apiError(err));
    }
  };

  // Leader mở khóa nhóm (Unlock)
  const handleUnlockGroup = async () => {
    if (!window.confirm("Bạn có muốn mở khóa nhóm không?")) return;
    try {
      await unlockGroup(groupData.id);
      alert("Đã mở khóa nhóm thành công!");
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      alert(apiError(err));
    }
  };

  // Leader khóa chốt danh sách (Finalize)
  const handleFinalizeGroup = async () => {
    if (!window.confirm("CẢNH BÁO: Sau khi Finalize, bạn sẽ không thể duyệt Apply, kick hay Unlock nhóm nữa! Bạn có chắc chắn muốn chốt?")) return;
    try {
      await submitRoster(groupData.id);
      alert("Đã Finalize nhóm thành công!");
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      alert(apiError(err));
    }
  };

  // Thành viên gửi yêu cầu xin rời nhóm (Đặc biệt khi nhóm ở trạng thái Locked)
  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (loading || hasPendingRequest || !groupData?.id || (isLeader && !leaveReason.trim()) || leaveReason.trim().length > 1000) return;
    setLoading(true);
    try {
      await requestLeaveGroup(groupData.id, { reason: leaveReason.trim() });
      alert(isLeader ? "Đã gửi yêu cầu tới Admin. Bạn vẫn là Leader trong lúc chờ duyệt." : "Đã gửi yêu cầu xin rời nhóm tới Trưởng nhóm thành công!");
      setLeaveReason("");
      await fetchLeaveRequests();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Leader duyệt đơn rời nhóm
  const handleApproveLeave = async (requestId) => {
    if (!window.confirm("Bạn có đồng ý cho phép thành viên này rời nhóm?")) return;
    try {
      await approveLeaveRequest(requestId);
      alert("Đã chấp thuận cho thành viên rời nhóm.");
      fetchLeaveRequests();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      alert(apiError(err));
    }
  };

  // Leader từ chối đơn rời nhóm
  const handleRejectLeave = async (requestId) => {
    const reason = prompt("Nhập lý do từ chối rời nhóm:");
    if (!reason) return;
    try {
      await rejectLeaveRequest(requestId, { reason });
      alert("Đã từ chối đơn xin rời nhóm.");
      fetchLeaveRequests();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div className="space-y-6 text-[#2C2825]">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button type="button" onClick={fetchLeaveRequests}>Làm mới yêu cầu</button>
      {hasPendingRequest && <p role="status" className="text-amber-700">Bạn có yêu cầu rời nhóm đang chờ xử lý.</p>}
      {/* 1. Khu vực điều khiển trạng thái dành cho Leader */}
      {isLeader && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-[#6B635B]">Quản lý trạng thái nhóm </h3>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleLockGroup} 
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              🔒 Khóa nhóm 
            </button>
            <button 
              onClick={handleUnlockGroup} 
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#2C2825] text-xs font-bold rounded-xl cursor-pointer transition"
            >
              🔓 Mở khóa 
            </button>
            <button 
              onClick={handleFinalizeGroup} 
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              🏁 Chốt danh sách
            </button>
          </div>
        </div>
      )}

      
{/* Lịch sử yêu cầu rời nhóm */}
{groupData?.id && (
  <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
    <h3 className="text-xs font-black uppercase text-[#6B635B]">
      Lịch sử yêu cầu rời nhóm ({leaveRequests.length})
    </h3>

    {leaveRequests.length === 0 ? (
      <p className="text-sm text-[#8A8178]">
        Chưa có yêu cầu rời nhóm nào.
      </p>
    ) : (
      <div className="space-y-3">
        {leaveRequests.map((req) => {
          const status = String(
            req.status || req.state || ""
          ).toUpperCase();

          const isPending = [
            "PENDING",
            "WAITING",
            "SUBMITTED",
          ].includes(status);

          const isApproved = [
            "APPROVED",
            "ACCEPTED",
          ].includes(status);

          const isRejected = [
            "REJECTED",
            "DECLINED",
          ].includes(status);

          return (
            <div
              key={req.id}
              className="p-4 rounded-2xl border border-[#E8E2D9] bg-[#FBF9F5] space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#2C2825]">
                    {req.userFullName ||
                      req.student?.fullName ||
                      req.studentId ||
                      "Sinh viên"}
                  </p>

                  <p className="text-xs text-[#6B635B]">
                    Lý do: {req.reason || "Không có lý do"}
                  </p>
                  <p className="text-xs">{req.leaderRequest ? 'Yêu cầu của Leader — Admin xử lý' : 'Yêu cầu của thành viên'}</p>

                  {req.createdAt && (
                    <p className="text-xs text-[#8A8178]">
                      Ngày gửi:{" "}
                      {new Date(req.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}

                  {req.decidedAt && (
                    <p className="text-xs text-[#8A8178]">
                      Ngày phản hồi:{" "}
                      {new Date(req.decidedAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    isPending
                      ? "bg-amber-100 text-amber-700"
                      : isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : isRejected
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isPending
                    ? "Đang chờ duyệt"
                    : isApproved
                      ? "Đã chấp nhận"
                      : isRejected
                        ? "Đã từ chối"
                        : status || "Chưa xác định"}
                </span>
              </div>

              {isLeader && isPending && !req.leaderRequest && (
                <div className="flex gap-2 border-t border-[#E8E2D9] pt-3">
                  <button
                    type="button"
                    onClick={() => handleApproveLeave(req.id)}
                    className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                  >
                    Cho phép
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectLeave(req.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

      {/* 3. Form xin rời nhóm dành cho Thành viên hoặc Leader muốn xin rời */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase text-[#6B635B]">Gửi yêu cầu xin rời nhóm</h3>
          <p className="text-[11px] text-[#6B635B]">
            {isLeader
              ? "Yêu cầu của Leader được chuyển tới Admin và giảng viên hướng dẫn. Bạn vẫn là Leader cho tới khi Admin duyệt yêu cầu và thay Leader."
              : "Yêu cầu rời nhóm được gửi tới Trưởng nhóm khi nhóm chưa khóa và còn trong thời hạn lập nhóm. Nếu nhóm đã khóa, vui lòng liên hệ giảng viên hướng dẫn hoặc Admin."}
          </p>
        </div>
        <form onSubmit={handleRequestLeave} className="space-y-3">
          <textarea
            rows={3}
            name="reason"
            aria-label="Lý do xin rời nhóm"
            maxLength={1000}
            disabled={loading || hasPendingRequest || !groupData?.id}
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="Nhập lý do bạn muốn rời nhóm..."
            className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            required={isLeader}
          />
          <button 
            type="submit" 
            disabled={loading || hasPendingRequest || !groupData?.id || (isLeader && !leaveReason.trim())}
            className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi đơn xin rời nhóm"}
          </button>
        </form>
      </div>
    </div>
  );
}
