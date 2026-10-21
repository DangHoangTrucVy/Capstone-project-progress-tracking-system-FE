import api from "./api";

// ==================== GROUPS (Theo chuẩn Subject & Group API mới) ====================
export const getGroupById = async (id) => (await api.get(`/groups/${id}`)).data;

export const getGroupMembers = async (groupId) =>
  (await api.get(`/groups/${groupId}/members`)).data;

export const createGroupInSubject = async (subjectId, data) =>
  (await api.post(`/subjects/${subjectId}/groups`, data)).data;

export const getOpenGroupsBySubject = async (subjectId, params) =>
  (await api.get(`/subjects/${subjectId}/open-groups`, { params })).data;

export const getSubjectCandidates = async (subjectId, params) =>
  (await api.get(`/subjects/${subjectId}/candidates`, { params })).data;

export const updateGroup = async (id, data) =>
  (await api.put(`/groups/${id}`, data)).data;

export const joinGroup = async (groupId) =>
  (await api.post(`/groups/${groupId}/join`)).data;

export const lockGroup = async (id) =>
  (await api.post(`/groups/${id}/lock`)).data;

export const unlockGroup = async (id) =>
  (await api.post(`/groups/${id}/unlock`)).data;

export const leaveGroup = async (groupId) =>
  (await api.post(`/groups/${groupId}/leave`)).data;

export const removeGroupMember = async (groupId, userId) =>
  (await api.delete(`/groups/${groupId}/members/${userId}`)).data;

export const replaceGroupLeader = async (groupId, data) =>
  (await api.put(`/groups/${groupId}/leader`, data)).data;

export const submitRoster = async (groupId) =>
  (await api.post(`/groups/${groupId}/submit-roster`)).data;

// ==================== APPLICATIONS & INVITATIONS (REQUESTS) ====================
export const getGroupApplications = async (groupId) =>
  (await api.get(`/groups/${groupId}/applications`)).data;

export const applyToGroup = async (groupId, data) =>
  (await api.post(`/groups/${groupId}/applications`, data)).data;

export const inviteToGroup = async (groupId, data) =>
  (await api.post(`/groups/${groupId}/invitations`, data)).data;

export const getGroupRequests = async (groupId) =>
  (await api.get(`/groups/${groupId}/requests`)).data;

// Lấy danh sách đơn ứng tuyển / lời mời của tôi theo môn học (chuẩn Swagger /subjects/{subjectId}/my-requests)[cite: 21]
export const getSubjectMyRequests = async (subjectId) =>
  (await api.get(`/subjects/${subjectId}/my-requests`)).data;

// Tương thích ngược: Lấy applications & invites cá nhân từ subject requests
export const getMyApplications = async (subjectId) => {
  if (!subjectId) return [];
  const res = await getSubjectMyRequests(subjectId).catch(() => []);
  const list = Array.isArray(res) ? res : res?.content || [];
  return list.filter((item) => item.type === "APPLICATION");
};

export const getMyInvites = async (subjectId) => {
  if (!subjectId) return [];
  const res = await getSubjectMyRequests(subjectId).catch(() => []);
  const list = Array.isArray(res) ? res : res?.content || [];
  return list.filter((item) => item.type === "INVITATION");
};

export const getGroupInvites = async (groupId) => {
  const response = await api
    .get(`/groups/${groupId}/requests`)
    .catch(() => ({ data: [] }));
  const list = response.data?.content || response.data || [];
  return list.filter((item) => item.type === "INVITATION");
};

export const acceptRequest = async (requestId) =>
  (await api.post(`/requests/${requestId}/accept`)).data;

export const rejectRequest = async (requestId, data) =>
  (await api.post(`/requests/${requestId}/reject`, data)).data;

export const withdrawRequest = async (requestId) =>
  (await api.post(`/requests/${requestId}/withdraw`)).data;

export const likeApplicant = async (requestId) =>
  (await api.put(`/requests/${requestId}/like`)).data;

export const removeLikeApplicant = async (requestId) =>
  (await api.delete(`/requests/${requestId}/like`)).data;

// ==================== VOTES ON APPLICATIONS ====================
export const getApplicationVotes = async (requestId) => {
  const response = await api
    .get(`/requests/${requestId}/votes`)
    .catch(() => ({ data: [] }));
  return response.data;
};

export const voteOnApplication = async (requestId, data) => {
  const response = await api.post(`/requests/${requestId}/votes`, data);
  return response.data;
};

// ==================== LEAVE GROUP REQUESTS & COMPLAINTS ====================
export const requestLeaveGroup = async (groupId, data) =>
  (await api.post(`/groups/${groupId}/leave`, data)).data;

export const getGroupLeaveRequests = async (groupId) =>
  (await api.get(`/groups/${groupId}/leave-requests`)).data;

export const getMyLeaveRequests = async () =>
  (await api.get(`/me/leave-requests`))
    .catch(() => ({ data: [] }))
    .then((res) => res.data);

export const withdrawLeaveRequest = async (requestId) =>
  (await api.post(`/leave-requests/${requestId}/withdraw`)).data;

export const leaderDecisionLeaveRequest = async (requestId, data) =>
  (await api.post(`/leave-requests/${requestId}/leader-decision`, data)).data;

export const complaintLeaveRequest = async (requestId, data) =>
  (await api.post(`/leave-requests/${requestId}/complaint`, data)).data;

export const moderatorDecisionLeaveRequest = async (requestId, data) =>
  (await api.post(`/leave-requests/${requestId}/moderator-decision`, data))
    .data;

export const getSubjectComplaints = async (subjectId, params) =>
  (await api.get(`/subjects/${subjectId}/complaints`, { params })).data;

// ==================== LEADER TRANSFERS ====================
export const offerLeaderTransfer = async (groupId, data) =>
  (await api.post(`/groups/${groupId}/leader-transfers`, data)).data;

export const getMyLeaderTransfers = async () =>
  (await api.get(`/me/leader-transfers`))
    .catch(() => ({ data: [] }))
    .then((res) => res.data);

export const acceptLeaderTransfer = async (transferId) =>
  (await api.post(`/leader-transfers/${transferId}/accept`)).data;

export const declineLeaderTransfer = async (transferId) =>
  (await api.post(`/leader-transfers/${transferId}/decline`)).data;

export const cancelLeaderTransfer = async (transferId) =>
  (await api.post(`/leader-transfers/${transferId}/cancel`)).data;

// ==================== SUBJECTS & UTILS ====================
export const getSubjectsBySemester = async (semester) => {
  const response = await api.get(`/semesters/${semester}/subjects`);
  return response.data;
};

// Trả về mảng rỗng cho các component cũ gọi getAllGroups nhằm tránh lỗi 404
export const getAllGroups = async () => [];
