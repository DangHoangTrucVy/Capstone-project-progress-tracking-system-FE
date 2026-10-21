import { useEffect, useState } from "react";
import {
  getSemesters,
  importStudents,
  previewStudents,
  importEligibilityFile,
  previewEligibilityFile,
  updateStudentEligibility,
} from "../../services/eligibilityService";
import api from "../../services/api";
import { apiError } from "../../utils/apiError";

const exampleJson = JSON.stringify(
  {
    students: [
      {
        email: "se170001@fpt.edu.vn",
        fullName: "Nguyễn Văn A",
        studentCode: "SE170001",
        eligible: true,
        reason: "Đủ điều kiện làm capstone",
      },
    ],
  },
  null,
  2,
);

function ResultTable({ students }) {
  if (!students || students.length === 0) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8E2D9]">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
            {["MSSV", "Họ và tên", "Email", "Trạng thái", "Lý do"].map(
              (label) => (
                <th key={label} className="p-3 font-bold uppercase">
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8E2D9] bg-white">
          {students.map((s, idx) => (
            <tr
              key={s.userId || s.id || s.email || idx}
              className="hover:bg-[#FBF9F5]/60 transition"
            >
              <td className="p-3 font-bold text-[#2C2825]">
                {s.studentCode || s.mssv || "—"}
              </td>
              <td className="p-3 font-semibold text-[#2C2825]">
                {s.fullName || s.name || "—"}
              </td>
              <td className="p-3 text-[#6B635B]">{s.email || "—"}</td>
              <td className="p-3">
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${s.eligible !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                >
                  {s.eligible !== false ? "Đủ điều kiện" : "Không đủ điều kiện"}
                </span>
              </td>
              <td className="p-3 text-[#6B635B]">
                {s.reason || s.ineligibleReason || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EligibilityPanel({ onChanged }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importResult, setImportResult] = useState(null);

  // Danh sách sinh viên theo học kỳ
  const [semesterStudents, setSemesterStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form States
  const [studentFile, setStudentFile] = useState(null);
  const [jsonInput, setJsonInput] = useState("");
  const [eligibilityFile, setEligibilityFile] = useState(null);

  // Update single student eligibility state
  const [singleStudentCode, setSingleStudentCode] = useState("");
  const [singleEligibleFlag, setSingleEligibleFlag] = useState("true");
  const [singleReason, setSingleReason] = useState("");

  // 1. Lấy danh sách học kỳ từ Backend
  useEffect(() => {
    getSemesters()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.content || [];
        setSemesters(list);
        if (list.length > 0) {
          const firstSem = list[0].code || list[0].name || list[0];
          setSelectedSemester(firstSem);
        }
      })
      .catch((err) => setError(apiError(err)));
  }, []);

  // 2. Lấy danh sách sinh viên theo học kỳ được chọn
  const fetchSemesterStudents = async (semCode) => {
    if (!semCode) return;
    setLoadingStudents(true);
    try {
      const res = await api.get(`/semesters/${semCode}/students`);
      const list = Array.isArray(res.data) ? res.data : res.data.content || res.data.items || [];
      setSemesterStudents(list);
    } catch {
      setSemesterStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedSemester) {
      fetchSemesterStudents(selectedSemester);
    }
  }, [selectedSemester]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  // Xử lý Import danh sách sinh viên (File hoặc JSON)
  const handleImportStudents = async (e, isPreview = false) => {
    e.preventDefault();
    if (busy || !selectedSemester) return;
    setBusy(true);
    clearMessages();
    setImportResult(null);

    try {
      let res;
      if (studentFile) {
        const formData = new FormData();
        formData.append("file", studentFile);
        res = isPreview
          ? await previewStudents(selectedSemester, formData)
          : await importStudents(selectedSemester, formData);
      } else if (jsonInput.trim()) {
        let parsed;
        try {
          parsed = JSON.parse(jsonInput);
        } catch {
          throw new Error(
            "Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại.",
          );
        }
        const payload = Array.isArray(parsed) ? { students: parsed } : parsed;
        res = isPreview
          ? await previewStudents(selectedSemester, payload)
          : await importStudents(selectedSemester, payload);
      } else {
        throw new Error(
          "Vui lòng chọn file Excel/CSV hoặc nhập nội dung JSON.",
        );
      }

      setImportResult(res);
      setSuccessMessage(
        isPreview
          ? "Xem trước danh sách thành công!"
          : "Import danh sách sinh viên vào học kỳ thành công!",
      );
      if (!isPreview) {
        fetchSemesterStudents(selectedSemester);
      }
      onChanged?.();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  // Xử lý Import file điều kiện sinh viên (Eligibility)
  const handleImportEligibility = async (e, isPreview = false) => {
    e.preventDefault();
    if (busy || !selectedSemester || !eligibilityFile) return;
    setBusy(true);
    clearMessages();
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", eligibilityFile);

      const res = isPreview
        ? await previewEligibilityFile(selectedSemester, formData)
        : await importEligibilityFile(selectedSemester, formData);

      setImportResult(res);
      setSuccessMessage(
        isPreview
          ? "Xem trước file điều kiện thành công!"
          : "Import file điều kiện sinh viên thành công!",
      );
      if (!isPreview) {
        fetchSemesterStudents(selectedSemester);
      }
      onChanged?.();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  // Xử lý cập nhật điều kiện lẻ cho 1 sinh viên
  const handleUpdateSingleEligibility = async (e) => {
    e.preventDefault();
    if (busy || !singleStudentCode.trim() || !selectedSemester) return;

    if (singleEligibleFlag === "false" && !singleReason.trim()) {
      setError("Vui lòng nhập lý do sinh viên chưa đủ điều kiện.");
      return;
    }

    setBusy(true);
    clearMessages();

    try {
      await updateStudentEligibility(
        selectedSemester,
        singleStudentCode.trim(),
        {
          eligible: singleEligibleFlag === "true",
          reason: singleReason.trim(),
        },
      );
      setSuccessMessage(`Đã cập nhật điều kiện cho MSSV: ${singleStudentCode}`);
      setSingleStudentCode("");
      setSingleReason("");
      fetchSemesterStudents(selectedSemester);
      onChanged?.();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-8 space-y-6 text-[#2C2825]">
      {/* Header & Chọn học kỳ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
            QUẢN LÝ ĐẦU KỲ · IMPORT DỮ LIỆU
          </span>
          <h1 className="text-xl font-black mt-2">
            Import Danh sách Sinh viên & Điều kiện
          </h1>
          <p className="text-xs text-[#6B635B] mt-1">
            Tải lên danh sách sinh viên và thiết lập điều kiện tham gia đồ án
            theo học kỳ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#6B635B]">Chọn học kỳ:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl font-bold text-[#E65100] outline-none cursor-pointer"
          >
            {semesters.map((sem, idx) => {
              const semCode = sem.code || sem;
              return (
                <option key={idx} value={semCode}>
                  {sem.name || semCode}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Thông báo lỗi / Thành công */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700"
        >
          ❌ {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
          ✨ {successMessage}
        </div>
      )}

      {/* 1. SECTION: IMPORT DANH SÁCH SINH VIÊN */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-black text-[#2C2825]">
            1. Import Danh sách Sinh viên chính thức
          </h2>
          <p className="text-xs text-[#6B635B] mt-1">
            Cung cấp file (Excel/CSV) danh sách sinh viên.
          </p>
        </div>

        <form
          onSubmit={(e) => handleImportStudents(e, false)}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#6B635B]">
                Tải lên file danh sách (.csv, .xlsx)
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={busy}
                onChange={(e) => {
                  setStudentFile(e.target.files?.[0] || null);
                  setJsonInput("");
                }}
                className="block w-full cursor-pointer rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] p-3 text-xs text-[#6B635B]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy || !studentFile}
              className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang xử lý..." : "✓ Xác nhận Import Sinh viên"}
            </button>
            <button
              type="button"
              disabled={busy || !studentFile}
              onClick={(e) => handleImportStudents(e, true)}
              className="px-5 py-3 bg-white border border-[#E8E2D9] hover:bg-gray-50 text-[#6B635B] text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              Xem trước (Preview)
            </button>
          </div>
        </form>
      </div>

      {/* 2. SECTION: IMPORT ĐIỀU KIỆN SINH VIÊN (ELIGIBILITY) */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-black text-[#2C2825]">
            2. Import File Điều kiện sinh viên (Eligibility)
          </h2>
          <p className="text-xs text-[#6B635B] mt-1">
            Cập nhật nhanh trạng thái đủ/chưa đủ điều kiện và lý do của sinh viên qua file.
          </p>
        </div>

        <form
          onSubmit={(e) => handleImportEligibility(e, false)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              required
              disabled={busy}
              onChange={(e) => setEligibilityFile(e.target.files?.[0] || null)}
              className="block w-full max-w-lg cursor-pointer rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] p-3 text-xs text-[#6B635B]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy || !eligibilityFile}
              className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang xử lý..." : "✓ Import File Điều kiện"}
            </button>
            <button
              type="button"
              disabled={busy || !eligibilityFile}
              onClick={(e) => handleImportEligibility(e, true)}
              className="px-5 py-3 bg-white border border-[#E8E2D9] hover:bg-gray-50 text-[#6B635B] text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              Xem trước Điều kiện (Preview)
            </button>
          </div>
        </form>
      </div>

      {/* 3. SECTION: CẬP NHẬT ĐIỀU KIỆN ĐƠN LẺ */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-black text-[#2C2825]">
            3. Cập nhật thủ công cho từng Sinh viên
          </h2>
          <p className="text-xs text-[#6B635B] mt-1">
            Thay đổi trạng thái cờ điều kiện trực tiếp bằng Mã số sinh viên (MSSV).
          </p>
        </div>

        <form onSubmit={handleUpdateSingleEligibility} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#6B635B]">
              Mã số sinh viên (MSSV)
              <input
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] font-normal outline-none focus:border-[#E65100]"
                value={singleStudentCode}
                onChange={(e) => setSingleStudentCode(e.target.value)}
                placeholder="VD: SE170001"
                required
                disabled={busy}
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-[#6B635B]">
              Trạng thái điều kiện
              <select
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] font-normal outline-none focus:border-[#E65100]"
                value={singleEligibleFlag}
                onChange={(e) => setSingleEligibleFlag(e.target.value)}
                disabled={busy}
              >
                <option value="true">Đủ điều kiện</option>
                <option value="false">Chưa đủ điều kiện</option>
              </select>
            </label>

            <label className="space-y-1 text-xs font-bold text-[#6B635B] sm:col-span-2">
              Lý do cập nhật (Bắt buộc nếu chưa đủ điều kiện)
              <textarea
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FCFAF7] font-normal outline-none focus:border-[#E65100]"
                value={singleReason}
                onChange={(e) => setSingleReason(e.target.value)}
                placeholder={
                  singleEligibleFlag === "false"
                    ? "Nhập lý do sinh viên chưa đủ điều kiện..."
                    : "Nhập lý do (nếu có)..."
                }
                required={singleEligibleFlag === "false"}
                disabled={busy}
                rows={2}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || !singleStudentCode.trim()}
            className="px-6 py-3 bg-[#2C2825] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Đang lưu..." : "Lưu thay đổi điều kiện"}
          </button>
        </form>
      </div>

      {/* 4. SECTION: DANH SÁCH SINH VIÊN TRONG HỌC KỲ */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#2C2825]">
              Danh sách sinh viên trong học kỳ ({selectedSemester})
            </h2>
            <p className="text-xs text-[#6B635B] mt-1">
              Tổng số: {semesterStudents.length} sinh viên đã được ghi nhận trên hệ thống.
            </p>
          </div>
          <button
            onClick={() => fetchSemesterStudents(selectedSemester)}
            className="px-3 py-1.5 bg-orange-50 text-[#E65100] text-xs font-bold rounded-xl hover:bg-orange-100 cursor-pointer"
          >
            🔄 Làm mới danh sách
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
                {["MSSV", "Họ tên", "Email", "Điều kiện", "Nhóm"].map((label) => (
                  <th key={label} className="p-3 font-bold uppercase">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9] bg-white">
              {loadingStudents ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#6B635B]">
                    Đang tải danh sách sinh viên...
                  </td>
                </tr>
              ) : semesterStudents.length > 0 ? (
                semesterStudents.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-[#FBF9F5]/60 transition">
                    <td className="p-3 font-bold text-[#2C2825]">{s.studentCode || s.mssv || "—"}</td>
                    <td className="p-3 font-semibold text-[#2C2825]">{s.fullName || s.name || "—"}</td>
                    <td className="p-3 text-[#6B635B]">{s.email || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${s.eligible !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {s.eligible !== false ? "Đủ điều kiện" : "Không đủ điều kiện"}
                      </span>
                    </td>
                    <td className="p-3 text-[#6B635B]">{s.groupCode || "Chưa có"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#6B635B] italic">
                    Chưa có sinh viên nào trong học kỳ này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIỂN THỊ KẾT QUẢ SAU KHI IMPORT / PREVIEW */}
      {importResult && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-sm text-[#2C2825]">
              📊 Kết quả xử lý từ hệ thống:
            </h2>
            <span
              className={`px-3 py-1 text-[11px] font-bold rounded-lg ${importResult.committed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
            >
              {importResult.committed
                ? "✓ Đã commit vào DB"
                : "🔍 Chế độ Xem trước (Preview)"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8E2D9] text-center">
              <p className="text-[10px] uppercase font-bold text-[#6B635B]">
                Tạo mới
              </p>
              <p className="text-lg font-black text-emerald-700 mt-1">
                {importResult.newRows ?? importResult.created ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8E2D9] text-center">
              <p className="text-[10px] uppercase font-bold text-[#6B635B]">
                Cập nhật
              </p>
              <p className="text-lg font-black text-blue-700 mt-1">
                {importResult.updatedRows ?? importResult.updated ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8E2D9] text-center">
              <p className="text-[10px] uppercase font-bold text-[#6B635B]">
                Không đổi
              </p>
              <p className="text-lg font-black text-gray-700 mt-1">
                {importResult.unchangedRows ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8E2D9] text-center">
              <p className="text-[10px] uppercase font-bold text-[#6B635B]">
                Lỗi dòng
              </p>
              <p className="text-lg font-black text-red-600 mt-1">
                {importResult.errorRows ?? 0}
              </p>
            </div>
          </div>

          {Array.isArray(importResult.errors) &&
            importResult.errors.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-red-600">
                  ⚠️ Chi tiết lỗi các dòng:
                </p>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-3 text-xs space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="text-red-700">
                      • <strong>Dòng {err.row}</strong> ({err.key}):{" "}
                      {err.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <ResultTable
            students={importResult.students || importResult.content || []}
          />
        </div>
      )}
    </section>
  );
}