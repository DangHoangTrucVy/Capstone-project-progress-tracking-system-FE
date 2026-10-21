import api from "./api";

// Lấy danh sách học kỳ từ Backend
export const getSemesters = async () => {
  const response = await api.get("/semesters");
  return response.data;
};

// Import danh sách sinh viên chính thức (POST)
export const importStudents = async (semester, formDataOrJson) => {
  const isFormData = formDataOrJson instanceof FormData;
  const response = await api.post(`/semesters/${semester}/imports/students`, formDataOrJson, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Xem trước danh sách sinh viên trước khi import (Preview) (POST)
export const previewStudents = async (semester, formDataOrJson) => {
  const isFormData = formDataOrJson instanceof FormData;
  const response = await api.post(`/semesters/${semester}/imports/students/preview`, formDataOrJson, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Import file điều kiện sinh viên (Eligibility) (POST)
export const importEligibilityFile = async (semester, formData) => {
  const response = await api.post(`/semesters/${semester}/imports/eligibility`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Xem trước file điều kiện sinh viên (Eligibility Preview) (POST)
export const previewEligibilityFile = async (semester, formData) => {
  const response = await api.post(`/semesters/${semester}/imports/eligibility/preview`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Cập nhật trạng thái điều kiện của sinh viên lẻ
export const updateStudentEligibility = async (semester, studentCode, data) => {
  const response = await api.put(`/semesters/${semester}/students/${studentCode}/eligibility`, data);
  return response.data;
};

export const getIneligibleStudents = async (semester, params) => {
  const response = await api.get(`/semesters/${semester}/students`, {
    params: { ...params, eligible: false }
  });
  return response.data;
};