import React, { useState, useEffect } from "react";
import { getAllGroups, getGroupById, addGroupMember } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function JoinGroup({ onJoined }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        const fetchValidGroups = async () => {
            try {
                const res = await getAllGroups();
                const groupList = res?.content || res || [];
                
                const detailedGroupsPromises = groupList.map(async (g) => {
                    try {
                        const detail = await getGroupById(g.id);
                        return detail || g;
                    } catch (err) {
                        return g;
                    }
                });

                const detailedGroups = await Promise.all(detailedGroupsPromises);

                const validGroups = detailedGroups.filter(g => {
                    const memberCount = g.members ? g.members.length : 0;
                    return memberCount < 5;
                });

                setGroups(validGroups);
            } catch (err) {
                console.error("Lỗi tải danh sách nhóm:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchValidGroups();
    }, []);

    const handleJoin = async (groupId) => {
        if (!window.confirm("Bạn có chắc chắn muốn tham gia nhóm này không?")) return;
        setJoiningId(groupId);
        try {
            const currentUser = await getCurrentUser();
            
            // Gọi trực tiếp API /groups/{id}/members để thêm sinh viên vào nhóm
            await addGroupMember(groupId, {
                userId: currentUser.id,
                isLeader: false
            });

            alert("Tham gia nhóm thành công!");
            localStorage.setItem("groupId", groupId);
            if (onJoined) onJoined();
            window.location.reload();
        } catch (err) {
            if (err.response?.status === 409) {
                alert("Bạn đã là thành viên của nhóm này rồi!");
                localStorage.setItem("groupId", groupId);
                if (onJoined) onJoined();
                window.location.reload();
            } else {
                console.error("Lỗi tham gia nhóm:", err);
                const errorMsg = err.response?.data?.message || "Không thể tham gia nhóm. Vui lòng kiểm tra lại quyền hoặc API Backend.";
                alert(errorMsg);
            }
        } finally {
            setJoiningId(null);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between p-6">
            <div className="max-w-3xl mx-auto w-full space-y-6 pt-10">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    <div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">⚠️ Chưa tham gia nhóm</span>
                        <h1 className="text-xl font-black text-[#2C2825] mt-1">Vui lòng chọn nhóm đồ án</h1>
                        <p className="text-xs text-[#6B635B]">Hệ thống chỉ hiển thị các nhóm chưa đủ thành viên (tối đa 5 thành viên).</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-red-500 font-bold text-xs rounded-xl transition">
                        Đăng xuất
                    </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h2 className="text-xs font-black uppercase text-[#6B635B]">Danh sách nhóm hợp lệ có thể tham gia</h2>
                    
                    {loading ? (
                        <p className="text-xs text-center py-8 text-[#6B635B]">Đang tải danh sách nhóm...</p>
                    ) : groups.length > 0 ? (
                        <div className="space-y-3">
                            {groups.map((g) => {
                                const count = g.members ? g.members.length : 0;
                                return (
                                    <div key={g.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-xs font-black text-[#2C2825]">{g.groupCode}</h3>
                                                <span className="px-2 py-0.5 bg-orange-100 text-[#E65100] text-[10px] font-bold rounded-md">{g.semester}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-[#2C2825]">Đề tài: {g.topicTitle || "Chưa chọn đề tài"}</p>
                                            <p className="text-[10px] text-[#6B635B]">Thành viên: {count}/5 người</p>
                                        </div>
                                        <button 
                                            onClick={() => handleJoin(g.id)}
                                            disabled={joiningId === g.id}
                                            className="px-5 py-2.5 bg-[#E65100] hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                                        >
                                            {joiningId === g.id ? "Đang xử lý..." : "Tham gia nhóm"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-xs text-[#6B635B]">Hiện tại không có nhóm nào trống hoặc các nhóm đều đã đủ 5 thành viên.</p>
                        </div>
                    )}
                </div>
            </div>
            <footer className="text-center text-[10px] text-[#6B635B] pb-4">Lịch Đồ Án · Khoa Công nghệ thông tin</footer>
        </div>
    );
}