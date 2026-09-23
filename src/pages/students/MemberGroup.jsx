import React, { useState, useEffect } from "react";
import { getGroupById, addGroupMember, removeGroupMember } from "../../services/groupService";

export default function MemberGroup({ groupId, isLeader }) {
    const [groupData, setGroupData] = useState(null);
    const [memberInput, setMemberInput] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchGroupDetails = async () => {
        if (!groupId) return;
        try {
            const res = await getGroupById(groupId);
            setGroupData(res);
        } catch (err) {
            console.error("Lỗi lấy thông tin nhóm:", err);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!isLeader) {
            alert("Chỉ có Trưởng nhóm mới có quyền thêm thành viên!");
            return;
        }
        if (!memberInput.trim()) return;

        if (groupData?.members && groupData.members.length >= 5) {
            alert("Nhóm đã đạt số lượng tối đa (5 thành viên). Không thể thêm mới!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                userId: memberInput.trim(),
                isLeader: false
            };
            await addGroupMember(groupId, payload);
            setMemberInput("");
            await fetchGroupDetails();
            alert("Thêm thành viên thành công!");
        } catch (err) {
            console.error("Lỗi thêm thành viên:", err);
            alert(err.response?.data?.message || "Thêm thành viên thất bại. Vui lòng kiểm tra lại ID/MSSV.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!isLeader) {
            alert("Chỉ có Trưởng nhóm mới có quyền xóa thành viên!");
            return;
        }
        if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) return;
        try {
            await removeGroupMember(groupId, memberId);
            await fetchGroupDetails();
            alert("Đã xóa thành viên thành công!");
        } catch (err) {
            console.error("Lỗi xóa thành viên:", err);
            alert("Xóa thành viên thất bại.");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-black text-[#2C2825]">Thành viên nhóm ({groupData?.members?.length || 0}/5 người)</h2>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] space-y-6 shadow-sm">
                
                {/* Thông tin Mã nhóm / Mã mời */}
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Mã nhóm / Mã mời</p>
                        <h4 className="text-sm font-black text-[#2C2825]">{groupData?.groupCode || "Đang tải..."}</h4>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => {
                            navigator.clipboard.writeText(groupData?.groupCode);
                            alert("Đã sao chép mã nhóm!");
                        }} 
                        className="px-3 py-1.5 bg-white border border-orange-200 text-xs font-bold rounded-xl text-[#E65100] shadow-xs hover:bg-orange-50 transition"
                    >
                        Sao chép mã
                    </button>
                </div>

                {/* Danh sách thành viên */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Danh sách hiện tại</h3>
                    {groupData?.members && groupData.members.length > 0 ? (
                        groupData.members.map((m) => (
                            <div key={m.id || m.userId} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold text-[#2C2825]">{m.userFullName || m.fullName || "Thành viên"}</h4>
                                    <p className="text-[10px] text-[#6B635B]">{m.userEmail || m.email || m.userId}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${m.isLeader ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}`}>
                                        {m.isLeader ? "👑 Trưởng nhóm" : "👤 Thành viên"}
                                    </span>
                                    {/* CHỈ HIỆN NÚT XÓA NẾU USER HIỆN TẠI LÀ LEADER VÀ ĐỐI TƯỢNG KHÔNG PHẢI LÀ LEADER */}
                                    {isLeader && !m.isLeader && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveMember(m.id || m.userId)} 
                                            className="text-red-500 font-bold text-xs hover:underline bg-red-50 px-2.5 py-1 rounded-lg"
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-[#6B635B] py-4">Chưa có thành viên nào trong nhóm.</p>
                    )}
                </div>

                {/* KHU VỰC THÊM THÀNH VIÊN: CHỈ HIỆN KHI ISLEADER = TRUE */}
                {isLeader ? (
                    groupData?.members?.length < 5 ? (
                        <form onSubmit={handleAddMember} className="pt-4 border-t border-[#E8E2D9] space-y-3">
                            <label className="block text-xs font-bold text-[#2C2825]">Thêm thành viên bằng MSSV</label>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    value={memberInput}
                                    onChange={(e) => setMemberInput(e.target.value)}
                                    placeholder="Vui lòng nhập MSSV" 
                                    required
                                    className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]" 
                                />
                                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition">
                                    {loading ? "Đang thêm..." : "Thêm"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-xs text-amber-600 font-bold text-center pt-2">Nhóm đã đạt tối đa 5 thành viên.</p>
                    )
                ) : (
                    /* NẾU LÀ THÀNH VIÊN THƯỜNG (MEMBER) -> HIỂN THỊ THÔNG BÁO HẠN CHẾ QUYỀN */
                    <div className="pt-4 border-t border-[#E8E2D9] text-center">
                        <p className="text-[11px] text-[#6B635B] italic bg-[#FBF9F5] p-3 rounded-xl border border-[#E8E2D9]">
                            🔒 Bạn đang tham gia với tư cách là <strong className="text-[#2C2825]">Thành viên</strong>. Chỉ có Trưởng nhóm mới có quyền thêm hoặc xóa thành viên.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}