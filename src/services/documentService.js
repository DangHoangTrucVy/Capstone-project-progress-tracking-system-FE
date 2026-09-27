import api from "./api";

// 1. Lấy danh sách tài liệu/artifacts của nhóm
export const getGroupDocuments = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/documents`);
  return response.data;
};

// 2. Nộp link tài liệu mới cho nhóm (JSON payload)
export const submitDocumentLink = async (groupId, docData) => {
  const response = await api.post(`/groups/${groupId}/documents`, docData);
  return response.data;
};

// 3. Tải xuống file tài liệu theo ID
export const downloadDocumentFile = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/file`, {
    responseType: "blob",
  });
  return response.data;
};