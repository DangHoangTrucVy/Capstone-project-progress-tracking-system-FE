import api from "./api";

// 1. Lấy thông tin chi tiết cuộc họp theo ID
export const getMeetingById = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}`);
  return response.data;
};

// 2. Bắt đầu cuộc họp (Dành cho GVHD)
export const startMeeting = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/start`);
  return response.data;
};

// 3. Kết thúc cuộc họp
export const endMeeting = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/end`);
  return response.data;
};

// 4. Lấy biên bản cuộc họp
export const getMeetingMinutes = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}/minutes`);
  return response.data;
};

// 5. Tạo biên bản tự động cho cuộc họp
export const generateMeetingMinutes = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/minutes/generate`);
  return response.data;
};

// 6. Ký xác nhận biên bản (Leader / Instructor sign-off)
export const signMeetingMinutes = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/minutes/sign`);
  return response.data;
};