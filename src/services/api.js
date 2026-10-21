import axios from "axios";

const api = axios.create({
    baseURL: "https://usd-plugins-mesa-geneva.trycloudflare.com/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        // Nếu là các API auth công khai (như campuses, config, login), tuyệt đối KHÔNG đính kèm Token
        const isPublicAuthRoute = config.url && config.url.includes("/auth/") && !config.url.includes("/auth/me");

        if (!isPublicAuthRoute) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;