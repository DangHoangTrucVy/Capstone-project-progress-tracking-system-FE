import api from "./api";

// 1. Lấy danh sách thông báo của người dùng hiện tại
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// 2. Đếm số lượng thông báo chưa đọc
export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

// 3. Đánh dấu một thông báo là đã đọc
export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

// 4. Đánh dấu tất cả thông báo là đã đọc
export const markAllNotificationsAsRead = async () => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};