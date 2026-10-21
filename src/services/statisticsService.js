import api from "./api";

// Statistics: GET /api/v1/semesters/{semester}/statistics
export const getSemesterStatistics = async (semester, params) => {
    const response = await api.get(`/semesters/${semester}/statistics`, { params });
    return response.data;
};

// Export Check: GET /api/v1/semesters/{semester}/export-check
export const checkSemesterExport = async (semester) => {
    const response = await api.get(`/semesters/${semester}/export-check`);
    return response.data;
};

// Export Excel: GET /api/v1/semesters/{semester}/export
export const exportSemesterExcel = async (semester, params) => {
    const response = await api.get(`/semesters/${semester}/export`, {
        params,
        responseType: "blob",
    });
    return response;
};