import { useEffect, useState } from "react";
import {
  getGroupsBySemester,
  addStudentToGroup,
  moveStudentToGroup,
  removeStudentFromGroup,
  mergeGroups,
  assignGroupLeaderDirectly,
  createGroupForStudents,
  checkFinalizeScope,
  finalizeScope,
  reopenScope,
} from "../../services/moderatorService";
import api from "../../services/api";

export default function ModeratorGroupControl({ semester }) {
  const [groups, setGroups] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
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

  // Modal tạo nhóm mới cho sinh viên lẻ & chỉ định Leader
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLeaderId, setNewGroupLeaderId] = useState("");
  const [newGroupMemberIds, setNewGroupMemberIds] = useState([]);

  // Modal nhập lý do khi đưa sinh viên ra khỏi nhóm
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingTarget, setRemovingTarget] = useState({ groupId: null, studentId: null, studentName: "" });
  const [removeReason, setRemoveReason] = useState("");

  // Modal nhập lý do khi mở lại danh sách
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopeningScopeId, setReopeningScopeId] = useState(null);
  const [reopenReason, setReopenReason] = useState("");

  // Modal xác nhận chốt danh sách
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [scopeToFinalize, setScopeToFinalize] = useState(null);

  // Modal xác nhận chỉ định trưởng nhóm (Thay thế window.confirm)
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [leaderTarget, setLeaderTarget] = useState({ groupId: null, userId: null, userName: "" });

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
      if (scopeList.length > 0 && !selectedScopeId) {
        setSelectedScopeId(scopeList[0].id || scopeList[0].scopeId);
      }

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

  const handleOpenAddModal = async (group) => {
    setTargetGroup(group);
    setSelectedStudentId("");
    try {
      const res = await api.get(`/semesters/${semester}/students?hasGroup=false&size=100`).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : res.data.content || res.data.items || [];
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

  const handleConfirmCreateGroup = async (e) => {
    e.preventDefault();
    if (!selectedScopeId || !newGroupName.trim() || !newGroupLeaderId) {
      showToast("Vui lòng điền đủ tên nhóm, chọn Trưởng nhóm và ít nhất một thành viên.", "error");
      return;
    }

    try {
      await createGroupForStudents(selectedScopeId, {
        name: newGroupName.trim(),
        leaderUserId: newGroupLeaderId,
        memberUserIds: newGroupMemberIds.length > 0 ? newGroupMemberIds : [newGroupLeaderId],
      });
      showToast("Tạo nhóm mới và chỉ định Trưởng nhóm thành công!");
      setCreateGroupModalOpen(false);
      setNewGroupName("");
      setNewGroupLeaderId("");
      setNewGroupMemberIds([]);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể tạo nhóm mới.",
        "error",
      );
    }
  };

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

  const handleOpenRemoveModal = (groupId, studentId, studentName) => {
    setRemovingTarget({ groupId, studentId, studentName });
    setRemoveReason("");
    setRemoveModalOpen(true);
  };

  const handleConfirmRemoveStudent = async (e) => {
    e.preventDefault();
    if (!removeReason.trim()) return;

    try {
      await removeStudentFromGroup(removingTarget.groupId, removingTarget.studentId, removeReason.trim());
      showToast("Đã đưa sinh viên ra khỏi nhóm.");
      setRemoveModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại.",
        "error",
      );
    }
  };

  // Mở modal xác nhận chỉ định Trưởng nhóm
  const handleMakeLeader = (groupId, userId, userName) => {
    setLeaderTarget({ groupId, userId, userName });
    setLeaderModalOpen(true);
  };

  // Thực thi gọi API đổi Trưởng nhóm
  const executeMakeLeader = async () => {
    if (!leaderTarget.groupId || !leaderTarget.userId) return;
    try {
      await assignGroupLeaderDirectly(leaderTarget.groupId, leaderTarget.userId);
      showToast(`Đã đổi Trưởng nhóm thành công sang ${leaderTarget.userName}!`);
      setLeaderModalOpen(false);
      loadData(semester);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể đổi Trưởng nhóm.",
        "error",
      );
      setLeaderModalOpen(false);
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

    setScopeToFinalize(scopeId);
    setConfirmModalOpen(true);
  };

  const executeFinalize = async () => {
    if (!scopeToFinalize) return;
    try {
      await finalizeScope(scopeToFinalize);
      showToast("Chốt danh sách thành công!");
      setConfirmModalOpen(false);
      setScopeToFinalize(null);
      loadData(semester);
    } catch (error) {
      showToast(error.response?.data?.message || "Chốt thất bại.", "error");
      setConfirmModalOpen(false);
    }
  };

  const handleOpenReopenModal = (scopeId) => {
    setReopeningScopeId(scopeId);
    setReopenReason("");
    setReopenModalOpen(true);
  };

  const handleConfirmReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    try {
      await reopenScope(reopeningScopeId, reopenReason.trim());
      showToast("Đã mở lại danh sách thành công!");
      setReopenModalOpen(false);
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
            ĐIỀU PHỐI VIÊN · ĐIỀU PHỐI CHI TIẾT NHÓM
          </span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">
            Quản lý thành viên, thêm/bớt, chuyển nhóm, gộp nhóm & Chỉ định Trưởng nhóm
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {unassignedList.length > 0 && (
            <button
              onClick={() => setCreateGroupModalOpen(true)}
              className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <span>✨</span>
              <span>Tạo nhóm cho SV lẻ</span>
            </button>
          )}

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
                    onClick={() => handleOpenReopenModal(scId)}
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

      {/* DANH SÁCH SINH VIÊN CHƯA CÓ NHÓM */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-[#2C2825]">
            🎓 Danh sách sinh viên chưa có nhóm ({unassignedList.length})
          </h3>
          <p className="text-[11px] text-[#6B635B]">
            Các sinh viên lẻ chưa thuộc nhóm nào trong học kỳ này để điều phối viên chủ động phân bổ.
          </p>
        </div>

        <div className="border border-[#E8E2D9] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                <th className="p-3 font-black uppercase w-16 text-center">STT</th>
                <th className="p-3 font-black uppercase">Mã số sinh viên</th>
                <th className="p-3 font-black uppercase">Họ và tên</th>
                <th className="p-3 font-black uppercase">Email</th>
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
                    <td className="p-3 font-mono font-bold text-[#171311]">
                      {stu.studentCode || stu.code || "—"}
                    </td>
                    <td className="p-3 font-bold text-[#2C2825]">
                      {stu.fullName || stu.name || "—"}
                    </td>
                    <td className="p-3 text-[#6B635B]">
                      {stu.email || stu.userEmail || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
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
                      {g.locked || g.isLocked ? "Đã khóa" : "Đang mở"}
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
                  {members.map((m) => {
                    const isLeader = Boolean(m.isLeader || m.leader || m.role === "LEADER" || m.position === "LEADER");
                    const studentCode = m.studentCode || m.code || m.userCode || "";
                    return (
                      <div
                        key={m.userId || m.id}
                        className="p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#462309] flex items-center gap-1.5 flex-wrap">
                            <span>{m.userFullName || m.fullName}</span>
                            {isLeader ? (
                              <span className="text-[9.5px] bg-cyan-400 text-shadow-cyan-400 px-1.5 py-0.5 rounded font-bold">
                                Trưởng nhóm
                              </span>
                            ) : (
                              <span className="text-[9.5px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                                Thành viên
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-[#080706] font-stretch-75% font-bold mt-1">
                           MSSV: {studentCode}
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
                          {!isLeader && (
                            <button
                              onClick={() =>
                                handleMakeLeader(
                                  g.id,
                                  m.userId || m.id,
                                  m.userFullName || m.fullName,
                                )
                              }
                              title="Chỉ định làm Trưởng nhóm"
                              className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              ⭐
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleOpenRemoveModal(
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
                    );
                  })}
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

      {/* MODAL TẠO NHÓM MỚI CHO SINH VIÊN LẺ & CHỈ ĐỊNH LEADER */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmCreateGroup}
            className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-7 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Tạo nhóm mới cho sinh viên chưa có nhóm
              </h3>
              <button
                type="button"
                onClick={() => setCreateGroupModalOpen(false)}
                className="font-bold text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1 font-bold">
                Chọn phạm vi ngành (Scope):
                <select
                  value={selectedScopeId}
                  onChange={(e) => setSelectedScopeId(e.target.value)}
                  required
                  className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] outline-none"
                >
                  {scopes.map((sc) => {
                    const scId = sc.id || sc.scopeId;
                    return (
                      <option key={scId} value={scId}>
                        {sc.majorName || sc.major}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block space-y-1 font-bold">
                Tên nhóm mới:
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm 01 hoặc SE_Group_01"
                  required
                  className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] outline-none"
                />
              </label>

              <label className="block space-y-1 font-bold">
                Chỉ định Trưởng nhóm:
                <select
                  value={newGroupLeaderId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setNewGroupLeaderId(lId);
                    if (lId && !newGroupMemberIds.includes(lId)) {
                      setNewGroupMemberIds([...newGroupMemberIds, lId]);
                    }
                  }}
                  required
                  className="w-full mt-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] outline-none"
                >
                  <option value="">-- Chọn sinh viên làm Trưởng nhóm --</option>
                  {unassignedList.map((s) => (
                    <option key={s.userId || s.id} value={s.userId || s.id}>
                      {s.fullName} ({s.studentCode || s.email})
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-1 font-bold">
                <p>Chọn các thành viên tham gia nhóm (Tối đa 5 người):</p>
                <div className="max-h-40 overflow-y-auto border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F5] space-y-2">
                  {unassignedList.map((s) => {
                    const sId = s.userId || s.id;
                    const isChecked = newGroupMemberIds.includes(sId);
                    return (
                      <label key={sId} className="flex items-center gap-2 cursor-pointer font-normal">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (newGroupMemberIds.length >= 5) {
                                showToast("Mỗi nhóm tối đa 5 thành viên.", "error");
                                return;
                              }
                              setNewGroupMemberIds([...newGroupMemberIds, sId]);
                            } else {
                              if (sId === newGroupLeaderId) {
                                showToast("Không thể bỏ chọn Trưởng nhóm khỏi danh sách thành viên.", "error");
                                return;
                              }
                              setNewGroupMemberIds(newGroupMemberIds.filter((id) => id !== sId));
                            }
                          }}
                          className="rounded border-[#E8E2D9] text-[#E65100] focus:ring-0"
                        />
                        <span>{s.fullName} — <strong className="font-mono">{s.studentCode}</strong> ({s.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setCreateGroupModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer transition"
              >
                Xác nhận tạo nhóm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL THÊM SINH VIÊN VÀO NHÓM */}
      {addModalOpen && targetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
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
                className="font-bold text-gray-400 cursor-pointer"
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
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận thêm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CHUYỂN SINH VIÊN SANG NHÓM KHÁC */}
      {moveModalOpen && movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
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
                className="font-bold text-gray-400 cursor-pointer"
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
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận chuyển
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL GỘP NHÓM */}
      {mergeModalOpen && targetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
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
                className="font-bold text-gray-400 cursor-pointer"
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
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận gộp nhóm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NHẬP LÝ DO ĐƯA SINH VIÊN RA KHỎI NHÓM */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmRemoveStudent}
            className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Đưa sinh viên ra khỏi nhóm
              </h3>
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="font-bold text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[#6B635B]">
              Bạn đang đưa sinh viên <strong className="text-[#2C2825]">{removingTarget.studentName}</strong> ra khỏi nhóm. Vui lòng nhập lý do bên dưới:
            </p>
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              required
              rows={3}
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] outline-none"
            />
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận đưa ra
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NHẬP LÝ DO MỞ LẠI DANH SÁCH */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmReopen}
            className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Mở lại danh sách đã chốt
              </h3>
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="font-bold text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[#6B635B]">
              Vui lòng nhập lý do mở lại danh sách phạm vi ngành này:
            </p>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Nhập lý do mở lại..."
              required
              rows={3}
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] outline-none"
            />
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận mở lại
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHỐT DANH SÁCH */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Xác nhận chốt danh sách
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="font-bold text-gray-400 hover:text-[#2C2825] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start gap-3.5 py-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg shrink-0">
                🔒
              </div>
              <div>
                <p className="font-bold text-[#2C2825] text-sm">
                  Bạn có chắc chắn muốn chốt danh sách phạm vi ngành này không?
                </p>
                <p className="text-[11px] text-[#6B635B] mt-1">
                  Sau khi chốt, các thay đổi lớn sẽ bị hạn chế theo quy định của học kỳ.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#6B635B] font-bold rounded-xl cursor-pointer transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeFinalize}
                className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                Xác nhận chốt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHỈ ĐỊNH TRƯỞNG NHÓM (THAY THẾ WINDOW.CONFIRM) */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Xác nhận chỉ định Trưởng nhóm
              </h3>
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="font-bold text-gray-400 hover:text-[#2C2825] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start gap-3.5 py-1">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-lg shrink-0">
                ⭐
              </div>
              <div>
                <p className="font-bold text-[#2C2825] text-sm">
                  Chỉ định <span className="text-[#E65100]">{leaderTarget.userName}</span> làm Trưởng nhóm mới của nhóm?
                </p>
                <p className="text-[11px] text-[#6B635B] mt-1">
                  Quyền trưởng nhóm cũ sẽ được thay thế bằng thành viên này ngay lập tức.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#6B635B] font-bold rounded-xl cursor-pointer transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeMakeLeader}
                className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}