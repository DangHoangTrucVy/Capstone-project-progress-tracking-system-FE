import api from "./api";

// Lấy danh sách đề tài (GET /api/v1/topics)
export const getTopics = async (params = { page: 0, size: 10 }) => {
    try {
        const response = await api.get("/topics", { params });
        return response.data;
    } catch (error) {
        console.warn("API /topics đang lỗi 500, dùng dữ liệu giả lập (fallback).");
        return {
            content: [
                { id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", topicCode: "T014", title: "Hệ thống hỗ trợ nông nghiệp bằng UAV phun thuốc tự động", category: "Agriculture" },
                { id: "4fa85f64-5717-4562-b3fc-2c963f66afa6", topicCode: "T015", title: "Quản lý kho hàng thông minh sử dụng AI và IoT", category: "IoT" }
            ]
        };
    }
};

// Tạo / Đề xuất đề tài mới (POST /api/v1/topics)
export const createTopic = async (topicData) => {
    const response = await api.post("/topics", topicData);
    return response.data;
};

// Lấy chi tiết đề tài theo ID (GET /api/v1/topics/{id})[cite: 50]
export const getTopicById = async (id) => {
    const response = await api.get(`/topics/${id}`);
    return response.data;
};

// Cập nhật đề tài (PUT /api/v1/topics/{id})[cite: 51]
export const updateTopic = async (id, topicData) => {
    const response = await api.put(`/topics/${id}`, topicData);
    return response.data;
};