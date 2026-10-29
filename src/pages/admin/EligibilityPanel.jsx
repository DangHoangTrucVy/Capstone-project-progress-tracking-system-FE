import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  getSemesters,
  updateStudentEligibility,
} from "../../services/eligibilityService";

export default function EligibilityPanel({ onChanged }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  
  // 🔍 State cho bộ lọc trạng thái điều kiện: "ALL" | "ELIGIBLE" | "INELIGIBLE"
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");

  // States cho luồng 1: Import danh sách ban đầu
  const [initialFile, setInitialFile] = useState(null);
  const [importingInitial, setImportingInitial] = useState(false);

  // States cho luồng 2: Import cập nhật điều kiện (Ineligible) với popup toggle
  const [showIneligibleModal, setShowIneligibleModal] = useState(false);
  const [ineligibleFile, setIneligibleFile] = useState(null);
  const [importingIneligible, setImportingIneligible] = useState(false);

  // States cho Modal Custom nhập lý do (thay thế window.prompt)
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [ineligibleReason, setIneligibleReason] = useState("");

  // State Toast Notification chuyên nghiệp
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 1. Tải danh sách học kỳ khi mở trang
  useEffect(() => {
    getSemesters({ size: 1000 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.content || [];
        setSemesters(list);
        if (list.length > 0) {
          const firstCode = list[0].code || list[0].name || list[0];
          setSelectedSemester(firstCode);
        }
      })
      .catch(() => setSemesters([]));
  }, []);

  // 2. Tải danh sách sinh viên theo học kỳ được chọn
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

  // 3. Xử lý Import danh sách ban đầu
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

  // 4. Xử lý Import cập nhật điều kiện (Ineligible)
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

  // 5. Khi bấm nút Gắn/Gỡ cờ
  
  const handleToggleClick = (student) => {
    const isEligible = student.eligibility !== "INELIGIBLE";

    if (isEligible) {
      // Đang đủ điều kiện -> Muốn gắn cờ Ineligible -> Mở Modal nhập lý do
      setTargetStudent(student);
      setIneligibleReason("");
      setReasonModalOpen(true);
    } else {
      // 🛠️ Đang chưa đủ điều kiện -> Muốn gỡ cờ về Đủ điều kiện -> Gọi hàm với chuỗi "ELIGIBLE"
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

    // Xác định giá trị gửi lên (nếu là chuỗi dùng luôn, nếu là boolean thì quy đổi)
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
        eligibility: eligibilityValue, // Gửi chuỗi "ELIGIBLE" hoặc "INELIGIBLE"
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

  // 🔍 Lọc sinh viên theo từ khóa (tên, email, MSSV) và trạng thái điều kiện
  const filteredStudents = students.filter((s) => {
    // 1. Lọc theo từ khóa tìm kiếm
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      !searchKeyword ||
      (s.fullName && s.fullName.toLowerCase().includes(keyword)) ||
      (s.email && s.email.toLowerCase().includes(keyword)) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(keyword)) ||
      (s.mssv && s.mssv.toLowerCase().includes(keyword));

    // 2. Lọc theo trạng thái điều kiện
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
    <div className="p-8 space-y-6 relative">
      {/* Tiêu đề & Chọn học kỳ */}
      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl flex justify-between items-center shadow-xs flex-wrap gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
            QUẢN LÝ ĐIỀU KIỆN SINH VIÊN
          </span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">
            Import danh sách & Cập nhật trạng thái sinh viên
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#6B635B]">Chọn học kỳ:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-4 py-2.5 text-xs font-bold bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
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
      </div>

      {/* 🚀 LUỒNG 1: IMPORT DANH SÁCH BAN ĐẦU */}
      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl shadow-xs space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-[#2C2825]">
              1. Import danh sách sinh viên ban đầu
            </h3>
            <p className="text-[11px] text-[#6B635B]">
              Đưa toàn bộ danh sách sinh viên chuẩn bị vào kỳ luận án lên hệ thống để bắt đầu tạo nhóm.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowIneligibleModal(true)}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <span>📂</span> Cập nhật danh sách (Trượt môn / Thiếu điều kiện)
          </button>
        </div>

        <form
          onSubmit={handleImportInitial}
          className="flex items-center gap-4 flex-wrap pt-2"
        >
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => setInitialFile(e.target.files[0])}
            className="text-xs text-[#6B635B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#E65100] hover:file:bg-orange-100 cursor-pointer"
          />
          <button
            type="submit"
            disabled={importingInitial || !initialFile}
            className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {importingInitial ? "Đang import..." : "Xác nhận Import danh sách ban đầu"}
          </button>
        </form>
      </div>

      {/* 🚀 LUỒNG 2: BOX IMPORT INELIGIBLE */}
      {showIneligibleModal && (
        <div className="bg-amber-50/70 p-6 border-2 border-amber-300 rounded-2xl shadow-md space-y-4 relative">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded uppercase">
                Cập nhật danh sách
              </span>
              <h3 className="text-sm font-black text-amber-950 mt-1">
                2. Import danh sách sinh viên <u>chưa đủ điều kiện</u>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIneligibleModal(false)}
              className="w-7 h-7 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold flex items-center justify-center hover:bg-amber-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs text-[#2C2825] space-y-1.5 shadow-xs">
            <p className="font-bold text-amber-900">📌 Hướng dẫn chức năng:</p>
            <p>• Chức năng này dùng khi Phòng đào tạo gửi file danh sách sinh viên <b>trượt môn, thiếu chứng chỉ ngoại ngữ hoặc không đủ điều kiện</b> làm Capstone.</p>
            <p>• Hệ thống sẽ tự động quét, <b>gắn cờ Không Đủ Điều Kiện</b> và tự động loại các sinh viên có trong file ra khỏi nhóm hiện tại của họ.</p>
          </div>

          <form
            onSubmit={handleImportIneligible}
            className="flex items-center gap-4 flex-wrap pt-1"
          >
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => setIneligibleFile(e.target.files[0])}
              className="text-xs text-[#6B635B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer bg-white p-1 rounded-xl border border-amber-200"
            />
            <button
              type="submit"
              disabled={importingIneligible || !ineligibleFile}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {importingIneligible ? "Đang cập nhật..." : "Xác nhận Import danh sách"}
            </button>
          </form>
        </div>
      )}

      {/* Thanh tìm kiếm & Bộ lọc trạng thái điều kiện */}
      <div className="bg-white p-4 border border-[#E8E2D9] rounded-2xl flex items-center justify-between shadow-xs flex-wrap gap-4">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="🔍 Tìm kiếm theo tên, email hoặc MSSV..."
          className="w-full md:w-96 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
        />

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#6B635B]">Lọc trạng thái:</span>
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            className="px-4 py-2.5 text-xs font-bold bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ELIGIBLE">✓ Đủ điều kiện</option>
            <option value="INELIGIBLE">✕ Chưa đủ điều kiện</option>
          </select>

          <span className="text-xs font-bold text-[#6B635B] ml-2">
            Tổng số: {filteredStudents.length} sinh viên
          </span>
        </div>
      </div>

      {/* Bảng danh sách sinh viên */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B]">
              <th className="p-4 font-black uppercase w-16 text-center">STT</th>
              <th className="p-4 font-black uppercase">MSSV</th>
              <th className="p-4 font-black uppercase">Họ và tên</th>
              <th className="p-4 font-black uppercase">Email</th>
              <th className="p-4 font-black uppercase">Trạng thái điều kiện</th>
              <th className="p-4 font-black uppercase text-right">
                Thao tác riêng từng dòng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-[#6B635B]">
                  Đang tải danh sách sinh viên...
                </td>
              </tr>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const isEligible = student.eligibility !== "INELIGIBLE";
                return (
                  <tr
                    key={student.id || student.studentCode || index}
                    className="hover:bg-[#FBF9F5]/70 transition"
                  >
                    <td className="p-4 text-center font-bold text-[#6B635B]">
                      {index + 1}
                    </td>
                    <td className="p-4 font-bold font-mono text-[#E65100]">
                      {student.studentCode || student.mssv}
                    </td>
                    <td className="p-4 font-bold text-[#2C2825]">
                      {student.fullName}
                    </td>
                    <td className="p-4 text-[#6B635B]">{student.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                          isEligible
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {isEligible ? "✓ Đủ điều kiện" : "✕ Chưa đủ điều kiện"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleClick(student)}
                        className={`px-3.5 py-1.5 font-bold rounded-xl text-xs cursor-pointer transition ${
                          isEligible
                            ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isEligible
                          ? "Gắn cờ Ineligible"
                          : "Gỡ cờ (Đủ điều kiện)"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-12 text-center text-[#6B635B] italic"
                >
                  Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 💡 CUSTOM MODAL (POPUP NHẬP LÝ DO) */}
      {reasonModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E2D9] p-6 space-y-5 text-xs">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <h3 className="text-sm font-black text-[#2C2825]">
                Gắn cờ Chưa đủ điều kiện
              </h3>
              <button
                type="button"
                onClick={() => setReasonModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#6B635B]">Sinh viên:</p>
              <p className="font-black text-sm text-[#2C2825]">
                {targetStudent.fullName} (
                {targetStudent.studentCode || targetStudent.mssv})
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-[#2C2825]">
                Nhập lý do chưa đủ điều kiện{" "}
                <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                value={ineligibleReason}
                onChange={(e) => setIneligibleReason(e.target.value)}
                placeholder="VD: Trượt môn tiên quyết, thiếu chứng chỉ..."
                autoFocus
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E2D9] pt-3">
              <button
                type="button"
                onClick={() => setReasonModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() =>
                  handleConfirmEligibilityChange(
                    targetStudent,
                    false,
                    ineligibleReason,
                  )
                }
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Xác nhận gắn cờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 TOAST NOTIFICATION CHUYÊN NGHIỆP */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl text-xs transition-all">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
              toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
            }`}
          >
            {toast.type === "error" ? "✕" : "✓"}
          </span>
          <div>
            <p className="font-black text-[#2C2825]">
              {toast.type === "error" ? "Thông báo lỗi" : "Thành công"}
            </p>
            <p className="text-[#6B635B]">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}