import React, { useState } from "react";

export default function DocumentGroup() {
    const [documents, setDocuments] = useState([
        { id: 1, name: "Phiếu đề xuất đề tài.pdf", stage: "Giai đoạn 1 • Đề xuất đề tài", uploader: "Minh Trí", status: "Đã duyệt", date: "13/08/2026" },
        { id: 2, name: "Đề cương đồ án.pdf", stage: "Giai đoạn 2 • Bảo vệ đề cương", uploader: "Bảo Châu", status: "Đã duyệt", date: "20/08/2026" },
        { id: 3, name: "Báo cáo tiến độ tuần 4.docx", stage: "Giai đoạn 3 • Kiểm tra tiến độ lần 1", uploader: "Thu Hiền", status: "Chờ duyệt", date: "12/09/2026" }
    ]);

    const handleUpload = (e) => {
        e.preventDefault();
        alert("Đã tải lên tệp thành công (Mô phỏng UI)");
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-black">Tài liệu của nhóm</h2>
            
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-6">
                {/* Khu vực kéo thả nộp file */}
                <form onSubmit={handleUpload} className="border-2 border-dashed border-[#E8E2D9] p-8 text-center rounded-2xl space-y-3 bg-[#FBF9F5]">
                    <div className="w-10 h-10 bg-orange-100 text-[#E65100] mx-auto rounded-xl flex items-center justify-center font-black">📂</div>
                    <p className="text-xs font-bold text-[#6B635B]">Kéo thả tệp vào đây, hoặc chọn tệp từ máy tính (PDF, DOCX, tối đa 25MB)</p>
                    <input type="file" id="fileUpload" className="hidden" onChange={handleUpload} />
                    <label htmlFor="fileUpload" className="inline-block px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:bg-orange-700 transition">
                        Chọn tệp để nộp
                    </label>
                </form>

                {/* Danh sách tài liệu */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách tài liệu đã nộp</h3>
                    {documents.map((doc) => (
                        <div key={doc.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-[#2C2825]">📄 {doc.name}</h4>
                                <p className="text-[10px] text-[#6B635B]">{doc.stage} • Nộp bởi {doc.uploader} ({doc.date})</p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${doc.status === "Đã duyệt" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                {doc.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}