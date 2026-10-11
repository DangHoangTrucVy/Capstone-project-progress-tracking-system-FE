import { exportGroupsExcel } from "../services/groupService";

// Shared by both report screens. Never save an API error page as an Excel file.
export async function downloadGroupsReport(semester) {
  const selectedSemester = semester.trim();
  if (!selectedSemester) throw new Error("Vui lòng chọn học kỳ cần xuất báo cáo.");

  let blob;
  try {
    blob = await exportGroupsExcel(selectedSemester);
  } catch (error) {
    if ([404, 405, 501].includes(error.response?.status)) {
      throw new Error("API xuất Excel chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau khi Backend triển khai.", { cause: error });
    }
    const data = error.response?.data;
    if (data instanceof Blob && /json/i.test(data.type)) {
      const payload = await data.text().then(JSON.parse).catch(() => null);
      if (payload?.message) throw new Error(payload.message, { cause: error });
    }
    throw new Error(data?.message || "Không thể xuất báo cáo Excel. Vui lòng kiểm tra kết nối và quyền truy cập.", { cause: error });
  }

  if (!(blob instanceof Blob) || !blob.size || /json|text\/|html/i.test(blob.type)) {
    throw new Error("Máy chủ chưa trả về file Excel hợp lệ.");
  }

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
    // Allow the browser to start consuming the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
