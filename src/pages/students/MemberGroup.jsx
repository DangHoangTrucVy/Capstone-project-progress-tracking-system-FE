import React, { useState, useEffect } from "react";
import { getGroupById, addGroupMember, removeGroupMember } from "../../services/groupService";

export default function MemberGroup({ groupId }) {
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
        if (!memberInput.trim()) return;
        setLoading(true);
        try {
            const payload = {
                userId: memberInput.trim(), // ID hoặc mã sinh viên theo API yêu cầu
                isLeader: false
            };
            await addGroupMember(groupId, payload);
            setMemberInput("");
            await fetchGroupDetails(); // Load lại danh sách thật từ server
            alert("Thêm thành viên thành công!");
        } catch (err) {
            console.error("Lỗi thêm thành viên:", err);
            alert("Thêm thành viên thất bại. Vui lòng kiểm tra lại ID/MSSV.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) return;
        try {
            await removeGroupMember(groupId, memberId);
            await fetchGroupDetails(); // Load lại danh sách thật từ server
            alert("Đã xóa thành viên thành công!");
        } catch (err) {
            console.error("Lỗi xóa thành viên:", err);
            alert("Xóa thành viên thất bại.");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-black">Thành viên nhóm</h2>
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-6">
                
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Mã nhóm / Mã mời</p>
                        <h4 className="text-sm font-black text-[#2C2825]">{groupData?.groupCode || "Đang tải..."}</h4>
                    </div>
                    <button type="button" onClick={() => navigator.clipboard.writeText(groupData?.groupCode)} className="px-3 py-1.5 bg-white border border-orange-200 text-xs font-bold rounded-xl text-[#E65100]">Sao chép mã</button>
                </div>

                <div className="space-y-3">
                    {groupData?.members && groupData.members.length > 0 ? (
                        groupData.members.map((m) => (
                            <div key={m.id || m.userId} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold">{m.userFullName || "Thành viên"}</h4>
                                    <p className="text-[10px] text-[#6B635B]">{m.userEmail || m.userId}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${m.isLeader ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}`}>
                                        {m.isLeader ? "Trưởng nhóm" : "Thành viên"}
                                    </span>
                                    {!m.isLeader && (
                                        <button type="button" onClick={() => handleRemoveMember(m.id || m.userId)} className="text-red-500 font-bold text-xs hover:underline">Xóa</button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-[#6B635B] py-4">Chưa có thành viên nào trong nhóm.</p>
                    )}
                </div>

                <form onSubmit={handleAddMember} className="pt-4 border-t border-[#E8E2D9] space-y-3">
                    <label className="block text-xs font-bold text-[#2C2825]">Thêm thành viên bằng ID / MSSV</label>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={memberInput}
                            onChange={(e) => setMemberInput(e.target.value)}
                            placeholder="Nhập User ID hoặc MSSV..." 
                            required
                            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]" 
                        />
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
                            {loading ? "Đang thêm..." : "Thêm"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}