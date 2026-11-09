import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ModeratorTimeline({ semester, onRefresh }) {
  const [semesterInfo, setSemesterInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // States cho Quy tắc Học kỳ
  const [maxGroupSize, setMaxGroupSize] = useState(5);
  const [defaultMinRoomSize, setDefaultMinRoomSize] = useState(3);
  const [savingRules, setSavingRules] = useState(false);

  // Mốc Hạn chót chung Học kỳ (Common Deadline)
  const [commonDeadline, setCommonDeadline] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Hàm chuyển đổi Giai đoạn học kỳ (Chuyển sang Bổ sung hoặc Kết thúc)
 const handleUpdatePhase = async (actionType) => {
    let endpoint = "";
    let actionName = "";

    if (actionType === "start-formation") {
      endpoint = `/semesters/${semester}/start-formation`;
      actionName = "Mở học kỳ -> Lập nhóm";
    } else if (actionType === "finalize-round1") {
      endpoint = `/semesters/${semester}/finalize-round1`;
      actionName = "Chốt đợt 1 (Sang Bổ sung / Kết thúc)";
    } else if (actionType === "finalize-round2") {
      endpoint = `/semesters/${semester}/finalize-round2`;
      actionName = "Chốt đợt 2 (Kết thúc ghép nhóm hoàn toàn)";
    }

    if (!window.confirm(`Xác nhận thực hiện thao tác: ${actionName}?`)) return;

    try {
      await api.post(endpoint);
      showToast(`Thực hiện thành công: ${actionName}!`);
      loadTimelineData(semester);
      if (onRefresh) onRefresh();
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (semester) {
      loadTimelineData(semester);
    }
  }, [semester]);

  const loadTimelineData = async (semCode) => {
    setLoading(true);
    try {
      const [semRes, rulesRes] = await Promise.all([
        api.get(`/semesters/${semCode}`).catch(() => null),
        api.get(`/semesters/${semCode}/rules`).catch(() => null),
      ]);

      const semData = semRes?.data || {};
      const rulesData = rulesRes?.data || {};

      setSemesterInfo(semData);

      // Load dữ liệu quy tắc hiện tại
      const maxVal = rulesData.maxGroupSize ?? semData.maxTeamSize ?? 5;
      const minVal = rulesData.defaultMinRoomSize ?? semData.minTeamSize ?? 3;
      setMaxGroupSize(maxVal);
      setDefaultMinRoomSize(minVal);

      // Load Hạn chót chung
      const deadlineVal = semData.deadline || semData.commonDeadline || rulesData.deadline;
      if (deadlineVal) {
        setCommonDeadline(formatDateTimeInput(deadlineVal));
      }
    } catch {
      showToast("Không thể tải thông tin lịch trình học kỳ.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeInput = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Cập nhật Quy tắc gọi API: PUT /api/v1/semesters/{semester}/rules
  const handleUpdateRules = async (e) => {
    e.preventDefault();
    setSavingRules(true);
    try {
      await api.put(`/semesters/${semester}/rules`, {
        maxGroupSize: parseInt(maxGroupSize, 10),
        defaultMinRoomSize: parseInt(defaultMinRoomSize, 10),
      });
      showToast("Cập nhật Quy tắc Học kỳ thành công!");
      if (onRefresh) onRefresh();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể cập nhật Quy tắc Học kỳ.",
        "error"
      );
    } finally {
      setSavingRules(false);
    }
  };

  // Cập nhật Hạn chót chung gọi API: PUT /api/v1/semesters/{semester}/deadline
  const handleUpdateDeadline = async (e) => {
    e.preventDefault();
    if (!commonDeadline) {
      showToast("Vui lòng chọn mốc thời gian Hạn chót!", "error");
      return;
    }

    try {
      const payloadDate = new Date(commonDeadline).toISOString();
      await api.put(`/semesters/${semester}/deadline`, {
        deadline: payloadDate,
      });
      showToast("Đã cập nhật Hạn chót chung Học kỳ thành công!");
      if (onRefresh) onRefresh();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể cập nhật Hạn chót chung.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-xs font-bold text-[#6B635B] text-center">
        Đang tải cấu hình Lịch trình & Giai đoạn...
      </div>
    );
  }

  const currentPhase = semesterInfo?.phase || "FORMING";

  return (
    <div className="p-8 space-y-6 text-xs font-sans">
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-[#2C2825]"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[10px] font-bold rounded-lg uppercase tracking-wider">
          GIAI ĐOẠN HỌC KỲ HIỆN TẠI: <strong className="text-[#E65100]">{currentPhase}</strong>
        </span>
        <h2 className="text-xl font-black text-[#2C2825]">
          Điều hành Timeline & Hạn Chót Học kỳ {semester}
        </h2>
        <p className="text-[11px] text-[#6B635B]">
          Điều chỉnh quy tắc sĩ số tối đa nhóm và mốc thời gian Hạn chót chung cho học kỳ.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* KHỐI 1: QUY TẮC HỌC KỲ (CÓ THỂ CẬP NHẬT SĨ SỐ TỐI ĐA / TỐI THIỂU) */}
        <form
          onSubmit={handleUpdateRules}
          className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3">
              <span className="text-base">⚙️</span>
              <h3 className="font-black text-sm text-[#2C2825]">
                Quy tắc Học kỳ 
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#6B635B] block">
                  Sĩ số tối đa một nhóm 
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    required
                    className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-black text-[#2C2825] outline-none focus:border-[#E65100] text-sm"
                  />
                  <span className="font-bold text-[#6B635B] shrink-0">Sinh viên</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#6B635B] block">
                  Sĩ số tối thiểu mặc định 
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={defaultMinRoomSize}
                    onChange={(e) => setDefaultMinRoomSize(e.target.value)}
                    required
                    className="w-full p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-black text-[#E65100] outline-none focus:border-[#E65100] text-sm"
                  />
                  <span className="font-bold text-[#6B635B] shrink-0">Sinh viên</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">💡 Lưu ý điều chỉnh Quy tắc:</p>
              <p>
                Sĩ số tối đa được tự do chỉnh sửa khi học kỳ ở giai đoạn <strong>OPENING</strong>, và chỉ được phép tăng thêm ở các giai đoạn sau.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRules}
            className="w-full py-3.5 bg-[#2C2825] hover:bg-black text-white font-black rounded-2xl shadow-md cursor-pointer transition mt-4 disabled:opacity-50"
          >
            {savingRules ? "Đang lưu quy tắc..." : "Lưu quy tắc Học kỳ"}
          </button>
        </form>

        {/* KHỐI 2: HẠN CHÓT CHUNG HỌC KỲ */}
        <form
          onSubmit={handleUpdateDeadline}
          className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3">
              <span className="text-base">⏱</span>
              <h3 className="font-black text-sm text-[#2C2825]">
                Hạn chót chung Học kỳ 
              </h3>
            </div>

            <div className="space-y-2">
              <label className="font-black text-[#2C2825] block">
                Chọn mốc thời gian Deadline (Ít nhất sau 48h):
              </label>
              <input
                type="datetime-local"
                value={commonDeadline}
                onChange={(e) => setCommonDeadline(e.target.value)}
                required
                className="w-full p-3.5 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl font-bold text-[#2C2825] outline-none focus:border-[#E65100] text-sm"
              />
              <p className="text-[10px] text-[#6B635B] leading-relaxed">
                * Mốc hạn chót chung áp dụng cho sinh viên tự do lập nhóm trước khi chốt đợt 1.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white font-black rounded-2xl shadow-md cursor-pointer transition mt-4"
          >
            Cập nhật Deadline chung
          </button>
        </form>
      </div>
      {/* KHỐI ĐIỀU HƯỚNG GIAI ĐOẠN HỌC KỲ CHO MODERATOR THEO SWAGGER */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3">
          <span className="text-base">🚀</span>
          <h3 className="font-black text-sm text-[#2C2825]">
            Điều phối Chuyển Giai đoạn Học kỳ (Theo Swagger)
          </h3>
        </div>
        <p className="text-[11px] text-[#6B635B]">
          Thực hiện các mốc chuyển giai đoạn chuẩn của hệ thống:
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleUpdatePhase("start-formation")}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition"
          >
            ▶️ Mở học kỳ → Lập nhóm (Start Formation)
          </button>

          <button
            type="button"
            onClick={() => handleUpdatePhase("finalize-round1")}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition"
          >
            🔄 Chốt đợt 1 (Finalize Round 1)
          </button>
          
          <button
            type="button"
            onClick={() => handleUpdatePhase("finalize-round2")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition"
          >
            ✓ Chốt đợt 2 / Kết thúc (Finalize Round 2)
          </button>
        </div>
      </div>
    </div>
  );
}