import api from "./api";

// Sửa lại bỏ chữ /api/v1 thừa ở đầu
export const getTopics = async (params = {}) => {
    const res = await api.get("/topics", { params });
    return res.data;
};

export const getTopicById = async (id) => {
    const res = await api.get(`/topics/${id}`);
    return res.data;
};

export const createTopic = async (payload) => {
    const res = await api.post("/topics", payload);
    return res.data;
};

export const updateTopic = async (id, payload) => {
    const res = await api.put(`/topics/${id}`, payload);
    return res.data;
};

export const getTopicQuestions = async (topicId) => {
    const res = await api.get(`/topics/${topicId}/questions`);
    return res.data;
};

export const addTopicQuestion = async (topicId, payload) => {
    const res = await api.post(`/topics/${topicId}/questions`, payload);
    return res.data;
};