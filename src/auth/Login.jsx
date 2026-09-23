import React, { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";
import fptBg from "../assets/fpt-bg.jpg"; // Hoặc đường dẫn trực tiếp tới ảnh của bạn

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State quản lý thông báo (Toast Notification)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (notification.show) {
      timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [notification.show]);

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

      const userRole = result.user?.role || result.role;

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("role", userRole);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      showToast("Đăng nhập thành công! Đang chuyển hướng...", "success");

      setTimeout(() => {
        if (userRole === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (userRole === "STUDENT" || userRole === "GROUP_LEADER") {
          navigate("/student-dashboard");
        } else if (
          userRole === "LECTURER" ||
          userRole === "TEACHER" ||
          userRole === "INSTRUCTOR"
        ) {
          navigate("/lecturer/dashboard");
        } else {
          navigate("/");
        }
      }, 1500);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const message =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex min-h-screen w-full bg-cover bg-center items-center justify-center font-sans overflow-hidden p-4 sm:p-6 md:p-8"
      style={{ backgroundImage: `url(${fptBg})` }}
    >
      {/* Lớp phủ mờ (Overlay) giúp làm dịu hình nền, tôn nổi bật khung form */}
      <div className="absolute inset-0 bg-[#2C2825]/40 backdrop-blur-[2px]"></div>

      {/* Thông báo nổi (Toast Notification) */}
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

      {/* Container chính bọc 2 cột */}
      <div className="relative z-10 w-full max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* CỘT TRÁI: Form đăng nhập (6 phần) */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white/80">
          {/* Logo đồng bộ trang Home */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              <div className="w-4 h-4 border-2 border-white rounded-lg flex items-center justify-center text-[9px]">
                ✓
              </div>
            </div>
            <span className="font-extrabold text-lg text-[#2C2825] tracking-tight">
              Lịch Đồ Án
            </span>
          </div>

          {/* Nội dung form */}
          <div className="max-w-md w-full mx-auto my-auto space-y-6 py-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#2C2825] tracking-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-xs text-[#6B635B]">
                Nhập email và mật khẩu của bạn để truy cập hệ thống đồ án tốt nghiệp.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2C2825]">
                  Email trường (FPT)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@fpt.edu.vn"
                  required
                  className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 text-xs outline-none transition focus:border-[#E65100] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#2C2825]">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-3 pr-10 text-xs outline-none transition focus:border-[#E65100] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#6B635B] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-[#E65100] focus:ring-[#E65100]"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <a href="#forgot" className="text-[#6B635B] hover:text-[#E65100] font-medium transition">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E65100] py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#D84315] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            <div className="text-center text-xs text-[#6B635B] pt-2">
              Chưa có tài khoản?{" "}
              <a href="/register" className="font-bold text-[#E65100] hover:underline">
                Đăng ký ngay
              </a>
            </div>
          </div>

          {/* Footer bản quyền */}
          <div className="flex justify-between items-center text-[11px] text-[#9E958C] pt-6 border-t border-[#F0EBE1]">
            <p>© 2026 Lịch Đồ Án FPT</p>
            <a href="#privacy" className="hover:text-[#2C2825]">Chính sách bảo mật</a>
          </div>
        </div>

        {/* CỘT PHẢI: Banner màu chủ đạo kèm hình minh họa Lịch & Dashboard (6 phần) */}
        <div className="lg:col-span-6 bg-[#E65100]/95 backdrop-blur-md p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 z-10 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              Quản lý lịch trình & tiến độ đồ án tốt nghiệp dễ dàng.
            </h2>
            <p className="text-xs text-orange-100/90 leading-relaxed">
              Đăng nhập để theo dõi lịch hẹn với giảng viên, kiểm tra các mốc thời gian và quản lý đề tài của nhóm bạn.
            </p>
          </div>

          <div className="my-8 z-10 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl">
            <div className="bg-white rounded-2xl p-4 text-[#2C2825] shadow-lg space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E65100]"></span>
                  <span className="font-bold text-xs">Lịch hẹn tuần này (Calendar)</span>
                </div>
                <span className="text-[10px] bg-orange-50 text-[#E65100] font-extrabold px-2 py-0.5 rounded-md">Spring 2026</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 space-y-1">
                  <p className="font-bold text-[#E65100]">Thứ Hai</p>
                  <p className="text-gray-600 font-semibold">09:00 - Duyệt đề cương</p>
                </div>
                <div className="bg-[#FBF9F5] p-2.5 rounded-xl border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-700">Thứ Tư</p>
                  <p className="text-gray-500">14:00 - Báo cáo tiến độ</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <p className="font-bold text-emerald-700">Thứ Sáu</p>
                  <p className="text-emerald-600 font-semibold">10:30 - Chấm hội đồng</p>
                </div>
              </div>
            </div>
          </div>

          <div className="z-10 text-[11px] text-orange-100/80 font-medium">
            Khoa Công nghệ thông tin · Đại học FPT TP.HCM
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;