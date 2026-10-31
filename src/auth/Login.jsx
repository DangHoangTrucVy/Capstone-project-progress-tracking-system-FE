import React, { useState, useEffect, useCallback } from "react";
import {
  login,
  loginWithGoogle,
  getGoogleConfig,
} from "../services/authService";
import GoogleSignInButton from "./GoogleSignInButton";
import { useNavigate } from "react-router-dom";
import fptBg from "../assets/fpt-bg.jpg";

const GOOGLE_ERRORS = {
  REGISTRATION_REQUIRED:
    "Thư điện tử của bạn chưa có trong danh sách đồ án được nhập từ phòng đào tạo.",
  ACCOUNT_NOT_PROVISIONED:
    "Tài khoản chưa được cấp quyền. Vui lòng liên hệ Quản trị viên.",
  GOOGLE_NOT_CONFIGURED: "Máy chủ chưa cấu hình đăng nhập Google.",
  GOOGLE_UNAVAILABLE: "Không kết nối được Google lúc này, vui lòng thử lại.",
  GOOGLE_SIGN_IN_FAILED: "Xác thực Google thất bại, vui lòng thử lại.",
};

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

  const [googleConfig, setGoogleConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getGoogleConfig()
      .then(setGoogleConfig)
      .catch(() => setGoogleConfig({ enabled: false }));
  }, []);

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
      const normalizedEmail = email.trim();
      const result = await login({
        email: normalizedEmail,
        password: password,
      });

      finishLogin(result);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", normalizedEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
    } catch (error) {
      const status = error.response?.status;
      const errorCode = error.response?.data?.errorCode;
      const message =
        status === 429
          ? "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ trong giây lát."
          : errorCode === "INVALID_CREDENTIALS"
            ? "Thư điện tử hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."
            : error.response?.data?.message ||
              "Đăng nhập thất bại. Vui lòng thử lại.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = (result) => {
    const userRole = result.user?.role || result.role;

    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("user", JSON.stringify(result.user));
    localStorage.setItem("role", userRole);

    showToast("Đăng nhập thành công! Đang chuyển hướng...", "success");

    setTimeout(() => {
      navigateBasedOnRole(userRole);
    }, 1200);
  };

  const handleGoogleCredential = async (idToken) => {
    setLoading(true);
    try {
      const result = await loginWithGoogle({ idToken });
      finishLogin(result);
    } catch (error) {
      const errorCode = error.response?.data?.errorCode;
      showToast(
        GOOGLE_ERRORS[errorCode] ||
          error.response?.data?.message ||
          "Đăng nhập Google thất bại. Thư điện tử của bạn phải nằm trong danh sách đồ án được cấp phép.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = useCallback(
    (message) => showToast(message, "error"),
    [],
  );

  const navigateBasedOnRole = (userRole) => {
    const normalizedRole = String(userRole || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z_]/g, "");

    if (["ADMIN", "SYSTEM_ADMIN"].includes(normalizedRole)) {
      navigate("/admin/dashboard");
    } else if (["MODERATOR", "LECTURER"].includes(normalizedRole)) {
      navigate("/moderator/dashboard");
    } else if (["LEADER", "GROUP_LEADER"].includes(normalizedRole)) {
      navigate("/leader/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  return (
    <div
      className="relative flex h-screen w-full bg-cover bg-center items-center justify-center font-sans overflow-hidden p-4 md:p-6"
      style={{ backgroundImage: `url(${fptBg})` }}
    >
      {/* Lớp phủ sáng nhẹ giúp cân bằng màu sắc toàn màn hình */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>

      {/* Thông báo dạng nổi (Toast) */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur-md px-5 py-4 shadow-2xl border border-white/30 animate-bounce">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-xs shrink-0 ${
              notification.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {notification.type === "success" ? "✓" : "✕"}
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-900">
              {notification.type === "success" ? "Thành công" : "Thông báo lỗi"}
            </p>
            <p className="text-xs text-neutral-700">{notification.message}</p>
          </div>
        </div>
      )}

      {/* KHUNG CHÍNH: HIỆU ỨNG KÍNH MỜ (GLASSMORPHISM) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto bg-white/25 backdrop-blur-3xl rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.2)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/50">
        
        {/* CỘT TRÁI: Form đăng nhập (Màu trắng sữa trong suốt hài hòa) */}
        <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between bg-white/150 backdrop-blur-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#E65100] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md">
              ✓
            </div>
            <span className="font-extrabold text-sm text-neutral-900 tracking-tight">
              MatchPoint FPT
            </span>
          </div>

          <div className="w-full my-auto space-y-4 py-3">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Đăng nhập hệ thống
              </h1>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Sinh viên xác thực bằng Google; Quản trị viên và Điều phối viên
                dùng mật khẩu hệ thống.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-800">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fpt.edu.vn"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white/90 px-3.5 py-2.5 text-xs text-neutral-900 outline-none transition focus:border-[#f8f8f8] focus:bg-white focus:ring-2 focus:ring-olive-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-800">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white/90 px-3.5 py-2.5 pr-10 text-xs text-neutral-900 outline-none transition focus:border-[#f8f8f8] focus:bg-white focus:ring-2 focus:ring-olive-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 focus:outline-none cursor-pointer text-xs font-bold"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E65100] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#D84315] active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading
                  ? "Đang xác thực..."
                  : "Đăng nhập Quản trị / Điều phối"}
              </button>
            </form>

            <div className="flex items-center my-2">
              <div className="grow border-t border-neutral-300"></div>
              <span className="px-3 text-[12px] text-shadow-neutral-800 font-medium tracking-wider">
                Hoặc đăng nhập bằng Google
              </span>
              <div className="grow border-t border-neutral-300"></div>
            </div>
            {googleConfig?.enabled ? (
              <div>
                <div className="flex justify-center">
                  <GoogleSignInButton
                    clientId={googleConfig.clientId}
                    onCredential={handleGoogleCredential}
                    onError={handleGoogleError}
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-neutral-600">
                {googleConfig
                  ? "Đăng nhập Google chưa được bật: máy chủ chưa cấu hình Google."
                  : "Đang kiểm tra đăng nhập Google..."}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-[11px] text-olive-900 pt-3 border-t border-neutral-200">
            <p>© 2026 Đại học FPT</p>
            <p>Hệ thống Đồ án tốt nghiệp Đại học FPT</p>
          </div>
        </div>

        {/* CỘT PHẢI: Banner thông tin (Màu cam trong suốt xuyên thấu hài hòa, chữ trắng nổi bật) */}
        <div className="lg:col-span-6 bg-[#E65100]/70 backdrop-blur-2xl p-7 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden shadow-inner border-l border-white/30">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/20 blur-3xl pointer-events-none"></div>

          <div className="space-y-2 z-10">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg tracking-wider inline-block border border-white/30 shadow-sm">
              Cổng thông tin Đồ án
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-white drop-shadow-sm">
              Hệ thống ghép nhóm Đồ án tốt nghiệp chuyên ngành
            </h3>
          </div>

          {/* Các thẻ con bên trong cột phải: nền kính mờ trắng đục nhẹ giúp chữ trắng cực kỳ dễ đọc */}
          <div className="my-5 z-10 space-y-3">
            <div className="bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/30 flex items-center gap-3.5 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                ✓
              </div>
              <p className="text-xs font-semibold leading-relaxed text-white drop-shadow-xs">
                Ghép nhóm chuyên ngành khép kín đảm bảo tính chính xác cao.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/30 flex items-center gap-3.5 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                ✓
              </div>
              <p className="text-xs font-semibold leading-relaxed text-white drop-shadow-xs">
                Quy mô nhóm chuẩn mực từ 3 đến 5 thành viên chính thức.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/30 flex items-center gap-3.5 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-white text-[#E65100] font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                ✓
              </div>
              <p className="text-xs font-semibold leading-relaxed text-white drop-shadow-xs">
                Điều phối và kiểm duyệt minh bạch toàn bộ học kỳ bởi Giảng viên điều phối.
              </p>
            </div>
          </div>

          <div className="z-10 text-[11px] text-orange-100 font-bold flex items-center justify-between drop-shadow-xs">
            <span>MatchPoint FPT University</span>
            <span>Hệ thống quản lý khép kín</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;