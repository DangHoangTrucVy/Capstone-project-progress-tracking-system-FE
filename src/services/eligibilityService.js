import api from "./api";

// Lấy danh sách sinh viên đã import / không đủ điều kiện
export const getImportedStudents = async (semester) => {
    const response = await api.get(`/semesters/${semester}/students`);
    return response.data;
};

export const getIneligibleStudents = async () => {
    const response = await api.get(`/semesters/ineligible-students`);
    return response.data;
};

// Cập nhật trạng thái đủ/không đủ điều kiện cho sinh viên
export const updateStudentEligibility = async (studentId, data) => {
    const response = await api.put(`/students/${studentId}/eligibility`, data);
    return response.data;
};

// Preview student list file: POST /api/v1/semesters/{semester}/imports/students/preview
export const previewStudentImport = async (semester, formData) => {
    const response = await api.post(`/semesters/${semester}/imports/students/preview`, formData, {
        headers: { "Content-Type": undefined },
    });
    return response.data;
};

// Import students: POST /api/v1/semesters/{semester}/imports/students
export const importStudents = async (semester, formData) => {
    const response = await api.post(`/semesters/${semester}/imports/students`, formData, {
        headers: { "Content-Type": undefined },
    });
    return response.data;
};

// Preview eligibility file: POST /api/v1/semesters/{semester}/imports/eligibility/preview
export const previewEligibilityImport = async (semester, formData) => {
    const response = await api.post(`/semesters/${semester}/imports/eligibility/preview`, formData, {
        headers: { "Content-Type": undefined },
    });
    return response.data;
};

// Import eligibility: POST /api/v1/semesters/{semester}/imports/eligibility
export const importEligibility = async (semester, formData) => {
    const response = await api.post(`/semesters/${semester}/imports/eligibility`, formData, {
        headers: { "Content-Type": undefined },
    });
    return response.data;
};

// Change a student's eligibility with a reason: PUT /api/v1/enrollments/{enrollmentId}/eligibility
export const updateEnrollmentEligibility = async (enrollmentId, data) => {
    const response = await api.put(`/enrollments/${enrollmentId}/eligibility`, data);
    return response.data;
};

// Edit student contact details: PUT /api/v1/semester-students/{semesterStudentId}
export const updateStudentContact = async (semesterStudentId, data) => {
    const response = await api.put(`/semester-students/${semesterStudentId}`, data);
    return response.data;
};