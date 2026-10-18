
import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

const cardClass =
  "rounded-2xl border border-[#E8E2D9] bg-white shadow-sm";

const roleLabels = {
  ADMIN: "Quản trị viên",
  STUDENT: "Sinh viên",
  GROUP_LEADER: "Nhóm trưởng",
  LEADER: "Nhóm trưởng",
  RESCUE_COORDINATOR: "Điều phối viên",
  MANAGER: "Quản lý",
};

function InfoField({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#F0E7DE] bg-[#FBF9F5] p-4 transition hover:border-[#F3B58C] hover:bg-[#FFF9F3] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FCEBDD] text-base text-[#E65100]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#8A7768]">
            {label}
          </p>
          <p className="mt-2 wrap-break-words text-sm font-bold leading-6 text-[#2C2825]">
            {value || "Chưa cập nhật"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (mounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Lỗi tải thông tin cá nhân:", err);

        if (mounted) {
          setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, []);

  const getInitials = (name) => {
    if (!name?.trim()) return "SV";

    const words = name.trim().split(/\s+/);

    return words.length > 1
      ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  };

  const role = String(user?.role || "STUDENT").toUpperCase();
  const status = String(user?.status || "ACTIVE").toUpperCase();
  const isActive = ["ACTIVE", "ENABLED"].includes(status);
  const displayRole = roleLabels[role] || role;

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="rounded-2xl border border-[#E8E2D9] bg-white px-8 py-6 text-sm font-semibold text-[#8A7768] shadow-sm">
          <span className="mr-2 inline-block animate-spin">◌</span>
          Đang tải thông tin hồ sơ...
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-full w-full bg-[#FBF9F5] font-sans text-[#2C2825] ">
      <div className="mx-auto w-full max-w-none space-y-6">

        {/* Page heading */}
        <section className={`${cardClass} relative overflow-hidden p-6 md:p-8`}>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-[#E65100] via-[#F3B58C] to-transparent" />

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FCEBDD] text-2xl text-[#E65100]">
              ♙
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C94A08]">
                Tài khoản của tôi
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Hồ sơ cá nhân
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#786B61]">
                Thông tin định danh và vai trò trong hệ thống MatchPoint FPT.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Main profile layout */}
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.5fr)]">

          {/* Left: profile identity */}
          <aside className={`${cardClass} relative flex h-full min-w-0 flex-col overflow-hidden`}>
            <div className="h-2 w-full bg-linear-to-r from-[#E65100] via-[#F3B58C] to-[#FCEBDD]" />

            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-[#FFE0C2] to-[#FCEBDD] p-1 ring-4 ring-[#FFF5EC] sm:h-36 sm:w-36">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Ảnh đại diện"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FCEBDD]">
                      <span className="text-4xl font-black text-[#C94A08]">
                        {getInitials(user?.fullName)}
                      </span>
                    </div>
                  )}

                  <span className="absolute bottom-1 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#E65100] text-sm font-bold text-white">
                    ✓
                  </span>
                </div>

                <h2 className="mt-5 wrap-break-words text-xl font-black sm:text-2xl">
                  {user?.fullName || "Chưa cập nhật họ tên"}
                </h2>

                <p className="mt-2 break-all text-sm text-[#8A7768]">
                  {user?.email || "Chưa cập nhật email"}
                </p>

                <span className="mt-5 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#F5D4BD] bg-[#FFF3E8] px-5 py-2 text-sm font-bold text-[#D94E00]">
                  <span>♛</span>
                  {displayRole}
                </span>

                <p className="mt-3 text-xs leading-5 text-[#8A7768]">
                  {user?.title || "Thành viên hệ thống đồ án"}
                </p>
              </div>

              <div className="my-7 h-px bg-[#EEE5DC]" />

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E8] text-lg">
                    🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8A7768]">Mã số sinh viên</p>
                    <p className="mt-1 wrap-break-words text-sm font-bold">
                      {user?.studentCode || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E8] text-lg">
                    🏛
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8A7768]">Khoa / Bộ môn</p>
                    <p className="mt-1 text-sm font-bold">
                      Khoa Công nghệ thông tin
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E8] text-lg">
                    👥
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8A7768]">Vai trò hệ thống</p>
                    <p className="mt-1 text-sm font-bold">{displayRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: bio and details */}
          <section className={`${cardClass} flex h-full min-w-0 flex-col p-6 sm:p-8`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C94A08]">
                  Account information
                </span>
                <h2 className="mt-1 text-xl font-black">
                  Thông tin chi tiết
                </h2>
              </div>

              <span className="inline-flex items-center gap-2 rounded-lg border border-[#E8E2D9] bg-[#FBF9F5] px-3 py-2 text-xs font-semibold text-[#8A7768]">
                <span className="text-[#E65100]">▤</span>
                Chỉ xem
              </span>
            </div>

            <div className="mb-6 rounded-xl border border-[#F2D6C2] bg-[#FFF8F1] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FCEBDD] text-lg text-[#E65100]">
                  ✦
                </span>
                <div>
                  <p className="text-sm font-bold text-[#C94A08]">
                    Bio & thông tin tài khoản
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#786B61]">
                    Các thông tin dưới đây được lấy từ tài khoản hiện tại. Liên hệ Admin nếu cần điều chỉnh dữ liệu.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 content-start gap-4 sm:grid-cols-2">
              <InfoField
                label="Họ và tên"
                value={user?.fullName}
                icon="♙"
              />

              <InfoField
                label="Mã số sinh viên"
                value={user?.studentCode}
                icon="🎓"
              />

              <InfoField
                label="Email hệ thống"
                value={user?.email}
                icon="✉"
              />

              <div className="min-w-0 rounded-xl border border-[#F0E7DE] bg-[#FBF9F5] p-4 transition hover:border-[#F3B58C] hover:bg-[#FFF9F3] sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FCEBDD] text-base text-[#E65100]">
                    ●
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#8A7768]">
                      Trạng thái tài khoản
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <InfoField
                label="Vai trò"
                value={displayRole}
                icon="♛"
              />

              <InfoField
                label="Khoa / Bộ môn"
                value="Khoa Công nghệ thông tin"
                icon="🏛"
              />
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-[#EEE5DC] pt-5 text-xs text-[#8A7768]">
              <span className="h-2 w-2 rounded-full bg-[#E65100]" />
              Thông tin hồ sơ chỉ dùng để xem.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
