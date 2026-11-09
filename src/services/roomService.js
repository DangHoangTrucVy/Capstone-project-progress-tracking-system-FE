import api from "./api";

// 1. Lấy thông tin 1 Room cụ thể
export const getRoomById = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

// 2. Chỉnh sửa thông tin Room (Leader: tên Room, kỹ năng cần tuyển | Mod: sửa minSize)
export const updateRoom = async (roomId, data) => {
  const response = await api.put(`/rooms/${roomId}`, data);
  return response.data;
};

// 3. Lấy danh sách Room của học kỳ (Mod xem tất cả, Sinh viên xem theo ngành)
export const getSemesterRooms = async (semester, params) => {
  const response = await api.get(`/semesters/${semester}/rooms`, { params });
  return response.data;
};

// 4. Sinh viên tìm kiếm Room trong ngành của mình (search query, available=true)
export const searchRooms = async (semester, params) => {
  const response = await api.get(`/semesters/${semester}/rooms/search`, { params });
  return response.data;
};

// 5. Moderator tạo Room hàng loạt cho 1 ngành
export const createRoomsForMajor = async (semester, data) => {
  const response = await api.post(`/semesters/${semester}/rooms`, data);
  return response.data;
};

// 6. Vào Room (Tự do/Vào Room trống thành Leader/Gửi đơn nếu Room khóa)
export const joinRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/join`);
  return response.data;
};

// 7. Rời Room (Tự rời / Gửi đơn xin rời nếu Room khóa)
export const leaveRoom = async (roomId, reason) => {
  const response = await api.post(`/rooms/${roomId}/leave`, { reason });
  return response.data;
};

// 8. Trưởng nhóm khóa Room
export const lockRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/lock`);
  return response.data;
};

// 9. Trưởng nhóm mở khóa Room
export const unlockRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/unlock`);
  return response.data;
};

// 10. Trưởng nhóm BÁO CHỐT gửi Moderator
export const requestFinalizeRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/finalize-request`);
  return response.data;
};

// 11. Trưởng nhóm HỦY BÁO CHỐT
export const withdrawFinalizeRequest = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}/finalize-request`);
  return response.data;
};

// 12. Moderator Duyệt hoặc Từ chối báo chốt ({ approved: true/false, reason: "" })
export const decideFinalizeRequest = async (roomId, data) => {
  const response = await api.post(`/rooms/${roomId}/finalize-decision`, data);
  return response.data;
};

// 13. Trưởng nhóm Kick thành viên trước deadline
export const removeRoomMember = async (roomId, userId) => {
  const response = await api.delete(`/rooms/${roomId}/members/${userId}`);
  return response.data;
};

// 14. Lấy danh sách ứng viên chưa có nhóm trong ngành (để Trưởng nhóm mời)
export const getCandidates = async (semester, params) => {
  const response = await api.get(`/semesters/${semester}/candidates`, { params });
  return response.data;
};

// 15. Lấy danh sách yêu cầu & lời mời cá nhân trong học kỳ
export const getMyRequestsAndInvites = async (semester) => {
  const response = await api.get(`/semesters/${semester}/my-requests`);
  return response.data;
};


// Bổ sung các hàm thao tác Room dành cho Sinh viên (V3.0)

// 1. Nhường / Bàn giao quyền Trưởng nhóm cho thành viên khác trong Room
export const transferLeader = async (roomId, targetUserId) => {
  const response = await api.post(`/rooms/${roomId}/leader`, { targetUserId });
  return response.data;
};

// 11. Mời sinh viên khác vào Room (Dùng trong giai đoạn Bổ sung)
export const inviteStudentToRoom = async (roomId, studentCode) => {
  const response = await api.post(`/rooms/${roomId}/invite`, { studentCode });
  return response.data;
};

// Export thêm alias createRoom để tương thích với các component frontend
export const createRoom = createRoomsForMajor;

// ==========================================
// BỔ SUNG CÁC HÀM XỬ LÝ LỜI MỜI VÀ ĐƠN (REQUESTS)
// ==========================================

// Chấp nhận lời mời / đơn ứng tuyển
export const acceptRequest = async (requestId) => {
  const response = await api.post(`/requests/${requestId}/accept`);
  return response.data;
};

// Từ chối lời mời / đơn ứng tuyển
export const rejectRequest = async (requestId, data) => {
  const response = await api.post(`/requests/${requestId}/reject`, data);
  return response.data;
};

// Rút lại đơn ứng tuyển đã gửi
export const withdrawRequest = async (requestId) => {
  const response = await api.delete(`/requests/${requestId}`);
  return response.data;
};