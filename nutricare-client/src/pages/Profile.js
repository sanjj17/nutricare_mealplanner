
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { getApiError } from "../api";
import {
  getStoredUser,
  isProfileComplete,
  parseGoals,
} from "../session";
import { useAuth } from "../context/AuthContext";
import { generatePDFReport } from "./pdfGenerator";
import foodData from "../FoodData";

const DIET_LABELS = {
  no_preference: "No specific preference",
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  vegan: "Vegan",
  non_vegetarian: "Non-vegetarian",
};

const ACTIVITY_LABELS = {
  sedentary: "Mostly sitting",
  light: "Light activity",
  moderate: "Moderately active",
  high: "Very active",
};

const GOAL_LABELS = {
  lose_weight: "Weight management",
  weight_loss: "Weight management",
  gain_weight: "Healthy weight gain",
  muscle_gain: "Muscle gain",
  maintain_health: "Everyday wellness",
  healthy_lifestyle: "Everyday wellness",
  "stay healthy": "Everyday wellness",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FALLBACK_MEALS = {
  breakfast: {
    name: "Balanced breakfast",
    description:
      "Choose a breakfast with grains and a suitable protein source.",
  },
  lunch: {
    name: "Dal, vegetables and grains",
    description:
      "A home-style meal with vegetables and a protein source.",
  },
  dinner: {
    name: "Vegetable and lentil meal",
    description:
      "A balanced dinner that can be adapted to your preferences.",
  },
  snack: {
    name: "Fruit or another suitable snack",
    description:
      "Choose a snack that fits your preferences and nutritional needs.",
  },
};

const ALLERGY_GROUPS = {
  peanut: ["peanut", "groundnut"],
  peanuts: ["peanut", "groundnut"],
  groundnut: ["peanut", "groundnut"],
  dairy: [
    "milk", "curd", "yogurt", "yoghurt", "paneer",
    "cheese", "ghee", "butter", "dairy",
  ],
  milk: [
    "milk", "curd", "yogurt", "yoghurt", "paneer",
    "cheese", "ghee", "butter", "dairy",
  ],
  lactose: ["milk", "curd", "yogurt", "yoghurt", "dairy"],
  gluten: [
    "wheat", "gluten", "roti", "phulka",
    "paratha", "dalia", "broken wheat", "bread",
  ],
  wheat: [
    "wheat", "roti", "phulka",
    "paratha", "dalia", "broken wheat", "bread",
  ],
  soy: ["soy", "soya", "tofu"],
  egg: ["egg", "eggs"],
  eggs: ["egg", "eggs"],
  nuts: [
    "almond", "walnut", "cashew", "pistachio",
    "hazelnut", "pecan", "macadamia", "tree nuts",
  ],
  almond: ["almond", "almonds"],
  almonds: ["almond", "almonds"],
  walnut: ["walnut", "walnuts"],
  walnuts: ["walnut", "walnuts"],
  cashew: ["cashew", "cashews"],
  sesame: ["sesame", "til"],
  fish: ["fish"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "lobster"],
};

function formatGoal(goal) {
  return (
    GOAL_LABELS[goal] ||
    String(goal)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;

  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(
    `(^|[^a-z])${escaped}([^a-z]|$)`,
    "i"
  ).test(text);
}

function getMealText(item) {
  const ingredients = Array.isArray(item?.ingredients)
    ? item.ingredients
    : [];

  const allergens = Array.isArray(item?.allergens)
    ? item.allergens
    : [];

  return [
    item?.name,
    item?.description,
    ...ingredients,
    ...allergens,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function hasAllergyConflict(item, allergies) {
  if (!allergies.length) return false;

  const text = getMealText(item);

  return allergies.some((allergy) => {
    const terms = ALLERGY_GROUPS[allergy] || [allergy];

    return terms.some((term) => containsPhrase(text, term));
  });
}

function shouldAvoidMeal(item, foodsToAvoid) {
  if (!foodsToAvoid.length) return false;

  const text = getMealText(item);

  return foodsToAvoid.some((food) =>
    containsPhrase(text, food)
  );
}

function matchesDiet(item, preference) {
  if (!preference || preference === "no_preference") {
    return true;
  }

  const explicitDietTypes = Array.isArray(item?.dietTypes)
    ? item.dietTypes.map((type) => String(type).toLowerCase())
    : null;

  if (explicitDietTypes) {
    if (preference === "vegan") {
      return explicitDietTypes.includes("vegan");
    }

    if (preference === "vegetarian") {
      return (
        explicitDietTypes.includes("vegetarian") ||
        explicitDietTypes.includes("vegan")
      );
    }

    if (preference === "eggetarian") {
      return (
        explicitDietTypes.includes("vegetarian") ||
        explicitDietTypes.includes("vegan") ||
        explicitDietTypes.includes("eggetarian")
      );
    }

    return true;
  }

  // Compatibility with older FoodData.js records.
  const text = getMealText(item);

  const meatOrFish = [
    "chicken", "mutton", "fish", "prawn", "shrimp",
    "seafood", "beef", "pork", "meat",
  ].some((word) => containsPhrase(text, word));

  const containsEgg = containsPhrase(text, "egg");

  const containsDairy = [
    "milk", "curd", "yogurt", "yoghurt", "paneer",
    "cheese", "ghee", "butter", "dairy",
  ].some((word) => containsPhrase(text, word));

  if (preference === "vegan") {
    return !meatOrFish && !containsEgg && !containsDairy;
  }

  if (preference === "vegetarian") {
    return !meatOrFish && !containsEgg;
  }

  if (preference === "eggetarian") {
    return !meatOrFish;
  }

  // The non-vegetarian category can include all food types.
  return true;
}

function makeMealEntry(item, mealType) {
  const fallback = FALLBACK_MEALS[mealType];

  if (!item) {
    return {
      name: fallback.name,
      description: fallback.description,
      ingredients: [],
      benefits: [],
      serving: "",
    };
  }

  let description = item.description || "";

  if (
    !description &&
    Array.isArray(item.benefits) &&
    item.benefits.length
  ) {
    description = item.benefits.join(", ");
  }

  if (!description) {
    description = `A ${mealType} idea for your weekly routine.`;
  }

  return {
    name: item.name || fallback.name,
    description,
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients
      : [],
    benefits: Array.isArray(item.benefits)
      ? item.benefits
      : [],
    serving:
      item.serving ||
      "Adjust portions to your appetite and individual needs.",
  };
}

function chooseFromPool(pool, dayIndex, offset = 0) {
  if (!pool.length) return null;

  return pool[(dayIndex + offset) % pool.length];
}

function formatGender(gender) {
  if (!gender) return "Not added";

  return String(gender)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllTips, setShowAllTips] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/profile");
      const user = response.data?.user || response.data;

      if (!user || !user.email) {
        throw new Error(
          "The server returned an incomplete profile. Please restart the backend and try again."
        );
      }

      setUserData(user);

      localStorage.setItem("userEmail", user.email);

      if (user.name) {
        localStorage.setItem("userName", user.name);
      }

      localStorage.setItem("user", JSON.stringify(user));

      if (!isProfileComplete(user)) {
        navigate("/profile/create", { replace: true });
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();

        navigate("/login", {
          replace: true,
          state: {
            message: "Your session expired. Please sign in again.",
          },
        });

        return;
      }

      setError(
        getApiError(
          requestError,
          "We couldn't load your profile. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, logout]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    loadProfile();
  }, [loadProfile, navigate, refreshKey]);

  const goals = useMemo(
    () => parseGoals(userData?.goals),
    [userData]
  );

  const conditions = useMemo(() => {
    if (!userData) return [];

    return [
      userData.diabetes && "Diabetes",
      userData.bp && "High blood pressure",
      userData.cholesterol && "High cholesterol",
      userData.thyroid_condition && "Thyroid condition",
      userData.pcos_pcod && "PCOS / PCOD",
      userData.anemia && "Anaemia",
      userData.kidney_disease && "Kidney disease",
      userData.other_conditions?.trim(),
    ].filter(Boolean);
  }, [userData]);

  const suggestions = useMemo(() => {
    if (!userData) return [];

    const tips = [];

    if (userData.diabetes) {
      tips.push(
        "Choose balanced meals with fibre-rich foods and keep added sugars in check."
      );
    }

    if (userData.bp) {
      tips.push(
        "Check sodium levels in packaged foods and seasonings."
      );
    }

    if (userData.cholesterol) {
      tips.push(
        "Consider fibre-rich foods such as oats, beans, fruit and vegetables."
      );
    }

    if (
      goals.some((goal) =>
        ["lose_weight", "weight_loss"].includes(goal)
      )
    ) {
      tips.push(
        "Focus on consistent meals and portions suited to your needs rather than skipping meals."
      );
    }

    if (
      goals.some((goal) =>
        ["gain_weight", "muscle_gain"].includes(goal)
      )
    ) {
      tips.push(
        "Plan regular meals and snacks with varied sources of energy and protein."
      );
    }

    if (
      goals.some((goal) =>
        [
          "maintain_health",
          "healthy_lifestyle",
          "stay healthy",
        ].includes(goal)
      )
    ) {
      tips.push(
        "Build a routine around varied meals, hydration, movement and restful sleep."
      );
    }

    if (userData.food_allergies) {
      tips.push(
        "Review ingredient labels and cross-contact warnings even when a meal idea appears to match your allergy preferences."
      );
    }

    if (userData.kidney_disease) {
      tips.push(
        "For kidney disease, follow guidance from your renal care team or registered dietitian rather than relying on a general meal plan."
      );
    }

    if (!tips.length) {
      tips.push(
        "Start with varied meals, regular mealtimes, hydration and habits you can sustain."
      );
    }

    return tips;
  }, [userData, goals]);

  const weeklyPlan = useMemo(() => {
    if (!userData) return [];

    const preferences = [...goals];

    if (Number(userData.age) > 50) {
      preferences.push("age_above_50");
    }

    const allFood = Array.isArray(foodData) ? foodData : [];
    const allergies = parseList(userData.food_allergies);
    const foodsToAvoid = parseList(userData.foods_to_avoid);
    const dietPreference =
      userData.dietary_preference || "no_preference";

    // Exclude explicit allergy conflicts, avoided ingredients and
    // incompatible food preferences before making the weekly plan.
    const filteredFood = allFood.filter((item) => {
      if (!item?.name || !item?.meal) return false;

      if (!matchesDiet(item, dietPreference)) {
        return false;
      }

      if (hasAllergyConflict(item, allergies)) {
        return false;
      }

      if (shouldAvoidMeal(item, foodsToAvoid)) {
        return false;
      }

      return true;
    });

    const makePool = (mealType) => {
      const pool = filteredFood.filter(
        (item) => item.meal === mealType
      );

      const matched = pool.filter(
        (item) =>
          Array.isArray(item.suitableFor) &&
          item.suitableFor.some((tag) =>
            preferences.includes(tag)
          )
      );

      // Prefer goal matches, but allow other preference-compatible
      // foods when there are no goal-tagged matches.
      return matched.length ? matched : pool;
    };

    const mealPools = {
      breakfast: makePool("breakfast"),
      lunch: makePool("lunch"),
      dinner: makePool("dinner"),
      snack: makePool("snack"),
    };

    return DAY_NAMES.map((day, dayIndex) => {
      const breakfast = makeMealEntry(
        chooseFromPool(mealPools.breakfast, dayIndex),
        "breakfast"
      );

      const lunch = makeMealEntry(
        chooseFromPool(mealPools.lunch, dayIndex, 2),
        "lunch"
      );

      const dinner = makeMealEntry(
        chooseFromPool(mealPools.dinner, dayIndex, 4),
        "dinner"
      );

      const snack = makeMealEntry(
        chooseFromPool(mealPools.snack, dayIndex, 1),
        "snack"
      );

      // The main meal properties remain strings for compatibility
      // with the existing PDF generator.
      return {
        day,

        breakfast: breakfast.name,
        lunch: lunch.name,
        dinner: dinner.name,
        snack: snack.name,

        breakfastDescription: breakfast.description,
        lunchDescription: lunch.description,
        dinnerDescription: dinner.description,
        snackDescription: snack.description,

        breakfastIngredients: breakfast.ingredients,
        lunchIngredients: lunch.ingredients,
        dinnerIngredients: dinner.ingredients,
        snackIngredients: snack.ingredients,

        breakfastServing: breakfast.serving,
        lunchServing: lunch.serving,
        dinnerServing: dinner.serving,
        snackServing: snack.serving,

        breakfastBenefits: breakfast.benefits,
        lunchBenefits: lunch.benefits,
        dinnerBenefits: dinner.benefits,
        snackBenefits: snack.benefits,
      };
    });
  }, [userData, goals]);

  const selectedDayIndex = weeklyPlan.length
    ? Math.min(activeDayIndex, weeklyPlan.length - 1)
    : 0;

  const activeDay = weeklyPlan[selectedDayIndex];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleReport = () => {
    setPdfMessage("");

    try {
      if (!userData || !weeklyPlan.length) {
        throw new Error(
          "Your profile is still loading. Please try again."
        );
      }

      generatePDFReport(userData, weeklyPlan);

      setPdfMessage(
        "Your wellness report has been prepared for download."
      );
    } catch (reportError) {
      setPdfMessage(
        reportError.message ||
          "The PDF could not be generated. Please try again."
      );
    }
  };

  const storedUser = getStoredUser();

  const displayName =
    userData?.name ||
    storedUser?.name ||
    localStorage.getItem("userName") ||
    "there";

  const firstName = String(displayName).trim().split(/\s+/)[0];
  const hasRealName = displayName !== "there";

  const displayGoals = goals.length
    ? goals.map(formatGoal).join(", ")
    : "Everyday wellness";

  const genderLabel = formatGender(userData?.gender);

  const renderMeal = (day, key, label, icon) => {
    const ingredients = day[`${key}Ingredients`] || [];
    const benefits = day[`${key}Benefits`] || [];
    const description = day[`${key}Description`] || "";
    const serving = day[`${key}Serving`] || "";

    return (
      <article className="nc-meal-card" key={key}>
        <div className="nc-meal-card-top">
          <span className="nc-meal-icon">{icon}</span>
          <span className="nc-meal-label">{label}</span>
        </div>

        <h3>{day[key]}</h3>

        {description && (
          <p className="nc-meal-summary">{description}</p>
        )}

        <details className="nc-meal-extra">
          <summary>View meal details</summary>

          {ingredients.length > 0 && (
            <div className="nc-meal-detail-section">
              <strong>Ingredients</strong>
              <p>{ingredients.join(", ")}</p>
            </div>
          )}

          {benefits.length > 0 && (
            <div className="nc-meal-detail-section">
              <strong>Notes</strong>
              <p>{benefits.join(", ")}</p>
            </div>
          )}

          {serving && (
            <div className="nc-meal-detail-section">
              <strong>Serving suggestion</strong>
              <p>{serving}</p>
            </div>
          )}
        </details>
      </article>
    );
  };

  if (loading) {
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
          </div>
        </header>

        <div className="nc-dash-main">
          <div className="nc-empty">
            <strong>Preparing your dashboard…</strong>
            Loading your saved profile and meal ideas.
          </div>
        </div>
      </main>
    );
  }

  if (error) {
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
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <div className="nc-dash-main">
          <div className="nc-empty">
            <strong>We couldn't open your dashboard</strong>
            <p>{error}</p>

            <div
              className="nc-dashboard-actions"
              style={{ justifyContent: "center" }}
            >
              <button
                className="nc-btn nc-btn-primary"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Try again ↻
              </button>

              <button
                className="nc-btn nc-btn-light"
                onClick={() => navigate("/profile/create")}
              >
                Complete profile
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

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

          <div className="nc-dash-user">
            <span>{userData.email}</span>

            <div
              className="nc-user-avatar"
              aria-label={
                hasRealName ? `${displayName}'s account` : "Account"
              }
            >
              {hasRealName
                ? firstName.charAt(0).toUpperCase()
                : "✳"}
            </div>

            <button
              className="nc-btn nc-btn-light"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="nc-dash-main">
        <div className="nc-dash-heading">
          <div>
            <div className="nc-eyebrow">
              <span className="nc-eyebrow-dot" />
              Your wellness snapshot
            </div>

            <h1>Hello, {firstName} 🌿</h1>

            <p>
              A few small steps today can support the habits you're building.
            </p>
          </div>

          <button
            className="nc-btn nc-btn-primary"
            onClick={() => navigate("/profile/create")}
          >
            Edit my profile <span>↗</span>
          </button>
        </div>

        {location.state?.notice && (
          <div
            className="nc-success"
            role="status"
            style={{ marginBottom: 18 }}
          >
            {location.state.notice}
          </div>
        )}

        <div className="nc-stat-grid">
          <div className="nc-stat">
            <div className="nc-stat-label">AGE</div>
            <div className="nc-stat-value">
              {userData.age ?? "—"}{" "}
              <span style={{ fontSize: 12, fontWeight: 600 }}>yrs</span>
            </div>
            <div className="nc-stat-note">Your profile details</div>
          </div>

          <div className="nc-stat">
            <div className="nc-stat-label">WEIGHT</div>
            <div className="nc-stat-value">
              {userData.weight ?? "—"}{" "}
              <span style={{ fontSize: 12, fontWeight: 600 }}>kg</span>
            </div>
            <div className="nc-stat-note">For your own tracking</div>
          </div>

          <div className="nc-stat">
            <div className="nc-stat-label">FOCUS</div>
            <div
              className="nc-stat-value"
              style={{ fontSize: 18, marginTop: 4 }}
            >
              {goals.length
                ? `${goals.length} ${
                    goals.length === 1 ? "goal" : "goals"
                  }`
                : "Everyday wellness"}
            </div>
            <div className="nc-stat-note">
              Personalised to your priorities
            </div>
          </div>
        </div>

        <div className="nc-dashboard-grid">
          <div className="nc-card">
            <div className="nc-card-head">
              <div>
                <h2>Your weekly meal inspiration</h2>
                <p>Choose a day to explore its meals</p>
              </div>
              <span className="nc-tag">7 DAYS</span>
            </div>

            <div
              className="nc-day-selector"
              role="group"
              aria-label="Choose a day"
            >
              {weeklyPlan.map((day, index) => (
                <button
                  key={day.day}
                  type="button"
                  className={`nc-day-tab ${
                    selectedDayIndex === index ? "active" : ""
                  }`}
                  aria-pressed={selectedDayIndex === index}
                  onClick={() => setActiveDayIndex(index)}
                >
                  <span className="nc-day-tab-name">{day.day}</span>
                  <span className="nc-day-tab-caption">
                    {selectedDayIndex === index
                      ? "Selected"
                      : "View meals"}
                  </span>
                </button>
              ))}
            </div>

            {activeDay && (
              <section className="nc-selected-day">
                <div className="nc-selected-day-heading">
                  <div>
                    <h3>{activeDay.day}'s meal plan</h3>
                    <p>
                      Four meal ideas, with details available when you need them.
                    </p>
                  </div>

                  <span className="nc-tag">4 MEALS</span>
                </div>

                <div className="nc-meal-card-grid">
                  {renderMeal(activeDay, "breakfast", "Breakfast", "☀")}
                  {renderMeal(activeDay, "lunch", "Lunch", "◉")}
                  {renderMeal(activeDay, "dinner", "Dinner", "☾")}
                  {renderMeal(activeDay, "snack", "Snack", "✳")}
                </div>
              </section>
            )}

            <p className="nc-help">
              These meals are general wellness inspiration, not a prescribed
              diet. Allergy filtering relies on the available ingredient data;
              always verify ingredients and cross-contact warnings. Consult a
              qualified healthcare professional for condition-specific advice.
            </p>

            <div className="nc-dashboard-actions">
              <button
                className="nc-btn nc-btn-primary"
                onClick={handleReport}
              >
                Download wellness report ↓
              </button>

              <button
                className="nc-btn nc-btn-light"
                onClick={() => navigate("/profile/create")}
              >
                Update details
              </button>
            </div>

            {pdfMessage && (
              <p className="nc-help" role="status">
                {pdfMessage}
              </p>
            )}
          </div>

          <aside className="nc-profile-sidebar">
            <div className="nc-card">
              <div className="nc-card-head">
                <div>
                  <h2>Your profile</h2>
                  <p>A quick look at what matters to you</p>
                </div>
                <span style={{ fontSize: 23 }}>✳</span>
              </div>

              <div
                className="nc-profile-list"
                style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
              >
                <div className="nc-profile-item">
                  <small>Gender</small>
                  <strong>{genderLabel}</strong>
                </div>

                <div className="nc-profile-item">
                  <small>Height</small>
                  <strong>
                    {userData.height_cm
                      ? `${userData.height_cm} cm`
                      : "Not added"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Activity level</small>
                  <strong>
                    {ACTIVITY_LABELS[userData.activity_level] ||
                      "Not specified"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Dietary preference</small>
                  <strong>
                    {DIET_LABELS[userData.dietary_preference] ||
                      "No specific preference"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Goals</small>
                  <strong>{displayGoals}</strong>
                </div>

                <div className="nc-profile-item">
                  <small>Health considerations</small>
                  <strong>
                    {conditions.length
                      ? conditions.join(", ")
                      : "None selected"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Food allergies</small>
                  <strong>
                    {userData.food_allergies || "None listed"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Foods to avoid</small>
                  <strong>
                    {userData.foods_to_avoid || "None specified"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Preferred cuisine</small>
                  <strong>
                    {userData.cuisine_preference || "No preference"}
                  </strong>
                </div>

                <div className="nc-profile-item">
                  <small>Meals per day</small>
                  <strong>
                    {userData.meals_per_day || "Not specified"}
                  </strong>
                </div>
              </div>

              <button
                className="nc-btn nc-btn-light"
                style={{ width: "100%", marginTop: 16 }}
                onClick={() => navigate("/profile/create")}
              >
                Edit profile ↗
              </button>
            </div>

            <div className="nc-card">
              <div className="nc-card-head">
                <div>
                  <h2>Gentle reminders</h2>
                  <p>Ideas to keep in mind</p>
                </div>
                <span style={{ fontSize: 23 }}>🌱</span>
              </div>

              <ul className="nc-tip-list">
                {(showAllTips
                  ? suggestions
                  : suggestions.slice(0, 4)
                ).map((tip, index) => (
                  <li key={index}>
                    <span className="nc-tip-check">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              {suggestions.length > 4 && (
                <button
                  className="nc-btn nc-btn-ghost"
                  style={{ marginTop: 12, paddingLeft: 0 }}
                  onClick={() => setShowAllTips((value) => !value)}
                >
                  {showAllTips ? "Show fewer" : "Show all reminders"} ↗
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
