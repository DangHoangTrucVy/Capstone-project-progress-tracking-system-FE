import React, { useState } from "react";
import { register } from "../services/authService";

const Register = () => {
    const [role, setRole] = useState("STUDENT"); // 'STUDENT' hoặc 'TEACHER'
    const [fullName, setFullName] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [department, setDepartment] = useState("Kỹ thuật phần mềm");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreeTerms) {
            alert("Vui lòng đồng ý với Điều khoản sử dụng!");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Email không hợp lệ! Vui lòng nhập đúng dạng example@fpt.edu.vn");
            return;
        }

        if (password.length < 8) {
            alert("Mật khẩu phải chứa ít nhất 8 ký tự!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const payload = {
                fullName: fullName.trim(),
                email: email.trim(),
                password,
                role,
                ...(role === "STUDENT" && { studentCode: studentCode.trim() }),
                department,
            };

            const result = await register(payload);

            if (result.accessToken) {
                localStorage.setItem("accessToken", result.accessToken);
            }
            if (result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
            }

            alert("Đăng ký thành công!");
        } catch (error) {
            console.error("Register failed:", error);
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";
            alert(message);
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans">
            {/* Cột trái - Banner Cam */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#E65100] text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern Họa tiết mờ */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none"></div>

                {/* Logo / Brand Header */}
                <div className="flex items-center gap-2 z-10">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
                        📅
                    </div>
                    <span className="font-semibold text-lg tracking-wide">Lịch Đồ Án</span>
                </div>

                {/* Nội dung chính */}
                <div className="my-auto z-10 max-w-lg">
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                        Một tài khoản, <br />
                        theo dõi trọn <br />
                        hành trình đồ án.
                    </h1>
                    <p className="text-white/80 text-base leading-relaxed">
                        Dành cho sinh viên và giảng viên hướng dẫn tại Khoa Công nghệ thông tin.
                    </p>
                </div>

                {/* Danh sách tính năng */}
                <div className="space-y-4 z-10 text-sm font-light text-white/90">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                        <span>Đặt lịch hẹn với GVHD chỉ trong vài giây</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                        <span>Theo dõi tiến độ theo từng mốc rõ ràng</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                        <span>Nộp và quản lý tài liệu đồ án tập trung</span>
                    </div>
                </div>
            </div>

            {/* Cột phải - Form Đăng ký */}
            <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-6">
                    <div>
                        <span className="text-xs text-gray-500 font-medium">Bắt đầu ngay</span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">Tạo tài khoản mới</h2>
                    </div>

                    {/* Tab Switcher: Sinh viên / Giảng viên */}
                    <div className="bg-gray-200/70 p-1 rounded-xl flex text-sm font-medium">
                        <button
                            type="button"
                            onClick={() => setRole("STUDENT")}
                            className={`flex-1 py-2 rounded-lg text-center transition-all ${
                                role === "STUDENT"
                                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Sinh viên
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("TEACHER")}
                            className={`flex-1 py-2 rounded-lg text-center transition-all ${
                                role === "TEACHER"
                                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Giảng viên
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Họ và tên */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                            />
                        </div>

                        {/* MSSV & Khoa / Bộ môn */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {role === "STUDENT" && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Mã số sinh viên
                                    </label>
                                    <input
                                        type="text"
                                        value={studentCode}
                                        onChange={(e) => setStudentCode(e.target.value)}
                                        placeholder="SE171245"
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                    />
                                </div>
                            )}

                            <div className={role === "TEACHER" ? "col-span-2" : ""}>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Khoa / Bộ môn
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                >
                                    <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                                    <option value="An toàn thông tin">An toàn thông tin</option>
                                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                                    <option value="Thiết kế đồ họa">Thiết kế đồ họa</option>
                                </select>
                            </div>
                        </div>

                        {/* Email trường */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Email trường
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="minhtri@fpt.edu.vn"
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                            />
                        </div>

                        {/* Mật khẩu & Xác nhận mật khẩu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Tối thiểu 8 ký tự"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition"
                                />
                            </div>
                        </div>

                        {/* Checkbox điều khoản */}
                        <div className="flex items-start gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#E65100] focus:ring-[#E65100]"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                                Tôi đồng ý với <a href="#terms" className="underline hover:text-gray-800">Điều khoản sử dụng</a> và <a href="#policy" className="underline hover:text-gray-800">Chính sách bảo mật</a> của hệ thống.
                            </label>
                        </div>

                        {/* Nút submit */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition duration-200"
                        >
                            Tạo tài khoản
                        </button>
                    </form>

                    {/* Link chuyển sang trang Đăng nhập */}
                    <div className="text-center text-xs text-gray-500 pt-2">
                        Đã có tài khoản?{" "}
                        <a href="/login" className="text-[#E65100] font-semibold hover:underline">
                            Đăng nhập
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;