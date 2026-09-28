import React, { useState, useEffect } from "react";
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "../../services/notificationService";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const normalizeNotifications = (response) => {
    const payload = response?.data ?? response;
    const items = Array.isArray(payload)
      ? payload
      : payload?.content ?? payload?.items ?? payload?.results ?? [];
    return Array.isArray(items) ? items : [];
  };

  const normalizeUnreadCount = (response) => {
    const payload = response?.data ?? response;
    const count =
      payload?.count ?? payload?.unreadCount ?? payload?.totalUnread ?? payload;
    const parsedCount = Number(count);
    return Number.isFinite(parsedCount) ? parsedCount : 0;
  };

  const isNotificationRead = (item) =>
    Boolean(item.isRead ?? item.read ?? item.status === "READ");

  const fetchNotificationData = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications().catch(() => []),
        getUnreadNotificationCount().catch(() => ({ count: 0 }))
      ]);
      setNotifications(normalizeNotifications(notifsRes));
      setUnreadCount(normalizeUnreadCount(countRes));
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotificationData();
    } catch (err) {
      console.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      alert("Đã đánh dấu tất cả là đã đọc!");
      fetchNotificationData();
    } catch (err) {
      alert("Không thể thực hiện thao tác này.");
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black">Trung tâm Thông báo</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-extrabold rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B635B]">
            Cập nhật các tin tức, lịch hẹn và đánh giá mới nhất từ giảng viên và hệ thống.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          ✓ Đọc tất cả
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="divide-y divide-[#E8E2D9]">
          {loading ? (
            <p className="text-xs text-[#6B635B] py-4">Đang tải thông báo...</p>
          ) : notifications.length > 0 ? (
            notifications.map((item) => (
              <div 
                key={item.id} 
                className={`py-4 flex justify-between items-center text-xs transition ${isNotificationRead(item) ? "opacity-60" : "bg-orange-50/20 px-3 rounded-xl"}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#2C2825] text-sm">🔔 {item.title || "Thông báo hệ thống"}</span>
                    {!isNotificationRead(item) && <span className="w-2 h-2 bg-[#E65100] rounded-full"></span>}
                  </div>
                  <p className="text-[#6B635B]">{item.message || item.content}</p>
                  <span className="text-[10px] text-[#9E958C]">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                  </span>
                </div>
                {!isNotificationRead(item) && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="px-3 py-1.5 bg-[#E65100] text-white font-bold rounded-xl text-[10px] cursor-pointer"
                  >
                    Đã đọc
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#6B635B] italic py-4">Không có thông báo nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}