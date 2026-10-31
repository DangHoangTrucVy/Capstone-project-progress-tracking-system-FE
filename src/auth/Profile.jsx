import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

const cardClass =
  "rounded-3xl border border-white/60 bg-white/75 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)]";

const roleLabels = {
  ADMIN: "Quản trị viên",
  STUDENT: "Sinh viên",
  GROUP_LEADER: "Trưởng nhóm",
  LEADER: "Trưởng nhóm",
  MODERATOR: "Giảng viên điều phối",
};

function InfoField({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/80 bg-white/60 p-4 transition hover:border-[#E65100]/40 hover:bg-white/90 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-base text-[#E65100] shadow-xs">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-500">
            {label}
          </p>
          <p className="mt-1.5 wrap-break-words text-sm font-bold leading-6 text-neutral-900">
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
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md px-8 py-6 text-sm font-semibold text-neutral-600 shadow-sm">
          <span className="mr-2 inline-block animate-spin">◌</span>
          Đang tải thông tin hồ sơ...
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white/80 backdrop-blur-md p-6 text-sm text-red-600 shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-full w-full bg-transparent font-sans text-neutral-900 ">
      <div className="mx-auto w-full max-w-none space-y-6">

        {/* Tiêu đề trang */}
        <section className={`${cardClass} relative overflow-hidden p-6 md:p-8`}>
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-linear-to-r from-[#E65100] via-orange-400 to-transparent" /><div className="absolute top-0 right-0 h-1.5 w-full bg-linear-gradient-to-r from-[#E65100] via-orange-400 to-transparent" />

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl text-[#E65100] shadow-xs">
              ✓
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">
                Tài khoản của tôi
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
                Hồ sơ cá nhân
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-neutral-600">
                Thông tin định danh và vai trò trong hệ thống quản lý đồ án tốt nghiệp.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {/* Bố cục chính của hồ sơ */}
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.5fr)]">

          {/* Cột trái: Thông tin định danh */}
          <aside className={`${cardClass} relative flex h-full min-w-0 flex-col overflow-hidden`}>
            <div className="h-1.5 w-full bg-linear-to-r from-[#E65100] via-orange-400 to-orange-200" />

            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-orange-100 to-orange-200 p-1 ring-4 ring-white/80 sm:h-36 sm:w-36 shadow-md">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Ảnh đại diện"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-orange-100">
                      <span className="text-4xl font-black text-[#E65100]">
                        {getInitials(user?.fullName)}
                      </span>
                    </div>
                  )}

                  <span className="absolute bottom-1 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#E65100] text-sm font-bold text-white shadow-sm">
                    ✓
                  </span>
                </div>

                <h2 className="mt-5 wrap-break-words text-xl font-black text-neutral-900 sm:text-2xl">
                  {user?.fullName || "Chưa cập nhật họ tên"}
                </h2>

                <p className="mt-1.5 break-all text-xs sm:text-sm text-neutral-600">
                  {user?.email || "Chưa cập nhật thư điện tử"}
                </p>

                <span className="mt-5 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-xs sm:text-sm font-bold text-[#E65100] shadow-xs">
                  <span>♛</span>
                  {displayRole}
                </span>

                <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                  {user?.title || "Thành viên hệ thống đồ án tốt nghiệp"}
                </p>
              </div>

              <div className="my-7 h-px bg-neutral-200/60" />

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-lg shadow-xs">
                    🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-500">Mã số sinh viên</p>
                    <p className="mt-1 wrap-break-words text-sm font-bold text-neutral-900">
                      {user?.studentCode || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-lg shadow-xs">
                    🏛
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-500">Chuyên ngành</p>
                    <p className="mt-1 text-sm font-bold text-neutral-900">
                      {user?.major || user?.majorName || "Công nghệ phần mềm"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-lg shadow-xs">
                    👥
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-500">Vai trò hệ thống</p>
                    <p className="mt-1 text-sm font-bold text-neutral-900">{displayRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Cột phải: Thông tin chi tiết */}
          <section className={`${cardClass} flex h-full min-w-0 flex-col p-6 sm:p-8`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">
                  Thông tin tài khoản
                </span>
                <h2 className="mt-1 text-xl font-black text-neutral-900">
                  Thông tin chi tiết
                </h2>
              </div>

              <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-xs">
                <span className="text-[#E65100]">▤</span>
                Chỉ xem
              </span>
            </div>

            <div className="mb-6 rounded-2xl border border-orange-200/80 bg-orange-50/60 p-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-base text-[#E65100]">
                  ✦
                </span>
                <div>
                  <p className="text-sm font-bold text-[#E65100]">
                    Thông tin hồ sơ Đồ án tốt nghiệp
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    Dữ liệu được đồng bộ trực tiếp từ danh sách do Phòng Đào tạo cung cấp vào hệ thống.
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
                value={user?.studentCode || "Chưa cập nhật"}
                icon="🎓"
              />

              <InfoField
                label="Thư điện tử hệ thống"
                value={user?.email}
                icon="✉"
              />

              <InfoField
                label="Chuyên ngành"
                value={user?.major || user?.majorName || "Công nghệ phần mềm"}
                icon="🏛"
              />

              <div className="min-w-0 rounded-2xl border border-white/80 bg-white/60 p-4 transition hover:border-[#E65100]/40 hover:bg-white/90 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-base text-[#E65100] shadow-xs">
                    ●
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-500">
                      Trạng thái tài khoản
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
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
                label="Vai trò hệ thống"
                value={displayRole}
                icon="♛"
              />
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-neutral-200/60 pt-5 text-xs text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-[#E65100]" />
              Thông tin cấu hình theo phạm vi ngành học đồ án tốt nghiệp.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}