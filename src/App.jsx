import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./auth/Login";
import Register from "./auth/Register";
import Home from "./components/Home";
import StudentDashboard from "./pages/students/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InstructorDashboard from "./pages/instructor/InstructorDashboard"; // Import trang giảng viên

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allowedRoles={["STUDENT", "GROUP_LEADER"]} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>

        {/* Routes dành riêng cho GIẢNG VIÊN (INSTRUCTOR / LECTURER / TEACHER) */}
        <Route element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "LECTURER", "TEACHER"]} />}>
          <Route path="/lecturer/dashboard" element={<InstructorDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;