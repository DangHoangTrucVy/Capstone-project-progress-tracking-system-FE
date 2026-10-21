import React, { useState, useEffect } from "react";
import { createGroupInSubject, getSubjectsBySemester } from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";

export default function CreateGroup({ onGroupCreated }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [groupCode, setGroupCode] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [subjectScopes, setSubjectScopes] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // 1. Tải thông tin user và danh sách học kỳ
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const userRes = await getCurrentUser();
        setCurrentUser(userRes);

        const semRes = await api.get("/semesters").catch(() => ({ data: [] }));
        const semList = Array.isArray(semRes.data) ? semRes.data : semRes.data?.content || [];
        setSemesters(semList);
        
        if (semList.length > 0) {
          const firstSem = semList[0].code || semList[0];
          setSelectedSemester(firstSem);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin ban đầu:", error);
      }
    };
    fetchInitData();
  }, []);

  // 2. Khi chọn học kỳ, gọi API lấy danh sách môn học kèm scopes theo đúng cấu trúc Swagger
  useEffect(() => {
    if (selectedSemester) {
      const fetchSubjects = async () => {
        try {
          const res = await getSubjectsBySemester(selectedSemester).catch(() => []);
          const dataList = Array.isArray(res) ? res : res?.content || res?.data || [];
          
          const flattenedOptions = [];
          dataList.forEach((subject) => {
            const subjectId = subject.id; // ID của môn học ở cấp độ gốc
            const subjectName = subject.name || subject.code;

            if (subject.scopes && Array.isArray(subject.scopes) && subject.scopes.length > 0) {
              subject.scopes.forEach((scope) => {
                flattenedOptions.push({
                  subjectId: subjectId, // Truyền đúng subjectId của môn học
                  scopeId: scope.id,
                  displayName: `${subjectName} - ${scope.majorName || scope.majorCode || "Chung"}`,
                });
              });
            } else {
              flattenedOptions.push({
                subjectId: subjectId,
                scopeId: null,
                displayName: subjectName,
              });
            }
          });

          setSubjectScopes(flattenedOptions);
          if (flattenedOptions.length > 0) {
            setSelectedSubjectId(flattenedOptions[0].subjectId);
          } else {
            setSelectedSubjectId("");
          }
        } catch (error) {
          console.error("Lỗi tải danh sách môn học:", error);
          setSubjectScopes([]);
          setSelectedSubjectId("");
        }
      };
      fetchSubjects();
    }
  }, [selectedSemester]);

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedSubjectId) {
      setNotice({
        type: "error",
        title: "Thiếu thông tin môn học",
        message: "Vui lòng chọn môn học/ngành phù hợp trước khi tạo nhóm.",
      });
      return;
    }

    setLoading(true);

    try {
      const groupPayload = {
        groupCode: groupCode.trim(),
      };

      const response = await createGroupInSubject(selectedSubjectId, groupPayload);
      const createdGroupId = response?.id || response?.data?.id;

      if (createdGroupId) {
        localStorage.setItem("groupId", createdGroupId);
      }

      setNotice({
        type: "success",
        title: "Tạo nhóm thành công",
        message: "Bạn đã trở thành Trưởng nhóm chính thức trong môn học.",
      });

      if (onGroupCreated) {
        await onGroupCreated();
      }
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      setNotice({
        type: "error",
        title: "Không thể tạo nhóm",
        message: error.response?.data?.message || "Tạo nhóm thất bại! Vui lòng kiểm tra lại.",
      });
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
                    placeholder="VD: SE-G01"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Học kỳ *
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  >
                    {semesters.map((sem, idx) => {
                      const semCode = sem.code || sem;
                      return (
                        <option key={idx} value={semCode}>
                          {semCode}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-[#2C2825] uppercase">
                  Chọn môn học & Ngành học *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjectScopes.map((sub, idx) => (
                    <option key={idx} value={sub.subjectId}>
                      {sub.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#6B635B] italic">
                  * Nhóm sẽ được tạo trực thuộc môn học và phạm vi ngành đã chọn.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black tracking-wider uppercase rounded-xl shadow-md transition-all flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
              >
                <span>
                  {loading ? "Đang xử lý..." : "Xác nhận tạo nhóm trong môn học"}
                </span>
                <span className="text-[10px] font-normal normal-case opacity-90">
                  (Bạn sẽ trở thành Trưởng nhóm chính thức)
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
                <li>Quy mô nhóm hợp lệ: từ 3 đến 5 thành viên chính thức.</li>
                <li>Mỗi sinh viên chỉ thuộc một nhóm chính thức tại một thời điểm trong môn học.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-black text-[#2C2825]">{notice.title}</h3>
              <button type="button" onClick={() => setNotice(null)} className="text-2xl leading-none text-[#6B635B] hover:text-black">×</button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6B635B]">{notice.message}</p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setNotice(null)} className="rounded-xl bg-[#E65100] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D84315]">OK</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}