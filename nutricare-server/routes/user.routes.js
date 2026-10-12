const jwt = require("jsonwebtoken");
const db = require("../models");

const User = db.user;
const JWT_SECRET = process.env.JWT_SECRET || "nutricare-local-development-secret-change-me";

function authenticate(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return res.status(401).json({ message: "Please sign in to access your profile." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = Number(payload.id || payload.userId || payload.sub);
    if (!Number.isInteger(userId) || userId < 1) throw new Error("Token does not contain a valid user id.");
    req.auth = { userId, email: payload.email || "" };
    return next();
  } catch (_) {
    return res.status(401).json({ message: "Your session is invalid or has expired. Please sign in again." });
  }
}

function publicUser(user) {
  const result = user.toJSON();
  delete result.password;
  return result;
}

function parseGoals(value) {
  if (Array.isArray(value)) return [...new Set(value.filter((goal) => typeof goal === "string").map((goal) => goal.trim()).filter(Boolean))];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parseGoals(parsed);
    if (typeof parsed === "string") value = parsed;
  } catch (_) {
    // Support older comma-separated records.
  }
  return [...new Set(value.split(",").map((goal) => goal.trim().replace(/^"|"$/g, "")).filter(Boolean))];
}

async function getCurrentUser(req, res) {
  const user = await User.findByPk(req.auth.userId);
  if (!user) {
    res.status(404).json({ message: "Your account could not be found. Please sign in again." });
    return null;
  }
  return user;
}

async function updateCurrentProfile(req, res) {
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return;
    const body = req.body || {};
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, "age")) {
      const age = Number(body.age);
      if (!Number.isInteger(age) || age < 1 || age > 120) return res.status(400).json({ message: "Age must be a whole number between 1 and 120." });
      updates.age = age;
    }
    if (Object.prototype.hasOwnProperty.call(body, "weight")) {
      const weight = Number(body.weight);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 500) return res.status(400).json({ message: "Weight must be a number greater than 0 and no more than 500 kg." });
      updates.weight = weight;
    }
    if (Object.prototype.hasOwnProperty.call(body, "gender")) {
      const gender = typeof body.gender === "string" ? body.gender.trim().toLowerCase() : "";
      if (!["female", "male", "other"].includes(gender)) return res.status(400).json({ message: "Please choose a gender option from the list." });
      updates.gender = gender;
    }

    const conditions =
  body.conditions && typeof body.conditions === "object"
    ? body.conditions
    : {};

for (const key of [
  "diabetes",
  "bp",
  "cholesterol",
  "thyroid_condition",
  "pcos_pcod",
  "anemia",
  "kidney_disease",
]) {
  if (typeof body[key] === "boolean") {
    updates[key] = body[key];
  } else if (typeof conditions[key] === "boolean") {
    updates[key] = conditions[key];
  }
}
// Optional height
if (Object.prototype.hasOwnProperty.call(body, "height_cm")) {
  if (body.height_cm === null || body.height_cm === "") {
    updates.height_cm = null;
  } else {
    const height = Number(body.height_cm);

    if (!Number.isFinite(height) || height < 50 || height > 260) {
      return res.status(400).json({
        message: "Height must be between 50 and 260 cm.",
      });
    }

    updates.height_cm = height;
  }
}

// Activity level
if (Object.prototype.hasOwnProperty.call(body, "activity_level")) {
  const allowed = ["sedentary", "light", "moderate", "high"];

  if (!allowed.includes(body.activity_level)) {
    return res.status(400).json({
      message: "Please select a valid activity level.",
    });
  }

  updates.activity_level = body.activity_level;
}

// Dietary preference
if (Object.prototype.hasOwnProperty.call(body, "dietary_preference")) {
  const allowed = [
    "no_preference",
    "vegetarian",
    "eggetarian",
    "vegan",
    "non_vegetarian",
  ];

  if (!allowed.includes(body.dietary_preference)) {
    return res.status(400).json({
      message: "Please select a valid dietary preference.",
    });
  }

  updates.dietary_preference = body.dietary_preference;
}

// Number of meals
if (Object.prototype.hasOwnProperty.call(body, "meals_per_day")) {
  if (body.meals_per_day === null || body.meals_per_day === "") {
    updates.meals_per_day = null;
  } else {
    const count = Number(body.meals_per_day);

    if (!Number.isInteger(count) || count < 2 || count > 6) {
      return res.status(400).json({
        message: "Meals per day must be between 2 and 6.",
      });
    }

    updates.meals_per_day = count;
  }
}

// Optional text preferences
for (const key of [
  "food_allergies",
  "foods_to_avoid",
  "other_conditions",
  "cuisine_preference",
]) {
  if (Object.prototype.hasOwnProperty.call(body, key)) {
    const value =
      body[key] == null ? "" : String(body[key]).trim();

    if (value.length > 2000) {
      return res.status(400).json({
        message: `${key} is too long.`,
      });
    }

    updates[key] = value || null;
  }
}
    if (Object.prototype.hasOwnProperty.call(body, "goals")) updates.goals = parseGoals(body.goals);
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim().slice(0, 100);

    await user.update(updates);
    return res.status(200).json({ message: "Profile saved successfully.", user: publicUser(user) });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "We couldn't save your profile. Please try again." });
  }
}

module.exports = (app) => {
  // Authenticated, current-user-only profile endpoints used by the React client.
  app.get("/api/profile", authenticate, async (req, res) => {
    try {
      const user = await getCurrentUser(req, res);
      if (user) return res.status(200).json({ user: publicUser(user) });
    } catch (error) {
      console.error("Profile fetch error:", error);
      return res.status(500).json({ message: "We couldn't load your profile. Please try again." });
    }
  });

  app.put("/api/profile", authenticate, updateCurrentProfile);

  // Backwards-compatible routes for older screens in this project. These operate
  // on the authenticated account only and never trust an email from the browser.
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const user = await getCurrentUser(req, res);
      if (user) return res.status(200).json([publicUser(user)]);
    } catch (error) {
      console.error("Current user fetch error:", error);
      return res.status(500).json({ message: "We couldn't load your account." });
    }
  });

  app.get("/api/users/:email", authenticate, async (req, res) => {
    try {
      const user = await getCurrentUser(req, res);
      if (!user) return;
      const requestedEmail = decodeURIComponent(req.params.email || "").trim().toLowerCase();
      if (requestedEmail && requestedEmail !== user.email.toLowerCase()) {
        return res.status(403).json({ message: "You can only view your own profile." });
      }
      return res.status(200).json(publicUser(user));
    } catch (error) {
      console.error("Legacy profile fetch error:", error);
      return res.status(500).json({ message: "We couldn't load your profile." });
    }
  });

  app.post("/api/users", authenticate, updateCurrentProfile);
};
