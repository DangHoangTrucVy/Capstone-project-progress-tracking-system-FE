import api from "./api";

// Each operation is checked against the running backend's OpenAPI document.
export const operations = {
  me: ["get", "/auth/me"],
  login: ["post", "/auth/login"],
  google: ["post", "/auth/google"],
  googleConfig: ["get", "/auth/google/config"],
  profile: ["get", "/me/profile"],
  updateProfile: ["put", "/me/profile"],
  semesters: ["get", "/semesters"],
  semester: ["get", "/semesters/{semester}"],
  students: ["get", "/semesters/{semester}/students"],
  groups: ["get", "/semesters/{semester}/groups"],
  scopes: ["get", "/semesters/{semester}/scopes"],
  statistics: ["get", "/semesters/{semester}/statistics"],
  assignModerator: ["put", "/semesters/{semester}/moderator"],
  extend: ["post", "/scopes/{scopeId}/extend"],
  moderationLeader: ["post", "/groups/{groupId}/moderation/leader"],
  moderationAdd: ["post", "/groups/{groupId}/moderation/add"],
  moderationMove: ["post", "/groups/{groupId}/moderation/move"],
  moderationRemove: ["post", "/groups/{groupId}/moderation/remove"],
  moderationMerge: ["post", "/groups/{groupId}/moderation/merge"],
  complaints: ["get", "/subjects/{subjectId}/complaints"],
  moderatorDecision: ["post", "/leave-requests/{requestId}/moderator-decision"],
  accounts: ["get", "/users"],
  createModerator: ["post", "/users/moderators"],
  importPreview: ["post", "/semesters/{semester}/imports/students/preview"],
  importConfirm: ["post", "/semesters/{semester}/imports/students"],
  eligibility: ["put", "/enrollments/{enrollmentId}/eligibility"],
  deadline: ["put", "/scopes/{scopeId}/deadline"],
  finalizeCheck: ["get", "/scopes/{scopeId}/finalize-check"],
  finalize: ["post", "/scopes/{scopeId}/finalize"],
  reopen: ["post", "/scopes/{scopeId}/reopen"],
  exportCheck: ["get", "/semesters/{semester}/export-check"],
  export: ["get", "/semesters/{semester}/export"],
  mySemesters: ["get", "/me/semesters"],
  group: ["get", "/groups/{groupId}"],
  openGroups: ["get", "/subjects/{subjectId}/open-groups"],
  createGroup: ["post", "/subjects/{subjectId}/groups"],
  apply: ["post", "/groups/{groupId}/applications"],
  invite: ["post", "/groups/{groupId}/invitations"],
  groupRequests: ["get", "/groups/{groupId}/requests"],
  myRequests: ["get", "/subjects/{subjectId}/my-requests"],
  accept: ["post", "/requests/{requestId}/accept"],
  reject: ["post", "/requests/{requestId}/reject"],
  withdraw: ["post", "/requests/{requestId}/withdraw"],
  lock: ["post", "/groups/{groupId}/lock"],
  unlock: ["post", "/groups/{groupId}/unlock"],
  leave: ["post", "/groups/{groupId}/leave"],
  groupLeaveRequests: ["get", "/groups/{groupId}/leave-requests"],
  myLeaveRequests: ["get", "/me/leave-requests"],
  leaveDecision: ["post", "/leave-requests/{requestId}/leader-decision"],
  complaint: ["post", "/leave-requests/{requestId}/complaint"],
  transfer: ["post", "/groups/{groupId}/leader-transfers"],
  myTransfers: ["get", "/me/leader-transfers"],
  transferAccept: ["post", "/leader-transfers/{transferId}/accept"],
  transferDecline: ["post", "/leader-transfers/{transferId}/decline"],
  transferCancel: ["post", "/leader-transfers/{transferId}/cancel"],
};
export async function call(name, { path = {}, params, body, file } = {}) {
  const operation = operations[name];
  if (!operation) throw new Error("Unknown API operation: " + name);
  const [method, template] = operation;
  const url = template.replace(/\{([^}]+)\}/g, (_, key) => {
    if (path[key] === undefined || path[key] === null || path[key] === "") {
      throw new Error("Missing parameter: " + key);
    }
    return encodeURIComponent(path[key]);
  });
  let data = body;
  if (file) {
    data = new FormData();
    data.append("file", file);
  }
  const response = await api.request({
    method, url, params, data,
    ...(file ? { headers: { "Content-Type": undefined } } : {}),
    ...(name === "export" ? { responseType: "blob" } : {}),
  });
  return response.data;
}
export async function allRows(name, path = {}) {
  const result = [];
  for (let page = 0; ; page += 1) {
    const data = await call(name, { path, params: { page, size: 100 } });
    if (Array.isArray(data)) return data;
    if (!Array.isArray(data.content)) throw new Error("Invalid paginated response");
    result.push(...data.content);
    if (data.last || page + 1 >= data.totalPages) return result;
  }
}
