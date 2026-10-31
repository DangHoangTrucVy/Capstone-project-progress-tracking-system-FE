import { useState, useEffect } from "react";
import { getMajors, createMajor, updateMajor } from "../../services/majorService";

export default function MajorPanel() {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State form tạo mới / chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [majorName, setMajorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast thông báo
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMajors = async () => {
    setLoading(true);
    try {
      const res = await getMajors();
      const list = Array.isArray(res) ? res : res?.data || res?.content || [];
      setMajors(list);
    } catch {
      setMajors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  const handleSaveMajor = async (e) => {
    e.preventDefault();
    if (!majorName.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateMajor(editingId, { name: majorName.trim() });
        showToast("Đổi tên chuyên ngành thành công!");
      } else {
        await createMajor({ name: majorName.trim() });
        showToast("Tạo chuyên ngành mới thành công!");
      }
      setMajorName("");
      setIsEditing(false);
      setEditingId(null);
      fetchMajors();
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (major) => {
    setIsEditing(true);
    setEditingId(major.id || major.majorId);
    setMajorName(major.name || major.majorName || "");
  };

  return (
   <div className="p-8 space-y-6 max-w-full mx-auto relative animate-fadeIn text-[#2C2825]">
      {/* Tiêu đề */}
      <div className="bg-white p-7 border border-[#E8E2D9] rounded-3xl flex justify-between items-center shadow-xs flex-wrap gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded">
            QUẢN LÝ CHUYÊN NGÀNH
          </span>
          <h1 className="text-xl font-black text-[#2C2825] mt-1">
            Danh sách chuyên ngành đào tạo
          </h1>
          <p className="text-xs text-[#6B635B]">
            Quy tắc: Các nhóm đồ án Capstone sẽ được hình thành trong cùng một chuyên ngành.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#6B635B]">Tổng số:</span>
          <span className="px-3 py-1 bg-orange-100 text-[#E65100] font-black text-xs rounded-xl">
            {majors.length} chuyên ngành
          </span>
        </div>
      </div>

      {/* Form Tạo mới / Cập nhật */}
      <div className="bg-white p-6 border border-[#E8E2D9] rounded-2xl shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-[#2C2825]">
            {isEditing ? " Đổi tên chuyên ngành" : "Thêm chuyên ngành mới "}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setMajorName("");
              }}
              className="text-xs font-bold text-gray-500 hover:text-black cursor-pointer"
            >
              Hủy chỉnh sửa ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSaveMajor} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={majorName}
            onChange={(e) => setMajorName(e.target.value)}
            placeholder="Nhập tên chuyên ngành (VD: Software Engineering, Information Assurance...)"
            required
            className="flex-1 min-w-70 px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-medium"
          />
          <button
            type="submit"
            disabled={submitting || !majorName.trim()}
            className="px-6 py-3 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer transition"
          >
            {submitting ? "Đang xử lý..." : isEditing ? "💾 Lưu thay đổi" : "🚀 Tạo chuyên ngành"}
          </button>
        </form>
      </div>

      {/* Bảng danh sách chuyên ngành */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs ">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#6B635B] text-center">
              <th className="p-4 font-black uppercase w-16 text-center">STT</th>
              <th className="p-4 font-black uppercase">Chuyên ngành</th>
              <th className="p-4 font-black uppercase">Tên Chuyên Ngành</th>
              <th className="p-4 font-black uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-12 text-center text-[#6B635B]">
                  Đang tải danh sách chuyên ngành...
                </td>
              </tr>
            ) : majors.length > 0 ? (
              majors.map((m, index) => (
                <tr key={m.id || m.majorId || index} className="hover:bg-[#FBF9F5]/70 transition text-center">
                  <td className="p-4 text-center font-bold text-[#6B635B]">{index + 1}</td>
                  <td className="p-4 font-mono font-bold text-[#E65100] ">
                    {m.code || m.majorId || `MAJ-0${index + 1}`}
                  </td>
                  <td className="p-4 font-bold text-[#2C2825] text-sm">
                    {m.name || m.majorName}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(m)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2C2825] font-bold rounded-xl text-xs cursor-pointer transition"
                    >
                      ✏️ Đổi tên
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-12 text-center text-[#6B635B] italic">
                  Chưa có chuyên ngành nào trong hệ thống.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl text-xs transition-all">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </span>
          <div>
            <p className="font-black text-[#2C2825]">{toast.type === "error" ? "Thông báo lỗi" : "Thành công"}</p>
            <p className="text-[#6B635B]">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}