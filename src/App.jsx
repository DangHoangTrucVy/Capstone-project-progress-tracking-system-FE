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