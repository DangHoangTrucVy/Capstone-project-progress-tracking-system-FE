import React, { useState, useEffect } from "react";
import { createGroup } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";

export default function CreateGroup({ onGroupCreated }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [groupCode, setGroupCode] = useState("");
  const semesterOptions = ["Fall2026", "Spring2027", "Summer2027", "Fall2027"];
  const [semester, setSemester] = useState("Fall2026");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await getCurrentUser();
        setCurrentUser(userRes);
      } catch (error) {
        console.error("Lỗi tải thông tin user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const groupPayload = {
        groupCode: groupCode.trim(),
        semester: semester.trim(),
      };

      const response = await createGroup(groupPayload);
      if (response && response.id) {
        localStorage.setItem("groupId", response.id);
      } else if (response && response.data?.id) {
        localStorage.setItem("groupId", response.data.id);
      }
      alert("Tạo nhóm thành công! Bạn đã trở thành Trưởng nhóm (Leader).");
      if (onGroupCreated) onGroupCreated();
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      alert(
        error.response?.data?.message ||
          "Tạo nhóm thất bại! Vui lòng kiểm tra lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyLeader = ["LEADER", "GROUP_LEADER"].includes(currentUser?.role);

  return (
    <main className="max-w-6xl mx-auto py-4 px-6 space-y-8 animate-fadeIn">
      {isAlreadyLeader ? (
        <div className="max-w-xl mx-auto text-center py-12 space-y-3 bg-white rounded-3xl border border-[#E8E2D9] shadow-sm p-8">
          <p className="text-sm font-bold text-amber-600">
            Bạn đã là Trưởng nhóm của một nhóm khác!
          </p>
          <p className="text-xs text-[#6B635B]">
            Mỗi sinh viên không làm Leader nhiều nhóm trong cùng đợt luận án.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-4xl border border-[#E8E2D9] shadow-lg shadow-stone-200/40">
            <form onSubmit={handleCreateGroupSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Mã nhóm *
                  </label>
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="VD: G2026-01"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Học kỳ *
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  >
                    {semesterOptions.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black tracking-wider uppercase rounded-xl shadow-md transition-all flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
              >
                <span>
                  {loading ? "Đang xử lý..." : "Xác nhận tạo nhóm ngay"}
                </span>
                <span className="text-[10px] font-normal normal-case opacity-90">
                  (Bạn sẽ trở thành Trưởng nhóm chính thức đầu tiên)
                </span>
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-4xl border border-[#E8E2D9] shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-[#E65100] font-black text-xs uppercase">
                <span>💡</span>
                <span>Quy chế lập nhóm</span>
              </div>
              <ul className="space-y-2 text-[11px] text-[#6B635B] list-disc pl-4 leading-relaxed">
                <li>
                  Quy mô nhóm hợp lệ: từ 3 đến 5 thành viên chính thức.
                </li>
                <li>
                  Mỗi sinh viên chỉ thuộc một nhóm chính thức tại một thời
                  điểm trong cùng đợt luận án.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}