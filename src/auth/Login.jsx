import React, { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";
import fptBg from "../assets/fpt-bg.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Đăng nhập bằng email trường (@fpt.edu.vn) và mật khẩu do Admin cấp
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim();
      const result = await login({
        email: normalizedEmail,
        password: password,
      });

      const userRole = result.user?.role || result.role;

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("role", userRole);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", normalizedEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      showToast("Đăng nhập thành công! Đang chuyển hướng...", "success");

      setTimeout(() => {
        navigateBasedOnRole(userRole);
      }, 1500);
    } catch (error) {
      const status = error.response?.status;
      const errorCode = error.response?.data?.errorCode;
      const message =
        status === 429
          ? "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc trước khi thử lại."
          : errorCode === "INVALID_CREDENTIALS"
          ? "Email hoặc mật khẩu không đúng. Hãy kiểm tra thông tin đăng nhập hoặc liên hệ Admin để xác nhận tài khoản."
          : error.response?.data?.message ||
            "Đăng nhập thất bại. Vui lòng thử lại.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const navigateBasedOnRole = (userRole) => {
    const normalizedRole = String(userRole || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z_]/g, "");

    if (["ADMIN", "SYSTEM_ADMIN"].includes(normalizedRole)) {
      navigate("/admin/dashboard");
    } else if (["LEADER", "GROUP_LEADER"].includes(normalizedRole)) {
      navigate("/leader/dashboard");
    } else if (
      ["STUDENT"].includes(normalizedRole)
    ) {
      navigate("/student/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div 
      className="relative flex min-h-screen w-full bg-cover bg-center items-center justify-center font-sans overflow-hidden p-4 sm:p-6 md:p-8"
      style={{ backgroundImage: `url(${fptBg})` }}
    >
      <div className="absolute inset-0 bg-[#2C2825]/40 backdrop-blur-[2px]"></div>

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

      <div className="relative z-10 w-full max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* CỘT TRÁI: Form đăng nhập */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
              <div className="w-4 h-4 border-2 border-white rounded-lg flex items-center justify-center text-[9px]">
                ✓
              </div>
            </div>
            <span className="font-extrabold text-lg text-[#2C2825] tracking-tight">
              Lịch Đồ Án FPT
            </span>
          </div>

          <div className="max-w-md w-full mx-auto my-auto space-y-4 py-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#2C2825] tracking-tight">
                Đăng nhập hệ thống
              </h1>
              <p className="text-xs text-[#6B635B]">
                Nhập email trường định danh <strong className="text-[#E65100]">@fpt.edu.vn</strong> để truy cập.
              </p>
            </div>

            {/* Form đăng nhập chính bằng Gmail trường & Mật khẩu */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                  Email trường 
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@fpt.edu.vn"
                  required
                  className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-2.5 text-xs outline-none transition focus:border-[#E65100] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-2.5 pr-10 text-xs outline-none transition focus:border-[#E65100] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer text-xs font-bold"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E65100] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#D84315] disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            <div className="flex items-center my-2">
              <div className="grow border-t border-[#E8E2D9]"></div>
              <span className="px-3 text-[10px] text-[#9E958C] uppercase font-bold">Hoặc</span>
              <div className="grow border-t border-[#E8E2D9]"></div>
            </div>

            {/* Nút đăng nhập Google Workspace phụ ở dưới */}
            <button
              type="button"
              onClick={() => showToast("Chức năng xác thực Google OAuth2 đang được backend tích hợp.", "success")}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E8E2D9] bg-white py-3 text-xs font-bold text-[#2C2825] shadow-sm transition-all hover:bg-gray-50 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.15C3.16 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.2C.44 8.13 0 9.87 0 12s.44 3.87 1.2 5.4l4.08-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.16 2.68 1.2 6.6l4.08 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
              </svg>
              Đăng nhập bằng Google 
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#9E958C] pt-4 border-t border-[#F0EBE1]">
            <p>© 2026 Lịch Đồ Án FPT</p>
            <a href="#privacy" className="hover:text-[#2C2825]">Chính sách bảo mật</a>
          </div>
        </div>

        {/* CỘT PHẢI: Lịch trình đồ án trực quan */}
        <div className="lg:col-span-6 bg-[#E65100]/95 backdrop-blur-md p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-2 z-10">
            <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider inline-block">
              Hệ thống quản lý Capstone
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-snug tracking-tight">
              Lịch trình & Các mốc thời gian học kỳ
            </h2>
          </div>

          <div className="my-4 z-10 space-y-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 shadow-md">
                1
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Đăng ký & Duyệt đề tài</h4>
                <p className="text-[11px] text-orange-100">Nộp tối đa 4 lần • Thẩm định 14 ngày (Lần 1)</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 shadow-md">
                2
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Đặt lịch & Tư vấn 1:1</h4>
                <p className="text-[11px] text-orange-100">Đặt trước 24h • Gửi câu hỏi Pre-meeting cho GVHD</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 shadow-md">
                3
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Review 1, 2 & Hội đồng kín</h4>
                <p className="text-[11px] text-orange-100">Đánh giá tiến độ và phân loại hướng bảo vệ</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 shadow-md">
                4
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Bảo vệ trước Hội đồng</h4>
                <p className="text-[11px] text-orange-100">Xếp lịch cuốn chiếu • Công bố kết quả chính thức</p>
              </div>
            </div>
          </div>

          <div className="z-10 text-[11px] text-orange-100/90 font-medium flex justify-between items-center pt-2 border-t border-white/20">
            <span>Khoa Công nghệ thông tin</span>
            <span>Đại học FPT TP.HCM</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;