import React, { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [role, setRole] = useState("student"); // 'student', 'lecturer', hoặc 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State quản lý thông báo tùy chỉnh (Toast Notification)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", // 'success' hoặc 'error'
  });

  const navigate = useNavigate();

  // Tự động ẩn thông báo sau 3 giây
  useEffect(() => {
    let timer;
    if (notification.show) {
      timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [notification.show]);

  // Hàm hiển thị thông báo
  const showToast = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({
        email: email,
        password: password,
      });

      console.log("Login success:", result);

      // Lấy thông tin user và role từ kết quả trả về
      const userRole = result.user?.role || result.role;

      // Lưu token, user và role vào LocalStorage
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("role", userRole);

      // Thông báo thành công và chuyển hướng sau 1.5s
      showToast("Đăng nhập thành công! Đang chuyển hướng...", "success");

      setTimeout(() => {
        if (userRole === "ADMIN") {
          navigate("/admin/dashboard"); // Điều hướng sang trang Admin
        } else if (userRole === "STUDENT" || userRole === "GROUP_LEADER") {
          navigate("/student-dashboard"); // Sinh viên hoặc nhóm trưởng vào dashboard sinh viên
        } else if (
          userRole === "LECTURER" ||
          userRole === "TEACHER" ||
          userRole === "INSTRUCTOR"
        ) {
          navigate("/lecturer/dashboard"); // Giảng viên vào dashboard giảng viên
        } else {
          navigate("/"); // Mặc định về trang chủ
        }
      }, 1500);
    } catch (error) {
      console.error("Login failed:", error);
      const message =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-[#FAFAFA] overflow-hidden">
      {/* Toast Notification Custom (Hiển thị góc trên bên phải, tự động tắt) */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-2xl border border-gray-100 transition-all duration-300">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold shrink-0 ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {notification.type === "success" ? "✓" : "✕"}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">
              {notification.type === "success" ? "Thành công" : "Lỗi"}
            </p>
            <p className="text-xs text-gray-500">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Cột trái - Branding cam FPT */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#E65100] p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-white/40">
            <span className="text-xs">📅</span>
          </div>
          <span>Lịch Đồ Án</span>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Theo dõi từng mốc đồ án, đúng hẹn mỗi lần.
          </h1>
          <p className="text-sm text-orange-100/80">
            Đặt lịch với giảng viên hướng dẫn, cập nhật tiến độ và nộp tài liệu
            — tất cả trong một nơi.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-orange-100/70">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white"></span>
            <span className="h-0.5 w-6 bg-white/40"></span>
            <span className="h-2 w-2 rounded-full bg-white"></span>
            <span className="h-0.5 w-6 bg-white/40"></span>
            <span className="h-2 w-2 rounded-full bg-white"></span>
          </div>
          <span className="ml-2">Giai đoạn 3/5</span>
        </div>
      </div>

      {/* Cột phải - Form đăng nhập */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Chào mừng trở lại</p>
            <h2 className="text-2xl font-semibold text-gray-800">
              Đăng nhập tài khoản
            </h2>
          </div>

          {/* Role Toggle Switch (3 lựa chọn: Sinh viên, Giảng viên, Admin) */}
          <div className="grid grid-cols-3 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                role === "student"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => setRole("lecturer")}
              className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                role === "lecturer"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Giảng viên
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                role === "admin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {role === "student"
                  ? "Email sinh viên"
                  : role === "lecturer"
                    ? "Email giảng viên"
                    : "Email quản trị viên (Admin)"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@fpt.edu.vn"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    // Icon ẩn mật khẩu (Mắt gạch chéo)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // Icon hiện mật khẩu (Mắt thường)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="#forgot" className="text-gray-500 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#E65100] py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="space-y-3 text-center text-xs text-gray-400">
            <p>hoặc</p>
            <p>
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="font-medium text-orange-600 hover:underline"
              >
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
