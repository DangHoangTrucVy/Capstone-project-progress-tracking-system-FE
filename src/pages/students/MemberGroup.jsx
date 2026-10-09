import React, { useState, useEffect, useCallback } from "react";
import {
  getGroupById,
  addGroupMember,
  removeGroupMember,
} from "../../services/groupService";
import { getIneligibleStudents } from "../../services/eligibilityService";

export default function MemberGroup({
  groupId,
  isLeader,
  onGroupUpdated,
}) {
  const [groupData, setGroupData] = useState(null);
  const [memberInput, setMemberInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ineligibleStudents, setIneligibleStudents] = useState([]);

  // =====================================================
  // LẤY GROUP + DANH SÁCH SINH VIÊN KHÔNG ĐỦ ĐIỀU KIỆN
  // =====================================================
  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) return;

    try {
      const [groupRes, ineligibleRes] = await Promise.all([
        getGroupById(groupId),
        getIneligibleStudents().catch(() => []),
      ]);

      const ineligibleList =
        ineligibleRes?.content ||
        ineligibleRes?.items ||
        ineligibleRes ||
        [];

      setIneligibleStudents(
        Array.isArray(ineligibleList) ? ineligibleList : []
      );

      setGroupData(groupRes);
    } catch (err) {
      console.error("Lỗi lấy thông tin nhóm:", err);
    }
  }, [groupId]);

  // =====================================================
  // LOAD LẦN ĐẦU + TỰ ĐỘNG KIỂM TRA LẠI
  // =====================================================
  useEffect(() => {
    fetchGroupDetails();

    // Cứ 5 giây kiểm tra lại.
    // Admin đánh dấu không đủ điều kiện ở máy khác
    // thì Leader sẽ tự thấy danh sách cập nhật.
    const interval = setInterval(() => {
      fetchGroupDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGroupDetails]);

  // =====================================================
  // KIỂM TRA MEMBER CÓ BỊ ĐÁNH DẤU INELIGIBLE KHÔNG
  // =====================================================
  const isMemberIneligible = (member) => {
    const memberId =
      member?.userId ||
      member?.studentId ||
      member?.id;

    const memberEmail = (
      member?.userEmail ||
      member?.email ||
      ""
    ).toLowerCase();

    const memberStudentCode = String(
      member?.studentCode ||
      member?.userStudentCode ||
      ""
    ).toLowerCase();

    return ineligibleStudents.some((student) => {
      const studentId =
        student?.userId ||
        student?.studentId ||
        student?.id;

      const studentEmail = (
        student?.email ||
        student?.userEmail ||
        ""
      ).toLowerCase();

      const studentCode = String(
        student?.studentCode ||
        student?.userStudentCode ||
        ""
      ).toLowerCase();

      return (
        (memberId &&
          studentId &&
          String(memberId) === String(studentId)) ||
        (memberEmail &&
          studentEmail &&
          memberEmail === studentEmail) ||
        (memberStudentCode &&
          studentCode &&
          memberStudentCode === studentCode)
      );
    });
  };

  // =====================================================
  // CHỈ HIỂN THỊ MEMBER ĐỦ ĐIỀU KIỆN
  // =====================================================
  const activeMembers = (groupData?.members || []).filter(
    (member) => !isMemberIneligible(member)
  );

  // =====================================================
  // THÊM MEMBER
  // =====================================================
  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!isLeader) {
      alert("Chỉ có Trưởng nhóm mới có quyền thêm thành viên!");
      return;
    }

    if (!memberInput.trim()) return;

    if (activeMembers.length >= 5) {
      alert(
        "Nhóm đã đạt số lượng tối đa (5 thành viên). Không thể thêm mới!"
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        studentCode: memberInput.trim(),
        isLeader: false,
      };

      await addGroupMember(groupId, payload);

      setMemberInput("");

      await fetchGroupDetails();

      if (onGroupUpdated) {
        await onGroupUpdated();
      }

      alert("Thêm thành viên thành công!");
    } catch (err) {
      console.error("Lỗi thêm thành viên:", err);

      alert(
        err.response?.data?.message ||
          "Thêm thành viên thất bại. Vui lòng kiểm tra lại MSSV."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // XÓA MEMBER
  // =====================================================
  const handleRemoveMember = async (memberId) => {
    if (!isLeader) {
      alert("Chỉ có Trưởng nhóm mới có quyền xóa thành viên!");
      return;
    }

    if (
      !window.confirm(
        "Bạn có chắc muốn xóa thành viên này khỏi nhóm?"
      )
    ) {
      return;
    }

    try {
      await removeGroupMember(groupId, memberId);

      await fetchGroupDetails();

      if (onGroupUpdated) {
        await onGroupUpdated();
      }

      alert("Đã xóa thành viên thành công!");
    } catch (err) {
      console.error("Lỗi xóa thành viên:", err);
      alert(
        err.response?.data?.message ||
          "Xóa thành viên thất bại."
      );
    }
  };

  // =====================================================
  // COUNT
  // =====================================================
  const memberCount = activeMembers.length;

  const isValidSize =
    memberCount >= 3 && memberCount <= 5;

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[#2C2825]">
            Thành viên nhóm ({memberCount}/5 người)
          </h2>

          <p className="text-xs text-[#6B635B] mt-1">
            Yêu cầu quy mô nhóm hợp lệ: từ 3 đến 5 thành viên chính thức.
          </p>
        </div>

        <div>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              isValidSize
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isValidSize
              ? "✓ Sĩ số hợp lệ"
              : "⚠️ Cần từ 3–5 thành viên"}
          </span>
        </div>
      </div>

      {/* DANH SÁCH */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] space-y-6 shadow-sm">

        {/* GROUP CODE */}
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-orange-600 uppercase">
              Mã nhóm
            </p>

            <h4 className="text-sm font-black text-[#2C2825]">
              {groupData?.groupCode || "Đang tải..."}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!groupData?.groupCode) return;

              navigator.clipboard.writeText(
                groupData.groupCode
              );

              alert("Đã sao chép mã nhóm!");
            }}
            className="px-3 py-1.5 bg-white border border-orange-200 text-xs font-bold rounded-xl text-[#E65100] shadow-xs hover:bg-orange-50 transition cursor-pointer"
          >
            Sao chép mã
          </button>
        </div>

        {/* MEMBERS */}
        <div className="space-y-3">

          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-[#6B635B]">
              Danh sách thành viên hiện tại
            </h3>

            <span className="text-[10px] text-gray-400">
              Tự động cập nhật
            </span>
          </div>

          {activeMembers.length > 0 ? (
            activeMembers.map((m) => (
              <div
                key={m.id || m.userId}
                className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#2C2825]">
                    {m.userFullName ||
                      m.fullName ||
                      "Thành viên"}
                  </h4>

                  <p className="text-[10px] text-[#6B635B]">
                    {m.userEmail ||
                      m.email ||
                      m.userId}
                  </p>
                </div>

                <div className="flex items-center space-x-3">

                  <span
                    className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                      m.isLeader
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.isLeader
                      ? "👑 Trưởng nhóm "
                      : "👤 Thành viên"}
                  </span>

                  {isLeader && !m.isLeader && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveMember(
                          m.id || m.userId
                        )
                      }
                      className="text-red-500 font-bold text-xs hover:underline bg-red-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}

                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-center text-[#6B635B] py-4">
              Chưa có thành viên nào trong nhóm.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}