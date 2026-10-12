import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { getApiError } from "../api";
import { isProfileComplete } from "../session";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const { token, user } = response.data || {};
      if (!token || !user?.email) throw new Error("The server signed you in but did not return a valid session. Please restart the backend and try again.");
      login(user, token);
      const intendedPath = location.state?.from?.pathname;
      navigate(intendedPath || (isProfileComplete(user) ? "/profile" : "/profile/create"), { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't sign you in. Check your email and password, then try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nc-auth-wrap">
      <aside className="nc-auth-aside">
        <button className="nc-brand" onClick={() => navigate("/")} style={{ border: 0, background: "transparent", padding: 0 }}><span className="nc-brand-mark">✳</span><span>nutricare.</span></button>
        <div className="nc-auth-aside-content"><div className="nc-eyebrow"><span className="nc-eyebrow-dot"></span> Your wellbeing, in focus</div><h1>A healthier routine starts with <span style={{ color: "#276b52", fontStyle: "italic" }}>you.</span></h1><p>Bring your goals, meal ideas, and everyday wellness reminders into one calm, easy-to-use space.</p></div>
        <div className="nc-auth-note">A little progress, repeated daily, can make a difference.</div>
      </aside>
      <section className="nc-auth-panel"><div className="nc-auth-card">
        <button className="nc-brand" onClick={() => navigate("/")} style={{ border: 0, background: "transparent", padding: 0, marginBottom: 36 }}><span className="nc-brand-mark">✳</span><span>nutricare.</span></button>
        <h2>Welcome back</h2><p className="nc-auth-subtitle">Sign in to pick up where you left off.</p>
        {error && <div className="nc-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
        <form className="nc-form" onSubmit={handleLogin}>
          <div className="nc-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required /></div>
          <div className="nc-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} autoComplete="current-password" required /></div>
          <button className="nc-btn nc-btn-primary" type="submit" disabled={loading}>{loading ? "Signing you in…" : "Sign in securely"} <span>↗</span></button>
        </form>
        <div className="nc-auth-switch">New to NutriCare? <button onClick={() => navigate("/signup")}>Create an account</button></div>
        <p className="nc-help" style={{ textAlign: "center", marginTop: 28 }}>Your personal information should be kept private and secure.</p>
      </div></section>
    </main>
  );
}
