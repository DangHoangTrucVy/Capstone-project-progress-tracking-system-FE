import api from "./api";

// GET /api/v1/groups/{groupId}/artifacts
export const getGroupArtifacts = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/artifacts`);
  return response.data;
};

// POST /api/v1/groups/{groupId}/artifacts
export const submitArtifact = async (groupId, artifactData) => {
  const response = await api.post(`/groups/${groupId}/artifacts`, artifactData);
  return response.data;
};

// GET /api/v1/groups/{groupId}/documents
export const getGroupDocuments = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/documents`);
  return response.data;
};

// POST /api/v1/groups/{groupId}/documents
export const submitDocumentLink = async (groupId, docData) => {
  const response = await api.post(`/groups/${groupId}/documents`, docData);
  return response.data;
};

// POST /api/v1/documents/{id}/accept
export const acceptDocument = async (documentId, payload = {}) => {
  const response = await api.post(`/documents/${documentId}/accept`, payload);
  return response.data;
};

// POST /api/v1/artifacts/{id}/accept
export const acceptArtifact = async (artifactId, payload = {}) => {
  const response = await api.post(`/artifacts/${artifactId}/accept`, payload);
  return response.data;
};

// GET /api/v1/documents/{id}
export const getDocumentById = async (documentId) => {
  const response = await api.get(`/documents/${documentId}`);
  return response.data;
};

// GET /api/v1/artifacts/{id}
export const getArtifactById = async (artifactId) => {
  const response = await api.get(`/artifacts/${artifactId}`);
  return response.data;
};

// GET /api/v1/documents/{id}/file
export const downloadDocumentFile = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/file`, {
    responseType: "blob",
  });
  return response.data;
};

// GET /api/v1/artifacts/{id}/file
export const downloadArtifactFile = async (artifactId) => {
  const response = await api.get(`/artifacts/${artifactId}/file`, {
    responseType: "blob",
  });
  return response.data;
};