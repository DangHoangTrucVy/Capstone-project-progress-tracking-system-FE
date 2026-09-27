import api from "./api";

// Lấy danh sách cột mốc của học kỳ
export const getMilestones = async () => {
  const response = await api.get("/milestones");
  return response.data;
};

// Lấy danh sách báo cáo tiến độ theo nhóm
export const getGroupProgress = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/progress`);
  return response.data;
};

// Báo cáo tiến độ tuần mới cho nhóm
export const createGroupProgress = async (groupId, progressData) => {
  const response = await api.post(`/groups/${groupId}/progress`, progressData);
  return response.data;
};

// Cập nhật phản hồi/đánh giá của giảng viên cho báo cáo tuần
export const updateSupervisorFeedback = async (progressId, feedbackData) => {
  const response = await api.put(`/progress/${progressId}/feedback`, feedbackData);
  return response.data;
};