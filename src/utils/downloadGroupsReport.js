import { exportGroupsExcel } from "../services/groupService";

// Shared by both report screens. Never save an API error page as an Excel file.
export async function downloadGroupsReport(semester) {
  const selectedSemester = semester.trim();

  let response;
  try {
    response = await exportGroupsExcel(selectedSemester || undefined);
  } catch (error) {
    if ([404, 405, 501].includes(error.response?.status)) {
      throw new Error("API xuất Excel chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau khi Backend triển khai.", { cause: error });
    }
    if (error.response?.status === 401) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { cause: error });
    if (error.response?.status === 403) throw new Error("Bạn không có quyền xuất báo cáo Excel.", { cause: error });
    const data = error.response?.data;
    if (data instanceof Blob && /json/i.test(data.type)) {
      const payload = await data.text().then(JSON.parse).catch(() => null);
      if (payload?.message) throw new Error(payload.message, { cause: error });
    }
    throw new Error(data?.message || "Không thể xuất báo cáo Excel. Vui lòng kiểm tra kết nối và quyền truy cập.", { cause: error });
  }

  const blob = response.data;
  if (response.status !== 200 || !response.headers['content-type']?.includes('spreadsheetml') || !(blob instanceof Blob) || !blob.size) {
    const payload = blob instanceof Blob ? await blob.text().then(JSON.parse).catch(() => null) : blob;
    throw new Error(payload?.message || "Máy chủ chưa trả về file Excel hợp lệ.");
  }

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const safeSemester = (selectedSemester || 'Tat_ca').replace(/[^a-zA-Z0-9_-]/g, "_");
  const disposition = response.headers['content-disposition'] || '';
  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  let serverName = /filename="([^"]+)"/i.exec(disposition)?.[1];
  if (encodedName) {
    try { serverName = decodeURIComponent(encodedName); } catch { /* Use the plain filename or fallback. */ }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = serverName?.split(/[\\/]/).pop() || `Danh_sach_ghep_nhom_${safeSemester}_${date}_${time}.xlsx`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser to start consuming the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
