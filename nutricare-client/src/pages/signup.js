import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/signup", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      const { token, user } = response.data || {};
      if (!token || !user?.email) throw new Error("The account was created but a session was not returned. Please try signing in.");
      login(user, token);
      navigate("/profile/create", { replace: true, state: { welcome: true } });
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't create your account. Please check your details and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nc-auth-wrap">
      <aside className="nc-auth-aside">
        <button className="nc-brand" onClick={() => navigate("/")} style={{ border: 0, background: "transparent", padding: 0 }}><span className="nc-brand-mark">✳</span><span>nutricare.</span></button>
        <div className="nc-auth-aside-content"><div className="nc-eyebrow"><span className="nc-eyebrow-dot"></span> Start where you are</div><h1>Build habits that feel <span style={{ color: "#276b52", fontStyle: "italic" }}>like you.</span></h1><p>A few details help us organise your goals and make your wellness dashboard more useful to you.</p></div>
        <div className="nc-auth-note">No perfection required. Just a place to begin.</div>
      </aside>
      <section className="nc-auth-panel"><div className="nc-auth-card">
        <button className="nc-brand" onClick={() => navigate("/")} style={{ border: 0, background: "transparent", padding: 0, marginBottom: 36 }}><span className="nc-brand-mark">✳</span><span>nutricare.</span></button>
        <h2>Create your account</h2><p className="nc-auth-subtitle">Join NutriCare and take the first step towards a more mindful routine.</p>
        {error && <div className="nc-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
        <form className="nc-form" onSubmit={handleSignup}>
          <div className="nc-field"><label htmlFor="signup-name">Your name</label><input id="signup-name" name="name" placeholder="How should we call you?" value={formData.name} onChange={handleChange} autoComplete="name" minLength="2" maxLength="100" required /></div>
          <div className="nc-field"><label htmlFor="signup-email">Email address</label><input id="signup-email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" required /></div>
          <div className="nc-field"><label htmlFor="signup-password">Create a password</label><input id="signup-password" type="password" name="password" placeholder="At least 8 characters" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength="8" required /><p className="nc-help">Use at least 8 characters for a stronger password.</p></div>
          <button className="nc-btn nc-btn-primary" type="submit" disabled={loading}>{loading ? "Creating your account…" : "Create account"} <span>↗</span></button>
        </form>
        <div className="nc-auth-switch">Already have an account? <button onClick={() => navigate("/login")}>Sign in</button></div>
        <p className="nc-help" style={{ textAlign: "center", marginTop: 25 }}>NutriCare provides general wellness information, not diagnosis or treatment.</p>
      </div></section>
    </main>
  );
}
