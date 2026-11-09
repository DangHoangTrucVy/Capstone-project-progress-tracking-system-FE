import api from "./api";

// 1. Lấy danh sách Room/Nhóm theo học kỳ (Moderator view)
export const getSemesterRoomsForMod = async (semester, params) => {
  const response = await api.get(`/semesters/${semester}/rooms`, { params });
  return response.data;
};

// 2. Lấy kế hoạch Room theo từng ngành
export const getRoomPlanPerMajor = async (semester) => {
  const response = await api.get(`/semesters/${semester}/rooms/plan`);
  return response.data;
};

// 3. Lấy danh sách các Room đang chờ Moderator duyệt chốt
export const getPendingFinalizeRequests = async (semester) => {
  const response = await api.get(`/semesters/${semester}/finalize-requests`);
  return response.data;
};

// 4. Lấy thống kê của học kỳ (7.7)
export const getSemesterStatistics = async (semester) => {
  const response = await api.get(`/semesters/${semester}/statistics`);
  return response.data;
};

// 5. Kiểm tra trước khi xuất Excel (báo Room/Nhóm dưới 3 người nếu có)
export const checkExportSemester = async (semester) => {
  const response = await api.get(`/semesters/${semester}/export-check`);
  return response.data;
};

// 6. Xuất file Excel bàn giao học kỳ (10)
export const exportSemesterExcel = async (semester) => {
  const response = await api.get(`/semesters/${semester}/export`, {
    responseType: "blob",
  });
  return response.data;
};

// 7. Giải tán các Room về trống (nhận roomIds hoặc allBelowMinimum=true) (7.1)
export const dissolveSubMinimumRooms = async (semester, data) => {
  const response = await api.post(`/semesters/${semester}/rooms/disband`, data);
  return response.data;
};

// 8. Moderator ghép sinh viên lẻ vào Room (7.2)
export const addStudentToRoomByMod = async (roomId, userId) => {
  const response = await api.post(`/rooms/${roomId}/moderation/add`, { userId });
  return response.data;
};

// 9. Moderator chuyển sinh viên sang Room khác (7.2)
export const moveStudentToRoomByMod = async (targetRoomId, userId) => {
  const response = await api.post(`/rooms/${targetRoomId}/moderation/move`, { userId });
  return response.data;
};

// 10. Moderator kick thành viên ra khỏi Room kèm lý do bắt buộc (7.2)
export const removeStudentFromRoomByMod = async (roomId, userId, reason) => {
  const response = await api.post(`/rooms/${roomId}/moderation/remove`, { userId, reason });
  return response.data;
};

// 11. Moderator gộp nhóm khác vào Room này (Source room về trống) (7.2)
export const mergeRoomsByMod = async (targetRoomId, sourceGroupId) => {
  const response = await api.post(`/rooms/${targetRoomId}/moderation/merge`, { sourceGroupId });
  return response.data;
};

// 12. Moderator chỉ định Leader trực tiếp (7.2)
export const assignLeaderByMod = async (roomId, userId) => {
  const response = await api.post(`/rooms/${roomId}/moderation/leader`, { userId });
  return response.data;
};