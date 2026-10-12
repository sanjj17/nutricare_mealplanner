import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const signedIn = Boolean(localStorage.getItem("token"));
  const startPlan = () => navigate(signedIn ? "/profile" : "/signup");

  return (
    <main className="nc-page">
      <nav className="nc-nav">
        <button className="nc-brand" onClick={() => navigate("/")} aria-label="NutriCare home" style={{ border: 0, background: "transparent", padding: 0 }}>
          <span className="nc-brand-mark">✳</span><span>nutricare<span style={{ color: "#7fa782" }}>.</span></span>
        </button>
        <div className="nc-nav-links"><a href="#approach">Our approach</a><a href="#features">What you'll get</a></div>
        <div className="nc-nav-actions">
          <button className="nc-btn nc-btn-light" onClick={() => navigate(signedIn ? "/profile" : "/login")}>{signedIn ? "My dashboard" : "Log in"}</button>
          <button className="nc-btn nc-btn-primary" onClick={startPlan}>{signedIn ? "View my plan" : "Create your plan"} <span>↗</span></button>
        </div>
      </nav>

      <section className="nc-hero" id="approach">
        <div>
          <div className="nc-eyebrow"><span className="nc-eyebrow-dot"></span> A gentler way to eat well</div>
          <h1>Small choices.<br/><span>Better everyday</span> health.</h1>
          <p className="nc-hero-copy">Personalised nutrition guidance that fits real life. Build healthier routines, discover meal ideas, and keep your wellbeing goals in sight — one day at a time.</p>
          <div className="nc-hero-actions">
            <button className="nc-btn nc-btn-primary" onClick={startPlan}>{signedIn ? "Open my dashboard" : "Create your plan"} <span>↗</span></button>
            <button className="nc-btn nc-btn-light" onClick={() => navigate(signedIn ? "/profile" : "/login")}>{signedIn ? "Already signed in" : "I already have an account"}</button>
          </div>
          <div className="nc-trust">
            <div className="nc-avatar-stack"><span className="nc-avatar">🌿</span><span className="nc-avatar" style={{ background: "#e7c8ba" }}>🍋</span><span className="nc-avatar" style={{ background: "#d6e5d0" }}>🥑</span></div>
            <span><strong>Made for everyday life</strong><br/>Simple guidance, at your pace</span>
          </div>
        </div>
        <div className="nc-hero-art" aria-label="Illustration of a balanced bowl of nourishing foods">
          <span className="nc-sparkle nc-sparkle-one">✳</span><span className="nc-sparkle nc-sparkle-two">✦</span>
          <div className="nc-float-card nc-float-top"><small>Your daily reminder</small><strong>Progress, not perfection 🌱</strong></div>
          <div className="nc-art-plate"><span className="nc-art-food">🥗</span></div>
          <div className="nc-float-card nc-float-bottom"><small>Your wellness journey</small><strong>One good choice at a time</strong><div className="nc-progress"><span></span></div></div>
        </div>
      </section>

      <section className="nc-section" id="features" style={{ background: "#fff" }}>
        <div className="nc-section-inner">
          <div className="nc-section-heading"><div className="nc-eyebrow">A little support goes a long way</div><h2>Healthier habits, made simpler.</h2><p>Nutrition can feel overwhelming. NutriCare helps you bring the everyday essentials into focus with a plan shaped around your goals and preferences.</p></div>
          <div className="nc-feature-grid">
            <article className="nc-feature"><div className="nc-feature-icon">🥑</div><h3>Made for you</h3><p>Keep your goals and health considerations together to make your nutrition journey feel more personal.</p></article>
            <article className="nc-feature"><div className="nc-feature-icon">🍲</div><h3>Ideas for your week</h3><p>Explore simple meal ideas and build a more consistent routine around breakfast, lunch, and dinner.</p></article>
            <article className="nc-feature"><div className="nc-feature-icon">🌿</div><h3>Small steps that stick</h3><p>Keep practical wellness reminders close by and focus on progress you can sustain over time.</p></article>
          </div>
        </div>
      </section>

      <section className="nc-section"><div className="nc-section-inner nc-bottom-cta">
        <div><h2>Your next healthy habit starts here.</h2><p>Create your profile and make space for a more mindful daily routine.<br/>NutriCare offers general wellness guidance, not medical advice.</p></div>
        <button className="nc-btn" style={{ background: "#fff", color: "#194b3a", flexShrink: 0 }} onClick={startPlan}>{signedIn ? "Go to my dashboard" : "Start my plan"} ↗</button>
      </div></section>
      <footer className="nc-footer"><button className="nc-brand" onClick={() => navigate("/")} style={{ border: 0, background: "transparent", padding: 0 }}><span className="nc-brand-mark">✳</span><span>nutricare.</span></button><span>Personalised wellness, one day at a time.</span><span>© {new Date().getFullYear()} NutriCare</span></footer>
    </main>
  );
}
