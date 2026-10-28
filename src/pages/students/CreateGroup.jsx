import React, { useState, useEffect } from "react";
import {
  createGroupInSubject,
  getSubjectsBySemester,
} from "../../services/groupService";
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";

export default function CreateGroup({ onGroupCreated }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [wantedSkills, setWantedSkills] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterDeadline, setSemesterDeadline] = useState(""); // Thêm state lưu deadline theo học kỳ
  const [subjectScopes, setSubjectScopes] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Danh sách gợi ý kỹ năng nhanh (UI state phụ trợ cho đẹp mắt)
  const [skillTags, setSkillTags] = useState(["ReactJS", "NodeJS / Express", "Spring Boot", "UI/UX (Figma)"]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const userRes = await getCurrentUser();
        setCurrentUser(userRes);

        const semRes = await api.get("/semesters").catch(() => ({ data: [] }));
        const semList = Array.isArray(semRes.data)
          ? semRes.data
          : semRes.data?.content || [];
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

  // Lấy thông tin chi tiết học kỳ (bao gồm defaultDeadline) mỗi khi selectedSemester thay đổi
  useEffect(() => {
    if (selectedSemester) {
      const fetchSemesterDetails = async () => {
        try {
          const res = await api.get(`/semesters/${selectedSemester}`).catch(() => null);
          const semData = res?.data;
          if (semData && semData.defaultDeadline) {
            // Format ngày tháng hiển thị đẹp hơn nếu cần (VD: DD/MM/YYYY)
            const rawDate = new Date(semData.defaultDeadline);
            const formattedDate = !isNaN(rawDate.getTime()) 
              ? rawDate.toLocaleDateString("vi-VN") 
              : semData.defaultDeadline;
            setSemesterDeadline(formattedDate);
          } else {
            setSemesterDeadline("");
          }
        } catch (err) {
          console.error("Không thể tải thông tin học kỳ:", err);
          setSemesterDeadline("");
        }
      };
      fetchSemesterDetails();
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedSemester) {
      const fetchSubjects = async () => {
        try {
          const res = await getSubjectsBySemester(selectedSemester).catch(
            () => [],
          );
          const dataList = Array.isArray(res)
            ? res
            : res?.content || res?.data || [];

          const flattenedOptions = [];
          dataList.forEach((subject) => {
            const subjectId = subject.id;
            const subjectName = subject.name || subject.code;

            if (
              subject.scopes &&
              Array.isArray(subject.scopes) &&
              subject.scopes.length > 0
            ) {
              subject.scopes.forEach((scope) => {
                flattenedOptions.push({
                  subjectId: subjectId,
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

  // Đồng bộ kỹ năng vào state wantedSkills
  useEffect(() => {
    setWantedSkills(skillTags.join(", "));
  }, [skillTags]);

  const handleAddSkill = (skill) => {
    if (skill && !skillTags.includes(skill)) {
      setSkillTags([...skillTags, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillTags(skillTags.filter((s) => s !== skillToRemove));
  };

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
        name: groupName.trim() || groupCode.trim(),
        groupCode: groupCode.trim(),
        wantedSkills: wantedSkills.trim() || "Chung",
      };

      const response = await createGroupInSubject(
        selectedSubjectId,
        groupPayload,
      );
      const createdGroupId = response?.id || response?.data?.id;

      if (createdGroupId) {
        localStorage.setItem("groupId", createdGroupId);
      }

      setNotice({
        type: "success",
        title: "Tạo nhóm thành công",
        message: "Bạn đã trở thành Trưởng nhóm chính thức trong môn học.",
      });

      if (onGroupCreated && createdGroupId) {
        await onGroupCreated(createdGroupId);
      }
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      const errRes = error.response?.data;
      const errorMsg = errRes?.message || "";

      let displayMessage = "Tạo nhóm thất bại! Vui lòng kiểm tra lại.";
      if (
        errorMsg.includes("deadline has passed") ||
        errorMsg.includes("Moderator now arranges")
      ) {
        displayMessage = "Đã quá hạn tạo nhóm ! Giảng viên hướng dẫn sẽ sắp xếp các nhóm cho bạn.";
      } else if (errorMsg) {
        displayMessage = errorMsg;
      }

      if (
        error.response?.status === 409 ||
        errRes?.errorCode === "ALREADY_IN_GROUP"
      ) {
        try {
          const res = await api
            .get(`/subjects/${selectedSubjectId}/groups`)
            .catch(() => api.get(`/subjects/${selectedSubjectId}/open-groups`));
          const groupsList = Array.isArray(res.data)
            ? res.data
            : res.data?.content || [];

          const myExistingGroup = groupsList.find(
            (g) =>
              g.leaderId === currentUser?.id ||
              (g.members &&
                g.members.some(
                  (m) => String(m.userId || m.id) === String(currentUser?.id),
                )),
          );

          if (myExistingGroup && myExistingGroup.id) {
            localStorage.setItem("groupId", myExistingGroup.id);

            setNotice({
              type: "success",
              title: "Khôi phục phiên Leader thành công",
              message:
                "Hệ thống đã nhận diện nhóm của bạn. Đang vào trang quản lý...",
            });

            setTimeout(async () => {
              if (onGroupCreated) {
                await onGroupCreated(myExistingGroup.id);
              } else {
                window.location.reload();
              }
            }, 800);
            return;
          }
        } catch (findErr) {
          console.error("Không thể tự động dò tìm nhóm:", findErr);
        }
      }

      setNotice({
        type: "error",
        title: "Không thể tạo nhóm",
        message: displayMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyLeader = ["LEADER", "GROUP_LEADER"].includes(
    currentUser?.role,
  );

  return (
    <main className="max-w-7xl mx-auto py-2 px-4 space-y-6 animate-fadeIn font-sans text-[#2C2825]">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {/* CỘT TRÁI: FORM ĐĂNG KÝ THÀNH LẬP NHÓM */}
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
            <div className="space-y-1 pb-4 border-b border-[#E8E2D9]">
              <span className="text-[11px] font-black text-[#E65100] tracking-widest uppercase">
                Khởi tạo Capstone Project
              </span>
              <h1 className="text-xl font-black text-[#2C2825]">
                Đăng ký thành lập nhóm mới
              </h1>
              <p className="text-xs text-[#6B635B] leading-relaxed">
                Điền đầy đủ thông tin bên dưới để khởi tạo nhóm và nhận quyền{" "}
                <strong className="text-[#2C2825]">Trưởng nhóm chính thức</strong>.
              </p>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <span className="text-base">⚠️</span>
              <div className="space-y-0.5">
                <p className="font-black">Lưu ý quan trọng:</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Sinh viên tạo nhóm sẽ tự động trở thành <strong>Trưởng nhóm</strong> và chịu trách nhiệm duyệt thành viên tham gia, chốt đề tài và nộp báo cáo đồ án cho Hội đồng bộ môn.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-[#2C2825] uppercase">
                      Mã nhóm *
                    </label>
                  </div>
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="VD: SE-G01"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-bold"
                  />
                  <p className="text-[10px] text-[#6B635B]">Định dạng chuẩn: [Kỳ]-[Ngành]-[Số nhóm]</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Tên nhóm dự án *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="VD: Nhóm 01 - SmartCampus AI"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-bold"
                  />
                  <p className="text-[10px] text-[#6B635B]">Tên nhóm nhận diện công khai trên sàn ghép đôi</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Học kỳ áp dụng *
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-bold text-[#E65100] cursor-pointer"
                  >
                    {semesters.map((sem, idx) => {
                      const semCode = sem.code || sem;
                      return (
                        <option key={idx} value={semCode}>
                          Học kỳ {semCode}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#2C2825] uppercase">
                    Chọn môn học & Ngành học *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100] font-bold text-[#2C2825] cursor-pointer"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjectScopes.map((sub, idx) => (
                      <option key={idx} value={sub.subjectId}>
                        {sub.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kỹ năng & Công nghệ cần tuyển */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#2C2825] uppercase">
                  Kỹ năng & Công nghệ cần tuyển
                </label>
                <div className="p-3 bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {skillTags.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-[#E65100] text-xs font-bold rounded-xl border border-orange-200 shadow-2xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-600 font-black ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customSkillInput.trim()) {
                        e.preventDefault();
                        handleAddSkill(customSkillInput.trim());
                        setCustomSkillInput("");
                      }
                    }}
                    placeholder="Nhấn Enter hoặc thêm kỹ năng khác (VD: Docker, AWS, Flutter...)"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#E65100]"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#6B635B] font-bold">Gợi ý thêm nhanh:</span>
                    {["+ Next.js", "+ Python/FastAPI", "+ DevOps", "+ Mobile Flutter"].map((suggestion, idx) => {
                      const cleanName = suggestion.replace("+ ", "");
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddSkill(cleanName)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 text-[#6B635B] hover:text-[#E65100] text-[10px] font-bold rounded-lg border border-[#E8E2D9] transition cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cam kết */}
              <div className="flex items-start gap-2 pt-1">
                <input type="checkbox" defaultChecked id="commit" className="mt-0.5 accent-[#E65100] cursor-pointer" />
                <label htmlFor="commit" className="text-[11px] text-[#6B635B] leading-relaxed cursor-pointer">
                  Tôi cam kết thông tin khai báo là chính xác, đồng ý chịu trách nhiệm điều hành nhóm theo đúng <strong className="text-[#2C2825]">Quy chế Đồ án tốt nghiệp</strong> của Nhà trường và Khoa CNTT FPT.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-black tracking-wider uppercase rounded-2xl shadow-md shadow-orange-500/20 transition-all flex flex-col items-center justify-center space-y-0.5 cursor-pointer mt-3"
              >
                <span>
                  {loading
                    ? "Đang xử lý..."
                    : "Xác nhận thành lập nhóm trong môn học"}
                </span>
                <span className="text-[10px] font-normal normal-case opacity-90">
                  (Bạn sẽ chính thức trở thành Trưởng nhóm)
                </span>
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: CÁC KHỐI THÔNG TIN (QUY CHẾ, ĐẶC QUYỀN, TÌM NHÓM) */}
          <div className="space-y-6">
            {/* Quy chế lập nhóm */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-[#E65100] font-black text-xs uppercase">
                <span>💡</span>
                <span>Quy chế lập nhóm Capstone</span>
              </div>
              <p className="text-[10px] text-[#9E958C]">FPT University Rules</p>
              <ul className="space-y-2.5 text-[11px] text-[#6B635B] list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Quy mô nhóm hợp lệ:</strong> Cần tối thiểu 3 đến tối đa 5 thành viên chính thức để được duyệt đề tài.
                </li>
                <li>
                  <strong>Nguyên tắc độc quyền:</strong> Mỗi sinh viên chỉ thuộc một nhóm chính thức duy nhất tại một thời điểm trong môn học.
                </li>
                <li>
                  <strong>Hạn chót khóa danh sách:</strong> Nhóm cần đủ thành viên trước ngày{" "}
                  <strong className="text-[#E65100]">
                    {semesterDeadline || "..."}
                  </strong>{" "}
                  trước khi bộ môn đóng đợt ghép.
                </li>
              </ul>
            </div>

            {/* Đặc quyền trưởng nhóm */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-[#E65100] font-black text-xs uppercase">
                <span>👑</span>
                <span>Đặc quyền trưởng nhóm</span>
              </div>
              <div className="space-y-2 text-[11px] text-[#6B635B]">
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Toàn quyền duyệt hoặc từ chối sinh viên ứng tuyển.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Gửi lời mời trực tiếp thành viên theo Mã số MSSV.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Cộng điểm đóng góp quản trị dự án Capstone (+5%).
                </p>
              </div>
            </div>

            {/* Banner tìm kiếm nhóm */}
            <div className="bg-[#1E1B18] text-white p-6 rounded-3xl shadow-md space-y-3">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Chưa muốn làm Leader?</p>
              <h3 className="text-sm font-black">Tìm kiếm nhóm đang tuyển thành viên</h3>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Khám phá hơn 14 nhóm Capstone đang mở tuyển Frontend, Backend, AI Engineer để gia nhập ngay.
              </p>
              <button 
                type="button"
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-white/20"
              >
                Xem danh sách nhóm đang mở →
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E8E2D9]"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-black text-[#2C2825]">
                {notice.title}
              </h3>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-2xl leading-none text-[#6B635B] hover:text-black cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#6B635B]">
              {notice.message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-xl bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D84315] cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}