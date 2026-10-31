import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";

const isRead = (item) =>
  item.readAt != null || item.read === true || item.isRead === true;

export default function NotificationBell({ onOpenLeaderRequest }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const [listResult, countResult] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      const list =
        listResult?.content ??
        listResult?.data?.content ??
        listResult?.data ??
        listResult;

      const items = Array.isArray(list) ? list : [];
      setNotifications(items);

      const count =
        typeof countResult === "number"
          ? countResult
          : (countResult?.count ??
            countResult?.unreadCount ??
            countResult?.data?.count ??
            countResult?.data?.unreadCount);

      setUnreadCount(
        count !== undefined
          ? Number(count) || 0
          : items.filter((item) => !isRead(item)).length,
      );

      setError("");
    } catch (err) {
      console.error("Load notifications failed:", err);
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(loadNotifications, 0);
    const timer = setInterval(loadNotifications, 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadNotifications]);

  const handleMarkRead = async (notification) => {
    const id = notification.id;
    if (!id) return;

    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể đánh dấu thông báo đã đọc.",
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể đánh dấu tất cả đã đọc.",
      );
    }
  };

  const getMessage = (item) =>
    item.message || item.content || item.title || "Bạn có thông báo mới.";

  const getNotificationIcon = (type) => {
    switch (type) {
      case "MEMBER_JOINED":
        return "👋";
      case "MEMBER_REMOVED":
        return "👤";
      case "LEAVE_REQUESTED":
        return "📩";
      case "LEAVE_DECIDED":
        return "📋";
      case "ELIGIBILITY_CHANGED":
        return "⚠️";
      case "LEADER_CHANGE_REQUESTED":
      case "LEADER_LEAVE_REQUESTED":
        return "📩";
      case "LEADER_CHANGED":
        return "👑";
      default:
        return "🔔";
    }
  };

  const getNotificationLabel = (item) => {
    const type = item.type;
    const message = (
      item.message ||
      item.content ||
      item.title ||
      ""
    ).toLowerCase();

    switch (type) {
      case "MEMBER_JOINED":
        return "Thành viên mới";
      case "MEMBER_REMOVED":
        return "Thay đổi thành viên";
      case "LEAVE_REQUESTED":
        return "Yêu cầu rời nhóm";
      case "LEAVE_DECIDED":
        return "Kết quả yêu cầu";
      case "ELIGIBILITY_CHANGED":
        if (message.includes("không đủ") || message.includes("chưa đủ") || message.includes("ineligible")) {
          return "Không đủ điều kiện";
        }
        return "Đủ điều kiện";
      case "LEADER_CHANGE_REQUESTED":
        return "Yêu cầu chuyển giao quyền Trưởng nhóm";
      case "LEADER_LEAVE_REQUESTED":
        return "Trưởng nhóm xin rời nhóm";
      case "LEADER_CHANGED":
        return "Thay đổi Trưởng nhóm";
      default:
        return "Thông báo";
    }
  };

  return (
    <div className="relative">
      {/* Nút quả chuông */}
      <button
        type="button"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) loadNotifications();
        }}
        aria-label="Thông báo"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl
                   border border-[#E8E2D9] bg-white text-[#2C2825]
                   shadow-2xs transition-all duration-200 hover:bg-orange-50 hover:border-orange-200 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5
                       items-center justify-center rounded-full bg-red-600
                       px-1 text-[10px] font-black text-white shadow-xs animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng thông báo"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup danh sách thông báo */}
          <div
            className="absolute right-0 z-50 mt-3 w-[min(380px,calc(100vw-24px))]
                       overflow-hidden rounded-3xl border border-[#E8E2D9]
                       bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Header popup */}
            <div
              className="flex items-center justify-between border-b
                            border-[#E8E2D9] bg-[#FBF9F5] px-5 py-4"
            >
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#2C2825]">
                  Trung tâm Thông báo
                </h3>
                <p className="text-[11px] font-medium text-[#6B635B] mt-0.5">
                  Bạn có <strong className="text-[#E65100]">{unreadCount}</strong> thông báo chưa đọc
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="px-3 py-1.5 bg-white hover:bg-orange-50 text-[#E65100] border border-[#E8E2D9] text-[11px] font-extrabold rounded-xl transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Đọc tất cả
              </button>
            </div>

            {error && <p className="px-5 py-3 text-xs font-medium text-red-600 bg-red-50">{error}</p>}

            {/* Danh sách items */}
            <div className="max-h-88 overflow-y-auto overscroll-contain divide-y divide-[#E8E2D9]/60">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-[#E65100] border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-xs font-bold text-[#6B635B]">Đang tải thông báo...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-12 text-center space-y-2">
                  <div className="text-3xl">🔔</div>
                  <p className="text-xs font-black text-[#2C2825]">
                    Chưa có thông báo nào
                  </p>
                  <p className="text-[11px] text-[#6B635B]">
                    Các cập nhật mới từ hệ thống sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className={`px-5 py-3.5 transition-all hover:bg-[#FBF9F5]
                      ${isRead(item) ? "bg-white opacity-80" : "bg-orange-50/50"}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center text-base shrink-0 shadow-2xs">
                        {getNotificationIcon(item.type)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#E65100]">
                            {getNotificationLabel(item.type)}
                          </p>
                          {!isRead(item) && (
                            <span className="w-2 h-2 rounded-full bg-[#E65100] shrink-0"></span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-[#2C2825] leading-relaxed wrap-break-words">
                          {getMessage(item)}
                        </p>
                        
                        {item.details && (
                          <p className="text-[11px] text-[#6B635B] bg-white p-2 rounded-xl border border-[#E8E2D9]">
                            Chi tiết: {item.details}
                          </p>
                        )}

                        {item.type === "LEADER_LEAVE_REQUESTED" &&
                          onOpenLeaderRequest && (
                            <button
                              type="button"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-[#E65100] hover:underline cursor-pointer"
                              onClick={() => {
                                onOpenLeaderRequest(item.entityId);
                                setIsOpen(false);
                                if (!isRead(item)) handleMarkRead(item);
                              }}
                            >
                              Xem yêu cầu rời nhóm →
                            </button>
                          )}

                        <div className="flex items-center justify-between pt-1">
                          {item.createdAt && (
                            <span className="text-[10px] font-medium text-[#8A8178]">
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                            </span>
                          )}

                          {!isRead(item) && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(item)}
                              className="text-[10px] font-extrabold text-[#E65100] hover:underline cursor-pointer ml-auto"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer popup */}
            <div className="border-t border-[#E8E2D9] bg-[#FBF9F5] p-3">
              <button
                type="button"
                onClick={loadNotifications}
                className="w-full rounded-xl bg-white border border-[#E8E2D9] py-2
                           text-xs font-extrabold text-[#6B635B]
                           hover:bg-orange-50 hover:text-[#E65100] transition cursor-pointer shadow-2xs"
              >
                Làm mới thông báo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}