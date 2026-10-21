import api from "./api";

// List semesters: GET /api/v1/semesters
export const getSemesters = async (params) => {
    const response = await api.get("/semesters", { params });
    return response.data;
};

// Create a semester (Admin): POST /api/v1/semesters
export const createSemester = async (data) => {
    const response = await api.post("/semesters", data);
    return response.data;
};

// Get a semester: GET /api/v1/semesters/{semester}
export const getSemesterByCode = async (semester) => {
    const response = await api.get(`/semesters/${semester}`);
    return response.data;
};

// Update a semester: PUT /api/v1/semesters/{semester}
export const updateSemester = async (semester, data) => {
    const response = await api.put(`/semesters/${semester}`, data);
    return response.data;
};

// Assign or replace Moderator: PUT /api/v1/semesters/{semester}/moderator
export const assignModerator = async (semester, data) => {
    const response = await api.put(`/semesters/${semester}/moderator`, data);
    return response.data;
};

// List the semester's subjects with their scopes: GET /api/v1/semesters/{semester}/subjects
export const getSemesterSubjects = async (semester) => {
    const response = await api.get(`/semesters/${semester}/subjects`);
    return response.data;
};

// Set scope deadline: PUT /api/v1/scopes/{scopeId}/deadline
export const setScopeDeadline = async (scopeId, data) => {
    const response = await api.put(`/scopes/${scopeId}/deadline`, data);
    return response.data;
};

// Finalize scope list: POST /api/v1/scopes/{scopeId}/finalize
export const finalizeScope = async (scopeId) => {
    const response = await api.post(`/scopes/${scopeId}/finalize`);
    return response.data;
};

// Reopen finalized scope: POST /api/v1/scopes/{scopeId}/reopen
export const reopenScope = async (scopeId, data) => {
    const response = await api.post(`/scopes/${scopeId}/reopen`, data);
    return response.data;
};

// Extend scope deadline: POST /api/v1/scopes/{scopeId}/extend
export const extendScope = async (scopeId, data) => {
    const response = await api.post(`/scopes/${scopeId}/extend`, data);
    return response.data;
};