import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./auth/Login";
import Register from "./auth/Register";
import Home from "./components/Home";
import Support from "./components/Support"; // Trang Hỗ trợ ở các bước trước
import Privacy from "./components/Privacy"; // Trang Chính sách
import Contact from "./components/Contact"; // Trang Liên hệ
import StudentDashboard from "./pages/students/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import ModeratorLayout from "./pages/moderator/ModeratorLayout";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import ContentReviewQueue from "./pages/moderator/ContentReviewQueue";
import SubModManagement from "./pages/moderator/SubModManagement";
import SubModTasks from "./pages/moderator/SubModTasks";
import Profile from "./auth/Profile";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SYSTEM_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Phân quyền cho MODERATOR CHÍNH */}
        {/* <Route element={<ProtectedRoute allowedRoles={["MODERATOR", "MAIN_MODERATOR", "ADMIN"]} />}>
          <Route path="/moderator/dashboard" element={<ModeratorDashboard />} />
          <Route path="/moderator/review-queue" element={<ContentReviewQueue />} />
          <Route path="/moderator/sub-mods" element={<SubModManagement />} />
        </Route> */}

        {/* Phân quyền cho SUB MODERATOR */}
        {/* <Route element={<ProtectedRoute allowedRoles={["SUB_MODERATOR", "MODERATOR", "MAIN_MODERATOR", "ADMIN"]} />}>
          <Route path="/submod/tasks" element={<SubModTasks />} />
        </Route> */}

        {/* Tạm thời cho phép ADMIN hoặc STUDENT truy cập để test UI nhanh */}
        {/* Bỏ bọc ProtectedRoute để test trực tiếp */}
        <Route element={<ModeratorLayout />}>
          <Route path="/moderator/dashboard" element={<ModeratorDashboard />} />
          <Route path="/moderator/review-queue" element={<ContentReviewQueue />} />
          <Route path="/moderator/sub-mods" element={<SubModManagement />} />
          <Route path="/submod/tasks" element={<SubModTasks />} />
          <Route path="/moderator/profile" element={
            <div className="p-8 w-full">
              <Profile />
            </div>
          } />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allowedRoles={["STUDENT", "LEADER", "GROUP_LEADER"]} />}>
          <Route path="/leader/dashboard" element={<StudentDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;