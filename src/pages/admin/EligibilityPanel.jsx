import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  getSemesters,
  updateStudentEligibility,
} from "../../services/eligibilityService";

export default function EligibilityPanel({ selectedSemesterCode, onChanged }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(selectedSemesterCode || "");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");

  const [initialFile, setInitialFile] = useState(null);
  const [importingInitial, setImportingInitial] = useState(false);

  const [showIneligibleModal, setShowIneligibleModal] = useState(false);
  const [ineligibleFile, setIneligibleFile] = useState(null);
  const [importingIneligible, setImportingIneligible] = useState(false);

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [ineligibleReason, setIneligibleReason] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (selectedSemesterCode) {
      setSelectedSemester(selectedSemesterCode);
    }
  }, [selectedSemesterCode]);

  useEffect(() => {
    getSemesters({ size: 1000 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.content || [];
        setSemesters(list);
        if (!selectedSemester && list.length > 0) {
          const firstCode = list[0].code || list[0].name || list[0];
          setSelectedSemester(firstCode);
        }
      })
      .catch(() => setSemesters([]));
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadStudents(selectedSemester);
    }
  }, [selectedSemester]);

  const loadStudents = async (semCode) => {
    setLoading(true);
    try {
      const res = await api.get(`/semesters/${semCode}/students`);
      const list = Array.isArray(res.data)
        ? res.data
        : res.data.content || res.data.items || [];
      setStudents(list);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportInitial = async (e) => {
    e.preventDefault();
    if (!initialFile || !selectedSemester) {
      showToast("Vui lòng chọn học kỳ và file danh sách ban đầu!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", initialFile);

    setImportingInitial(true);
    try {
      await api.post(
        `/semesters/${selectedSemester}/imports/students`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showToast("Import danh sách ban đầu thành công!");
      setInitialFile(null);
      loadStudents(selectedSemester);
      if (onChanged) onChanged();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Import danh sách ban đầu thất bại.",
        "error",
      );
    } finally {
      setImportingInitial(false);
    }
  };

  const handleImportIneligible = async (e) => {
    e.preventDefault();
    if (!ineligibleFile || !selectedSemester) {
      showToast("Vui lòng chọn học kỳ và file cập nhật điều kiện!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", ineligibleFile);

    setImportingIneligible(true);
    try {
      await api.post(
        `/semesters/${selectedSemester}/imports/eligibility`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showToast(
        "Cập nhật danh sách điều kiện thành công! Hệ thống đã tự động quét.",
      );
      setIneligibleFile(null);
      setShowIneligibleModal(false);
      loadStudents(selectedSemester);
      if (onChanged) onChanged();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Cập nhật danh sách thất bại.",
        "error",
      );
    } finally {
      setImportingIneligible(false);
    }
  };

  const handleToggleClick = (student) => {
    const isEligible = student.eligibility !== "INELIGIBLE";
    if (isEligible) {
      setTargetStudent(student);
      setIneligibleReason("");
      setReasonModalOpen(true);
    } else {
      handleConfirmEligibilityChange(student, "ELIGIBLE", "Gỡ cờ đủ điều kiện");
    }
  };

  const handleConfirmEligibilityChange = async (
    student,
    newEligibleOrStatus,
    reasonText,
  ) => {
    const enrollmentId = student.id || student.enrollmentId;
    if (!enrollmentId) {
      showToast("Không tìm thấy ID ghi danh của sinh viên này.", "error");
      return;
    }

    let eligibilityValue = "ELIGIBLE";
    if (typeof newEligibleOrStatus === "string") {
      eligibilityValue = newEligibleOrStatus;
    } else {
      eligibilityValue = newEligibleOrStatus ? "ELIGIBLE" : "INELIGIBLE";
    }

    if (eligibilityValue === "INELIGIBLE" && !reasonText.trim()) {
      showToast("Vui lòng nhập lý do chưa đủ điều kiện.", "error");
      return;
    }

    try {
      await updateStudentEligibility(enrollmentId, {
        eligibility: eligibilityValue,
        reason: reasonText ? reasonText.trim() : "",
      });

      showToast("Cập nhật trạng thái thành công!");
      setReasonModalOpen(false);
      setTargetStudent(null);
      loadStudents(selectedSemester);
      if (onChanged) onChanged();
    } catch (err) {
      showToast(err.response?.data?.message || "Cập nhật thất bại.", "error");
    }
  };

  const filteredStudents = students.filter((s) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      !searchKeyword ||
      (s.fullName && s.fullName.toLowerCase().includes(keyword)) ||
      (s.email && s.email.toLowerCase().includes(keyword)) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(keyword)) ||
      (s.mssv && s.mssv.toLowerCase().includes(keyword));

    const isEligible = s.eligibility !== "INELIGIBLE";
    let matchesEligibility = true;
    if (eligibilityFilter === "ELIGIBLE") {
      matchesEligibility = isEligible;
    } else if (eligibilityFilter === "INELIGIBLE") {
      matchesEligibility = !isEligible;
    }

    return matchesKeyword && matchesEligibility;
  });

  return (
    <div className="space-y-6 relative font-sans text-xs">
      {/* LUỒNG 1: IMPORT BAN ĐẦU */}
      <div className="bg-white/90 backdrop-blur-xl p-6 border border-white rounded-3xl shadow-xl shadow-black/5 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-3 border-b border-gray-100">
          <div>
            <span className="px-2.5 py-1 bg-orange-100 text-[#E65100] text-[10px] font-black rounded-lg uppercase">
              Bước 1
            </span>
            <h3 className="text-sm font-black text-[#1A1816] mt-1">
              Import danh sách sinh viên ban đầu
            </h3>
            <p className="text-[11px] text-[#554D44] font-semibold mt-0.5">
              Đưa toàn bộ danh sách sinh viên chuẩn bị vào kỳ luận án lên hệ thống.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowIneligibleModal(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <span>📂</span> Cập nhật danh sách (Trượt môn / Thiếu điều kiện)
          </button>
        </div>

        <form onSubmit={handleImportInitial} className="flex items-center gap-4 flex-wrap pt-1">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => setInitialFile(e.target.files[0])}
            className="text-xs text-[#554D44] font-semibold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-orange-100 file:text-[#E65100] hover:file:bg-orange-200 cursor-pointer bg-orange-50/50 p-1.5 rounded-2xl border border-orange-100"
          />
          <button
            type="submit"
            disabled={importingInitial || !initialFile}
            className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black rounded-xl shadow-lg shadow-orange-600/20 disabled:opacity-50 cursor-pointer transition"
          >
            {importingInitial ? "Đang import..." : "🚀 Xác nhận Import danh sách ban đầu"}
          </button>
        </form>
      </div>

      {/* LUỒNG 2: BOX IMPORT INELIGIBLE (MODAL ACCORDION) */}
      {showIneligibleModal && (
        <div className="bg-amber-50/95 backdrop-blur-xl p-6 border-2 border-amber-300 rounded-3xl shadow-xl space-y-4 animate-smooth-fade">
          <div className="flex justify-between items-start pb-3 border-b border-amber-200">
            <div>
              <span className="px-2.5 py-1 bg-amber-200 text-amber-900 text-[10px] font-black rounded-lg uppercase">
                Cập nhật bổ sung
              </span>
              <h3 className="text-sm font-black text-amber-950 mt-1">
                Import danh sách sinh viên <u>chưa đủ điều kiện</u>
              </h3>
              <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                File Excel chứa danh sách sinh viên rớt môn hoặc không đủ điều kiện học kỳ này.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIneligibleModal(false)}
              className="w-8 h-8 rounded-xl bg-white border border-amber-300 text-amber-900 font-black flex items-center justify-center cursor-pointer shadow-sm hover:bg-amber-100 transition"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleImportIneligible} className="flex items-center gap-4 flex-wrap">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => setIneligibleFile(e.target.files[0])}
              className="text-xs text-amber-900 font-semibold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-200 file:text-amber-950 cursor-pointer bg-white p-1.5 rounded-2xl border border-amber-200 shadow-sm"
            />
            <button
              type="submit"
              disabled={importingIneligible || !ineligibleFile}
              className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 cursor-pointer transition"
            >
              {importingIneligible ? "Đang cập nhật..." : "📥 Xác nhận Cập nhật danh sách"}
            </button>
          </form>
        </div>
      )}

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white/85 backdrop-blur-xl p-4 border border-white rounded-2xl flex items-center justify-between shadow-lg shadow-black/5 flex-wrap gap-4">
        <div className="relative flex-1 min-w-65">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="🔍 Tìm kiếm theo tên, email, MSSV..."
            className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#E65100] font-semibold text-[#1A1816] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-[#554D44]">Lọc trạng thái:</span>
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-black bg-white border border-gray-200 rounded-xl outline-none focus:border-[#E65100] text-[#E65100] cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ELIGIBLE">✓ Đủ điều kiện</option>
            <option value="INELIGIBLE">✕ Chưa đủ điều kiện</option>
          </select>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] font-black text-xs rounded-lg border border-orange-100">
            Tổng: {filteredStudents.length} sinh viên
          </span>
        </div>
      </div>

      {/* BẢNG DANH SÁCH SINH VIÊN */}
      <div className="bg-white/85 backdrop-blur-xl border border-white rounded-2xl overflow-hidden shadow-xl shadow-black/5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white/80 border-b border-gray-100 text-[#554D44]">
              <th className="p-4 font-black uppercase w-16 text-center">STT</th>
              <th className="p-4 font-black uppercase">MSSV</th>
              <th className="p-4 font-black uppercase">Họ và tên</th>
              <th className="p-4 font-black uppercase">Email</th>
              <th className="p-4 font-black uppercase">Trạng thái</th>
              <th className="p-4 font-black uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-[#554D44] italic font-semibold">
                  Đang tải danh sách sinh viên...
                </td>
              </tr>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const isEligible = student.eligibility !== "INELIGIBLE";
                return (
                  <tr key={student.id || index} className="hover:bg-orange-50/40 transition">
                    <td className="p-4 text-center font-bold text-[#554D44]">{index + 1}</td>
                    <td className="p-4 font-mono font-black text-[#E65100]">{student.studentCode || student.mssv}</td>
                    <td className="p-4 font-extrabold text-[#1A1816]">{student.fullName}</td>
                    <td className="p-4 text-[#554D44] font-semibold">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 font-black rounded-lg text-[10px] border ${isEligible ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-red-100 text-red-900 border-red-200"}`}>
                        {isEligible ? "✓ Đủ điều kiện" : "✕ Chưa đủ điều kiện"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleClick(student)}
                        className={`px-3 py-1.5 font-black rounded-xl text-[11px] cursor-pointer shadow-xs transition ${
                          isEligible
                            ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {isEligible ? "🚩 Gắn cờ Ineligible" : "✨ Gỡ cờ (Đủ điều kiện)"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-[#554D44] italic font-semibold">
                  Không tìm thấy sinh viên phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL LÝ DO GẮN CỜ */}
      {reasonModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white p-7 space-y-4 text-xs animate-smooth-fade">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-sm font-black text-[#1A1816]">Gắn cờ Chưa đủ điều kiện</h3>
              <button
                type="button"
                onClick={() => setReasonModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div>
              <p className="text-gray-500 font-semibold">Sinh viên:</p>
              <p className="font-extrabold text-[#1A1816] text-sm mt-0.5">
                {targetStudent.fullName} ({targetStudent.studentCode || targetStudent.mssv})
              </p>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#554D44]">Lý do chưa đủ điều kiện:</label>
              <input
                type="text"
                value={ineligibleReason}
                onChange={(e) => setIneligibleReason(e.target.value)}
                placeholder="VD: Trượt môn PRF192, thiếu chứng chỉ ngoại ngữ..."
                autoFocus
                className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#E65100] font-semibold text-[#1A1816] shadow-xs"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReasonModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl cursor-pointer transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmEligibilityChange(targetStudent, false, ineligibleReason)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md cursor-pointer transition"
              >
                Xác nhận gắn cờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST THÔNG BÁO */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl text-xs animate-bounce">
          <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </span>
          <p className="font-black text-[#1A1816]">{toast.message}</p>
        </div>
      )}
    </div>
  );
}