import api from "./api";

// GET /api/v1/groups/{id}
export const getGroupById = async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
};

// PUT /api/v1/groups/{id}
export const updateGroup = async (id, data) => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
};

// PUT /api/v1/groups/{id}/leader
export const replaceGroupLeader = async (id, data) => {
    const response = await api.put(`/groups/${id}/leader`, data);
    return response.data;
};

// GET /api/v1/groups
export const getAllGroups = async (params) => {
    const response = await api.get("/groups", { params });
    return response.data;
};

// POST /api/v1/groups
export const createGroup = async (data) => {
    const response = await api.post("/groups", data);
    return response.data;
};

// POST /api/v1/groups/{id}/unlock
export const unlockGroup = async (id) => {
    const response = await api.post(`/groups/${id}/unlock`);
    return response.data;
};

// POST /api/v1/groups/{id}/roster/submit
export const submitRoster = async (id) => {
    const response = await api.post(`/groups/${id}/roster/submit`);
    return response.data;
};

// POST /api/v1/groups/{id}/roster/review
export const reviewRoster = async (id, data) => {
    const response = await api.post(`/groups/${id}/roster/review`, data);
    return response.data;
};

// POST /api/v1/groups/{id}/members
export const addGroupMember = async (id, data) => {
    const response = await api.post(`/groups/${id}/members`, data);
    return response.data;
};

// POST /api/v1/groups/{id}/lock
export const lockGroup = async (id) => {
    const response = await api.post(`/groups/${id}/lock`);
    return response.data;
};

// DELETE /api/v1/groups/{id}/members/{memberId}
export const removeGroupMember = async (id, memberId) => {
    const response = await api.delete(`/groups/${id}/members/${memberId}`);
    return response.data;
};
export const joinGroup = async (groupId, data) => {
  const response = await api.post(`/groups/${groupId}/join`, data);
  return response.data;
};

// --- Luồng Apply, Invite & Formation ---
export const getGroupOverview = async (groupId) => {
    const response = await api.get(`/groups/${groupId}/overview`);
    return response.data;
};

export const getGroupApplications = async (groupId) => {
    const response = await api.get(`/groups/${groupId}/applications`);
    return response.data;
};

export const applyToGroup = async (groupId, data) => {
    const response = await api.post(`/groups/${groupId}/applications`, data);
    return response.data;
};

export const getGroupInvites = async (groupId) => {
    const response = await api.get(`/groups/${groupId}/invites`);
    return response.data;
};

export const inviteToGroup = async (groupId, data) => {
    const response = await api.post(`/groups/${groupId}/invites`, data);
    return response.data;
};

export const acceptInvite = async (inviteId) => {
    const response = await api.post(`/invites/${inviteId}/accept`);
    return response.data;
};

export const declineInvite = async (inviteId) => {
    const response = await api.post(`/invites/${inviteId}/decline`);
    return response.data;
};

export const revokeInvite = async (inviteId) => {
    const response = await api.post(`/invites/${inviteId}/revoke`);
    return response.data;
};

export const approveApplication = async (appId) => {
    const response = await api.post(`/applications/${appId}/approve`);
    return response.data;
};

export const rejectApplication = async (appId, data) => {
    const response = await api.post(`/applications/${appId}/reject`, data);
    return response.data;
};

export const withdrawApplication = async (appId) => {
    const response = await api.post(`/applications/${appId}/withdraw`);
    return response.data;
};

export const getMyApplications = async () => {
    const response = await api.get("/me/applications");
    return response.data;
};

export const getMyInvites = async () => {
    const response = await api.get("/me/invites");
    return response.data;
};

export const getMyFormationWindow = async () => {
    const response = await api.get("/me/formation-window");
    return response.data;
};

export const getSemesterJoinSettings = async (semester) => {
    const response = await api.get(`/semesters/${semester}/join-settings`);
    return response.data;
};

export const updateSemesterJoinSettings = async (semester, data) => {
    const response = await api.put(`/semesters/${semester}/join-settings`, data);
    return response.data;
};

export const setFormationDeadline = async (semester, data) => {
    const response = await api.put(`/semesters/${semester}/formation-deadline`, data);
    return response.data;
};

// --- Bổ sung các API cho Luồng v2.5 ---
// 2. Yêu cầu rời nhóm / Xử lý rời nhóm
export const requestLeaveGroup = async (groupId, data) => (await api.post(`/groups/${groupId}/leave-requests`, data)).data;
export const getGroupLeaveRequests = async (groupId) => (await api.get(`/groups/${groupId}/leave-requests`)).data;
export const approveLeaveRequest = async (requestId) => (await api.post(`/leave-requests/${requestId}/approve`)).data;
export const rejectLeaveRequest = async (requestId, data) => (await api.post(`/leave-requests/${requestId}/reject`, data)).data;

// 3. Xuất Excel báo cáo (QT15)
export const exportGroupsExcel = async (semester) => {
    const response = await api.get(`/reports/export?semester=${semester}`, { responseType: 'blob' });
    return response.data;
};