import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { register, getCampuses } from "../services/authService";
import fptBg from "../assets/fpt-bg.jpg";

const CAMPUS_LABELS = {
  HA_NOI: "Hà Nội",
  HO_CHI_MINH: "TP. Hồ Chí Minh",
  DA_NANG: "Đà Nẵng",
  CAN_THO: "Cần Thơ",
  QUY_NHON: "Quy Nhơn",
};

const STUDENT_CODE = /^[A-Za-z]{2}\d{5,6}$/;

const inputClass =
  "w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-2.5 text-xs outline-none transition focus:border-[#E65100] focus:bg-white";

// Sinh viên chưa có email trường đăng ký bằng email cá nhân + MSSV; Admin xác nhận rồi mới đăng nhập được
const Register = () => {
  const [form, setForm] = useState({
    fullName: "",
    studentCode: "",
    email: "",
    campus: "",
    password: "",
    confirmPassword: "",
  });
  const [campuses, setCampuses] = useState(Object.keys(CAMPUS_LABELS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    getCampuses()
      .then((list) => Array.isArray(list) && list.length && setCampuses(list))
      .catch(() => {});
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!STUDENT_CODE.test(form.studentCode.trim())) {
      setError("MSSV không hợp lệ (ví dụ: SE160368).");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        fullName: form.fullName.trim(),
        studentCode: form.studentCode.trim().toUpperCase(),
        email: form.email.trim(),
        campus: form.campus,
        password: form.password,
      });
      setDone(result);
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      setError(
        errorCode === "STUDENT_CODE_TAKEN"
          ? "MSSV này đã được đăng ký. Nếu không phải bạn, vui lòng liên hệ Admin."
          : errorCode === "CONFLICT"
            ? "Email này đã có tài khoản. Hãy đăng nhập, hoặc dùng email khác."
            : err.response?.data?.message ||
              "Đăng ký thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full bg-cover bg-center items-center justify-center font-sans p-4 sm:p-6"
      style={{ backgroundImage: `url(${fptBg})` }}
    >
      <div className="absolute inset-0 bg-[#2C2825]/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-md rounded-4xl shadow-2xl border border-white/40 p-8 sm:p-10 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#E65100] rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
            ✓
          </div>
          <span className="font-extrabold text-lg text-[#2C2825] tracking-tight">
            Lịch Đồ Án FPT
          </span>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white text-xl font-bold">
              ✓
            </div>
            <h1 className="text-2xl font-black text-[#2C2825]">
              Đã gửi đăng ký
            </h1>
            <p className="text-xs text-[#6B635B] leading-relaxed">
              Tài khoản <strong>{done.email}</strong> đang{" "}
              <strong className="text-[#E65100]">chờ Admin xác nhận</strong> bạn
              là sinh viên của trường. Sau khi được duyệt, bạn đăng nhập bằng
              email và mật khẩu vừa đặt (hoặc nút Google nếu đó là tài khoản
              Gmail).
            </p>
            <Link
              to="/login"
              className="block w-full text-center rounded-xl bg-[#E65100] py-3 text-xs font-bold text-white shadow-md hover:bg-[#D84315]"
            >
              Về trang đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-[#2C2825] tracking-tight">
                Đăng ký tài khoản sinh viên
              </h1>
              <p className="text-xs text-[#6B635B]">
                Dành cho sinh viên chưa có email trường. Dùng email cá nhân và
                MSSV; Admin sẽ xác nhận trước khi bạn đăng nhập được.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                  Họ và tên
                </label>
                <input
                  value={form.fullName}
                  onChange={set("fullName")}
                  required
                  maxLength={255}
                  placeholder="Nguyễn Văn A"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                    MSSV
                  </label>
                  <input
                    value={form.studentCode}
                    onChange={set("studentCode")}
                    required
                    maxLength={8}
                    placeholder="SE160368"
                    className={`${inputClass} uppercase`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                    Campus
                  </label>
                  <select
                    value={form.campus}
                    onChange={set("campus")}
                    required
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="" disabled>
                      Chọn campus
                    </option>
                    {campuses.map((c) => (
                      <option key={c} value={c}>
                        {CAMPUS_LABELS[c] || c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                  Email cá nhân
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  maxLength={255}
                  placeholder="ban@gmail.com"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                    Mật khẩu
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      required
                      minLength={8}
                      placeholder="Ít nhất 8 ký tự"
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-[#6B635B] hover:text-[#E65100]"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                          <path d="M9.9 5.2A11 11 0 0112 5c5 0 9 5 9 7a10 10 0 01-2.1 3.1" />
                          <path d="M6.2 6.2C3.8 7.8 3 10.1 3 12c0 2 4 7 9 7a10 10 0 004-.8" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] ${
                        form.password.length >= 8
                          ? "text-emerald-600"
                          : "text-[#9A9188]"
                      }`}
                    >
                      {form.password.length >= 8
                        ? "✓ Mật khẩu đạt yêu cầu"
                        : `Cần ít nhất 8 ký tự (${form.password.length}/8)`}
                    </span>

                    <span className="text-[11px] text-[#9A9188]">
                      {form.password.length} ký tự
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#2C2825]">
                    Nhập lại mật khẩu
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      required
                      placeholder="Nhập lại mật khẩu"
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? "Ẩn mật khẩu xác nhận"
                          : "Hiện mật khẩu xác nhận"
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-[#6B635B] hover:text-[#E65100]"
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                          <path d="M9.9 5.2A11 11 0 0112 5c5 0 9 5 9 7a10 10 0 01-2.1 3.1" />
                          <path d="M6.2 6.2C3.8 7.8 3 10.1 3 12c0 2 4 7 9 7a10 10 0 004-.8" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {form.confirmPassword.length > 0 && (
                    <p
                      className={`mt-1 text-[11px] ${
                        form.password === form.confirmPassword
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {form.password === form.confirmPassword
                        ? "✓ Mật khẩu khớp"
                        : "Mật khẩu chưa khớp"}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E65100] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#D84315] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang gửi..." : "Gửi đăng ký"}
              </button>
            </form>

            <p className="text-center text-xs text-[#6B635B]">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-bold text-[#E65100] hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
