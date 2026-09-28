import React, { useState, useEffect } from "react";
import { getAllGroups, updateGroup } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import Profile from "../../auth/Profile"; // Import trang Profile chuẩn của bạn

export default function CouncilDashboard() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("review3"); // review3, defense, profile
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [classification, setClassification] = useState("APPROVED_DEFENSE_1");
  const [defenseScore, setDefenseScore] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchCouncilData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const res = await getAllGroups();
      setGroups(res?.content || res || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu hội đồng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouncilData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const buildGroupUpdatePayload = (group, changes) => ({
    groupCode: group.groupCode,
    semester: group.semester,
    status: group.status,
    topicId: group.topicId || group.topic?.id || null,
    supervisorId: group.supervisorId || group.supervisor?.id || null,
    ...changes,
  });

  const handleSaveClassification = async (groupId) => {
    setSubmitting(true);
    try {
      const group = groups.find((item) => item.id === groupId);
      if (!group) throw new Error("Không tìm thấy nhóm cần cập nhật.");

      await updateGroup(
        groupId,
        buildGroupUpdatePayload(group, { councilStatus: classification }),
      );
      alert("Đã cập nhật kết quả phân loại Hội đồng.");
      await fetchCouncilData();
      setSelectedGroup(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Cập nhật thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDefenseScore = async (groupId) => {
    const score = Number(defenseScore);
    if (defenseScore === "" || !Number.isFinite(score) || score < 0 || score > 10) {
      alert("Vui lòng nhập điểm bảo vệ!");
      return;
    }
    setSubmitting(true);
    try {
      const group = groups.find((item) => item.id === groupId);
      if (!group) throw new Error("Không tìm thấy nhóm cần cập nhật.");

      await updateGroup(
        groupId,
        buildGroupUpdatePayload(group, { defenseScore: score }),
      );
      alert("Đã lưu điểm bảo vệ.");
      await fetchCouncilData();
      setSelectedGroup(null);
      setDefenseScore("");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Không thể lưu điểm bảo vệ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-bold text-[#6B635B] bg-[#FBF9F5]">
        Đang tải phân hệ Hội đồng...
      </div>
    );
  }

  const councilMemberName =
    user?.fullName || user?.name || "Thành viên Hội đồng";
  const councilMemberEmail = user?.email || "council@fpt.edu.vn";

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-[#2C2825] font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-[#E8E2D9] flex flex-col justify-between p-6 select-none shrink-0 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              ⚖️
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#2C2825]">
                Cổng Hội Đồng
              </h2>
              <p className="text-[10px] text-[#6B635B]">
                Thẩm định & Chấm bảo vệ
              </p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold text-[#6B635B]">
            <button
              onClick={() => setActiveTab("review3")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "review3"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#FBF9F5]"
              }`}
            >
              <span>🏛️</span>
              <span>Hội đồng kín (Review 3)</span>
            </button>
            <button
              onClick={() => setActiveTab("defense")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "defense"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#FBF9F5]"
              }`}
            >
              <span>🎓</span>
              <span>Bảo vệ cuối kỳ (Cuốn chiếu)</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#E65100] text-white shadow-md"
                  : "hover:bg-[#FBF9F5]"
              }`}
            >
              <span>👤</span>
              <span>Hồ sơ cá nhân</span>
            </button>
          </nav>
        </div>

        {/* USER INFO & LOGOUT Ở CUỐI SIDEBAR */}
        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div
            onClick={() => setActiveTab("profile")}
            className="p-3 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex items-center gap-3 cursor-pointer hover:border-[#E65100] transition"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-xs shrink-0">
              {councilMemberName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#2C2825] truncate">
                {councilMemberName}
              </p>
              <p className="text-[10px] text-[#6B635B] truncate">
                {councilMemberEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all duration-200 text-center shadow-2xs cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-8 flex justify-between items-center text-xs shrink-0 shadow-sm">
          <span className="font-bold text-[#6B635B]">
            Phân hệ Hội đồng —{" "}
            {activeTab === "review3"
              ? "Hội đồng kín (Review 3)"
              : activeTab === "defense"
                ? "Bảo vệ cuối kỳ"
                : "Hồ sơ cá nhân"}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[#2C2825] font-extrabold">
              {councilMemberName} (Chủ tịch / Thành viên Hội đồng)
            </span>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9E958C]">Luồng hội đồng</p>
                <h2 className="mt-1 text-lg font-black text-[#2C2825]">Giai đoạn 2, 5 & 6 · Duyệt đề tài, review và bảo vệ</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {[
                  "2. Duyệt đề tài",
                  "5. Review 3",
                  "6. Bảo vệ",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[#E65100]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {activeTab === "review3" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[10px] font-bold rounded-md">
                  Giai đoạn 5.3 · Review 3 / Hội đồng kín (Tuần 14)
                </span>
                <h1 className="text-xl font-black">
                  Phân loại nhóm sau Review 3
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Đây là giai đoạn phân loại nhóm dựa trên tiến độ, chất lượng đề tài và khả năng bảo vệ. Theo quy trình, hệ thống hỗ trợ quyết định đi tiếp hay điều chỉnh.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#E65100]">Review 1</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">Đánh giá sơ bộ</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Nhóm được xem xét ở giai đoạn đầu, xác định hướng đi và mốc phát triển.</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Review 2</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">Đánh giá giữa kỳ</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Thiết lập lịch review tương tự review 1 để đánh giá tiến độ và điều chỉnh.</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Review 3</p>
                  <h3 className="mt-2 text-base font-black text-[#2C2825]">Hội đồng kín</h3>
                  <p className="mt-2 text-[11px] text-[#6B635B]">Phân loại nhóm và quyết định người nào đủ điều kiện vào bảo vệ cuối kỳ.</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Danh sách nhóm ({groups.length})
                </h3>
                <div className="divide-y divide-[#E8E2D9]">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="py-4 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#E65100]">
                            {g.groupCode}
                          </span>
                          <span className="text-[#2C2825] font-bold">
                            {g.topicTitle || g.topic?.title || "Chưa có đề tài"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B635B] mt-1">
                          Phân loại:{" "}
                          <strong className="text-[#2C2825]">
                            {g.councilStatus || "Chưa phân loại"}
                          </strong>
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedGroup(g)}
                        className="px-4 py-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl cursor-pointer shadow-sm"
                      >
                        ⚡ Phân loại nhóm
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "defense" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
                <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[10px] font-bold rounded-md">
                  Giai đoạn 6 · Bảo vệ cuối kỳ theo lịch cuốn chiếu
                </span>
                <h1 className="text-xl font-black">
                  Chấm điểm Bảo vệ (Lần 1 & Lần 2)
                </h1>
                <p className="text-xs text-[#6B635B]">
                  Nhóm sau khi qua hội đồng kín sẽ được xếp lịch bảo vệ theo từng đợt, không dồn cùng lúc. Nếu chưa đạt ở lần 1, được quyền bảo vệ lần 2 để cải thiện điểm số.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#6B635B]">
                  Danh sách nhóm bảo vệ ({groups.length})
                </h3>
                <div className="divide-y divide-[#E8E2D9]">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="py-4 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#E65100]">
                            {g.groupCode}
                          </span>
                          <span className="text-[#2C2825] font-bold">
                            {g.topicTitle || g.topic?.title || "Chưa có đề tài"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B635B] mt-1">
                          Điểm bảo vệ:{" "}
                          <strong className="text-emerald-600 font-black">
                            {g.defenseScore !== undefined
                              ? `${g.defenseScore} điểm`
                              : "Chưa chấm"}
                          </strong>
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedGroup(g)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                      >
                        ✍️ Chấm điểm bảo vệ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ráp trực tiếp component Profile vào đây */}
          {activeTab === "profile" && <Profile />}
        </div>
      </main>

      {/* MODAL THAO TÁC CHẤM ĐIỂM / PHÂN LOẠI */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl border border-[#E8E2D9]">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm">
                Nhóm: {selectedGroup.groupCode}
              </h3>
              <button
                onClick={() => setSelectedGroup(null)}
                className="font-bold text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {activeTab === "review3" ? (
              <div className="space-y-4 text-xs">
                <label className="block font-bold text-[#2C2825]">
                  Chọn trạng thái phân loại sau Review 3:
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                >
                  <option value="APPROVED_DEFENSE_1">
                    Nhóm ổn → Được duyệt ra Bảo vệ lần 1 ngay
                  </option>
                  <option value="NEED_REVISION">
                    Nhóm cần chỉnh sửa → Phải hoàn thiện mới được ra Bảo vệ lần
                    1
                  </option>
                  <option value="DOWNGRADE_DEFENSE_2">
                    Nhóm chưa đạt → Đẩy xuống lịch Bảo vệ lần 2
                  </option>
                </select>
                <button
                  onClick={() => handleSaveClassification(selectedGroup.id)}
                  disabled={submitting}
                  className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : "Xác nhận phân loại & Gửi thông báo"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <label className="block font-bold text-[#2C2825]">
                  Nhập điểm bảo vệ (Thang 10):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={defenseScore}
                  onChange={(e) => setDefenseScore(e.target.value)}
                  placeholder="VD: 8.5"
                  className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
                />
                <button
                  onClick={() => handleSaveDefenseScore(selectedGroup.id)}
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {submitting ? "Đang lưu..." : "Lưu điểm bảo vệ"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
