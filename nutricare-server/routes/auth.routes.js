const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");

const User = db.user;
const JWT_SECRET = process.env.JWT_SECRET || "nutricare-local-development-secret-change-me";

function publicUser(user) {
  const result = user.toJSON();
  delete result.password;
  return result;
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

module.exports = (app) => {
  // Single source of truth for account creation. Do not duplicate this route in user.routes.js.
  app.post("/api/signup", async (req, res) => {
    try {
      const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body.password === "string" ? req.body.password : "";

      if (name.length < 2) return res.status(400).json({ message: "Please enter your name (at least 2 characters)." });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
      if (password.length < 8) return res.status(400).json({ message: "Please use a password with at least 8 characters." });

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(409).json({ message: "An account with this email already exists. Please log in instead." });

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, password: hashedPassword, goals: [] });
      return res.status(201).json({ message: "Account created successfully.", token: createToken(user), user: publicUser(user) });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "An account with this email already exists. Please log in instead." });
      }
      console.error("Signup error:", error);
      return res.status(500).json({ message: "We couldn't create your account because of a server error. Please try again." });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body.password === "string" ? req.body.password : "";
      if (!email || !password) return res.status(400).json({ message: "Enter your email address and password." });

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: "Email or password is incorrect." });

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) return res.status(401).json({ message: "Email or password is incorrect." });

      return res.status(200).json({ message: "Login successful.", token: createToken(user), user: publicUser(user) });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "We couldn't sign you in because of a server error. Please try again." });
    }
  });
};
