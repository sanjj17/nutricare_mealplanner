const express = require("express");
const cors = require("cors");
const db = require("./models");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;
let databaseReady = false;

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(databaseReady ? 200 : 503).json({
    ok: databaseReady,
    service: "NutriCare API",
    database: databaseReady ? "connected" : "connecting or unavailable",
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (!databaseReady) return res.status(503).json({ message: "The database is not ready yet. Check the MySQL service and server terminal, then try again." });
  return next();
});

// Register each route group once. Signup/login only exist in auth.routes.js.
require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);

const server = app.listen(PORT, () => {
  console.log(`NutriCare API listening at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

db.sequelize.authenticate()
  .then(() => db.sequelize.sync())
  .then(() => {
    databaseReady = true;
    console.log("MySQL connected and Sequelize models are ready.");
  })
  .catch((error) => {
    databaseReady = false;
    console.error("Database connection/sync failed:", error.message);
    console.error("Check nutricare-server/.env and ensure MySQL is running with the configured database.");
  });

process.on("SIGINT", async () => {
  server.close(async () => {
    try { await db.sequelize.close(); } catch (_) {}
    process.exit(0);
  });
});
