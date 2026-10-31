import React, { useState, useEffect, useCallback } from "react";
import {
  getGroupById,
  inviteToGroup,
  removeGroupMember,
  offerLeaderTransfer,
  getMyLeaderTransfers,
  acceptLeaderTransfer,
  declineLeaderTransfer,
  cancelLeaderTransfer,
} from "../../services/groupService";

export default function MemberGroup({
  groupId,
  isLeader,
  currentUserId,
  onGroupUpdated,
}) {
  const [groupData, setGroupData] = useState(null);
  const [memberInput, setMemberInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderTransfers, setLeaderTransfers] = useState([]);

  const [dialog, setDialog] = useState(null);
  const [processing, setProcessing] = useState(false);

  const checkIfLeader = (member) => {
    return Boolean(
      member?.isLeader ||
      member?.leader ||
      member?.role === "LEADER" ||
      member?.userId === groupData?.leaderId ||
      member?.id === groupData?.leaderId,
    );
  };

  const showNotice = (message, type = "success") => {
    setDialog({
      title: type === "success" ? "Thành công" : "Có lỗi xảy ra",
      message,
      type,
      confirmText: "Đã hiểu",
      action: null,
    });
  };

  const showConfirm = ({
    title,
    message,
    confirmText,
    action,
    danger = false,
  }) => {
    setDialog({
      title,
      message,
      confirmText,
      action,
      danger,
    });
  };

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) return;

    try {
      const [groupRes, transfersRes] = await Promise.all([
        getGroupById(groupId),
        getMyLeaderTransfers().catch(() => []),
      ]);

      setGroupData(groupRes);

      const transferList = Array.isArray(transfersRes)
        ? transfersRes
        : transfersRes?.content || [];
      setLeaderTransfers(
        transferList.filter(
          (item) =>
            item.status === "PENDING" &&
            String(item.groupId) === String(groupId),
        ),
      );
    } catch (err) {
      console.error("Lỗi lấy thông tin nhóm hoặc transfer:", err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const membersList = groupData?.members || [];

  const handleInviteMember = async (e) => {
    e.preventDefault();

    if (!isLeader) {
      showNotice("Chỉ có Trưởng nhóm mới có quyền mời sinh viên!", "error");
      return;
    }

    if (loading || !groupId || !memberInput.trim()) return;

    if (membersList.length >= 5) {
      showNotice(
        "Nhóm đã đạt số lượng thành viên tối đa (5 thành viên). Không thể thêm mới!",
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      await inviteToGroup(groupId, {
        studentCode: memberInput.trim().toUpperCase(),
      });

      setMemberInput("");
      showNotice(
        "Đã gửi lời mời thành công. Sinh viên cần xác nhận để tham gia nhóm.",
      );
      await fetchGroupDetails();
      if (onGroupUpdated) await onGroupUpdated();
    } catch (err) {
      console.error("Lỗi gửi lời mời:", err);
      showNotice(
        err.response?.data?.message ||
          "Gửi lời mời thất bại. Vui lòng kiểm tra lại mã số sinh viên.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    if (!isLeader) {
      showNotice("Chỉ có Trưởng nhóm mới có quyền xóa thành viên!", "error");
      return;
    }

    showConfirm({
      title: "Xác nhận xóa thành viên",
      message: "Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm không?",
      confirmText: "Xóa thành viên",
      danger: true,
      action: async () => {
        await removeGroupMember(groupId, memberId);
        await fetchGroupDetails();

        if (onGroupUpdated) {
          await onGroupUpdated();
        }

        showNotice("Đã xóa thành viên thành công!");
      },
    });
  };

  const handleOfferLeaderTransfer = (member) => {
    if (!isLeader) {
      showNotice("Chỉ có Trưởng nhóm mới có quyền bàn giao vai trò!", "error");
      return;
    }

    const targetUserId = member.userId || member.profile?.userId || member.id;
    const memberName =
      member.userFullName ||
      member.fullName ||
      member.profile?.fullName ||
      "thành viên này";

    if (!targetUserId) {
      showNotice("Không tìm thấy mã định danh của thành viên này.", "error");
      return;
    }

    showConfirm({
      title: "Xác nhận bàn giao quyền Trưởng nhóm",
      message: `Bạn có chắc chắn muốn gửi đề xuất chuyển giao vai trò Trưởng nhóm cho ${memberName} không?`,
      confirmText: "Xác nhận bàn giao",
      danger: false,
      action: async () => {
        await offerLeaderTransfer(groupId, targetUserId);
        await fetchGroupDetails();

        if (onGroupUpdated) {
          await onGroupUpdated();
        }

        showNotice(
          `Đã gửi yêu cầu bàn giao quyền Trưởng nhóm cho ${memberName} thành công! Đang chờ thành viên xác nhận.`,
        );
      },
    });
  };

  const handleAcceptTransfer = async (transferId) => {
    try {
      await acceptLeaderTransfer(transferId);
      showNotice("Đã nhận quyền Trưởng nhóm thành công!");
      await fetchGroupDetails();
      if (onGroupUpdated) await onGroupUpdated();
      window.location.reload();
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Không thể chấp nhận bàn giao quyền.",
        "error",
      );
    }
  };

  const handleDeclineTransfer = async (transferId) => {
    try {
      await declineLeaderTransfer(transferId);
      showNotice("Đã từ chối nhận quyền Trưởng nhóm.");
      await fetchGroupDetails();
    } catch (err) {
      showNotice(err.response?.data?.message || "Thực hiện thất bại.", "error");
    }
  };

  const handleCancelTransfer = async (transferId) => {
    try {
      await cancelLeaderTransfer(transferId);
      showNotice("Đã hủy đề xuất bàn giao quyền Trưởng nhóm.");
      await fetchGroupDetails();
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Không thể hủy đề xuất.",
        "error",
      );
    }
  };

  const memberCount = membersList.length;
  const isValidSize = memberCount >= 3 && memberCount <= 5;

  return (
    <div className="space-y-6 font-sans text-[#2C2825]">
      {/* 👑 KHU VỰC HIỂN THỊ YÊU CẦU BÀN GIAO TRƯỞNG NHÓM */}
      {leaderTransfers.length > 0 && (
        <div className="bg-orange-50/80 p-6 rounded-3xl border border-orange-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#E65100] font-black text-xs uppercase">
            <span>👑</span>
            <span>Yêu cầu chuyển giao quyền Trưởng nhóm đang chờ xử lý</span>
          </div>

          <div className="space-y-2">
            {leaderTransfers.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-orange-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <p className="font-black text-[#2C2825]">
                      {item.fromName
                        ? `Trưởng nhóm ${item.fromName} muốn bàn giao quyền Trưởng nhóm cho bạn.`
                        : "Có yêu cầu bàn giao quyền Trưởng nhóm trong nhóm."}
                    </p>
                    <p className="text-[11px] text-[#6B635B] mt-0.5">
                      Mã nhóm: {groupData?.groupCode || groupData?.code}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {isLeader ? (
                      <button
                        onClick={() => handleCancelTransfer(item.id)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer"
                      >
                        Hủy đề xuất
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcceptTransfer(item.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
                        >
                          Chấp nhận làm Trưởng nhóm
                        </button>
                        <button
                          onClick={() => handleDeclineTransfer(item.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[#2C2825]">
            Thành viên nhóm ({memberCount}/5 người)
          </h2>
          <p className="text-xs text-[#6B635B] mt-1">
            Quy mô nhóm hợp lệ theo quy định: từ 3 đến 5 thành viên chính thức.
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
            {isValidSize ? "✓ Sĩ số hợp lệ" : "⚠️ Cần đạt từ 3–5 thành viên"}
          </span>
        </div>
      </div>

      {/* {isLeader && (
        <form
          onSubmit={handleInviteMember}
          className="bg-white p-6 rounded-3xl border border-[#E8E2D9] space-y-3 shadow-sm"
        >
          <label
            htmlFor="member-invite-code"
            className="block text-xs font-bold uppercase text-[#6B635B]"
          >
            Mời sinh viên tham gia bằng Mã số sinh viên
          </label>
          <div className="flex gap-3 flex-wrap">
            <input
              id="member-invite-code"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              required
              disabled={loading}
              placeholder="Nhập mã số sinh viên..."
              className="border border-[#E8E2D9] bg-[#FBF9F5] rounded-xl px-4 py-2.5 text-xs flex-1 outline-none focus:border-[#E65100]"
            />
            <button
              type="submit"
              disabled={
                loading || !groupId || !memberInput.trim() || memberCount >= 5
              }
              className="bg-[#E65100] text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md hover:bg-[#D84315] disabled:opacity-50 cursor-pointer transition"
            >
              {loading ? "Đang gửi..." : "Gửi lời mời"}
            </button>
          </div>
          <p className="text-xs text-[#6B635B]">
            Sinh viên sẽ chính thức được tính vào sĩ số sau khi chấp nhận lời
            mời tham gia nhóm.
          </p>
        </form>
      )} */}

      {/* DANH SÁCH */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] space-y-6 shadow-sm">
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
              Mã nhóm
            </p>
            <h4 className="text-sm font-black text-[#2C2825] mt-0.5">
              {groupData?.groupCode || groupData?.code || "Đang tải..."}
            </h4>
          </div>

          <button
            type="button"
            onClick={async () => {
              const codeToCopy = groupData?.groupCode || groupData?.code;
              if (!codeToCopy) return;

              try {
                await navigator.clipboard.writeText(codeToCopy);
                showNotice("Đã sao chép mã nhóm thành công!");
              } catch {
                showNotice(
                  "Không thể sao chép mã nhóm. Vui lòng thử lại.",
                  "error",
                );
              }
            }}
            className="px-3.5 py-1.5 bg-white border border-orange-200 text-xs font-bold rounded-xl text-[#E65100] shadow-xs hover:bg-orange-50 transition cursor-pointer"
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
            <span className="text-[10px] text-[#9E958C]">
              Cập nhật trực tiếp
            </span>
          </div>

          {membersList.length > 0 ? (
            membersList.map((m) => {
              const isMemberLeader = checkIfLeader(m);
              const memberId = m.id || m.userId || m.profile?.userId;

              return (
                <div
                  key={memberId}
                  className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] flex justify-between items-center text-xs"
                >
                  <div>
                    <h4 className="font-black text-[#2C2825]">
                      {m.userFullName ||
                        m.fullName ||
                        m.profile?.fullName ||
                        "Thành viên"}
                    </h4>
                    <p className="text-[11px] text-[#815b35] mt-1.5 font-bold">
                      Mã số sinh viên:{" "}
                      {m.studentCode ||
                        m.userStudentCode ||
                        m.profile?.studentCode ||
                        m.email ||
                        m.userEmail ||
                        m.profile?.email ||
                        memberId}
                    </p>

                    <p className="text-[11px] text-[#815b35] mt-1.5 font-bold">
                      Thư điện tử:{" "}
                      <em className="text-[#b64f01] font-medium">
                        {m.email ||
                          m.userEmail ||
                          m.profile?.email ||
                          "Chưa cập nhật"}
                      </em>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-full ${
                        isMemberLeader
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isMemberLeader ? "👑 Trưởng nhóm" : "👤 Thành viên"}
                    </span>

                    {isLeader && !isMemberLeader && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOfferLeaderTransfer(m)}
                          className="text-[#E65100] font-bold text-xs hover:underline bg-orange-50 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Bổ nhiệm Trưởng nhóm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberId)}
                          className="text-red-600 font-bold text-xs hover:underline bg-red-50 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-center text-[#6B635B] py-4 italic">
              Hiện chưa có thành viên nào trong nhóm.
            </p>
          )}
        </div>

        {dialog && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E8E2D9]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-black text-[#2C2825]">
                  {dialog.title}
                </h3>
                <button
                  type="button"
                  aria-label="Đóng"
                  disabled={processing}
                  onClick={() => setDialog(null)}
                  className="text-2xl leading-none text-[#6B635B] hover:text-black cursor-pointer"
                >
                  ×
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#6B635B]">
                {dialog.message}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                {dialog.action && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setDialog(null)}
                    className="rounded-xl border border-[#E8E2D9] px-5 py-2.5 text-sm font-bold text-[#6B635B] hover:bg-[#F8F6F0] cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                )}

                <button
                  type="button"
                  disabled={processing}
                  onClick={async () => {
                    if (!dialog.action) {
                      setDialog(null);
                      return;
                    }

                    setProcessing(true);

                    try {
                      const action = dialog.action;
                      setDialog(null);
                      await action();
                    } catch (err) {
                      showNotice(
                        err.response?.data?.message ||
                          err.message ||
                          "Thao tác thất bại. Vui lòng thử lại.",
                        "error",
                      );
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer ${
                    dialog.danger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#E65100] hover:bg-[#D84315]"
                  }`}
                >
                  {processing
                    ? "Đang xử lý..."
                    : dialog.confirmText || "Đã hiểu"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
