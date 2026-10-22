import { useState, useEffect } from "react";
import { getSemesters } from "../../services/eligibilityService";
import {
  assignModerator,
  createSemester,
} from "../../services/semesterService";
import { getUsers } from "../../services/userService";
import { downloadGroupsReport } from "../../utils/downloadGroupsReport";
import { apiError } from "../../utils/apiError";

export default function SemesterSettings() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

  // State quản lý phân công Moderator
  const [moderators, setModerators] = useState([]);
  const [selectedModeratorId, setSelectedModeratorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // State tạo học kỳ chuẩn theo đúng thuộc tính thực tế của Backend v2.9
  const [newSemesterForm, setNewSemesterForm] = useState({
    code: "SU27",
    name: "Summer 2027",
    startDate: "2026-10-23",
    endDate: "2026-10-25",
    formationOpensAt: "2026-10-22T00:00:00.000Z", // <-- Chỉnh mốc này lùi về quá khứ
    defaultDeadline: "2026-10-25T23:59:59.000Z",
  });
  const [creatingSemester, setCreatingSemester] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoadingSemesters(true);
      const [semRes, userRes] = await Promise.all([
        getSemesters({ size: 1000 }),
        getUsers({ size: 1000 }).catch(() => []),
      ]);

      const semList = Array.isArray(semRes) ? semRes : semRes.content || [];
      setSemesters(semList);
      if (semList.length > 0 && !selectedSemester) {
        const firstCode = semList[0].code || semList[0].name || semList[0];
        setSelectedSemester(firstCode);
      }

      const userList = userRes?.content || userRes || [];
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (creatingSemester) return;
    setCreatingSemester(true);
    setError("");
    setSuccessMessage("");

    try {
      // Gửi payload đầy đủ thuộc tính thực tế lên backend
      await createSemester(newSemesterForm);
      setSuccessMessage(
        `Đã tạo học kỳ ${newSemesterForm.code} thành công với đầy đủ mốc thời gian hệ thống!`,
      );
      setSelectedSemester(newSemesterForm.code);
      await fetchData();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setCreatingSemester(false);
    }
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    if (exportingExcel) return;
    setExportingExcel(true);
    setError("");
    setSuccessMessage("");

    try {
      await downloadGroupsReport(selectedSemester);
      setSuccessMessage(
        `Đã tải xuống báo cáo Excel học kỳ ${selectedSemester} thành công!`,
      );
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
      await assignModerator(selectedSemester, {
        moderatorId: selectedModeratorId,
      });
      setSuccessMessage(
        `Đã phân công Moderator thành công cho học kỳ ${selectedSemester}!`,
      );
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
          <h1 className="text-2xl font-black text-[#2C2825]">
            Quản lý Học kỳ & Cấu hình Thời gian
          </h1>
          <p className="text-xs text-[#6B635B]">
            Tạo học kỳ mới với đầy đủ thuộc tính thời gian thực tế để kích hoạt
            chuẩn luồng chuyển đổi trạng thái.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FBF9F5] px-4 py-2.5 rounded-2xl border border-[#E8E2D9]">
          <span className="text-xs font-bold text-[#6B635B]">Tổng học kỳ:</span>
          <span className="text-xs font-black text-[#E65100]">
            {semesters.length}
          </span>
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
        {/* Cột trái: Form tạo học kỳ thực tế đầy đủ thuộc tính + Danh sách học kỳ (7 phần) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#E65100]">
                ⚙️ Tạo học kỳ mới (Chuẩn dữ liệu Backend v2.9)
              </h2>
            </div>
            <p className="text-[11px] text-[#6B635B]">
              Form này gửi trực tiếp các mốc <strong>formationOpensAt</strong>{" "}
              và <strong>defaultDeadline</strong> thật lên server để hệ thống
              kích hoạt tự động mở ghép nhóm.
            </p>

            <form onSubmit={handleCreateSemester} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Mã học kỳ (Code)
                  </label>
                  <input
                    type="text"
                    value={newSemesterForm.code}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        code: e.target.value,
                      })
                    }
                    required
                    placeholder="VD: SU26"
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Tên học kỳ (Name)
                  </label>
                  <input
                    type="text"
                    value={newSemesterForm.name}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        name: e.target.value,
                      })
                    }
                    required
                    placeholder="VD: Summer 2026"
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Ngày bắt đầu (Start Date)
                  </label>
                  <input
                    type="date"
                    value={newSemesterForm.startDate}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        startDate: e.target.value,
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Ngày kết thúc (End Date)
                  </label>
                  <input
                    type="date"
                    value={newSemesterForm.endDate}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        endDate: e.target.value,
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Thời điểm mở (Formation Opens At)
                  </label>
                  <input
                    type="datetime-local"
                    value={newSemesterForm.formationOpensAt.slice(0, 16)}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        formationOpensAt: new Date(
                          e.target.value,
                        ).toISOString(),
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">
                    Deadline mặc định (Default Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    value={newSemesterForm.defaultDeadline.slice(0, 16)}
                    onChange={(e) =>
                      setNewSemesterForm({
                        ...newSemesterForm,
                        defaultDeadline: new Date(e.target.value).toISOString(),
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingSemester}
                className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {creatingSemester
                  ? "Đang tạo..."
                  : "🚀 Tạo Học Kỳ Mới (Chuẩn Backend)"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
              📅 Danh sách học kỳ khả dụng trong hệ thống
            </h2>

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
                      className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                        isSelected
                          ? "border-[#E65100] bg-orange-50/30 ring-2 ring-orange-100"
                          : "border-[#E8E2D9] bg-white hover:border-orange-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-xs">
                          🎓
                        </div>
                        <div>
                          <h3 className="font-black text-xs text-[#2C2825]">
                            {name}
                          </h3>
                          <p className="text-[10px] text-[#6B635B] mt-0.5">
                            Mã:{" "}
                            <span className="font-mono font-bold text-[#E65100]">
                              {code}
                            </span>{" "}
                            | Start: {sem.startDate || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100">
                        Đang chọn
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Phân công Moderator & Xuất Excel (5 phần) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                👑 Phân công Moderator phụ trách
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                Chọn học kỳ bên trái và chỉ định giảng viên quản lý.
              </p>
            </div>

            <form onSubmit={handleAssignModerator} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B635B]">
                  Học kỳ đang chọn
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedSemester}
                  className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B635B]">
                  Chọn Giảng viên / Moderator
                </label>
                <select
                  value={selectedModeratorId}
                  onChange={(e) => setSelectedModeratorId(e.target.value)}
                  required
                  className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#2C2825] outline-none cursor-pointer focus:border-[#E65100]"
                >
                  <option value="">-- Chọn Moderator --</option>
                  {moderators.map((mod) => (
                    <option
                      key={mod.id || mod.userId}
                      value={mod.id || mod.userId}
                    >
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
                {assigning
                  ? "Đang phân công..."
                  : "✓ Xác nhận phân công Moderator"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                📥 Xuất Excel Báo cáo (QT15)
              </h2>
              <p className="text-xs text-[#6B635B] leading-relaxed">
                Xuất file bàn giao tổng hợp theo học kỳ bạn đang chọn để kiểm
                tra kết quả.
              </p>
            </div>

            <form onSubmit={handleExportExcel} className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={exportingExcel || semesters.length === 0}
                className="w-full py-4 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{exportingExcel ? "⏳" : "📥"}</span>
                <span>
                  {exportingExcel
                    ? "Đang tạo file Excel..."
                    : `Tải xuống báo cáo ${selectedSemester} (.xlsx)`}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
