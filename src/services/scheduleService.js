import api from "./api";

// --- SCHEDULE SLOTS (Giảng viên / Admin) ---
// Cập nhật lại hàm getSlots để gán giá trị mặc định cho Pageable
export const getSlots = async (params = {}) => {
    const queryParams = {
        page: 0,
        size: 50,
        ...params
    };
    const response = await api.get("/slots", { params: queryParams });
    return response.data;
};

export const createSlot = async (slotData) => {
    // slotData: startTime, endTime, durationMinutes, capacity, locationType, meetingUrl
    const response = await api.post("/slots", slotData);
    return response.data;
};

export const getSlotById = async (id) => {
    const response = await api.get(`/slots/${id}`);
    return response.data;
};

// --- BOOKINGS (Group Leader) ---
export const bookSlot = async (slotId) => {
    // POST /slots/{id}/book (Backend dùng pessimistic-lock chống race-condition)
    const response = await api.post(`/slots/${slotId}/book`);
    return response.data;
};

export const cancelBooking = async (bookingId) => {
    // DELETE /bookings/{id} (Kiểm tra cửa sổ hủy trễ - late-cancellation window)
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
};

export const getGroupBookings = async (groupId) => {
    const response = await api.get(`/groups/${groupId}/bookings`).catch(() => []);
    return response.data;
};