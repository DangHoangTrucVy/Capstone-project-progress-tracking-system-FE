import { useEffect, useState } from "react";
import api from "../../services/api";
import { getSemesters } from "../../services/eligibilityService";

export default function ModeratorScopes() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal gia hạn deadline
  const [modalOpen, setModalOpen] = useState(false);
  const [activeScope, setActiveScope] = useState(null);
  const [newDeadline, setNewDeadline] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    getSemesters()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.content || [];
        setSemesters(list);
        if (list.length > 0) setSelectedSemester(list[0].code || list[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadScopes(selectedSemester);
    }
  }, [selectedSemester]);

  const loadScopes = async (semester) => {
    setLoading(true);
    try {
      const res = await api.get(`/semesters/${semester}/scopes`).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : res.data.content || res.data.items || [];
      setScopes(list);
    } catch {
      setScopes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExtendModal = (scope) => {
    setActiveScope(scope);
    setNewDeadline("");
    setModalOpen(true);
  };

//  const handleSaveDeadline = async (e) => {
//     e.preventDefault();
//     if (!activeScope || !newDeadline) return;

//     try {
//       // Chuyển đổi ngày giờ sang chuẩn ISO string để backend Java nhận diện chính xác tuyệt đối
//       const formattedDeadline = new Date(newDeadline).toISOString();

//       await api.post(`/scopes/${activeScope.id || activeScope.scopeId}/extend`, {
//         deadline: formattedDeadline,
//       });
//       showToast("Cập nhật / Gia hạn deadline thành công!");
//       setModalOpen(false);
//       loadScopes(selectedSemester);
//     } catch (error) {
//       showToast(error.response?.data?.message || "Không thể đổi deadline.", "error");
//     }
//   };

const handleSaveDeadline = async (e) => {
    e.preventDefault();
    if (!activeScope || !newDeadline) return;

    try {
      const formattedDeadline = new Date(newDeadline).toISOString();
      const scopeId = activeScope.id || activeScope.scopeId;

      // Nếu đang ở trạng thái PREPARING thì dùng API set deadline ban đầu, ngược lại mới dùng extend
      if (activeScope.phase === "PREPARING") {
        await api.put(`/scopes/${scopeId}/deadline`, { deadline: formattedDeadline });
      } else {
        await api.post(`/scopes/${scopeId}/extend`, { deadline: formattedDeadline });
      }

      showToast("Cấu hình deadline thành công!");
      setModalOpen(false);
      loadScopes(selectedSemester);
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể cập nhật deadline.", "error");
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
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">MODERATOR · PHẠM VI NGÀNH & DEADLINE</span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">Cấu hình thời gian & Deadline theo từng ngành</h1>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
        >
          {semesters.map((sem, idx) => {
            const code = sem.code || sem;
            return <option key={idx} value={code}>{code}</option>;
          })}
        </select>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
              <th className="p-4 font-black uppercase">Ngành học (Major Scope)</th>
              <th className="p-4 font-black uppercase">Giai đoạn hiện tại</th>
              <th className="p-4 font-black uppercase">Deadline</th>
              <th className="p-4 font-black uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {loading ? (
              <tr><td colSpan="4" className="p-12 text-center text-[#6B635B]">Đang tải danh sách phạm vi...</td></tr>
            ) : scopes.length > 0 ? (
              scopes.map((scope) => (
                <tr key={scope.id || scope.scopeId} className="hover:bg-[#FBF9F5]/70 transition">
                  <td className="p-4 font-bold text-[#E65100]">{scope.majorName || scope.major}</td>
                  <td className="p-4 font-semibold text-[#2C2825]">{scope.phase || "Đang mở ghép nhóm"}</td>
                  <td className="p-4 text-[#6B635B]">{scope.deadline ? new Date(scope.deadline).toLocaleString() : "Deadline chung học kỳ"}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenExtendModal(scope)}
                      className="px-3 py-1.5 bg-orange-50 text-[#E65100] hover:bg-orange-100 font-bold rounded-xl border border-orange-200 cursor-pointer"
                    >
                      ⏱ Gia hạn / Đổi Deadline
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-12 text-center text-[#6B635B] italic">Chưa có phạm vi ngành nào trong học kỳ này.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL GIA HẠN DEADLINE */}
      {modalOpen && activeScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveDeadline} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">Gia hạn deadline ngành: {activeScope.majorName || activeScope.major}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="font-bold text-gray-400">✕</button>
            </div>
            <label className="block space-y-1 font-bold">
              Chọn mốc thời điểm deadline mới (Ít nhất sau 48h):
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                required
                className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              />
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 font-bold rounded-xl">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl">Xác nhận gia hạn</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}