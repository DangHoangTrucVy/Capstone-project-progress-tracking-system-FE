import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  // Lấy thông tin user/role đã lưu khi login (ví dụ: 'STUDENT' hoặc 'LECTURER')
  const userRole = localStorage.getItem('role'); 

  // Nếu chưa đăng nhập -> Chuyển về trang /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu role không hợp lệ -> Chuyển về trang không có quyền hoặc trang chủ
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Đủ điều kiện -> Cho phép truy cập route con
  return <Outlet />;
};

export default ProtectedRoute;