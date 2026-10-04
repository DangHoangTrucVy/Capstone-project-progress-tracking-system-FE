import api from "./api";

// Admin: danh sách sinh viên đăng ký bằng email cá nhân (mặc định đang chờ duyệt)
export const getRegistrations = async (params) => {
    // params: { status: PENDING_APPROVAL | REJECTED | ACTIVE, page, size, sort }
    const response = await api.get("/registrations", { params });
    return response.data;
};

export const approveRegistration = async (id) => {
    const response = await api.post(`/registrations/${id}/approve`);
    return response.data;
};

export const rejectRegistration = async (id, reason) => {
    const response = await api.post(`/registrations/${id}/reject`, { reason });
    return response.data;
};
