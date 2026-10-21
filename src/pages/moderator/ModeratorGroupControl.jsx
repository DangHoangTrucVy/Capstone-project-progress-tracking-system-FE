import { useEffect, useState } from "react";
import { 
  getGroupsBySemester, 
  addStudentToGroup, 
  removeStudentFromGroup, 
  assignGroupLeaderDirectly,
  finalizeScope,
  reopenScope
} from "../../services/moderatorService";
import api from "../../services/api";

export default function ModeratorGroupControl({ semester }) {
  const [groups, setGroups] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal thêm sinh viên vào nhóm
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (semester) {
      loadData(semester);
    }
  }, [semester]);

  const loadData = async (sem) => {
    setLoading(true);
    try {
      const [groupsRes, scopesRes] = await Promise.all([
        getGroupsBySemester(sem).catch(() => []),
        api.get(`/semesters/${sem}/scopes`).catch(() => ({ data: [] })),
      ]);
      setGroups(Array.isArray(groupsRes) ? groupsRes : groupsRes.content || groupsRes.items || []);
      
      const scopeList = Array.isArray(scopesRes.data) ? scopesRes.data : scopesRes.data.content || [];
      setScopes(scopeList);
      if (scopeList.length > 0) setSelectedScopeId(scopeList[0].id || scopeList[0].scopeId);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal thêm sinh viên lẻ vào nhóm
  const handleOpenAddModal = async (group) => {
    setTargetGroup(group);
    setSelectedStudentId("");
    try {
      // Lấy danh sách sinh viên chưa có nhóm trong học kỳ/ngành
      const res = await api.get(`/semesters/${semester}/students?hasGroup=false`).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : res.data.content || res.data.items || [];
      setUnassignedStudents(list);
    } catch {
      setUnassignedStudents([]);
    }
    setAddModalOpen(true);
  };

  // Thực hiện thêm sinh viên vào nhóm
  const handleConfirmAddStudent = async (e) => {
    e.preventDefault();
    if (!targetGroup || !selectedStudentId) return;

    try {
      await addStudentToGroup(targetGroup.id, selectedStudentId);
      showToast("Đã thêm sinh viên vào nhóm thành công!");
      setAddModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Thêm sinh viên thất bại.", "error");
    }
  };

  // Đưa sinh viên ra khỏi nhóm
  const handleRemoveStudent = async (groupId, studentId, studentName) => {
    const reason = window.prompt(`Nhập lý do đưa sinh viên ${studentName} ra khỏi nhóm:`);
    if (!reason || !reason.trim()) return;

    try {
      await removeStudentFromGroup(groupId, studentId, reason.trim());
      showToast("Đã đưa sinh viên ra khỏi nhóm.");
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  // Chỉ định Leader trực tiếp
  const handleMakeLeader = async (groupId, userId, userName) => {
    if (!window.confirm(`Chỉ định ${userName} làm Leader mới của nhóm?`)) return;

    try {
      await assignGroupLeaderDirectly(groupId, userId);
      showToast(`Đã đổi Leader thành công sang ${userName}!`);
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Không thể đổi Leader.", "error");
    }
  };

  // Chốt danh sách scope
  const handleFinalize = async (scopeId) => {
    if (!window.confirm("Chốt danh sách phạm vi này?")) return;
    try {
      await finalizeScope(scopeId);
      showToast("Chốt danh sách thành công!");
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Chốt thất bại (còn nhóm dưới 3 người).", "error");
    }
  };

  // Mở lại danh sách scope
  const handleReopen = async (scopeId) => {
    const reason = window.prompt("Nhập lý do mở lại danh sách đã chốt:");
    if (!reason || !reason.trim()) return;

    try {
      await reopenScope(scopeId, reason.trim());
      showToast("Đã mở lại danh sách thành công!");
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Mở lại thất bại.", "error");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl flex justify-between items-center shadow-xs flex-wrap gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">MODERATOR · ĐIỀU PHỐI CHI TIẾT NHÓM (7.1)</span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">Quản lý thành viên, thêm/bớt sinh viên & Chỉ định Leader</h1>
        </div>
        <div className="flex gap-2">
          {scopes.map((sc) => {
            const scId = sc.id || sc.scopeId;
            const isFinalized = sc.finalized;
            return (
              <div key={scId} className="flex items-center gap-2 bg-[#FBF9F5] p-2 border border-[#E8E2D9] rounded-xl text-xs">
                <span className="font-bold">{sc.majorName || sc.major}</span>
                {isFinalized ? (
                  <button onClick={() => handleReopen(scId)} className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 cursor-pointer">
                    🔓 Mở lại
                  </button>
                ) : (
                  <button onClick={() => handleFinalize(scId)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 cursor-pointer">
                    🔒 Chốt
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH NHÓM VÀ THÀNH VIÊN */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#6B635B]">Đang tải danh sách nhóm...</div>
        ) : groups.length > 0 ? (
          groups.map((g) => {
            const members = g.members || [];
            const count = members.length;
            return (
              <div key={g.id} className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#E65100]">Nhóm: {g.groupCode}</h3>
                    <p className="text-[11px] text-[#6B635B]">Sĩ số: {count}/5 thành viên • Trạng thái: {g.status || "Hoạt động"}</p>
                  </div>
                  {count < 5 && (
                    <button
                      onClick={() => handleOpenAddModal(g)}
                      className="px-3.5 py-2 bg-orange-50 text-[#E65100] hover:bg-orange-100 font-bold rounded-xl border border-orange-200 text-xs cursor-pointer"
                    >
                      + Thêm sinh viên vào nhóm
                    </button>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m) => (
                    <div key={m.userId || m.id} className="p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#2C2825]">{m.userFullName || m.fullName} {m.isLeader && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Leader</span>}</p>
                        <p className="text-[10px] text-[#6B635B]">{m.userEmail || m.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!m.isLeader && (
                          <button
                            onClick={() => handleMakeLeader(g.id, m.userId || m.id, m.userFullName || m.fullName)}
                            title="Chỉ định làm Leader"
                            className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveStudent(g.id, m.userId || m.id, m.userFullName || m.fullName)}
                          title="Đưa ra khỏi nhóm"
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs text-[#6B635B] italic bg-white border border-[#E8E2D9] rounded-2xl">
            Chưa có nhóm nào trong học kỳ này.
          </div>
        )}
      </div>

      {/* MODAL THÊM SINH VIÊN VÀO NHÓM */}
      {addModalOpen && targetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleConfirmAddStudent} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">Thêm sinh viên vào nhóm {targetGroup.groupCode}</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} className="font-bold text-gray-400">✕</button>
            </div>
            <label className="block space-y-1 font-bold">
              Chọn sinh viên chưa có nhóm:
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              >
                <option value="">-- Chọn sinh viên --</option>
                {unassignedStudents.map((s) => (
                  <option key={s.id || s.studentCode} value={s.id || s.studentCode}>
                    {s.fullName} ({s.studentCode || s.email})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 bg-gray-100 font-bold rounded-xl">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl">Xác nhận thêm</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}