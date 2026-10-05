import React, { useState } from "react";
import api from "../../services/api";

export default function ExportExcelReport() {
  const [semester, setSemester] = useState("Fall2026");
  const [loading, setLoading] = useState(false);

  const handleExportExcel = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gọi API xuất báo cáo Excel theo chuẩn QT15
      const response = await api.get(`/reports/export?semester=${semester}`, {
        responseType: "blob",
      });

      // Tạo đường dẫn tải file ẩn
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Đặt tên file theo chuẩn: Danh_sach_ghep_nhom_<Ky>_<yyyyMMdd_HHmmss>.xlsx
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
      link.setAttribute(download, `Danh_sach_ghep_nhom_${semester}_${dateStr}_${timeStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert("Xuất file Excel báo cáo thành công!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      alert("Không thể xuất file báo cáo. Vui lòng kiểm tra lại kết nối hoặc dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          QT15 · Xuất Excel Báo Cáo Ghép Nhóm
        </span>
        <h1 className="text-xl font-black">Xuất danh sách bàn giao (Excel)</h1>
        <p className="text-xs text-[#6B635B]">
          Hệ thống sẽ tạo file Excel chứa 2 sheet: <strong className="text-[#2C2825]">Danh_sach_nhom</strong> và <strong className="text-[#2C2825]">Chua_co_nhom</strong> theo đúng chuẩn dữ liệu hiện hành.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
        <form onSubmit={handleExportExcel} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#6B635B]">Chọn học kỳ cần xuất báo cáo</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            >
              <option value="Fall2026">Fall 2026</option>
              <option value="Spring2027">Spring 2027</option>
              <option value="Summer2027">Summer 2027</option>
              <option value="Fall2027">Fall 2027</option>
            </select>
          </div>

          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 text-xs space-y-2 text-[#6B635B]">
            <p className="font-black text-[#E65100]">Quy tắc định dạng dữ liệu trong file xuất:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Sheet Danh_sach_nhom:</strong> Gồm mã nhóm, tên nhóm, sĩ số, trạng thái nhóm, thông tin thành viên (MSSV, họ tên, email, SĐT, vai trò Leader/Member).</li>
              <li><strong>Sheet Chua_co_nhom:</strong> Gồm danh sách sinh viên chưa có nhóm, trạng thái điều kiện và lý do chưa có nhóm.</li>
              <li>MSSV và SĐT được lưu dưới dạng văn bản để giữ nguyên số 0 ở đầu; không gộp ô trong bảng dữ liệu.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang tạo file Excel..." : "📥 Tải xuống file Excel (.xlsx)"}
          </button>
        </form>
      </div>
    </div>
  );
}