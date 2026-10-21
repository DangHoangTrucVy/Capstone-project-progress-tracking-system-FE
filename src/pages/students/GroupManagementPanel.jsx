import { useState, useEffect, useCallback } from "react";
import { apiError } from "../../utils/apiError";
import {
  getGroupById,
  lockGroup,
  unlockGroup,
  submitRoster,
  requestLeaveGroup,
  getGroupLeaveRequests,
  leaderDecisionLeaveRequest,
} from "../../services/groupService";

export default function GroupManagementPanel({ groupData, isLeader, currentUserId, onGroupUpdated }) {
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const fetchLeaveRequests = useCallback(async () => {
    if (!groupData?.id) return;
    try {
      const res = await getGroupLeaveRequests(groupData.id);
      setLeaveRequests(res?.content || res || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được yêu cầu rời nhóm.");
    }
  }, [groupData?.id]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (loading || !groupData?.id) return;
    setLoading(true);
    try {
      await requestLeaveGroup(groupData.id, { reason: leaveReason.trim() });
      setLeaveReason("");
      await fetchLeaveRequests();
      setNotice({ type: "success", message: "Đã gửi yêu cầu rời nhóm thành công!" });
    } catch (err) {
      setNotice({ type: "error", message: apiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (requestId) => {
    try {
      await leaderDecisionLeaveRequest(requestId, { approved: true });
      await fetchLeaveRequests();
      if (onGroupUpdated) await onGroupUpdated();
      setNotice({ type: "success", message: "Đã cho phép thành viên rời nhóm." });
    } catch (err) {
      setNotice({ type: "error", message: apiError(err) });
    }
  };

  return (
    <div className="space-y-6 text-[#2C2825]">
      {error && <p className="text-red-700 text-xs">{error}</p>}
      
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Gửi yêu cầu xin rời nhóm</h3>
        <form onSubmit={handleRequestLeave} className="space-y-3">
          <textarea
            rows={3}
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="Nhập lý do bạn muốn rời nhóm..."
            className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none"
            required
          />
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-red-50 text-red-600 font-bold text-xs rounded-xl cursor-pointer">
            {loading ? "Đang gửi..." : "Gửi đơn xin rời nhóm"}
          </button>
        </form>
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 max-w-sm w-full">
            <h3 className="text-sm font-black">{notice.type === "success" ? "Thành công" : "Lỗi"}</h3>
            <p className="text-xs text-[#6B635B]">{notice.message}</p>
            <button onClick={() => setNotice(null)} className="w-full py-2 bg-[#E65100] text-white font-bold text-xs rounded-xl">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}