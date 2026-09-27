import React, { useState, useEffect } from "react";
import { getGroupDocuments, submitDocumentLink } from "../../services/documentService";

export default function DocumentGroup({ groupId = "default-group-id" }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docForm, setDocForm] = useState({
    title: "",
    url: "",
    milestoneId: "",
  });

  const fetchDocuments = async () => {
    try {
      const res = await getGroupDocuments(groupId);
      setDocuments(res.content || res || []);
    } catch (err) {
      console.error("Lỗi tải danh sách tài liệu:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchDocuments();
  }, [groupId]);

  const handleSubmitDoc = async (e) => {
    e.preventDefault();
    try {
      await submitDocumentLink(groupId, docForm);
      alert("Nộp tài liệu/link thành công!");
      setDocForm({ title: "", url: "", milestoneId: "" });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể nộp tài liệu.");
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-5xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          Documents / Artifacts · Nộp tài liệu
        </span>
        <h1 className="text-xl font-black">Quản lý Tài liệu & Báo cáo Đồ án</h1>
        <p className="text-xs text-[#6B635B]">
          Nộp các liên kết mã nguồn GitHub, bản vẽ thiết kế hệ thống hoặc tài liệu báo cáo qua các cột mốc.
        </p>
      </div>

      {/* Form nộp tài liệu */}
      <form onSubmit={handleSubmitDoc} className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Nộp liên kết tài liệu mới</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#6B635B]">Tiêu đề tài liệu *</label>
            <input
              type="text"
              required
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
              placeholder="Ví dụ: Báo cáo Sprint 1 / Link GitHub Repository"
              className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#6B635B]">Đường dẫn (URL) *</label>
            <input
              type="url"
              required
              value={docForm.url}
              onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
        >
          + Nộp tài liệu
        </button>
      </form>

      {/* Danh sách tài liệu đã nộp */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách tài liệu đã nộp ({documents.length})</h3>
        <div className="divide-y divide-[#E8E2D9]">
          {loading ? (
            <p className="text-xs text-[#6B635B] py-4">Đang tải tài liệu...</p>
          ) : documents.length > 0 ? (
            documents.map((item) => (
              <div key={item.id} className="py-4 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <p className="font-black text-[#2C2825] text-sm">📄 {item.title}</p>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#E65100] hover:underline font-bold truncate block max-w-md"
                  >
                    {item.url}
                  </a>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
                  {item.status || "Đã nộp"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#6B635B] italic py-4">Chưa có tài liệu nào được nộp.</p>
          )}
        </div>
      </div>
    </div>
  );
}