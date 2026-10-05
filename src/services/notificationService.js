import api from "./api";

// GET /api/v1/notifications
export const getNotifications = async () => {
    const response = await api.get("/notifications");
    return response.data;
};

// GET /api/v1/notifications/unread-count
export const getUnreadNotificationCount = async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
};

// PUT /api/v1/notifications/{id}/read
export const markNotificationAsRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

// PUT /api/v1/notifications/read-all
export const markAllNotificationsAsRead = async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
};