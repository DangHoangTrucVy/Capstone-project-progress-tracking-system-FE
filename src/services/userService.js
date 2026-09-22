import api from "./api";

// Lấy danh sách người dùng (có thể lọc theo role và phân trang)
export const getUsers = async (params) => {
    // params có thể gồm: { role, page, size, sort }
    const response = await api.get("/users", { params });
    return response.data;
};

// Lấy thông tin chi tiết người dùng theo ID
export const getUserById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// Tạo tài khoản mới (Admin tạo user)
export const createUser = async (userData) => {
    // userData: { email, fullName, password, role }
    const response = await api.post("/users", userData);
    return response.data;
};

// Cập nhật thông tin người dùng
export const updateUser = async (id, userData) => {
    // userData: { fullName, avatarUrl, status }
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};

//BE chưa cập nhật cho Admin
// export const deleteUser = async (id) => {
//     const response = await api.delete(`/users/${id}`);
//     return response.data;
// };