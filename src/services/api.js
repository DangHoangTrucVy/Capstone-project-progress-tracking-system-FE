import axios from "axios";

// Khởi tạo instance axios
const api = axios.create({
    baseURL: "http://localhost:8080/api/v1", // Hoặc URL API backend của bạn
    headers: {
        "Content-Type": "application/json",
    },
});

// Thêm Interceptor để tự động đính kèm Token nếu có
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;