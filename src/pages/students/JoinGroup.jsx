import React, { useState, useEffect } from "react";
import { getAllGroups, getGroupById, joinGroup } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function JoinGroup({ onJoined }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        const fetchValidGroups = async () => {
            try {
                const userRes = await getCurrentUser().catch(() => null);
                const userMajor = userRes?.major || userRes?.specialization || "";

                const res = await getAllGroups();
                const groupList = res?.content || res || [];
                
                const detailedGroupsPromises = groupList.map(async (g) => {
                    try {
                        const detail = await getGroupById(g.id);
                        return detail || g;
                    } catch {
                        return g;
                    }
                });

                const detailedGroups = await Promise.all(detailedGroupsPromises);

                // Lọc nhóm: Còn chỗ trống (< 5 người) và cùng chuyên ngành (nếu có thông tin)
                const validGroups = detailedGroups.filter(g => {
                    const memberCount = g.members ? g.members.length : 0;
                    const isNotFull = memberCount < 5;

                    if (userMajor && g.major && g.major.toLowerCase() !== userMajor.toLowerCase()) {
                        return false;
                    }
                    return isNotFull;
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
            await joinGroup(groupId);

            alert("Tham gia nhóm thành công!");
            localStorage.setItem("groupId", groupId);
            if (onJoined) onJoined();
            window.location.reload();
        } catch (err) {
            if (err.response?.status === 409) {
                alert("Bạn đã là thành viên của nhóm này rồi hoặc đã thuộc nhóm khác!");
                localStorage.setItem("groupId", groupId);
                if (onJoined) onJoined();
                window.location.reload();
            } else {
                console.error("Lỗi tham gia nhóm:", err);
                const errorMsg = err.response?.data?.message || "Không thể tham gia nhóm. Vui lòng kiểm tra lại điều kiện cùng ngành.";
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
                        <h1 className="text-xl font-black text-[#2C2825] mt-1">Chọn nhóm đồ án cùng ngành</h1>
                        <p className="text-xs text-[#6B635B]">Hệ thống chỉ hiển thị các nhóm hợp lệ trong cùng chuyên ngành (Sĩ số từ 3 đến 5 người).</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-red-500 font-bold text-xs rounded-xl transition cursor-pointer">
                        Đăng xuất
                    </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                    <h2 className="text-xs font-black uppercase text-[#6B635B]">Danh sách nhóm hợp lệ trong ngành</h2>
                    
                    {loading ? (
                        <p className="text-xs text-center py-8 text-[#6B635B]">Đang tải danh sách nhóm...</p>
                    ) : groups.length > 0 ? (
                        <div className="space-y-3">
                            {groups.map((g) => {
                                const count = g.members ? g.members.length : 0;
                                const slotsLeft = 5 - count;
                                return (
                                    <div key={g.id} className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-xs font-black text-[#2C2825]">{g.groupCode}</h3>
                                                <span className="px-2 py-0.5 bg-orange-100 text-[#E65100] text-[10px] font-bold rounded-md">{g.semester}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-[#2C2825]">Học kỳ: {g.semester || "Fall2026"}</p>
                                            <p className="text-[10px] text-[#6B635B]">Thành viên: {count}/5 người (Còn trống {slotsLeft} chỗ)</p>
                                        </div>
                                        <button 
                                            onClick={() => handleJoin(g.id)}
                                            disabled={joiningId === g.id}
                                            className="px-5 py-2.5 bg-[#E65100] hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                                        >
                                            {joiningId === g.id ? "Đang xử lý..." : "Tham gia nhóm"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-xs text-[#6B635B]">Hiện không có nhóm nào phù hợp hoặc còn chỗ trống trong ngành của bạn.</p>
                        </div>
                    )}
                </div>
            </div>
            <footer className="text-center text-[10px] text-[#6B635B] pb-4">MatchPoint FPT</footer>
        </div>
    );
}