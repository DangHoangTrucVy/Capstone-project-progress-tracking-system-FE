import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./auth/Login";
import Home from "./components/Home";
import Support from "./components/Support"; // Trang Hỗ trợ ở các bước trước
import Privacy from "./components/Privacy"; // Trang Chính sách
import Contact from "./components/Contact"; // Trang Liên hệ
import StudentDashboard from "./pages/students/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import CouncilDashboard from "./pages/council/CouncilDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SYSTEM_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["LEADER", "GROUP_LEADER"]} />}>
          <Route path="/leader/dashboard" element={<StudentDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "LECTURER", "TEACHER", "REVIEWER"]} />}>
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/lecturer/dashboard" element={<InstructorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["COUNCIL", "COUNCIL_MEMBER", "COUNCILCHAIR", "ADMIN"]} />}>
          <Route path="/council/dashboard" element={<CouncilDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;