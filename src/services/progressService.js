import api from "./api";

// GET /api/v1/reports/summary
export const getReportsSummary = async (params) => {
    const response = await api.get("/reports/summary", { params });
    return response.data;
};