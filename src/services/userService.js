// import api from "./api";

// // Lấy danh sách người dùng (có thể lọc theo role và phân trang)
// export const getUsers = async (params) => {
//     // params có thể gồm: { role, page, size, sort }
//     const response = await api.get("/users", { params });
//     return response.data;
// };

// // Lấy thông tin chi tiết người dùng theo ID
// export const getUserById = async (id) => {
//     const response = await api.get(`/users/${id}`);
//     return response.data;
// };

// // Tạo tài khoản mới (Admin tạo user)
// export const createUser = async (userData) => {
//     // userData: { email, fullName, password, role }
//     const response = await api.post("/users", userData);
//     return response.data;
// };

// // Cập nhật thông tin người dùng
// export const updateUser = async (id, userData) => {
//     // userData: { fullName, avatarUrl, status }
//     const response = await api.put(`/users/${id}`, userData);
//     return response.data;
// };

// //BE chưa cập nhật cho Admin
// // export const deleteUser = async (id) => {
// //     const response = await api.delete(`/users/${id}`);
// //     return response.data;
// // };

// export const getUsersByRole = async (role) => {
//   const response = await api.get(`/users`, { params: { role } });
//   return response.data;
// };

import api from "./api";

// GET /api/v1/users/{id}
export const getUserById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// PUT /api/v1/users/{id}
export const updateUser = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

// GET /api/v1/me/profile
export const getMyProfile = async () => {
    const response = await api.get("/me/profile");
    return response.data;
};

// PUT /api/v1/me/profile
export const updateMyProfile = async (data) => {
    const response = await api.put("/me/profile", data);
    return response.data;
};

// GET /api/v1/users
export const getUsers = async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
};

// POST /api/v1/users
export const createUser = async (data) => {
    const response = await api.post("/users", data);
    return response.data;
};