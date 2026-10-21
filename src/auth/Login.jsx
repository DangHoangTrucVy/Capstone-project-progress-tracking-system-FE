import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { call } from "../services/formationService";
import GoogleSignInButton from "./GoogleSignInButton";
import "../pages/FormationDashboard.css";

export default function Login() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    call("googleConfig").then(setConfig).catch(() => setConfig({ enabled: false }));
  }, []);
  async function signIn(name, body) {
    setBusy(true); setError("");
    try {
      const result = await call(name, { body });
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("role", result.user.role);
      navigate(result.user.role === "ADMIN" ? "/admin/dashboard"
        : result.user.role === "LECTURER" ? "/moderator/dashboard" : "/student/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Đăng nhập thất bại.");
    } finally { setBusy(false); }
  }
  return <main className="formation login-card">
    <h1>Đăng nhập Website ghép nhóm</h1>
    <p>Admin và Moderator đăng nhập bằng mật khẩu. Sinh viên đăng nhập Google bằng email trong danh sách Admin đã import.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <form onSubmit={e => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      signIn("login", { email: data.get("email").trim(), password: data.get("password") });
    }}>
      <h2>Admin / Moderator</h2>
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label>
      <button disabled={busy}>Đăng nhập</button>
    </form>
    <section><h2>Sinh viên</h2>
      <p>Dùng Google cá nhân đã có trong danh sách. Không dùng tài khoản @fpt.edu.vn. Liên hệ Admin nếu chưa được nhập danh sách.</p>
      {config?.enabled ? <GoogleSignInButton clientId={config.clientId}
        onCredential={idToken => signIn("google", { idToken })}
        onError={setError} disabled={busy} />
        : <p>{config ? "Máy chủ chưa cấu hình đăng nhập Google." : "Đang tải..."}</p>}
    </section>
  </main>;
}
