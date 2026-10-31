import api from "./api";

// Lấy danh sách chuyên ngành: GET /api/v1/majors
export const getMajors = async () => {
  const response = await api.get("/majors");
  return response.data;
};

// Tạo chuyên ngành mới (Admin): POST /api/v1/majors
export const createMajor = async (data) => {
  const response = await api.post("/majors", data);
  return response.data;
};

// Đổi tên / cập nhật chuyên ngành (Admin): PUT /api/v1/majors/{id}
export const updateMajor = async (id, data) => {
  const response = await api.put(`/majors/${id}`, data);
  return response.data;
};