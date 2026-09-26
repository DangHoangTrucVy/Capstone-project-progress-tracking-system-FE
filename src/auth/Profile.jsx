import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (err) {
                console.error("Lỗi tải thông tin cá nhân:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-100 flex items-center justify-center text-xs font-bold text-[#6B635B]">
                Đang tải thông tin hồ sơ...
            </div>
        );
    }

    const getInitials = (name) => {
        if (!name) return "SV";
        const words = name.trim().split(" ");
        return words.length > 1
            ? words[words.length - 2][0] + words[words.length - 1][0]
            : words[0].slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6 animate-fadeIn font-sans max-w-4xl mx-auto text-[#2C2825]">
            {/* Top Banner */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
                        Hồ sơ cá nhân · Account Settings
                    </span>
                    <h1 className="text-xl md:text-2xl font-black text-[#2C2825]">
                        Thông tin tài khoản & Chức vụ
                    </h1>
                    <p className="text-xs text-[#6B635B]">
                        Xem thông tin định danh và vai trò của bạn trong hệ thống. Mọi thay đổi thông tin vui lòng liên hệ Admin.
                    </p>
                </div>
            </div>

            {/* Nội dung chính Profile (Chỉ xem) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cột trái: Avatar & Chức vụ */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 text-center flex flex-col items-center">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-orange-100"
                        />
                    ) : (
                        <div className="w-24 h-24 bg-orange-100 text-[#E65100] font-black rounded-2xl flex items-center justify-center text-2xl shadow-md">
                            {getInitials(user?.fullName)}
                        </div>
                    )}

                    <div className="space-y-1">
                        <h3 className="font-black text-base text-[#2C2825]">{user?.fullName}</h3>
                        <p className="text-xs text-[#6B635B]">{user?.email}</p>
                    </div>

                    <div className="space-y-1 w-full">
                        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-xs font-black rounded-xl border border-orange-100 uppercase block">
                            {user?.role || "STUDENT"}
                        </span>
                        <p className="text-[11px] font-bold text-gray-600 pt-1">
                            {user?.title || "Thành viên hệ thống đồ án"}
                        </p>
                    </div>
                </div>

                {/* Cột phải: Chi tiết thông tin */}
                <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase text-[#6B635B]">Chi tiết tài khoản</h3>

                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-3 py-3 border-b border-[#E8E2D9]">
                            <span className="font-bold text-[#6B635B]">Họ và tên:</span>
                            <span className="col-span-2 font-extrabold text-[#2C2825]">{user?.fullName || "Chưa cập nhật"}</span>
                        </div>
                        <div className="grid grid-cols-3 py-3 border-b border-[#E8E2D9]">
                            <span className="font-bold text-[#6B635B]">Email hệ thống:</span>
                            <span className="col-span-2 font-extrabold text-[#2C2825]">{user?.email}</span>
                        </div>
                        <div className="grid grid-cols-3 py-3 border-b border-[#E8E2D9]">
                            <span className="font-bold text-[#6B635B]">Trạng thái tài khoản:</span>
                            <span className="col-span-2 font-extrabold text-emerald-600">{user?.status || "ACTIVE"}</span>
                        </div>
                        <div className="grid grid-cols-3 py-3 border-b border-[#E8E2D9]">
                            <span className="font-bold text-[#6B635B]">Vai trò (Role):</span>
                            <span className="col-span-2 font-extrabold text-[#E65100]">{user?.role}</span>
                        </div>
                        <div className="grid grid-cols-3 py-3">
                            <span className="font-bold text-[#6B635B]">Khoa / Bộ môn:</span>
                            <span className="col-span-2 font-extrabold text-[#2C2825]">Khoa Công nghệ thông tin</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}