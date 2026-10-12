export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function saveSession(token, user) {
  if (token) localStorage.setItem("token", token);
  if (user?.email) localStorage.setItem("userEmail", user.email);
  if (user?.name) localStorage.setItem("userName", user.name);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  ["token", "userEmail", "userName", "user", "suggestions"].forEach((key) => localStorage.removeItem(key));
}

export function parseGoals(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim());
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string" && item.trim());
    if (typeof parsed === "string") value = parsed;
  } catch (_) {
    // Older records may contain comma-separated goals instead of a JSON array.
  }
  return value.split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

export function isProfileComplete(user) {
  return Boolean(
    user && Number.isFinite(Number(user.age)) && Number(user.age) > 0 &&
    Number.isFinite(Number(user.weight)) && Number(user.weight) > 0 &&
    typeof user.gender === "string" && user.gender.trim()
  );
}
