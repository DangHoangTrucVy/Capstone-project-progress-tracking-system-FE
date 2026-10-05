import React, { useState } from "react";
import { importEligibilityJson, importEligibilityFile, updateStudentEligibility } from "../../services/eligibilityService";

export default function EligibilityImport() {
  const [jsonInput, setJsonInput] = useState("");
  const [file, setFile] = useState(null);
  const [userId, setUserId] = useState("");
  const [eligibleStatus, setEligibleStatus] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    setLoading(true);
    try {
      const parsedData = JSON.parse(jsonInput);
      await importEligibilityJson(parsedData);
      alert("Import danh sách sinh viên đủ điều kiện (JSON) thành công!");
      setJsonInput("");
    } catch (err) {
      alert("Lỗi: Định dạng JSON không hợp lệ hoặc lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await importEligibilityFile(formData);
      alert("Import file danh sách sinh viên thành công!");
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || "Import file thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    try {
      await updateStudentEligibility(userId.trim(), { eligible: eligibleStatus });
      alert("Cập nhật trạng thái cờ điều kiện sinh viên thành công!");
      setUserId("");
    } catch (err) {
      alert("Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn text-[#2C2825] max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <h2 className="text-xl font-black">Quản lý danh sách đủ điều kiện (Eligibility)</h2>
        <p className="text-xs text-[#6B635B]">
          Admin thực hiện import danh sách sinh viên từ kỳ trước hoặc gắn/gỡ cờ điều kiện tham gia đợt đồ án.
        </p>
      </div>

      {/* 1. Import bằng File Excel / CSV */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Import từ File (CSV / Excel)</h3>
        <form onSubmit={handleFileSubmit} className="space-y-3">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-xs text-[#6B635B] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#E65100] hover:file:bg-orange-100 cursor-pointer"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Tải lên file danh sách"}
          </button>
        </form>
      </div>

      {/* 2. Import bằng JSON */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Import dữ liệu JSON trực tiếp</h3>
        <form onSubmit={handleJsonSubmit} className="space-y-3">
          <textarea 
            rows={5}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Dán đoạn JSON danh sách sinh viên (VD: [{"studentCode": "SE12345", ...}])'
            className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100] font-mono"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Import JSON"}
          </button>
        </form>
      </div>

      {/* 3. Cập nhật cờ điều kiện từng sinh viên */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Gắn / Gỡ cờ điều kiện cá nhân</h3>
        <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold">Mã sinh viên / User ID</label>
            <input 
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập ID sinh viên..."
              className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">Trạng thái điều kiện</label>
            <select 
              value={eligibleStatus}
              onChange={(e) => setEligibleStatus(e.target.value === "true")}
              className="w-full p-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            >
              <option value="true">Đủ điều kiện (Eligible)</option>
              <option value="false">Không đủ điều kiện (Ineligible)</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            Cập nhật trạng thái
          </button>
        </form>
      </div>
    </div>
  );
}