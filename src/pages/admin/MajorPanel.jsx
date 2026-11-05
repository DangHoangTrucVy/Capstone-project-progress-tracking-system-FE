import { useState, useEffect } from "react";
import { getMajors, createMajor, updateMajor } from "../../services/majorService";

export default function MajorPanel() {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [majorCode, setMajorCode] = useState("");
  
  // State modal Tạo mới / Chỉnh sửa
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const handleCreateMajor = async (e) => {
    e.preventDefault();
    if (!majorName.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createMajor({ name: majorName.trim() });
      showToast("Tạo chuyên ngành mới thành công!");
      setMajorName("");
      setIsCreateOpen(false);
      fetchMajors();
    } catch (error) {
      showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

 const handleUpdateMajor = async (e) => {
  e.preventDefault();
  if (!majorName.trim() || submitting) return;

  setSubmitting(true);
  try {
    // Gửi kèm cả code và name theo đúng yêu cầu API
    await updateMajor(editingId, { 
      code: majorCode, 
      name: majorName.trim() 
    });
    showToast("Đổi tên chuyên ngành thành công!");
    setMajorName("");
    setMajorCode("");
    setIsEditOpen(false);
    setEditingId(null);
    fetchMajors();
  } catch (error) {
    showToast(error.response?.data?.message || "Thực hiện thất bại.", "error");
  } finally {
    setSubmitting(false);
  }
};

  const handleStartEdit = (major) => {
    setEditingId(major.id || major.majorId);
    setMajorName(major.name || major.majorName || "");
    setMajorCode(major.code || "");
    setIsEditOpen(true);
  };

  const majorImages = [
    "https://cnttshop.vn/storage/images/tin-tuc/tri-tue-nhan-tao-ai/tri-tu-nhan-tao-ai-la-gi.jpg",
    "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80"
  ];

  return (
    <div className="w-full px-8 py-6 space-y-6 animate-smooth-fade text-[#1A1816]">
      {/* Khối CSS keyframes cho hiệu ứng hiển thị mượt mà từ trên xuống */}
      <style>{`
        @keyframes smoothFadeIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-smooth-fade {
          animation: smoothFadeIn 1.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, transform;
        }
      `}</style>

      {/* Tiêu đề & Nút Thêm chuyên ngành */}
      <div className="bg-[#E65100]/90 backdrop-blur-xl p-6 border border-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg shadow-black/5 gap-4">
        <div>
          <span className="px-3 py-1 bg-orange-100 text-[#E65100] text-[11px] font-black rounded border border-orange-200">
            QUẢN LÝ CHUYÊN NGÀNH
          </span>
          <h1 className="text-2xl font-black text-[#ffffff] mt-1">
            Danh sách chuyên ngành đào tạo
          </h1>
          <p className="text-xs text-[#efe9e3] font-semibold mt-0.5">
            Quy tắc: Các nhóm đồ án Capstone sẽ được hình thành trong cùng một chuyên ngành[cite: 1].
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-xs font-extrabold text-[#3A3530] bg-white/90 px-4 py-2.5 border border-white rounded-xl shadow-sm">
            Tổng số: <span className="text-[#E65100] font-black">{majors.length}</span> chuyên ngành
          </div>
          <button
            type="button"
            onClick={() => {
              setMajorName("");
              setIsCreateOpen(true);
            }}
            className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition"
          >
            <span> Thêm chuyên ngành</span>
          </button>
        </div>
      </div>

      {/* Danh sách dạng Card Grid */}
      <div>
        {loading ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-12 text-center text-[#554D44] font-semibold text-xs shadow-lg shadow-black/5">
            Đang tải danh sách chuyên ngành...
          </div>
        ) : majors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {majors.map((m, index) => (
              <div 
                key={m.id || m.majorId || index} 
                className="bg-white/80 backdrop-blur-xl border border-white hover:border-[#E65100]/50 rounded-2xl overflow-hidden shadow-lg shadow-black/5 transition flex flex-col justify-between group"
              >
                <div className="relative h-36 w-full overflow-hidden bg-white/50">
                  <img 
                    src={majorImages[index % majorImages.length]} 
                    alt="Major Cover" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg font-mono font-black text-[#E65100] text-[11px] shadow-sm">
                    #{index + 1}
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#554D44] uppercase tracking-wider block">
                      {m.code || m.majorId || `MAJ-0${index + 1}`}
                    </span>
                    <h3 className="font-extrabold text-[#1A1816] text-sm line-clamp-2">
                      {m.name || m.majorName}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-white/80 flex items-center justify-between mt-3">
                    <span className="text-[10px] text-[#554D44] font-semibold italic">Đào tạo chuẩn FPT</span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(m)}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-[#E65100] text-[#1A1816] font-bold rounded-xl text-xs cursor-pointer transition flex items-center gap-1 border border-white shadow-xs"
                    >
                       Đổi tên
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-12 text-center text-[#554D44] italic text-xs shadow-lg shadow-black/5">
            Chưa có chuyên ngành nào trong hệ thống[cite: 1].
          </div>
        )}
      </div>

      {/* Modal Tạo Chuyên Ngành Mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-smooth-fade">
            <div className="flex justify-between items-center border-b border-white/80 pb-4">
              <h3 className="text-sm font-black text-[#1A1816] flex items-center gap-2">
               Thêm chuyên ngành mới
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-800 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateMajor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#3A3530] mb-1.5">Tên chuyên ngành</label>
                <input
                  type="text"
                  value={majorName}
                  onChange={(e) => setMajorName(e.target.value)}
                  placeholder="VD: Software Engineering, Artificial Intelligence..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 text-xs bg-white border border-white rounded-xl focus:outline-none focus:border-[#E65100] font-semibold text-[#1A1816] shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-orange-50 text-[#3A3530] text-xs font-bold rounded-xl cursor-pointer transition border border-white shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !majorName.trim()}
                  className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-50 cursor-pointer transition"
                >
                  {submitting ? "Đang tạo..." : "Lưu chuyên ngành"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Tên Chuyên Ngành */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-smooth-fade">
            <div className="flex justify-between items-center border-b border-white/80 pb-4">
              <h3 className="text-sm font-black text-[#1A1816] flex items-center gap-2">
                 Đổi tên chuyên ngành
              </h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-gray-800 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateMajor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#3A3530] mb-1.5">Tên chuyên ngành mới</label>
                <input
                  type="text"
                  value={majorName}
                  onChange={(e) => setMajorName(e.target.value)}
                  placeholder="Nhập tên mới..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 text-xs bg-white border border-white rounded-xl focus:outline-none focus:border-[#E65100] font-semibold text-[#1A1816] shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingId(null);
                    setMajorName("");
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-orange-50 text-[#3A3530] text-xs font-bold rounded-xl cursor-pointer transition border border-white shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !majorName.trim()}
                  className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-50 cursor-pointer transition"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl text-xs transition-all animate-smooth-fade">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </span>
          <div>
            <p className="font-black text-[#1A1816]">{toast.type === "error" ? "Thông báo lỗi" : "Thành công"}</p>
            <p className="text-[#554D44] font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}