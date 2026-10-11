import api from './api';

export const getSlots = async (params) => (await api.get('/slots', { params })).data;
export const bookSlot = async (slotId, groupId) => (await api.post(`/slots/${slotId}/book`, { groupId })).data;
export const cancelBooking = async (bookingId, reason) => (await api.delete(`/bookings/${bookingId}`, { data: { reason } })).data;
export const getTopicQuestions = async (topicId) => (await api.get(`/topics/${topicId}/questions`)).data;
export const submitTopicQuestion = async (topicId, questionText) => (await api.post(`/topics/${topicId}/questions`, { questionText })).data;
