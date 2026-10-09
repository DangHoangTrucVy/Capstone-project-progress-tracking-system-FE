import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";

export default function NotificationBell() {
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
    loadNotifications();

    // Cập nhật định kỳ nếu chưa kết nối SSE.
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
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
        return "📩";
      case "LEADER_CHANGED":
        return "👑";
      default:
        return "🔔";
    }
  };

  const getNotificationLabel = (type) => {
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
        return "Không đủ điều kiện";
      case "LEADER_CHANGE_REQUESTED":
        return "Đơn xin rời chức vụ Leader";
      case "LEADER_CHANGED":
        return "Thay đổi Leader";
      default:
        return "Thông báo";
    }
  };

  const isRead = (item) =>
    item.readAt != null || item.read === true || item.isRead === true;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) loadNotifications();
        }}
        aria-label="Thông báo"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full
                   border border-[#E8E2D9] bg-white text-[#2C2825]
                   transition hover:bg-orange-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
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
                       px-1 text-[10px] font-bold text-white"
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

          <div
            className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-24px))]
                       overflow-hidden rounded-2xl border border-[#E8E2D9]
                       bg-white shadow-xl"
          >
            <div
              className="flex items-center justify-between border-b
                            border-[#F0EBE1] px-4 py-3"
            >
              <div>
                <h3 className="font-bold text-[#2C2825]">Thông báo</h3>
                <p className="text-xs text-[#6B635B]">
                  {unreadCount} thông báo chưa đọc
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="text-xs font-semibold text-[#E65100]
                           hover:underline disabled:opacity-40"
              >
                Đọc tất cả
              </button>
            </div>

            {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

            <div className="max-h-150 overflow-y-auto">
              {loading ? (
                <p className="p-5 text-center text-sm text-gray-500">
                  Đang tải thông báo...
                </p>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="mb-2 text-3xl">🔔</div>
                  <p className="text-sm font-semibold text-[#2C2825]">
                    Chưa có thông báo
                  </p>
                  <p className="mt-1 text-xs text-[#6B635B]">
                    Các cập nhật mới sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className={`border-b border-[#F5F1EA] px-4 py-3
                      ${isRead(item) ? "bg-white" : "bg-orange-50/70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden="true">
                        {getNotificationIcon(item.type)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#E65100]">
                          {getNotificationLabel(item.type)}
                        </p>

                        <p className="mt-1 warp-break-words text-sm text-[#2C2825]">
                          {getMessage(item)}
                        </p>

                        {item.createdAt && (
                          <p className="mt-1 text-xs text-[#8A8178]">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        )}

                        {!isRead(item) && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(item)}
                            className="mt-2 text-xs font-semibold text-[#E65100] hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#F0EBE1] px-4 py-3">
              <button
                type="button"
                onClick={loadNotifications}
                className="w-full rounded-lg bg-[#FBF9F5] py-2
                           text-xs font-semibold text-[#6B635B]
                           hover:bg-orange-50"
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
