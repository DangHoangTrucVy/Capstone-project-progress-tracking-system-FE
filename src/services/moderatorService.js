import api from "./api";

// 1. Lấy danh sách nhóm theo học kỳ
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

// 5. Giải tán nhóm hàng loạt (các nhóm dưới 3 người) (7.1)
export const dissolveGroupsBatch = async (groupIds) => {
  const response = await api.post(`/moderation/dissolve`, { groupIds });
  return response.data;
};

// 6. Đưa sinh viên lẻ vào nhóm (kể cả nhóm đang khóa, tối đa 5 người) (7.1)
// Backend (ModerationController.StudentBody) đọc trường "userId", không phải "studentId".
export const addStudentToGroup = async (groupId, userId) => {
  const response = await api.post(`/groups/${groupId}/moderation/add`, { userId });
  return response.data;
};

// 7. Chuyển sinh viên từ nhóm hiện tại sang nhóm khác (7.1)
export const moveStudentToGroup = async (targetGroupId, userId) => {
  const response = await api.post(`/groups/${targetGroupId}/moderation/move`, { userId });
  return response.data;
};

// 8. Đưa sinh viên ra khỏi nhóm kèm lý do (7.1)
export const removeStudentFromGroup = async (groupId, userId, reason) => {
  const response = await api.post(`/groups/${groupId}/moderation/remove`, { userId, reason });
  return response.data;
};

// 9. Gộp nhóm khác vào nhóm này (tối đa 5 thành viên) (7.1)
export const mergeGroups = async (targetGroupId, sourceGroupId) => {
  const response = await api.post(`/groups/${targetGroupId}/moderation/merge`, { sourceGroupId });
  return response.data;
};

// 10. Chỉ định trực tiếp thành viên làm Leader (7.1)
export const assignGroupLeaderDirectly = async (groupId, userId) => {
  const response = await api.post(`/groups/${groupId}/moderation/leader`, { userId });
  return response.data;
};

// 11. Tạo nhóm mới từ sinh viên chưa có nhóm và chỉ định Leader (7.1)
export const createGroupForStudents = async (scopeId, payload) => {
  const response = await api.post(`/scopes/${scopeId}/groups`, payload);
  return response.data;
};

// 12. Kiểm tra điều kiện trước khi chốt danh sách scope (7.2)
export const checkFinalizeScope = async (scopeId) => {
  const response = await api.get(`/scopes/${scopeId}/finalize-check`);
  return response.data;
};

// 13. Chốt danh sách scope (7.2)
export const finalizeScope = async (scopeId) => {
  const response = await api.post(`/scopes/${scopeId}/finalize`);
  return response.data;
};

// 14. Mở lại danh sách đã chốt (kèm lý do) (7.2)
export const reopenScope = async (scopeId, reason) => {
  const response = await api.post(`/scopes/${scopeId}/reopen`, { reason });
  return response.data;
};