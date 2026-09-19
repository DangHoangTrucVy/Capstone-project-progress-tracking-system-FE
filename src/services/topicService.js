import api from "./api";

// Lấy danh sách đề tài (có thể lọc theo status)
export const getTopics = async (params) => {
    const response = await api.get("/topics", { params });
    return response.data;
};

// Tạo đề tài mới
export const createTopic = async (topicData) => {
    // topicData: { topicCode, title, description, category }
    const response = await api.post("/topics", topicData);
    return response.data;
};

// Cập nhật đề tài
export const updateTopic = async (id, topicData) => {
    // topicData: { title, description, category, status }
    const response = await api.put(`/topics/${id}`, topicData);
    return response.data;
};

export const updateTopicStatus = async (id, statusData) => {
    // statusData: { status: "PUBLISHED" } hoặc đầy đủ thông tin đề tài theo yêu cầu Swagger
    const response = await api.put(`/topics/${id}`, statusData);
    return response.data;
};

// Lấy danh sách câu hỏi theo topicId
export const getTopicQuestions = async (topicId, params) => {
    const response = await api.get(`/topics/${topicId}/questions`, { params });
    return response.data;
};

// Thêm câu hỏi mới vào đề tài
export const createTopicQuestion = async (topicId, questionData) => {
    // questionData mẫu: { category, questionText, guidanceNotes }
    const response = await api.post(`/topics/${topicId}/questions`, questionData);
    return response.data;
};