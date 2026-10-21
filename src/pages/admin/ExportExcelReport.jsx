import { useState, useEffect } from "react";
import { downloadGroupsReport } from "../../utils/downloadGroupsReport";
import { getSemesters } from "../../services/eligibilityService";
import { apiError } from "../../utils/apiError";

export default function ExportExcelReport() {
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("Fall2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSemesters()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.content || [];
        setSemesters(list);
        if (list.length > 0) {
          const firstCode = list[0].code || list[0].name || list[0];
          setSemester(firstCode);
        }
      })
      .catch((err) => setError(apiError(err)));
  }, []);

  const handleExportExcel = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await downloadGroupsReport(semester);
      alert("Đã tải báo cáo Excel thành công!");
    } catch (err) {
      setError(err.message);
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
          Hệ thống sẽ tạo file Excel chứa dữ liệu theo học kỳ thực tế từ hệ thống.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
          ❌ {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5">
        <form onSubmit={handleExportExcel} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#6B635B]">Chọn học kỳ cần xuất báo cáo</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100] cursor-pointer font-bold text-[#E65100]"
            >
              {semesters.map((sem, idx) => {
                const code = sem.code || sem;
                return (
                  <option key={idx} value={code}>
                    {sem.name || code}
                  </option>
                );
              })}
            </select>
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