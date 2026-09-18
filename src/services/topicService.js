import api from "./api";

export const getTopics = async () => {
    // Truyền thêm page và size mặc định để tránh lỗi 500 từ Spring Pageable
    const response = await api.get("/topics", {
        params: {
            page: 0,
            size: 10
        }
    });
    return response.data;
};