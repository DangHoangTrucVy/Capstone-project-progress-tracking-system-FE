import api from "./api";

// 1. Lấy danh sách nhóm theo học kỳ (Hỗ trợ lọc nhóm dưới 3 người theo endpoint Swagger)
export const getGroupsBySemester = async (semester) => {
  const response = await api.get(`/semesters/${semester}/groups`);
  return response.data;
};

// 2. Lấy thống kê của học kỳ (7.3)
export const getSemesterStatistics = async (semester) => {
  const response = await api.get(`/semesters/${semester}/statistics`);
  return response.data;
};

// 3. Kiểm tra trước khi xuất Excel (báo nhóm dưới 3 người nếu có)
export const checkExportSemester = async (semester) => {
  const response = await api.get(`/semesters/${semester}/export-check`);
  return response.data;
};

// 4. Xuất file Excel bàn giao (10)
export const exportSemesterExcel = async (semester) => {
  const response = await api.get(`/semesters/${semester}/export`, {
    responseType: "blob",
  });
  return response.data;
};

// 5. Giải tán nhóm hàng loạt (ví dụ: các nhóm dưới 3 người) (7.1)
export const dissolveGroupsBatch = async (groupIds) => {
  const response = await api.post(`/moderation/dissolve`, { groupIds });
  return response.data;
};

// 6. Đưa sinh viên lẻ vào nhóm (kể cả nhóm đang khóa, tối đa 5 người) (7.1)
export const addStudentToGroup = async (groupId, studentId) => {
  const response = await api.post(`/groups/${groupId}/moderation/add`, { studentId });
  return response.data;
};

// 7. Chuyển sinh viên từ nhóm này sang nhóm khác (7.1)
export const moveStudentToGroup = async (targetGroupId, studentId) => {
  const response = await api.post(`/groups/${targetGroupId}/moderation/move`, { studentId });
  return response.data;
};

// Chốt danh sách học kỳ / phạm vi
export const finalizeScope = async (scopeId) => {
  const response = await api.post(`/scopes/${scopeId}/finalize`);
  return response.data;
};

// Mở lại danh sách đã chốt (kèm lý do)
export const reopenScope = async (scopeId, reason) => {
  const response = await api.post(`/scopes/${scopeId}/reopen`, { reason });
  return response.data;
};


// Đưa sinh viên ra khỏi nhóm kèm lý do
export const removeStudentFromGroup = async (groupId, studentId, reason) => {
  const response = await api.post(`/groups/${groupId}/moderation/remove`, { studentId, reason });
  return response.data;
};


// Gộp nhóm khác vào nhóm này
export const mergeGroups = async (targetGroupId, sourceGroupId) => {
  const response = await api.post(`/groups/${targetGroupId}/moderation/merge`, { sourceGroupId });
  return response.data;
};

// Chỉ định trực tiếp thành viên làm Leader
export const assignGroupLeaderDirectly = async (groupId, userId) => {
  const response = await api.post(`/groups/${groupId}/moderation/leader`, { userId });
  return response.data;
};

// Tạo nhóm mới từ sinh viên chưa có nhóm và chỉ định Leader
export const createGroupForStudents = async (scopeId, payload) => {
  // payload: { studentIds, leaderId, groupCode }
  const response = await api.post(`/scopes/${scopeId}/groups`, payload);
  return response.data;
};