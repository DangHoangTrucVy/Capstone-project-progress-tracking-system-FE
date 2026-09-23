import api from "./api";

/**
 * 1. GET /api/v1/slots
 * Lấy danh sách các slot rảnh / lịch hẹn (hỗ trợ lọc theo instructorId, status, fromDate, toDate, pageable)
 */
export const getSlots = async (params = {}) => {
  const response = await api.get("/api/v1/slots", { params });
  return response.data;
};

/**
 * 2. POST /api/v1/slots
 * Tạo mới một slot lịch hẹn (Dành cho Giảng viên / Admin)
 */
export const createSlot = async (slotData) => {
  const response = await api.post("/api/v1/slots", slotData);
  return response.data;
};

/**
 * 3. GET /api/v1/slots/{id}
 * Lấy chi tiết thông tin một slot theo ID
 */
export const getSlotById = async (id) => {
  const response = await api.get(`/api/v1/slots/${id}`);
  return response.data;
};

/**
 * 4. POST /api/v1/slots/{id}/book
 * Đặt lịch (Book slot) cho nhóm
 * Body yêu cầu: { groupId: "...", notes: "..." }
 */
export const bookSlot = async (slotId, bookingPayload) => {
  const response = await api.post(`/api/v1/slots/${slotId}/book`, bookingPayload);
  return response.data;
};

/**
 * 5. DELETE /api/v1/bookings/{id}
 * Hủy lịch hẹn đã đặt theo booking ID
 * Body tùy chọn (nếu có lý do): { reason: "..." }
 */
export const cancelBooking = async (bookingId, reason = "") => {
  const response = await api.delete(`/api/v1/bookings/${bookingId}`, {
    data: { reason }
  });
  return response.data;
};

/**
 * Hàm hỗ trợ lấy danh sách booking của một nhóm cụ thể 
 * (Dựa trên cấu trúc API lọc slot hoặc custom endpoint của backend nhóm bạn)
 */
export const getGroupBookings = async (groupId) => {
  // Thường backend sẽ cung cấp endpoint lọc theo groupId hoặc lấy qua slots
  const response = await api.get("/api/v1/slots", {
    params: { groupId, status: "CONFIRMED" }
  }).catch(() => ({ data: [] }));
  
  return response.data;
};