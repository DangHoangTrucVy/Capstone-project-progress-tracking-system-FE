import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./auth/Login";
import Home from "./components/Home";
import Support from "./components/Support";
import Privacy from "./components/Privacy";
import Contact from "./components/Contact";
import FormationDashboard from "./pages/FormationDashboard";
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Navigate to="/login" replace />} />
    <Route path="/support" element={<Support />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/contact" element={<Contact />} />
    <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
      <Route path="/admin/dashboard" element={<FormationDashboard />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={["LECTURER"]} />}>
      <Route path="/moderator/dashboard" element={<FormationDashboard />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
      <Route path="/student/dashboard" element={<FormationDashboard />} />
      <Route path="/leader/dashboard" element={<Navigate to="/student/dashboard" replace />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
