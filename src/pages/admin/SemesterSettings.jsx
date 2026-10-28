import { useState, useEffect } from "react";
import { getSemesters } from "../../services/eligibilityService";
import {
  assignModerator,
  createSemester,
  updateSemester,
  deleteSemester,
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

  // Helper định dạng ngày giờ cho input datetime-local (YYYY-MM-DDTHH:mm)
  const toLocalISOString = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const openingDate = new Date();
  openingDate.setDate(now.getDate() - 1);

  const deadlineDate = new Date();
  deadlineDate.setDate(now.getDate() + 5);

  // State form Tạo / Cập nhật học kỳ (Lưu chuỗi thô YYYY-MM-DDTHH:mm để gõ phím trực tiếp)
  const [isEditing, setIsEditing] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    code: "SU27",
    name: "Summer 2027",
    startDate: formatDate(now),
    endDate: formatDate(deadlineDate),
    formationOpensAt: toLocalISOString(openingDate),
    defaultDeadline: toLocalISOString(deadlineDate),
  });
  const [submittingSemester, setSubmittingSemester] = useState(false);

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

  // Xử lý Tạo mới hoặc Cập nhật học kỳ (Chuyển đổi sang .toISOString() chuẩn xác khi submit)
  const handleSaveSemester = async (e) => {
    e.preventDefault();
    if (submittingSemester) return;
    setSubmittingSemester(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...semesterForm,
        formationOpensAt: new Date(semesterForm.formationOpensAt).toISOString(),
        defaultDeadline: new Date(semesterForm.defaultDeadline).toISOString(),
      };

      if (isEditing) {
        await updateSemester(semesterForm.code, payload);
        setSuccessMessage(`Đã cập nhật thông tin học kỳ ${semesterForm.code} thành công!`);
      } else {
        await createSemester(payload);
        setSuccessMessage(`Đã tạo học kỳ mới ${semesterForm.code} thành công!`);
      }
      setSelectedSemester(semesterForm.code);
      setIsEditing(false);
      await fetchData();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmittingSemester(false);
    }
  };

  // Xóa học kỳ trống
  const handleDeleteSemester = async (code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học kỳ trống ${code} không?`)) return;
    setError("");
    setSuccessMessage("");
    try {
      await deleteSemester(code);
      setSuccessMessage(`Đã xóa học kỳ ${code} thành công.`);
      await fetchData();
    } catch (err) {
      setError(apiError(err));
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
      setSuccessMessage(`Đã tải xuống báo cáo Excel học kỳ ${selectedSemester} thành công!`);
    } catch (err) {
      setError(err.message || "Xuất Excel thất bại.");
    } finally {
      setExportingExcel(false);
    }
  };

  // Phân công Moderator
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
      setSuccessMessage(`Đã phân công Moderator thành công cho học kỳ ${selectedSemester}!`);
      setSelectedModeratorId("");
      await fetchData();
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
            Quản lý Học kỳ & Phân công Moderator
          </h1>
          <p className="text-xs text-[#6B635B]">
            Thiết lập mốc thời gian ghép nhóm và chỉ định giảng viên điều phối toàn học kỳ.
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
        {/* Cột trái: Form tạo/sửa học kỳ + Danh sách học kỳ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#E65100]">
                {isEditing ? "✏️ Cập nhật thông tin học kỳ" : "⚙️ Tạo học kỳ mới (Chuẩn v2.9)"}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSemesterForm({
                      code: "SU27",
                      name: "Summer 2027",
                      startDate: formatDate(now),
                      endDate: formatDate(deadlineDate),
                      formationOpensAt: toLocalISOString(openingDate),
                      defaultDeadline: toLocalISOString(deadlineDate),
                    });
                  }}
                  className="text-[11px] font-bold text-gray-500 hover:text-black cursor-pointer"
                >
                  Hủy sửa ✕
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSemester} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Mã học kỳ (Code)</label>
                  <input
                    type="text"
                    value={semesterForm.code}
                    disabled={isEditing}
                    onChange={(e) => setSemesterForm({ ...semesterForm, code: e.target.value })}
                    required
                    placeholder="VD: SU26"
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Tên học kỳ (Name)</label>
                  <input
                    type="text"
                    value={semesterForm.name}
                    onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                    required
                    placeholder="VD: Summer 2026"
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={semesterForm.startDate}
                    onChange={(e) => setSemesterForm({ ...semesterForm, startDate: e.target.value })}
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={semesterForm.endDate}
                    onChange={(e) => setSemesterForm({ ...semesterForm, endDate: e.target.value })}
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Thời điểm mở nhóm</label>
                  <input
                    type="datetime-local"
                    value={semesterForm.formationOpensAt}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        formationOpensAt: e.target.value,
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B635B]">Deadline mặc định</label>
                  <input
                    type="datetime-local"
                    value={semesterForm.defaultDeadline}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        defaultDeadline: e.target.value,
                      })
                    }
                    required
                    className="w-full p-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingSemester}
                className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {submittingSemester ? "Đang lưu..." : isEditing ? "💾 Lưu thay đổi học kỳ" : "🚀 Tạo Học Kỳ Mới"}
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
                      className={`rounded-2xl border p-4 transition-all flex items-center justify-between shadow-xs ${
                        isSelected
                          ? "border-[#E65100] bg-orange-50/30 ring-2 ring-orange-100"
                          : "border-[#E8E2D9] bg-white hover:border-orange-200"
                      }`}
                    >
                      <div
                        onClick={() => setSelectedSemester(code)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-xs">
                          🎓
                        </div>
                        <div>
                          <h3 className="font-black text-xs text-[#2C2825]">{name}</h3>
                          <p className="text-[10px] text-[#6B635B] mt-0.5">
                            Mã: <span className="font-mono font-bold text-[#E65100]">{code}</span> | Start: {sem.startDate || "N/A"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setSemesterForm({
                              code: sem.code || code,
                              name: sem.name || name,
                              startDate: sem.startDate || "",
                              endDate: sem.endDate || "",
                              formationOpensAt: sem.formationOpensAt ? sem.formationOpensAt.slice(0, 16) : toLocalISOString(now),
                              defaultDeadline: sem.defaultDeadline ? sem.defaultDeadline.slice(0, 16) : toLocalISOString(deadlineDate),
                            });
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSemester(code)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Phân công Moderator & Xuất Excel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                👑 Phân công Moderator phụ trách (3.6)
              </h2>
              <p className="text-[11px] text-[#6B635B]">
                Mỗi học kỳ có đúng một Moderator điều phối mọi ngành.
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

          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#6B635B]">
                📥 Xuất Excel Báo cáo (QT15)
              </h2>
              <p className="text-xs text-[#6B635B] leading-relaxed">
                Xuất file bàn giao tổng hợp theo học kỳ bạn đang chọn để kiểm tra kết quả.
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
                  {exportingExcel ? "Đang tạo file Excel..." : `Tải xuống báo cáo ${selectedSemester} (.xlsx)`}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}