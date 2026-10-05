import api from "./api";

// PUT /api/v1/eligibility/{userId}
export const updateStudentEligibility = async (userId, data) => {
    const response = await api.put(`/eligibility/${userId}`, data);
    return response.data;
};

// POST /api/v1/eligibility/import
export const importEligibilityJson = async (data) => {
    const response = await api.post("/eligibility/import", data);
    return response.data;
};

// POST /api/v1/eligibility/import/file
export const importEligibilityFile = async (formData) => {
    const response = await api.post("/eligibility/import/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// GET /api/v1/eligibility/me
export const getMyEligibilityStatus = async () => {
    const response = await api.get("/eligibility/me");
    return response.data;
};

// GET /api/v1/eligibility/ineligible
export const getIneligibleStudents = async () => {
    const response = await api.get("/eligibility/ineligible");
    return response.data;
};