import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ModeratorLeaveRequests({ semester }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [isApprovedAction, setIsApprovedAction] = useState(true);
  const [decisionNote, setDecisionNote] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (semester) {
      loadRequests(semester);
    }
  }, [semester]);

  const loadRequests = async (semCode) => {
    setLoading(true);
    try {
      // Đã cập nhật đúng Endpoint Swagger: GET /api/v1/semesters/{semester}/complaints
      const compRes = await api
        .get(`/semesters/${semCode}/complaints`)
        .catch(() =>
          // Fallback nếu server cũ còn dùng endpoint leave-requests
          api.get(`/semesters/${semCode}/leave-requests`).catch(() => ({ data: [] }))
        );

      const compList = Array.isArray(compRes.data)
        ? compRes.data
        : compRes.data?.content || compRes.data?.items || [];
      setRequests(compList);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (req, approved) => {
    setActiveRequest(req);
    setIsApprovedAction(approved);
    setDecisionNote("");
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!isApprovedAction && !decisionNote.trim()) {
      showToast("Vui lòng nhập lý do từ chối.", "error");
      return;
    }

    try {
      const requestId = activeRequest.id || activeRequest.requestId;
      // Endpoint đúng theo Swagger: POST /api/v1/leave-requests/{requestId}/moderator-decision
      await api.post(`/leave-requests/${requestId}/moderator-decision`, {
        approve: isApprovedAction,
        note: decisionNote.trim(),
        reason: decisionNote.trim(),
      });

      showToast(
        isApprovedAction ? "Đã chấp nhận yêu cầu rời Room." : "Đã từ chối yêu cầu rời Room."
      );
      setDecisionModalOpen(false);
      loadRequests(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  return (
    <div className="p-8 space-y-6 text-xs">
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white p-6 border border-[#E8E2D9] rounded-3xl flex justify-between items-center shadow-xs">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-lg">
            ĐIỀU PHỐI VIÊN · KHIẾU NẠI & RỜI ROOM
          </span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">
            Xử lý yêu cầu rời Room và khiếu nại
          </h1>
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
              <th className="p-4 font-black uppercase">Sinh viên</th>
              <th className="p-4 font-black uppercase">Room hiện tại</th>
              <th className="p-4 font-black uppercase">Lý do / Nội dung khiếu nại</th>
              <th className="p-4 font-black uppercase text-right">Quyết định</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-12 text-center text-[#6B635B]">
                  Đang tải danh sách khiếu nại...
                </td>
              </tr>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req.id || req.requestId} className="hover:bg-[#FBF9F5]/70 transition">
                  <td className="p-4 font-bold text-[#2C2825]">
                    {req.studentName || req.fullName || req.studentCode || "—"}
                  </td>
                  <td className="p-4 font-bold text-[#E65100]">
                    {req.roomName || req.groupCode || req.roomId || "—"}
                  </td>
                  <td className="p-4 text-[#6B635B]">
                    {req.reason || req.content || req.description || "Yêu cầu rời Room"}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenDecisionModal(req, true)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 cursor-pointer"
                    >
                      ✓ Đồng ý cho rời
                    </button>
                    <button
                      onClick={() => handleOpenDecisionModal(req, false)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl border border-red-200 cursor-pointer"
                    >
                      ✕ Từ chối
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-12 text-center text-[#6B635B] italic">
                  Không có khiếu nại hay yêu cầu rời Room nào cần xử lý.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {decisionModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmDecision}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl text-xs"
          >
            <h3 className="font-black text-sm">
              {isApprovedAction ? "Đồng ý cho sinh viên rời Room" : "Từ chối yêu cầu rời Room"}
            </h3>
            <textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do..."
              required={!isApprovedAction}
              rows={3}
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white font-bold rounded-xl ${
                  isApprovedAction ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}