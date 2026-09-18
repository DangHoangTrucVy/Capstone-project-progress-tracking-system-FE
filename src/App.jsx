import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './auth/Login';
import Register from './auth/Register';
import Home from './components/Home';

import StudentDashboard from './pages/students/StudentDashboard';


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Ai cũng truy cập được */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes dành riêng cho STUDENT */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>

        {/* Routes dành riêng cho GIẢNG VIÊN (LECTURER) */}
        <Route element={<ProtectedRoute allowedRoles={['LECTURER', 'TEACHER']} />}>
          {/* <Route path="/lecturer/dashboard" element={<LecturerDashboard />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;