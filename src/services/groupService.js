import api from "./api";

// Lấy danh sách nhóm (có hỗ trợ filter nếu cần)
export const getAllGroups = async (params) => {
    const response = await api.get("/groups", { params });
    return response.data;
};

// Tạo nhóm mới (POST /api/v1/groups)
export const createGroup = async (groupData) => {
    const response = await api.post("/groups", groupData);
    return response.data;
};

// Lấy thông tin chi tiết nhóm theo ID (GET /api/v1/groups/{id})[cite: 44]
export const getGroupById = async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
};

// Cập nhật thông tin nhóm (PUT /api/v1/groups/{id})[cite: 45]
export const updateGroup = async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
};

// Thêm thành viên vào nhóm (POST /api/v1/groups/{id}/members)
export const addGroupMember = async (id, memberData) => {
    const response = await api.post(`/groups/${id}/members`, memberData);
    return response.data;
};

// Xóa thành viên khỏi nhóm (DELETE /api/v1/groups/{id}/members/{memberId})
export const removeGroupMember = async (id, memberId) => {
    const response = await api.delete(`/groups/${id}/members/${memberId}`);
    return response.data;
};