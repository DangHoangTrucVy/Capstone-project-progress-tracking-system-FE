import { useEffect, useState } from "react";
import {
  getSemesterRoomsForMod,
  addStudentToRoomByMod,
  moveStudentToRoomByMod,
  removeStudentFromRoomByMod,
  mergeRoomsByMod,
  assignLeaderByMod,
  getPendingFinalizeRequests,
} from "../../services/moderatorService";
import {
  createRoomsForMajor,
  decideFinalizeRequest,
} from "../../services/roomService";
import api from "../../services/api";

export default function ModeratorGroupControl({
  semester,
  initialFilter = "ALL",
  onGroupUpdated,
}) {
  const [rooms, setRooms] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
  const [ineligibleList, setIneligibleList] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc nâng cao: ALL | HAS_MEMBERS | EMPTY | FULL | PENDING | UNASSIGNED | INELIGIBLE
  const [filterStatus, setFilterStatus] = useState(initialFilter);

  // Modal Gửi Hồ Sơ Sinh Viên Lẻ Tới Phòng Thiếu Thành Viên
  const [sendProfileModalOpen, setSendProfileModalOpen] = useState(false);
  const [selectedStudentForRecommend, setSelectedStudentForRecommend] =
    useState(null);
  const [targetRoomForRecommendId, setTargetRoomForRecommendId] = useState("");

  // Modal Tạo Hàng Loạt Phòng
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roomCount, setRoomCount] = useState(10);
  const [minRoomSize, setMinRoomSize] = useState(3);
  const [selectedMajorId, setSelectedMajorId] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [targetRoom, setTargetRoom] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingStudent, setMovingStudent] = useState(null);
  const [sourceRoomId, setSourceRoomId] = useState("");
  const [destinationRoomId, setDestinationRoomId] = useState("");

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedSourceRoomId, setSelectedSourceRoomId] = useState("");

  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingTarget, setRemovingTarget] = useState({
    roomId: null,
    userId: null,
    studentName: "",
  });
  const [removeReason, setRemoveReason] = useState("");

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

  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  const loadData = async (sem) => {
    setLoading(true);
    try {
      const [roomsRes, pendingRes, studentsRes, semDetailRes, planRes] =
        await Promise.all([
          getSemesterRoomsForMod(sem).catch(() => []),
          getPendingFinalizeRequests(sem).catch(() => []),
          api.get(`/semesters/${sem}/students`).catch(() => ({ data: [] })),
          api.get(`/semesters/${sem}`).catch(() => ({ data: null })),
          api.get(`/semesters/${sem}/rooms/plan`).catch(() => ({ data: [] })),
        ]);

      const roomList = Array.isArray(roomsRes)
        ? roomsRes
        : roomsRes.content || roomsRes.items || [];
      setRooms(roomList);

      const pendingList = Array.isArray(pendingRes)
        ? pendingRes
        : pendingRes.content || [];
      setPendingRequests(pendingList);

      const allStudents = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data.content || studentsRes.data.items || [];

      // Lọc danh sách Sinh viên đủ điều kiện chưa có phòng
      const unassigned = allStudents.filter(
        (s) =>
          s.eligibility !== "INELIGIBLE" &&
          s.eligible !== false &&
          !s.hasGroup &&
          !s.roomId,
      );
      setUnassignedList(unassigned);

      // Lọc danh sách Sinh viên Không đủ điều kiện
      const ineligible = allStudents.filter(
        (s) => s.eligibility === "INELIGIBLE" || s.eligible === false,
      );
      setIneligibleList(ineligible);

      let majorList =
        planRes.data ||
        semDetailRes.data?.majors ||
        semDetailRes.data?.majorList ||
        [];
      if (!Array.isArray(majorList) && majorList.content)
        majorList = majorList.content;

      if (!majorList || majorList.length === 0) {
        const uniqueMajorsMap = {};
        roomList.forEach((r) => {
          const mId = r.majorId || r.id;
          if (mId && !uniqueMajorsMap[mId]) {
            uniqueMajorsMap[mId] = {
              id: mId,
              majorId: mId,
              name: r.majorName || r.name,
              code: r.majorCode || r.code,
            };
          }
        });
        majorList = Object.values(uniqueMajorsMap);
      }

      setMajors(majorList);
      if (majorList.length > 0) {
        const firstId =
          majorList[0].id || majorList[0].majorId || majorList[0].code;
        setSelectedMajorId(firstId);
      }
    } catch {
      setRooms([]);
      setUnassignedList([]);
      setIneligibleList([]);
    } finally {
      setLoading(false);
    }
  };

  // Moderator gửi gợi ý Profile sinh viên lẻ đến Leader của Room chưa đủ thành viên
  const handleConfirmSendProfile = async (e) => {
    e.preventDefault();
    if (!selectedStudentForRecommend || !targetRoomForRecommendId) return;

    try {
      await api.post(`/rooms/${targetRoomForRecommendId}/recommend-student`, {
        studentId:
          selectedStudentForRecommend.userId || selectedStudentForRecommend.id,
      });
      showToast(
        `Đã gửi Hồ sơ của ${selectedStudentForRecommend.fullName} tới Trưởng nhóm!`,
      );
      setSendProfileModalOpen(false);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể gửi hồ sơ sinh viên.",
        "error",
      );
    }
  };

  const handleOpenCreateModal = () => {
    if (majors.length > 0) {
      const firstId = majors[0].id || majors[0].majorId || majors[0].code;
      setSelectedMajorId(firstId);
    }
    setCreateModalOpen(true);
  };

  const handleBatchCreateRooms = async (e) => {
    e.preventDefault();
    const count = parseInt(roomCount, 10);
    if (!count || count <= 0) {
      showToast("Số lượng phòng phải lớn hơn 0", "error");
      return;
    }

    if (!selectedMajorId) {
      showToast("Vui lòng chọn ngành học!", "error");
      return;
    }

    try {
      await createRoomsForMajor(semester, {
        majorId: selectedMajorId,
        count: count,
        minSize: parseInt(minRoomSize, 10) || 3,
      });
      showToast(`Đã tự động tạo ${count} Phòng thành công!`);
      setCreateModalOpen(false);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể tạo danh sách Phòng.",
        "error",
      );
    }
  };

  const handleDecideFinalize = async (roomId, approved) => {
    try {
      await decideFinalizeRequest(roomId, {
        approved,
        reason: approved ? "" : "Chưa đạt yêu cầu của Người điều phối",
      });
      showToast(
        approved
          ? "Đã duyệt chốt Phòng thành Nhóm chính thức!"
          : "Đã từ chối báo chốt.",
      );
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại.",
        "error",
      );
    }
  };

  const handleConfirmAddStudent = async (e) => {
    e.preventDefault();
    if (!targetRoom || !selectedUserId) return;
    try {
      await addStudentToRoomByMod(
        targetRoom.id || targetRoom.roomId,
        selectedUserId,
      );
      showToast("Đã thêm sinh viên vào Phòng!");
      setAddModalOpen(false);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(error.response?.data?.message || "Thêm thất bại.", "error");
    }
  };

  const handleConfirmMoveStudent = async (e) => {
    e.preventDefault();
    if (!movingStudent || !destinationRoomId) return;
    try {
      await moveStudentToRoomByMod(
        destinationRoomId,
        movingStudent.userId || movingStudent.id,
      );
      showToast("Đã chuyển sinh viên sang Phòng mới!");
      setMoveModalOpen(false);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(error.response?.data?.message || "Chuyển thất bại.", "error");
    }
  };

  const handleConfirmMerge = async (e) => {
    e.preventDefault();
    if (!targetRoom || !selectedSourceRoomId) return;
    try {
      await mergeRoomsByMod(
        targetRoom.id || targetRoom.roomId,
        selectedSourceRoomId,
      );
      showToast("Gộp Phòng thành công!");
      setMergeModalOpen(false);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(error.response?.data?.message || "Gộp thất bại.", "error");
    }
  };

  const handleConfirmRemoveStudent = async (e) => {
    e.preventDefault();
    if (!removeReason.trim()) return;
    try {
      await removeStudentFromRoomByMod(
        removingTarget.roomId,
        removingTarget.userId,
        removeReason.trim(),
      );
      showToast("Đã đưa sinh viên ra khỏi Phòng.");
      setRemoveModalOpen(false);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Thực hiện thất bại.",
        "error",
      );
    }
  };

  const handleMakeLeader = async (roomId, userId, userName) => {
    if (!window.confirm(`Chỉ định ${userName} làm Trưởng nhóm mới?`)) return;
    try {
      await assignLeaderByMod(roomId, userId);
      showToast(`Đã chỉ định ${userName} làm Trưởng nhóm!`);
      loadData(semester);
      if (onGroupUpdated) onGroupUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể chỉ định Trưởng nhóm.",
        "error",
      );
    }
  };

  const formatRoomName = (name) => {
    if (!name) return "";
    return name.replace(/^Room\s*/i, "Phòng ");
  };

  // LOGIC LỌC PHÒNG
  const filteredRooms = rooms.filter((r) => {
    const memCount = r.members?.length || 0;
    const maxSize = r.maxSize || 5;
    const isPending = pendingRequests.some(
      (p) => (p.id || p.roomId) === (r.id || r.roomId),
    );

    if (filterStatus === "HAS_MEMBERS") return memCount > 0;
    if (filterStatus === "EMPTY") return memCount === 0;
    if (filterStatus === "FULL") return memCount >= maxSize || r.full === true;
    if (filterStatus === "PENDING")
      return isPending || r.finalizeStatus === "PENDING";
    return true; // "ALL"
  });

  return (
    <div className="p-8 space-y-6 text-xs font-sans">
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-white ${toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"}`}
        >
          {toast.message}
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-lg">
            ĐIỀU PHỐI CHI TIẾT CÁC PHÒNG & SINH VIÊN LẺ
          </span>
          <h2 className="text-lg font-black text-[#2C2825] mt-1">
            Danh sách Phòng & Quyền điều phối của Người điều phối
          </h2>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer shadow-md transition"
        >
          ➕ Tạo Phòng Hàng Loạt
        </button>
      </div>

      {/* THANH BỘ LỌC TRẠNG THÁI NÂNG CAO */}
      <div className="bg-white p-3 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-2 flex-wrap">
        <span className="font-bold text-[#6B635B] px-3">Bộ lọc phân loại:</span>
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "ALL"
              ? "bg-[#2C2825] text-white shadow-xs"
              : "bg-[#FBF9F5] text-[#6B635B] hover:bg-[#F3EFEA]"
          }`}
        >
          Tất cả Phòng ({rooms.length})
        </button>

        <button
          onClick={() => setFilterStatus("HAS_MEMBERS")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "HAS_MEMBERS"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-[#FBF9F5] text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          Phòng có người (
          {rooms.filter((r) => (r.members?.length || 0) > 0).length})
        </button>

        <button
          onClick={() => setFilterStatus("EMPTY")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "EMPTY"
              ? "bg-gray-600 text-white shadow-xs"
              : "bg-[#FBF9F5] text-gray-600 hover:bg-gray-100"
          }`}
        >
          Phòng trống (
          {rooms.filter((r) => (r.members?.length || 0) === 0).length})
        </button>

        <button
          onClick={() => setFilterStatus("FULL")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "FULL"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-[#FBF9F5] text-purple-700 hover:bg-purple-50"
          }`}
        >
          Phòng đã đủ (
          {
            rooms.filter(
              (r) => (r.members?.length || 0) >= (r.maxSize || 5) || r.full,
            ).length
          }
          )
        </button>

        <button
          onClick={() => setFilterStatus("UNASSIGNED")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "UNASSIGNED"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          SV chưa vào phòng ({unassignedList.length})
        </button>

        <button
          onClick={() => setFilterStatus("INELIGIBLE")}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            filterStatus === "INELIGIBLE"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
           SV không đủ điều kiện ({ineligibleList.length})
        </button>

        {pendingRequests.length > 0 && (
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
              filterStatus === "PENDING"
                ? "bg-[#E65100] text-white shadow-xs"
                : "bg-orange-50 text-[#E65100] hover:bg-orange-100"
            }`}
          >
            Chờ duyệt chốt ({pendingRequests.length})
          </button>
        )}
      </div>

      {/* DANH SÁCH SINH VIÊN ĐỦ ĐIỀU KIỆN NHƯNG CHƯA CÓ PHÒNG (NÚT GỬI PROFILE) */}
      {filterStatus === "UNASSIGNED" && (
        <div className="bg-white p-6 rounded-3xl border border-amber-200 space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-amber-900">
            Danh sách Sinh viên đủ điều kiện chưa vào phòng sau Chốt Đợt 1 (
            {unassignedList.length})
          </h3>
          <p className="text-[11px] text-[#6B635B]">
            Moderator có thể chọn và gửi Hồ sơ (Profile) của các sinh viên này
            trực tiếp đến Trưởng nhóm các Phòng chưa đủ thành viên.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {unassignedList.map((s) => (
              <div
                key={s.userId || s.id}
                className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-[#2C2825]">{s.fullName}</p>
                  <p className="text-[10px] text-[#6B635B]">
                    MSSV: {s.studentCode || s.code} • Ngành:{" "}
                    {s.majorCode || s.majorName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudentForRecommend(s);
                    setTargetRoomForRecommendId("");
                    setSendProfileModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  ✉️ Gửi Profile tới Phòng
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH SINH VIÊN KHÔNG ĐỦ ĐIỀU KIỆN (HIỂN THỊ LÝ DO CHÍNH XÁC TỪ BE) */}
      {filterStatus === "INELIGIBLE" && (
        <div className="bg-white p-6 rounded-3xl border border-red-200 space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-red-700">
             Danh sách Sinh viên Không đủ điều kiện tham gia ghép nhóm (
            {ineligibleList.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ineligibleList.map((s) => {
              // Map thuộc tính reason trực tiếp từ Swagger API backend trả về
              const reasonText =
                s.reason ||
                s.ineligibleReason ||
                s.eligibilityReason ||
                "Nợ môn điều kiện / Thiếu tín chỉ tích lũy";

              return (
                <div
                  key={s.userId || s.id || s.enrollmentId}
                  className="p-4 bg-red-50/50 border border-red-200 rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-red-900">{s.fullName}</p>
                    <p className="text-[10px] text-red-700">
                      MSSV: {s.studentCode || s.code} • Ngành:{" "}
                      {s.majorCode || s.majorName}
                    </p>
                    <p className="text-[10px] text-red-600 font-bold mt-1">
                      Lý do: {reasonText}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold">
                    Bị khóa ghép nhóm
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KHỐI CÁC PHÒNG CHỜ DUYỆT BÁO CHỐT */}
      {pendingRequests.length > 0 &&
        (filterStatus === "ALL" || filterStatus === "PENDING") && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-black text-sm text-amber-900">
              🔔 Các Phòng chờ duyệt Báo chốt ({pendingRequests.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id || req.roomId}
                  className="bg-white p-4 rounded-2xl border border-amber-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-[#E65100]">
                      {formatRoomName(req.name)} (
                      {req.majorName || req.majorCode || req.major})
                    </p>
                    <p className="text-[10px] text-[#6B635B]">
                      Sĩ số:{" "}
                      {req.memberCount || req.members?.length || req.size || 0}{" "}
                      người
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleDecideFinalize(req.id || req.roomId, true)
                      }
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Duyệt chốt
                    </button>
                    <button
                      onClick={() =>
                        handleDecideFinalize(req.id || req.roomId, false)
                      }
                      className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* DANH SÁCH CHI TIẾT PHÒNG ĐÃ QUA LỌC */}
      {filterStatus !== "UNASSIGNED" && filterStatus !== "INELIGIBLE" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[#6B635B]">
              Đang tải danh sách Phòng...
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((r) => {
              const members = r.members || [];
              const rId = r.id || r.roomId;
              const displayName = formatRoomName(r.name);
              return (
                <div
                  key={rId}
                  className="bg-white border border-[#E8E2D9] rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-black text-[#E65100] flex items-center gap-2">
                        <span>
                          {r.groupCode
                            ? `Nhóm: ${r.groupCode} (${displayName})`
                            : displayName}
                        </span>
                        {members.length === 0 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-lg">
                            Trống
                          </span>
                        )}
                        {members.length >= (r.maxSize || 5) && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-lg">
                            Đã đủ
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-[#6B635B]">
                        Ngành: {r.majorName || r.majorCode || r.major} • Sĩ số:{" "}
                        {members.length}/{r.maxSize || 5} thành viên
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTargetRoom(r);
                          setSelectedUserId("");
                          setAddModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-orange-50 text-[#E65100] font-bold rounded-xl border border-orange-200 cursor-pointer"
                      >
                        + Thêm SV lẻ
                      </button>
                      <button
                        onClick={() => {
                          setTargetRoom(r);
                          setSelectedSourceRoomId("");
                          setMergeModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-200 cursor-pointer"
                      >
                        Gộp Phòng khác vào
                      </button>
                    </div>
                  </div>

                  {members.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((m) => {
                        const isLeader = Boolean(
                          m.userId === r.leaderId ||
                          m.isLeader ||
                          m.role === "LEADER",
                        );
                        const uId = m.userId || m.id;
                        return (
                          <div
                            key={uId}
                            className="p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold text-[#2C2825] flex items-center gap-1.5">
                                <span>{m.fullName || m.userFullName}</span>
                                {isLeader && (
                                  <span className="text-[9px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded font-black">
                                    Trưởng nhóm
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-[#6B635B]">
                                MSSV: {m.studentCode || m.code}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setMovingStudent(m);
                                  setSourceRoomId(rId);
                                  setMoveModalOpen(true);
                                }}
                                title="Chuyển Phòng"
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                              >
                                ⇄
                              </button>
                              {!isLeader && (
                                <button
                                  onClick={() =>
                                    handleMakeLeader(
                                      rId,
                                      uId,
                                      m.fullName || m.userFullName,
                                    )
                                  }
                                  title="Chỉ định Trưởng nhóm"
                                  className="p-1.5 bg-purple-50 text-purple-600 rounded-lg cursor-pointer"
                                >
                                  ⭐
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setRemovingTarget({
                                    roomId: rId,
                                    userId: uId,
                                    studentName: m.fullName || m.userFullName,
                                  });
                                  setRemoveReason("");
                                  setRemoveModalOpen(true);
                                }}
                                title="Đưa ra khỏi Phòng"
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#6B635B] italic py-2">
                      Chưa có thành viên nào tham gia phòng này.
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[#6B635B] italic bg-white border border-[#E8E2D9] rounded-3xl">
              Không tìm thấy Phòng phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      )}

      {/* MODAL GỬI PROFILE CỦA SINH VIÊN TỚI TRƯỜNG NHÓM PHÒNG CÒN THIẾU TV */}
      {sendProfileModalOpen && selectedStudentForRecommend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmSendProfile}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm text-[#2C2825]">
              Gửi Hồ sơ của {selectedStudentForRecommend.fullName}
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              Chọn Phòng chưa đủ sĩ số (dưới 5 người) để gửi Profile đến Trưởng
              nhóm xem xét:
            </p>

            <select
              value={targetRoomForRecommendId}
              onChange={(e) => setTargetRoomForRecommendId(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] text-xs"
            >
              <option value="">-- Chọn Phòng chưa đủ thành viên --</option>
              {rooms
                .filter((r) => (r.members?.length || 0) < (r.maxSize || 5))
                .map((r) => (
                  <option key={r.id || r.roomId} value={r.id || r.roomId}>
                    {r.name} ({r.members?.length || 0}/5 thành viên) - Ngành:{" "}
                    {r.majorCode || r.major}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSendProfileModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận gửi Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CỬA SỔ TẠO HÀNG LOẠT PHÒNG */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleBatchCreateRooms}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm">
              Tạo nhiều Phòng tự động theo Ngành
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              Tên phòng sẽ được hệ thống tự động sinh theo dạng:{" "}
              <strong>Phòng 01, Phòng 02...</strong>
            </p>

            <div className="space-y-2">
              <label className="font-bold block">Ngành học trong kỳ:</label>
              <select
                value={selectedMajorId}
                onChange={(e) => setSelectedMajorId(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              >
                {majors.length > 0 ? (
                  majors.map((m, idx) => {
                    const idVal = m.id || m.majorId || m.code || m;
                    const displayName =
                      m.majorName || m.name || m.majorCode || m.code || idVal;
                    const codeDisplay =
                      m.majorCode || m.code
                        ? ` (${m.majorCode || m.code})`
                        : "";
                    return (
                      <option key={idx} value={idVal}>
                        {displayName}
                        {codeDisplay}
                      </option>
                    );
                  })
                ) : (
                  <option value="">-- Không có ngành học --</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-bold block">Số lượng Phòng cần tạo:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={roomCount}
                onChange={(e) => setRoomCount(e.target.value)}
                placeholder="Nhập số phòng (VD: 10)..."
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold block">
                Sĩ số tối thiểu mặc định:
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={minRoomSize}
                onChange={(e) => setMinRoomSize(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận tạo hàng loạt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CỬA SỔ THÊM SINH VIÊN LẺ */}
      {addModalOpen && targetRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmAddStudent}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm">
              Thêm sinh viên vào {formatRoomName(targetRoom.name)}
            </h3>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
            >
              <option value="">-- Chọn sinh viên chưa có nhóm --</option>
              {unassignedList.map((s) => (
                <option key={s.userId || s.id} value={s.userId || s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
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

      {/* CỬA SỔ CHUYỂN SINH VIÊN SANG PHÒNG KHÁC */}
      {moveModalOpen && movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmMoveStudent}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm">
              Chuyển {movingStudent.fullName || movingStudent.userFullName} sang
              Phòng mới
            </h3>
            <select
              value={destinationRoomId}
              onChange={(e) => setDestinationRoomId(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
            >
              <option value="">-- Chọn Phòng đích --</option>
              {rooms
                .filter((r) => (r.id || r.roomId) !== sourceRoomId)
                .map((r) => (
                  <option key={r.id || r.roomId} value={r.id || r.roomId}>
                    {formatRoomName(r.name)} ({r.majorCode || r.major})
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
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

      {/* CỬA SỔ GỘP PHÒNG */}
      {mergeModalOpen && targetRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmMerge}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm">
              Gộp một Phòng khác vào {formatRoomName(targetRoom.name)}
            </h3>
            <select
              value={selectedSourceRoomId}
              onChange={(e) => setSelectedSourceRoomId(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
            >
              <option value="">-- Chọn Phòng nguồn để gộp vào --</option>
              {rooms
                .filter(
                  (r) =>
                    (r.id || r.roomId) !== (targetRoom.id || targetRoom.roomId),
                )
                .map((r) => (
                  <option key={r.id || r.roomId} value={r.id || r.roomId}>
                    {formatRoomName(r.name)} ({r.members?.length || 0} thành
                    viên)
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận gộp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CỬA SỔ ĐƯA SINH VIÊN RA KHỎI PHÒNG */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmRemoveStudent}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-black text-sm text-red-600">
              Đưa {removingTarget.studentName} ra khỏi Phòng
            </h3>
            <div className="space-y-2">
              <label className="font-bold block">
                Lý do đưa ra khỏi Phòng (bắt buộc):
              </label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Nhập lý do điều phối..."
                required
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
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
                Xác nhận đưa ra khỏi phòng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
