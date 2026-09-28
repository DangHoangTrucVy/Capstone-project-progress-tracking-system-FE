import api from "./api";

// GET /api/v1/meetings/{id}
export const getMeetingById = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}`);
  return response.data;
};

// PUT /api/v1/meetings/{id}/start
export const startMeeting = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/start`);
  return response.data;
};

// PUT /api/v1/meetings/{id}/end
export const endMeeting = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/end`);
  return response.data;
};

// GET /api/v1/meetings/{id}/minutes
export const getMeetingMinutes = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}/minutes`);
  return response.data;
};

// POST /api/v1/meetings/{id}/minutes/generate
export const generateMeetingMinutes = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/minutes/generate`);
  return response.data;
};

// PUT /api/v1/meetings/{id}/minutes/sign
export const signMeetingMinutes = async (meetingId) => {
  const response = await api.put(`/meetings/${meetingId}/minutes/sign`);
  return response.data;
};

// POST /api/v1/bookings/{bookingId}/meetings
export const createMeetingFromBooking = async (bookingId, payload = {}) => {
  const response = await api.post(`/bookings/${bookingId}/meetings`, payload);
  return response.data;
};

// GET /api/v1/meetings/{id}/requirements
export const getMeetingRequirements = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}/requirements`);
  return response.data;
};

// POST /api/v1/meetings/{id}/requirements
export const createMeetingRequirement = async (meetingId, payload) => {
  const response = await api.post(`/meetings/${meetingId}/requirements`, payload);
  return response.data;
};