import api from "./api";

// Lấy lịch của một học kỳ
export const getSemesterCalendar = async (semester) => {
  const response = await api.get(
    `/semesters/${encodeURIComponent(semester)}`,
  );

  return response.data;
};

// Cập nhật ngày bắt đầu học kỳ
export const updateSemesterStartDate = async (
  semester,
  startDate,
) => {
  const response = await api.put(
    `/semesters/${encodeURIComponent(semester)}`,
    {
      startDate,
    },
  );

  return response.data;
};