import api from "./api";

export const getAllGroups = async (params) => {
    const response = await api.get("/groups", { params });
    return response.data;
};

export const createGroup = async (groupData) => {
    const response = await api.post("/groups", groupData);
    return response.data;
};

export const getGroupById = async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
};

export const updateGroup = async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
};

export const addGroupMember = async (id, memberData) => {
    const response = await api.post(`/groups/${id}/members`, memberData);
    return response.data;
};

export const removeGroupMember = async (id, memberId) => {
    const response = await api.delete(`/groups/${id}/members/${memberId}`);
    return response.data;
};