import React, { useState } from "react";

export default function DocumentGroup() {
    const [documents, setDocuments] = useState([
        { id: 1, name: "Phiếu đề xuất đề tài.pdf", stage: "Giai đoạn 1 • Đề xuất đề tài", uploader: "Minh Trí", status: "Đã duyệt", date: "13/08/2026" },
        { id: 2, name: "Đề cương đồ án.pdf", stage: "Giai đoạn 2 • Bảo vệ đề cương", uploader: "Bảo Châu", status: "Đã duyệt", date: "20/08/2026" },
        { id: 3, name: "Báo cáo tiến độ tuần 4.docx", stage: "Giai đoạn 3 • Kiểm tra tiến độ lần 1", uploader: "Thu Hiền", status: "Chờ duyệt", date: "12/09/2026" }
    ]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Kiểm tra giới hạn 25MB
            if (file.size > 25 * 1024 * 1024) {
                alert("Kích thước tệp vượt quá giới hạn cho phép (tối đa 25MB).");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadSubmit = (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Vui lòng chọn một tệp tài liệu trước khi nộp!");
            return;
        }

        setUploading(true);
        setTimeout(() => {
            const newDoc = {
                id: Date.now(),
                name: selectedFile.name,
                stage: "Giai đoạn 3 • Báo cáo tiến độ",
                uploader: "Đặng Hoàng Trúc Vy", // Lấy từ user hiện tại nếu có
                status: "Chờ duyệt",
                date: new Date().toLocaleDateString("vi-VN")
            };
            setDocuments([newDoc, ...documents]);
            setSelectedFile(null);
            setUploading(false);
            alert("Đã tải lên tệp tài liệu thành công!");
        }, 800);
    };

    return (
        <div className="space-y-6 animate-fadeIn text-[#2C2825]">
            <h2 className="text-lg font-black">Tài liệu & Báo cáo đồ án</h2>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] space-y-6 shadow-sm">
                
                {/* Khu vực nộp file */}
                <form onSubmit={handleUploadSubmit} className="border-2 border-dashed border-[#E8E2D9] p-8 text-center rounded-2xl space-y-3 bg-[#FBF9F5]">
                    <div className="w-10 h-10 bg-orange-100 text-[#E65100] mx-auto rounded-xl flex items-center justify-center font-black">📂</div>
                    <div>
                        <p className="text-xs font-bold text-[#6B635B]">Kéo thả tệp vào đây, hoặc chọn tệp từ máy tính</p>
                        <p className="text-[10px] text-[#9E958C] mt-0.5">Định dạng hỗ trợ: PDF, DOCX, ZIP (Tối đa 25MB)</p>
                    </div>

                    <input 
                        type="file" 
                        id="fileUpload" 
                        className="hidden" 
                        accept=".pdf,.docx,.doc,.zip,.rar"
                        onChange={handleFileChange} 
                    />

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                        <label htmlFor="fileUpload" className="px-5 py-2.5 bg-white border border-[#E8E2D9] text-[#2C2825] text-xs font-bold rounded-xl cursor-pointer shadow-2xs hover:bg-gray-50 transition">
                            {selectedFile ? `📁 ${selectedFile.name}` : "Chọn tệp từ máy tính"}
                        </label>

                        {selectedFile && (
                            <button 
                                type="submit" 
                                disabled={uploading}
                                className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                            >
                                {uploading ? "Đang tải lên..." : "Xác nhận nộp file"}
                            </button>
                        )}
                    </div>
                </form>

                {/* Danh sách tài liệu */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách tài liệu đã nộp ({documents.length})</h3>
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                            <div key={doc.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-[#2C2825]">📄 {doc.name}</h4>
                                    <p className="text-[10px] text-[#6B635B]">{doc.stage} • Nộp bởi {doc.uploader} ({doc.date})</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${doc.status === "Đã duyệt" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                                        {doc.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-[#6B635B] py-6 italic">Chưa có tài liệu nào được nộp.</p>
                    )}
                </div>

            </div>
        </div>
    );
}