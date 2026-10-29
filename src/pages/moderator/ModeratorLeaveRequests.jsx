import { useEffect, useState } from "react";
import api from "../../services/api";
import { getSemesters } from "../../services/eligibilityService";

export default function ModeratorLeaveRequests({ semester }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(semester || "");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (semester) {
      setSelectedSemester(semester);
    } else {
      getSemesters()
        .then((res) => {
          const list = Array.isArray(res) ? res : res.content || [];
          setSemesters(list);
          if (list.length > 0) setSelectedSemester(list[0].code || list[0]);
        })
        .catch(() => {});
    }
  }, [semester]);

  useEffect(() => {
    if (selectedSemester) {
      loadRequests(selectedSemester);
    }
  }, [selectedSemester]);

  const loadRequests = async (semCode) => {
    setLoading(true);
    try {
      // 1. Lấy danh sách môn học trong học kỳ trước để có subjectId
      const subRes = await api.get(`/semesters/${semCode}/subjects`).catch(() => ({ data: [] }));
      const subjects = subRes.data?.content || subRes.data || [];

      let allComplaints = [];

      // 2. Duyệt qua các môn học để gọi API lấy danh sách khiếu nại/yêu cầu rời nhóm: GET /subjects/{subjectId}/complaints
      for (const sub of subjects) {
        try {
          const compRes = await api.get(`/subjects/${sub.id}/complaints`).catch(() => ({ data: [] }));
          const compList = Array.isArray(compRes.data) ? compRes.data : compRes.data?.content || compRes.data?.items || [];
          
          // Gắn thêm thông suất subjectCode nếu cần
          const mapped = compList.map(item => ({ ...item, subjectCode: sub.code || sub.name }));
          allComplaints = [...allComplaints, ...mapped];
        } catch (e) {}
      }

      setRequests(allComplaints);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId, approved) => {
    const reason = window.prompt(approved ? "Nhập lý do chấp nhận (không bắt buộc):" : "Nhập lý do từ chối khiếu nại:") || "";
    if (!approved && !reason.trim()) {
      showToast("Vui lòng nhập lý do từ chối.", "error");
      return;
    }

    try {
      await api.post(`/leave-requests/${requestId}/moderator-decision`, {
        approved,
        reason: reason.trim(),
      });
      showToast(approved ? "Đã chấp nhận khiếu nại rời nhóm." : "Đã từ chối khiếu nại.");
      loadRequests(selectedSemester);
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl flex justify-between items-center shadow-xs">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">MODERATOR · KHIẾU NẠI & RỜI NHÓM</span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">Xử lý yêu cầu rời nhóm và khiếu nại</h1>
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
              <th className="p-4 font-black uppercase">Sinh viên</th>
              <th className="p-4 font-black uppercase">Nhóm hiện tại</th>
              <th className="p-4 font-black uppercase">Nội dung / Lý do</th>
              <th className="p-4 font-black uppercase text-right">Quyết định</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {loading ? (
              <tr><td colSpan="4" className="p-12 text-center text-[#6B635B]">Đang tải danh sách khiếu nại...</td></tr>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req.id || req.requestId} className="hover:bg-[#FBF9F5]/70 transition">
                  <td className="p-4 font-bold text-[#2C2825]">{req.studentName || req.userName || req.fullName || "—"}</td>
                  <td className="p-4 font-bold text-[#E65100]">{req.groupCode || req.groupName || "—"}</td>
                  <td className="p-4 text-[#6B635B]">{req.reason || req.content || "Yêu cầu rời nhóm / Khiếu nại"}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleDecision(req.id || req.requestId, true)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 cursor-pointer"
                    >
                      ✓ Đồng ý cho rời
                    </button>
                    <button
                      onClick={() => handleDecision(req.id || req.requestId, false)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl border border-red-200 cursor-pointer"
                    >
                      ✕ Từ chối
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-12 text-center text-[#6B635B] italic">Không có khiếu nại hay yêu cầu rời nhóm nào cần xử lý.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}