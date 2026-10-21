import api from "../services/api";

export async function downloadGroupsReport(semester = "") {
  const selectedSemester = String(semester).trim();
  if (!selectedSemester) {
    throw new Error("Vui lòng chọn học kỳ cần xuất báo cáo.");
  }

  let response;
  try {
    // Gọi đúng endpoint GET theo Swagger: /api/v1/semesters/{semester}/export
    response = await api.get(`/semesters/${selectedSemester}/export`, {
      responseType: "blob", // Nhận dữ liệu dưới dạng file nhị phân (binary)
    });
  } catch (error) {
    if ([404, 405, 501].includes(error.response?.status)) {
      throw new Error("API xuất Excel chưa sẵn sàng trên máy chủ. Vui lòng kiểm tra lại backend.");
    }
    if (error.response?.status === 401) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    if (error.response?.status === 403) {
      throw new Error("Bạn không có quyền xuất báo cáo Excel.");
    }
    
    // Đọc thông báo lỗi từ Blob trả về nếu có
    const data = error.response?.data;
    if (data instanceof Blob && /json/i.test(data.type)) {
      const payload = await data.text().then(JSON.parse).catch(() => null);
      if (payload?.message) throw new Error(payload.message);
    }
    throw new Error(data?.message || "Không thể xuất báo cáo Excel. Vui lòng kiểm tra lại.");
  }

  const blob = response.data;
  if (response.status !== 200 || !(blob instanceof Blob) || !blob.size) {
    throw new Error("Máy chủ chưa trả về file Excel hợp lệ.");
  }

  // Tự động tạo tên file và kích hoạt tải xuống trình duyệt
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const safeSemester = selectedSemester.replace(/[^a-zA-Z0-9_-]/g, "_");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = `Danh_sach_ghep_nhom_${safeSemester}_${date}_${time}.xlsx`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default downloadGroupsReport;