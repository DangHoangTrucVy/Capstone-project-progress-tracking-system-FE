import api from "./api";

// GET /api/v1/milestones
export const getMilestones = async () => {
  const response = await api.get("/milestones");
  return response.data;
};

// GET /api/v1/progress/{id}
export const getProgressById = async (progressId) => {
  const response = await api.get(`/progress/${progressId}`);
  return response.data;
};

// PUT /api/v1/progress/{id}
export const updateProgress = async (progressId, payload) => {
  const response = await api.put(`/progress/${progressId}`, payload);
  return response.data;
};

// PUT /api/v1/progress/{id}/feedback
export const updateSupervisorFeedback = async (progressId, feedbackData) => {
  const response = await api.put(`/progress/${progressId}/feedback`, feedbackData);
  return response.data;
};

// GET /api/v1/groups/{groupId}/progress
export const getGroupProgress = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/progress`);
  return response.data;
};

// GET /api/v1/groups/{groupId}/progress/summary
export const getGroupProgressSummary = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/progress/summary`);
  return response.data;
};

// GET /api/v1/reports/summary
export const getReportsSummary = async (params = {}) => {
  const response = await api.get("/reports/summary", { params });
  return response.data;
};

// POST /api/v1/groups/{groupId}/progress
export const createGroupProgress = async (groupId, progressData) => {
  const response = await api.post(`/groups/${groupId}/progress`, progressData);
  return response.data;
};

// GET /api/v1/groups/{groupId}/evaluations
export const getGroupEvaluations = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/evaluations`);
  return response.data;
};

// POST /api/v1/groups/{groupId}/evaluations
export const createGroupEvaluation = async (groupId, payload) => {
  const response = await api.post(`/groups/${groupId}/evaluations`, payload);
  return response.data;
};

// GET /api/v1/requirements
export const getRequirements = async (params = {}) => {
  const response = await api.get("/requirements", { params });
  return response.data;
};

// POST /api/v1/meetings/{id}/requirements
export const createMeetingRequirement = async (meetingId, payload) => {
  const response = await api.post(`/meetings/${meetingId}/requirements`, payload);
  return response.data;
};

// GET /api/v1/meetings/{id}/requirements
export const getMeetingRequirements = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}/requirements`);
  return response.data;
};

// PUT /api/v1/requirements/{id}
export const updateRequirement = async (requirementId, payload) => {
  const response = await api.put(`/requirements/${requirementId}`, payload);
  return response.data;
};