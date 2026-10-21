import api from "./api";

// ==================== GROUPS ====================
export const getAllGroups = async (params) => (await api.get(`/groups`, { params })).data;

export const getGroupById = async (id) => (await api.get(`/groups/${id}`)).data;

export const getGroupMembers = async (groupId) => (await api.get(`/groups/${groupId}/members`)).data;

export const createGroup = async (data) => (await api.post(`/groups`, data)).data;

export const updateGroup = async (id, data) => (await api.put(`/groups/${id}`, data)).data;

export const joinGroup = async (groupId) => (await api.post(`/groups/${groupId}/join`)).data;

export const lockGroup = async (id) => (await api.post(`/groups/${id}/lock`)).data;

export const unlockGroup = async (id) => (await api.post(`/groups/${id}/unlock`)).data;

export const submitRoster = async (id) => (await api.post(`/groups/${id}/submit-roster`)).data;

export const reviewRoster = async (id, data) => (await api.post(`/groups/${id}/review-roster`, data)).data;

export const replaceGroupLeader = async (groupId, data) => (await api.put(`/groups/${groupId}/leader`, data)).data;

export const removeGroupMember = async (groupId, userId) => (await api.delete(`/groups/${groupId}/members/${userId}`)).data;


// ==================== APPLICATIONS (APPLY) ====================
export const getGroupApplications = async (groupId) => (await api.get(`/groups/${groupId}/applications`)).data;

export const applyToGroup = async (groupId, data) => (await api.post(`/groups/${groupId}/applications`, data)).data;

export const approveApplication = async (appId) => (await api.post(`/applications/${appId}/approve`)).data;

export const rejectApplication = async (appId, data) => (await api.post(`/applications/${appId}/reject`, data)).data;

export const withdrawApplication = async (appId) => (await api.post(`/applications/${appId}/withdraw`)).data;

export const getMyApplications = async () => (await api.get(`/student/applications`)).data;


// ==================== VOTES ON APPLICATIONS ====================
export const getApplicationVotes = async (appId) => (await api.get(`/applications/${appId}/votes`)).data;

export const voteOnApplication = async (appId, data) => (await api.post(`/applications/${appId}/votes`, data)).data;


// ==================== INVITATIONS ====================
export const getGroupInvites = async (groupId) => (await api.get(`/groups/${groupId}/invitations`)).data;

export const inviteToGroup = async (groupId, data) => (await api.post(`/groups/${groupId}/invitations`, data)).data;

export const revokeInvite = async (inviteId) => (await api.delete(`/invitations/${inviteId}`)).data;

export const getMyInvites = async () => (await api.get(`/student/invitations`)).data;

export const acceptInvite = async (inviteId) => (await api.post(`/invitations/${inviteId}/accept`)).data;

export const declineInvite = async (inviteId) => (await api.post(`/invitations/${inviteId}/decline`)).data;


// ==================== LEAVE GROUP REQUESTS ====================
// ==================== LEAVE GROUP REQUESTS & DECISIONS ====================
export const requestLeaveGroup = async (groupId, data) => (await api.post(`/groups/${groupId}/leave-requests`, data)).data;

export const getGroupLeaveRequests = async (groupId) => (await api.get(`/groups/${groupId}/leave-requests`)).data;

// Lấy danh sách complaints/leave-requests theo môn học cho Moderator/Admin
export const getSubjectComplaints = async (subjectId, params) => (await api.get(`/subjects/${subjectId}/complaints`, { params })).data;

// Leader quyết định (phê duyệt / từ chối) yêu cầu rời nhóm
export const leaderDecisionLeaveRequest = async (requestId, data) => (await api.post(`/leave-requests/${requestId}/leader-decision`, data)).data;

// Moderator / Admin quyết định xử lý yêu cầu hoặc khiếu nại
export const moderatorDecisionLeaveRequest = async (requestId, data) => (await api.post(`/leave-requests/${requestId}/moderator-decision`, data)).data;

//===================================Subjects===================================//
// Lấy danh sách môn học theo học kỳ từ Backend
export const getSubjectsBySemester = async (semester) => {
  const response = await api.get(`/semesters/${semester}/subjects`);
  return response.data;
};