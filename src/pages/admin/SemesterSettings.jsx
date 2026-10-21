import { useState, useEffect } from "react";
import { getSemesters } from "../../services/eligibilityService";
import { assignModerator } from "../../services/semesterService";
import { getUsers } from "../../services/userService";
import { downloadGroupsReport } from "../../utils/downloadGroupsReport";
import { apiError } from "../../utils/apiError";

export default function SemesterSettings() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("Fall2026");
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  
  // State quản lý phân công Moderator
  const [moderators, setModerators] = useState([]);
  const [selectedModeratorId, setSelectedModeratorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [semRes, userRes] = await Promise.all([
          getSemesters({ size: 1000 }),
          getUsers({ size: 1000 }).catch(() => []),
        ]);

        const semList = Array.isArray(semRes) ? semRes : semRes.content || [];
        setSemesters(semList);
        if (semList.length > 0) {
          const firstCode = semList[0].code || semList[0].name || semList[0];
          setSelectedSemester(firstCode);
        }

        const userList = userRes?.content || userRes || [];
        // Lọc danh sách các tài khoản có vai trò Moderator / Lecturer
        const modList = userList.filter((u) => {
          const r = String(u.role || "").toUpperCase();
          return r.includes("MODERATOR") || r.includes("LECTURER");
        });
        setModerators(modList);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoadingSemesters(false);
      }
    };
    fetchData();
  }, []);

  const handleExportExcel = async (e) => {
    e.preventDefault();
    if (exportingExcel) return;
    setExportingExcel(true);
    setError("");
    setSuccessMessage("");

    try {
      await downloadGroupsReport(selectedSemester);
      setSuccessMessage(`Đã tải xuống báo cáo Excel học kỳ ${selectedSemester} thành công!`);
    } catch (err) {
      setError(err.message || "Xuất Excel thất bại.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleAssignModerator = async (e) => {
    e.preventDefault();
    if (!selectedSemester || !selectedModeratorId || assigning) return;

    setAssigning(true);
    setError("");
    setSuccessMessage("");

    try {
      // Sửa từ userId thành moderatorId khớp chuẩn với Swagger backend
      await assignModerator(selectedSemester, { moderatorId: selectedModeratorId });
      setSuccessMessage(`Đã phân công Moderator thành công cho học kỳ ${selectedSemester}!`);
      setSelectedModeratorId("");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn text-[#2C2825]">
      {/* Header Banner */}
      <div className="bg-white p-7 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-black rounded-lg uppercase tracking-wider">
            Cấu hình hệ thống · V2.9
          </span>
          <h1 className="text-2xl font-black text-[#2C2825]">Quản lý Học kỳ & Báo cáo</h1>
          <p className="text-xs text-[#6B635B]">
            Theo dõi danh sách học kỳ, phân công Moderator phụ trách và xuất file báo cáo tổng hợp bàn giao.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FBF9F5] px-4 py-2.5 rounded-2xl border border-[#E8E2D9]">
          <span className="text-xs font-bold text-[#6B635B]">Tổng học kỳ:</span>
          <span className="text-xs font-black text-[#E65100]">{semesters.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <span>✨</span> {successMessage}
        </div>
      )}

      {/* Grid Layout chính */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Cột trái: Danh sách học kỳ (chiếm 7 phần) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
              📅 Danh sách học kỳ khả dụng
            </h2>
          </div>

          {loadingSemesters ? (
            <div className="p-12 text-center text-xs font-bold text-[#6B635B] bg-white rounded-3xl border border-[#E8E2D9]">
              Đang tải dữ liệu học kỳ...
            </div>
          ) : (
            <div className="space-y-3">
              {semesters.map((sem, idx) => {
                const code = sem.code || sem;
                const name = sem.name || code;
                const isSelected = selectedSemester === code;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSemester(code)}
                    className={`rounded-2xl border p-5 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                      isSelected
                        ? "border-[#E65100] bg-orange-50/30 ring-2 ring-orange-100"
                        : "border-[#E8E2D9] bg-white hover:border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-sm">
                        🎓
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-[#2C2825]">{name}</h3>
                        <p className="text-[11px] text-[#6B635B] mt-0.5">
                          Mã hệ thống: <span className="font-mono font-bold text-[#E65100]">{code}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100">
                      Đang hoạt động
                    </span>
                  </div>
                );
              })}
              {!semesters.length && (
                <div className="p-8 text-center text-xs text-[#6B635B] italic bg-white rounded-3xl border border-[#E8E2D9]">
                  Chưa có học kỳ nào được thiết lập.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải: Phân công Moderator & Xuất Excel (chiếm 5 phần) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Khung Phân công Moderator */}
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                👑 Phân công Moderator phụ trách
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                Chọn học kỳ bên trái và chỉ định giảng viên quản lý học kỳ đó.
              </p>
            </div>

            <form onSubmit={handleAssignModerator} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B635B]">Học kỳ đang chọn</label>
                <input
                  type="text"
                  disabled
                  value={selectedSemester}
                  className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B635B]">Chọn Giảng viên / Moderator</label>
                <select
                  value={selectedModeratorId}
                  onChange={(e) => setSelectedModeratorId(e.target.value)}
                  required
                  className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#2C2825] outline-none cursor-pointer focus:border-[#E65100]"
                >
                  <option value="">-- Chọn Moderator --</option>
                  {moderators.map((mod) => (
                    <option key={mod.id || mod.userId} value={mod.id || mod.userId}>
                      {mod.fullName} ({mod.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning || !selectedModeratorId}
                className="w-full py-3.5 bg-[#2C2825] hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {assigning ? "Đang phân công..." : "✓ Xác nhận phân công Moderator"}
              </button>
            </form>
          </div>

          {/* Khung Xuất Excel Báo cáo */}
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                📥 Xuất Excel Báo cáo (QT15)
              </h2>
              <p className="text-xs text-[#6B635B] leading-relaxed">
                Hệ thống tổng hợp toàn bộ danh sách nhóm và sinh viên thành file Excel bàn giao theo đúng học kỳ bạn đang chọn.
              </p>
            </div>

            <form onSubmit={handleExportExcel} className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={exportingExcel || semesters.length === 0}
                className="w-full py-4 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{exportingExcel ? "⏳" : "📥"}</span>
                <span>{exportingExcel ? "Đang tạo file Excel..." : `Tải xuống báo cáo ${selectedSemester} (.xlsx)`}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}