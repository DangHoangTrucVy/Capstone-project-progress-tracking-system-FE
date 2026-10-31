import { useEffect, useState } from "react";
import {
  getGroupsBySemester,
  addStudentToGroup,
  moveStudentToGroup,
  removeStudentFromGroup,
  mergeGroups,
  assignGroupLeaderDirectly,
  checkFinalizeScope,
  finalizeScope,
  reopenScope,
} from "../../services/moderatorService";
import api from "../../services/api";

export default function ModeratorGroupControl({ semester }) {
  const [groups, setGroups] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]); // Danh sách sinh viên chưa có nhóm
  const [loading, setLoading] = useState(true);

  // Modal thêm sinh viên vào nhóm
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Modal chuyển sinh viên sang nhóm khác
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingStudent, setMovingStudent] = useState(null);
  const [sourceGroupId, setSourceGroupId] = useState("");
  const [destinationGroupId, setDestinationGroupId] = useState("");

  // Modal gộp nhóm
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceGroups, setSourceGroups] = useState([]);
  const [selectedSourceGroupId, setSelectedSourceGroupId] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

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
      const [groupsRes, scopesRes, unassignedRes] = await Promise.all([
        getGroupsBySemester(sem).catch(() => []),
        api.get(`/semesters/${sem}/scopes`).catch(() => ({ data: [] })),
        api
          .get(`/semesters/${sem}/students?hasGroup=false`)
          .catch(() => ({ data: [] })),
      ]);

      const groupList = Array.isArray(groupsRes)
        ? groupsRes
        : groupsRes.content || groupsRes.items || [];
      setGroups(groupList);

      const scopeList = Array.isArray(scopesRes.data)
        ? scopesRes.data
        : scopesRes.data.content || [];
      setScopes(scopeList);

      const unassignedData = Array.isArray(unassignedRes.data)
        ? unassignedRes.data
        : unassignedRes.data.content || unassignedRes.data.items || [];
      setUnassignedList(unassignedData);
    } catch {
      setGroups([]);
      setUnassignedList([]);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal thêm sinh viên lẻ
  const handleOpenAddModal = async (group) => {
    setTargetGroup(group);
    setSelectedStudentId("");
    try {
      const res = await api.get(`/semesters/${semester}/students?hasGroup=false&size=100`).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : res.data.content || res.data.items || [];
      // Nhóm chỉ gồm sinh viên cùng ngành (backend trả OTHER_MAJOR nếu khác ngành) => chỉ hiện SV cùng ngành với nhóm.
      setUnassignedStudents(list.filter((s) => !group.majorCode || s.majorCode === group.majorCode));
    } catch {
      setUnassignedStudents([]);
    }
    setAddModalOpen(true);
  };

  const handleConfirmAddStudent = async (e) => {
    e.preventDefault();
    if (!targetGroup || !selectedStudentId) return;

    try {
      // selectedStudentId đang được truyền lên API
      await addStudentToGroup(targetGroup.id, selectedStudentId);
      showToast("Đã thêm sinh viên vào nhóm thành công!");
      setAddModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thêm sinh viên thất bại.",
        "error",
      );
    }
  };

  // Chuyển sinh viên sang nhóm khác
  const handleOpenMoveModal = (student, currentGrpId) => {
    setMovingStudent(student);
    setSourceGroupId(currentGrpId);
    setDestinationGroupId("");
    setMoveModalOpen(true);
  };

  const handleConfirmMoveStudent = async (e) => {
    e.preventDefault();
    if (!movingStudent || !destinationGroupId) return;

    try {
      await moveStudentToGroup(
        destinationGroupId,
        movingStudent.userId || movingStudent.id,
      );
      showToast("Đã chuyển sinh viên sang nhóm mới thành công!");
      setMoveModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Chuyển sinh viên thất bại.",
        "error",
      );
    }
  };

  // Gộp nhóm
  const handleOpenMergeModal = (group) => {
    setTargetGroup(group);
    setSelectedSourceGroupId("");
    setSourceGroups(groups.filter((g) => g.id !== group.id));
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async (e) => {
    e.preventDefault();
    if (!targetGroup || !selectedSourceGroupId) return;

    try {
      await mergeGroups(targetGroup.id, selectedSourceGroupId);
      showToast("Gộp nhóm thành công!");
      setMergeModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Gộp nhóm thất bại (vượt quá 5 thành viên hoặc lỗi ràng buộc).",
        "error",
      );
    }
  };

  // Đưa sinh viên ra khỏi nhóm
  const handleRemoveStudent = async (groupId, studentId, studentName) => {
    const reason = window.prompt(
      `Nhập lý do đưa sinh viên ${studentName} ra khỏi nhóm:`,
    );
    if (!reason || !reason.trim()) return;

    try {
      await removeStudentFromGroup(groupId, studentId, reason.trim());
      showToast("Đã đưa sinh viên ra khỏi nhóm.");
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại.",
        "error",
      );
    }
  };

  // Chỉ định Leader trực tiếp
  const handleMakeLeader = async (groupId, userId, userName) => {
    if (!window.confirm(`Chỉ định ${userName} làm Leader mới của nhóm?`))
      return;

    try {
      await assignGroupLeaderDirectly(groupId, userId);
      showToast(`Đã đổi Leader thành công sang ${userName}!`);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể đổi Leader.",
        "error",
      );
    }
  };

  const handleFinalize = async (scopeId) => {
    try {
      const checkRes = await checkFinalizeScope(scopeId).catch(() => null);
      if (checkRes && checkRes.blocked && checkRes.reason) {
        window.alert(`Không thể chốt danh sách: ${checkRes.reason}`);
        return;
      }
    } catch {}

    if (!window.confirm("Chốt danh sách phạm vi ngành này?")) return;
    try {
      await finalizeScope(scopeId);
      showToast("Chốt danh sách thành công!");
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Chốt thất bại.", "error");
    }
  };

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
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl flex justify-between items-center shadow-xs flex-wrap gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
            MODERATOR · ĐIỀU PHỐI CHI TIẾT NHÓM (7.1)
          </span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">
            Quản lý thành viên, thêm/bớt, chuyển nhóm, gộp nhóm & Chỉ định
            Leader
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {scopes.map((sc) => {
            const scId = sc.id || sc.scopeId;
            const isFinalized = sc.finalized;
            return (
              <div
                key={scId}
                className="flex items-center gap-2 bg-[#FBF9F5] p-2 border border-[#E8E2D9] rounded-xl text-xs"
              >
                <span className="font-bold">{sc.majorName || sc.major}</span>
                {isFinalized ? (
                  <button
                    onClick={() => handleReopen(scId)}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 cursor-pointer"
                  >
                    🔓 Mở lại
                  </button>
                ) : (
                  <button
                    onClick={() => handleFinalize(scId)}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    🔒 Chốt
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 💡 DANH SÁCH SINH VIÊN CHƯA CÓ NHÓM DẠNG BẢNG (STT, MSSV, HỌ VÀ TÊN) */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-[#2C2825]">
            🎓 Danh sách sinh viên chưa có nhóm ({unassignedList.length})
          </h3>
          <p className="text-[11px] text-[#6B635B]">
            Các sinh viên lẻ chưa thuộc nhóm nào trong học kỳ này để Moderator
            chủ động phân bổ.
          </p>
        </div>

        <div className="border border-[#E8E2D9] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                <th className="p-3 font-black uppercase w-16 text-center">
                  STT
                </th>
                <th className="p-3 font-black uppercase">MSSV</th>
                <th className="p-3 font-black uppercase">Họ và tên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]">
              {unassignedList.length > 0 ? (
                unassignedList.map((stu, index) => (
                  <tr
                    key={stu.id || stu.studentCode}
                    className="hover:bg-[#FBF9F5]/70 transition"
                  >
                    <td className="p-3 text-center font-bold text-[#6B635B]">
                      {index + 1}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#E65100]">
                      {stu.studentCode || stu.code || "—"}
                    </td>
                    <td className="p-3 font-bold text-[#2C2825]">
                      {stu.fullName || stu.name || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="p-8 text-center text-[#6B635B] italic"
                  >
                    Tuyệt vời! Tất cả sinh viên trong học kỳ đều đã có nhóm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DANH SÁCH CÁC NHÓM ĐỒ ÁN */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-[#2C2825]">
          👥 Danh sách chi tiết các nhóm
        </h3>
        {loading ? (
          <div className="text-center py-12 text-xs text-[#6B635B]">
            Đang tải danh sách nhóm...
          </div>
        ) : groups.length > 0 ? (
          groups.map((g) => {
            const members = g.members || [];
            const count = members.length;
            return (
              <div
                key={g.id}
                className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#E65100]">
                      Nhóm: {g.groupCode} ({g.name})
                    </h3>
                    <p className="text-[11px] text-[#6B635B]">
                      Sĩ số: {count}/5 thành viên • Trạng thái:{" "}
                      {g.status || "Hoạt động"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {count < 5 && (
                      <button
                        onClick={() => handleOpenAddModal(g)}
                        className="px-3 py-1.5 bg-orange-50 text-[#E65100] hover:bg-orange-100 font-bold rounded-xl border border-orange-200 text-xs cursor-pointer"
                      >
                        + Thêm thành viên
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenMergeModal(g)}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-xl border border-purple-200 text-xs cursor-pointer"
                    >
                      🔗 Gộp nhóm khác vào
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m) => (
                    <div
                      key={m.userId || m.id}
                      className="p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#2C2825]">
                          {m.userFullName || m.fullName}{" "}
                          {m.isLeader && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                              Leader
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#6B635B]">
                          {m.userEmail || m.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenMoveModal(m, g.id)}
                          title="Chuyển sang nhóm khác"
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          ⇄
                        </button>
                        {!m.isLeader && (
                          <button
                            onClick={() =>
                              handleMakeLeader(
                                g.id,
                                m.userId || m.id,
                                m.userFullName || m.fullName,
                              )
                            }
                            title="Chỉ định làm Leader"
                            className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleRemoveStudent(
                              g.id,
                              m.userId || m.id,
                              m.userFullName || m.fullName,
                            )
                          }
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
          <form
            onSubmit={handleConfirmAddStudent}
            className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Thêm sinh viên vào nhóm {targetGroup.groupCode}
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="font-bold text-gray-400"
              >
                ✕
              </button>
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
                  <option key={s.userId || s.enrollmentId} value={s.userId}>
                    {s.fullName} ({s.studentCode || s.email})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl"
              >
                Xác nhận thêm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CHUYỂN SINH VIÊN SANG NHÓM KHÁC */}
      {moveModalOpen && movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleConfirmMoveStudent}
            className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Chuyển sinh viên:{" "}
                {movingStudent.userFullName || movingStudent.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="font-bold text-gray-400"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-1 font-bold">
              Chọn nhóm đích để chuyển đến:
              <select
                value={destinationGroupId}
                onChange={(e) => setDestinationGroupId(e.target.value)}
                required
                className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              >
                <option value="">-- Chọn nhóm đích --</option>
                {groups
                  .filter((g) => g.id !== sourceGroupId)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      Nhóm {g.groupCode} ({g.members?.length || 0}/5 thành viên)
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl"
              >
                Xác nhận chuyển
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL GỘP NHÓM */}
      {mergeModalOpen && targetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleConfirmMerge}
            className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Gộp nhóm vào nhóm {targetGroup.groupCode}
              </h3>
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="font-bold text-gray-400"
              >
                ✕
              </button>
            </div>
            <label className="block space-y-1 font-bold">
              Chọn nhóm nguồn cần gộp (Thành viên sẽ được chuyển sang nhóm{" "}
              {targetGroup.groupCode}):
              <select
                value={selectedSourceGroupId}
                onChange={(e) => setSelectedSourceGroupId(e.target.value)}
                required
                className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              >
                <option value="">-- Chọn nhóm nguồn cần gộp --</option>
                {sourceGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Nhóm {g.groupCode} ({g.members?.length || 0} thành viên)
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-[#6B635B] italic">
              Lưu ý: Tổng số thành viên sau khi gộp không được vượt quá 5 người.
            </p>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl"
              >
                Xác nhận gộp nhóm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
