import api from "./api";

/**
 * 1. GET /slots
 * Lấy danh sách các slot rảnh / lịch hẹn
 */
export const getSlots = async (params = {}) => {
  try {
    const response = await api.get("/slots", { params });
    return response.data;
  } catch (error) {
    console.warn("Backend đang lỗi kết nối CSDL tại /slots:", error);
    return { content: [], empty: true }; // Trả về cấu trúc phân trang rỗng an toàn cho UI
  }
};

/**
 * 2. POST /slots
 * Tạo mới một slot lịch hẹn (Dành cho Giảng viên / Admin)
 */
export const createSlot = async (slotData) => {
  const response = await api.post("/slots", slotData);
  return response.data;
};

/**
 * 3. GET /slots/{id}
 * Lấy chi tiết thông tin một slot theo ID
 */
export const getSlotById = async (id) => {
  const response = await api.get(`/slots/${id}`);
  return response.data;
};

/**
 * 4. POST /slots/{id}/book
 * Đặt lịch (Book slot) cho nhóm
 */
export const bookSlot = async (slotId, bookingPayload = {}) => {
  const response = await api.post(`/slots/${slotId}/book`, bookingPayload);
  return response.data;
};

/**
 * 5. DELETE /bookings/{id}
 * Hủy lịch hẹn đã đặt theo booking ID
 */
export const cancelBooking = async (bookingId, reason = "") => {
  const response = await api.delete(`/bookings/${bookingId}`, {
    data: { reason }
  });
  return response.data;
};

/**
 * Hàm hỗ trợ lấy danh sách booking của một nhóm cụ thể
 */
export const getGroupBookings = async (groupId) => {
  const response = await api.get("/slots", {
    params: { groupId, status: "CONFIRMED" }
  }).catch(() => ({ data: [] }));
  
  return response.data;
};