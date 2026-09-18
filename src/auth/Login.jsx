import React, { useState } from "react";
import { login } from "../services/authService";

const Login = () => {
  const [role, setRole] = useState("student"); // 'student' hoặc 'lecturer'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({
        email: email,
        password: password,
      });

      console.log("Login success:", result);

      // Lưu token và thông tin người dùng
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));

      alert("Đăng nhập thành công!");
      
      console.log("User:", result.user);
      console.log("Role:", result.user?.role);
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data?.message || "Đăng nhập thất bại";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FAFAFA]">
      {/* Cột trái - Branding cam FPT */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#E65100] p-12 text-white lg:flex">
        {/* Logo / Header */}
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-white/40">
            <span className="text-xs">📅</span>
          </div>
          <span>Lịch Đồ Án</span>
        </div>

        {/* Banner Content */}
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Theo dõi từng mốc đồ án, đúng hẹn mỗi lần.
          </h1>
          <p className="text-sm text-orange-100/80">
            Đặt lịch với giảng viên hướng dẫn, cập nhật tiến độ và nộp tài liệu — tất cả trong một nơi.
          </p>
        </div>

        {/* Progress Timeline Indicator */}
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
          {/* Title */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Chào mừng trở lại</p>
            <h2 className="text-2xl font-semibold text-gray-800">
              Đăng nhập tài khoản
            </h2>
          </div>

          {/* Role Toggle Switch */}
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {role === "student" ? "Email sinh viên" : "Email giảng viên"}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
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
              className="w-full rounded-lg bg-[#E65100] py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="space-y-3 text-center text-xs text-gray-400">
            <p>hoặc</p>
            <p>
              Chưa có tài khoản?{" "}
              <a href="/register" className="font-medium text-orange-600 hover:underline">
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