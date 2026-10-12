
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiError } from "../api";
import { isProfileComplete, parseGoals } from "../session";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  age: "",
  height_cm: "",
  weight: "",
  gender: "",
  activity_level: "",
  dietary_preference: "no_preference",
  food_allergies: "",
  foods_to_avoid: "",
  cuisine_preference: "",
  meals_per_day: "",
  other_conditions: "",
  diabetes: false,
  bp: false,
  cholesterol: false,
  thyroid_condition: false,
  pcos_pcod: false,
  anemia: false,
  kidney_disease: false,
  goals: [],
};

const GOAL_OPTIONS = [
  ["lose_weight", "Weight management"],
  ["gain_weight", "Healthy weight gain"],
  ["maintain_health", "Everyday wellness"],
];

const CONDITION_OPTIONS = [
  ["diabetes", "Diabetes"],
  ["bp", "High blood pressure"],
  ["cholesterol", "High cholesterol"],
  ["thyroid_condition", "Thyroid condition"],
  ["pcos_pcod", "PCOS / PCOD"],
  ["anemia", "Anaemia"],
  ["kidney_disease", "Kidney disease"],
];

const DIET_OPTIONS = [
  ["no_preference", "No specific preference"],
  ["vegetarian", "Vegetarian"],
  ["eggetarian", "Eggetarian"],
  ["vegan", "Vegan"],
  ["non_vegetarian", "Non-vegetarian"],
];

const ACTIVITY_OPTIONS = [
  ["sedentary", "Mostly sitting"],
  ["light", "Light activity"],
  ["moderate", "Moderately active"],
  ["high", "Very active"],
];

export default function CreateProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    api.get("/profile")
      .then((response) => {
        if (cancelled) return;

        const user = response.data?.user || response.data;
        if (!user) return;

        setHasExistingProfile(isProfileComplete(user));

        setForm({
          ...EMPTY_FORM,
          age: user.age ?? "",
          height_cm: user.height_cm ?? "",
          weight: user.weight ?? "",
          gender: user.gender || "",
          activity_level: user.activity_level || "",
          dietary_preference:
            user.dietary_preference || "no_preference",
          food_allergies: user.food_allergies || "",
          foods_to_avoid: user.foods_to_avoid || "",
          cuisine_preference: user.cuisine_preference || "",
          meals_per_day: user.meals_per_day ?? "",
          other_conditions: user.other_conditions || "",
          diabetes: Boolean(user.diabetes),
          bp: Boolean(user.bp),
          cholesterol: Boolean(user.cholesterol),
          thyroid_condition: Boolean(user.thyroid_condition),
          pcos_pcod: Boolean(user.pcos_pcod),
          anemia: Boolean(user.anemia),
          kidney_disease: Boolean(user.kidney_disease),
          goals: parseGoals(user.goals),
        });
      })
      .catch((requestError) => {
        if (cancelled) return;

        if (requestError.response?.status === 401) {
          logout();
          navigate("/login", {
            replace: true,
            state: {
              message: "Your session expired. Please sign in again.",
            },
          });
        } else {
          setError(
            getApiError(
              requestError,
              "We couldn't load your saved details. You can still enter your profile."
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, logout]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCondition = (event) => {
    const { name, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: checked,
    }));
  };

  const handleGoal = (event) => {
    const { value, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      goals: checked
        ? [...new Set([...previous.goals, value])]
        : previous.goals.filter((goal) => goal !== value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.age || !form.weight || !form.gender) {
      setError("Please enter your age, weight and gender.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        age: Number(form.age),
        height_cm: form.height_cm
          ? Number(form.height_cm)
          : null,
        weight: Number(form.weight),
        gender: form.gender,
        dietary_preference: form.dietary_preference,
        food_allergies: form.food_allergies.trim() || null,
        foods_to_avoid: form.foods_to_avoid.trim() || null,
        cuisine_preference:
          form.cuisine_preference.trim() || null,
        meals_per_day: form.meals_per_day
          ? Number(form.meals_per_day)
          : null,
        other_conditions:
          form.other_conditions.trim() || null,
        conditions: {
          diabetes: form.diabetes,
          bp: form.bp,
          cholesterol: form.cholesterol,
          thyroid_condition: form.thyroid_condition,
          pcos_pcod: form.pcos_pcod,
          anemia: form.anemia,
          kidney_disease: form.kidney_disease,
        },
        goals: form.goals,
      };

      // Do not submit an empty activity level.
      if (form.activity_level) {
        payload.activity_level = form.activity_level;
      }

      await api.put("/profile", payload);

      navigate("/profile", {
        replace: true,
        state: {
          notice: hasExistingProfile
            ? "Your profile was updated successfully."
            : "Your profile is ready. Welcome to NutriCare!",
        },
      });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
        navigate("/login", {
          replace: true,
          state: {
            message: "Your session expired. Please sign in again.",
          },
        });
      } else {
        setError(
          getApiError(
            requestError,
            "We couldn't save your profile. Please check your details and try again."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, placeholder, type = "text") => (
    <div className="nc-field" key={name}>
      <label htmlFor={`profile-${name}`}>{label}</label>
      <input
        id={`profile-${name}`}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <main className="nc-dashboard">
      <header className="nc-dash-nav">
        <div className="nc-dash-nav-inner">
          <button
            className="nc-brand"
            onClick={() => navigate("/")}
            style={{
              border: 0,
              background: "transparent",
              padding: 0,
            }}
          >
            <span className="nc-brand-mark">✳</span>
            <span>nutricare.</span>
          </button>

          <button
            className="nc-btn nc-btn-light"
            onClick={() =>
              navigate(hasExistingProfile ? "/profile" : "/")
            }
          >
            {hasExistingProfile ? "Back to dashboard" : "Back to home"}
          </button>
        </div>
      </header>

      <section className="nc-dash-main">
        <div
          className="nc-section-heading"
          style={{
            textAlign: "left",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          <div className="nc-eyebrow">Your starting point</div>
          <h2 style={{ marginTop: 14 }}>
            {hasExistingProfile
              ? "Update your profile."
              : "Let's make this personal."}
          </h2>
          <p>
            Tell us about your routines, food preferences and goals.
            You can leave optional details blank and update them later.
          </p>
        </div>

        <form
          className="nc-profile-form nc-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="nc-error" role="alert">
              {error}
            </div>
          )}

          {checkingProfile && (
            <div className="nc-help">
              Checking your saved details…
            </div>
          )}

          <div className="nc-form-section-title">About you</div>
          <div className="nc-form-grid">
            {field("Age (years)", "age", "e.g. 25", "number")}
            {field("Weight (kg)", "weight", "e.g. 65", "number")}
            {field(
              "Height (cm, optional)",
              "height_cm",
              "e.g. 165",
              "number"
            )}

            <div className="nc-field">
              <label htmlFor="profile-gender">Gender</label>
              <select
                id="profile-gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Choose an option</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>

            <div className="nc-field">
              <label htmlFor="profile-activity_level">
                Activity level (optional)
              </label>
              <select
                id="profile-activity_level"
                name="activity_level"
                value={form.activity_level}
                onChange={handleChange}
              >
                <option value="">Not specified</option>
                {ACTIVITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="nc-form-section-title">
            Health considerations
          </div>
          <p className="nc-help">
            Select conditions that apply to you. Share only what you
            are comfortable sharing.
          </p>

          <div className="nc-choice-grid">
            {CONDITION_OPTIONS.map(([key, label]) => (
              <label className="nc-choice" key={key}>
                <input
                  type="checkbox"
                  name={key}
                  checked={form[key]}
                  onChange={handleCondition}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {field(
            "Other health conditions (optional)",
            "other_conditions",
            "Enter any other conditions"
          )}

          <div className="nc-form-section-title">
            Food preferences
          </div>

          <div className="nc-form-grid">
            <div className="nc-field">
              <label htmlFor="profile-dietary_preference">
                Dietary preference
              </label>
              <select
                id="profile-dietary_preference"
                name="dietary_preference"
                value={form.dietary_preference}
                onChange={handleChange}
              >
                {DIET_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="nc-field">
              <label htmlFor="profile-cuisine_preference">
                Preferred cuisine (optional)
              </label>
              <select
                id="profile-cuisine_preference"
                name="cuisine_preference"
                value={form.cuisine_preference}
                onChange={handleChange}
              >
                <option value="">No preference</option>
                <option value="Indian">Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="North Indian">North Indian</option>
                <option value="Maharashtrian">Maharashtrian</option>
                <option value="Mixed">Mixed cuisines</option>
              </select>
            </div>

            <div className="nc-field">
              <label htmlFor="profile-meals_per_day">
                Meals per day (optional)
              </label>
              <select
                id="profile-meals_per_day"
                name="meals_per_day"
                value={form.meals_per_day}
                onChange={handleChange}
              >
                <option value="">No preference</option>
                {[2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} meals
                  </option>
                ))}
              </select>
            </div>
          </div>

          {field(
            "Food allergies (optional)",
            "food_allergies",
            "e.g. peanuts, milk, soy"
          )}

          <p className="nc-help">
            List known allergies separated by commas. NutriCare will
            use this information to filter meal ideas; always check
            ingredient labels and cross-contamination warnings.
          </p>

          {field(
            "Foods you prefer to avoid (optional)",
            "foods_to_avoid",
            "e.g. mushrooms, bitter gourd"
          )}

          <div className="nc-form-section-title">
            Your goals
          </div>

          <div className="nc-choice-grid">
            {GOAL_OPTIONS.map(([value, label]) => (
              <label className="nc-choice" key={value}>
                <input
                  type="checkbox"
                  value={value}
                  checked={form.goals.includes(value)}
                  onChange={handleGoal}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {form.kidney_disease && (
            <div className="nc-error" role="note">
              Nutrition needs for kidney disease depend on individual
              medical factors. Do not rely on general meal suggestions
              as a therapeutic diet; consult your renal care team or
              a registered dietitian.
            </div>
          )}

          <p className="nc-help">
            NutriCare provides general wellness inspiration, not
            diagnosis or treatment. For medical conditions, follow
            advice from your qualified healthcare professional.
          </p>

          <button
            className="nc-btn nc-btn-primary"
            type="submit"
            disabled={loading || checkingProfile}
          >
            {loading
              ? "Saving your profile…"
              : hasExistingProfile
                ? "Save changes"
                : "Save and view dashboard"}
            <span>↗</span>
          </button>
        </form>
      </section>
    </main>
  );
}
