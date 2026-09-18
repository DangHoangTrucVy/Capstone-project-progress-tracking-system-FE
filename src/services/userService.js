import api from "./api";

// Lấy danh sách người dùng (hỗ trợ lọc theo role như INSTRUCTOR, STUDENT...)
export const getUsers = async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
};