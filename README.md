# 🥗 NutriCare

**NutriCare** is a full-stack web app that turns a short health and lifestyle profile into a personalised **weekly meal plan**. Users sign up, describe their goals, diet, allergies and health considerations, and get a day-by-day plan of breakfast, lunch, dinner and a snack, which they can download as a PDF.

> NutriCare provides general wellness information only. It is **not medical advice** or a prescribed diet.

<!-- Add a screenshot or GIF here, e.g. ![Dashboard](docs/dashboard.png) -->

---

## ✨ Features

- **Account system**: signup and login with hashed passwords (bcrypt) and 7-day JWT sessions
- **Guided profile setup**: age, weight, height, gender, activity level, meals per day, cuisine preference
- **Health considerations**: diabetes, blood pressure, cholesterol, thyroid, PCOS/PCOD, anaemia and kidney disease, plus a free-text field for anything else
- **Diet-aware filtering**: vegetarian, eggetarian, vegan, non-vegetarian or no preference
- **Allergy and avoid-list handling**: meals containing listed allergens or foods are excluded from the plan
- **Goal-based suggestions**: weight management, healthy weight gain, muscle gain, everyday wellness
- **Weekly meal dashboard**: seven day tabs, four meal cards per day, expandable details (ingredients, serving suggestion)
- **PDF export**: a formatted wellness report with your profile and weekly plan (jsPDF + autoTable)
- **Protected routes**: dashboard and profile pages require a valid session
- **API health check**: `/api/health` reports whether the database is connected

---

## 🧰 Tech Stack

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Frontend | React 19, React Router 7, Tailwind CSS 3, Axios, jsPDF      |
| Backend  | Node.js, Express 5, Sequelize 6                             |
| Database | MySQL (via `mysql2`)                                        |
| Auth     | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`                |

---

## 📁 Project Structure

```
nutricare_mealplanner/
├── nutricare-client/          # React app (Create React App)
│   └── src/
│       ├── pages/             # Landing, Signup, Login, CreateProfile, Profile (dashboard), pdfGenerator
│       ├── components/        # ProtectedRoute
│       ├── context/           # AuthContext
│       ├── FoodData.js        # Meal database used by the planner
│       ├── api.js             # Axios instance + error helper
│       └── session.js         # Token/user storage helpers
└── nutricare-server/          # Express API
    ├── config/                # DB configuration (reads .env)
    ├── models/                # Sequelize models (User)
    ├── routes/                # auth.routes.js, user.routes.js
    └── server.js              # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MySQL](https://www.mysql.com/) 8+ running locally (or reachable remotely)

### 1. Clone the repository

```bash
git clone https://github.com/sanjj17/nutricare_mealplanner.git
cd nutricare_mealplanner
```

### 2. Create the database

```sql
CREATE DATABASE nutricare;
```

Tables are created automatically on first start (`sequelize.sync()`).

### 3. Configure and start the server

```bash
cd nutricare-server
npm install
```

Create `nutricare-server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=nutricare
JWT_SECRET=replace-with-a-long-random-string

# Optional
PORT=8080
CLIENT_ORIGIN=http://localhost:3000
```

```bash
npm start
```

The API runs at `http://localhost:8080`. Verify it with:

```bash
curl http://localhost:8080/api/health
```

### 4. Start the client

In a new terminal:

```bash
cd nutricare-client
npm install
npm start
```

The app opens at `http://localhost:3000`.

To point the client at a different API URL, create `nutricare-client/.env.local`:

```env
REACT_APP_API_URL=http://localhost:8080
```

---

## 🔌 API Reference

All routes are prefixed with `/api`. Routes marked 🔒 need an `Authorization: Bearer <token>` header.

| Method | Endpoint         | Auth | Description                                   |
|--------|------------------|------|-----------------------------------------------|
| GET    | `/health`        |      | Service and database status                   |
| POST   | `/signup`        |      | Create an account, returns token + user       |
| POST   | `/login`         |      | Log in, returns token + user                  |
| GET    | `/profile`       | 🔒   | Get the current user's profile                |
| PUT    | `/profile`       | 🔒   | Update the current user's profile             |
| GET    | `/users`         | 🔒   | List users                                    |
| GET    | `/users/:email`  | 🔒   | Get a user by email                           |
| POST   | `/users`         | 🔒   | Update profile (same handler as `PUT /profile`) |

**Example: signup**

```bash
curl -X POST http://localhost:8080/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"supersecret1"}'
```

**Validation rules:** password ≥ 8 characters; age 1–120; weight up to 500 kg; height 50–260 cm; meals per day 2–6.

---

## 🧠 How the Meal Plan Works

1. The profile is loaded from the API after login.
2. `FoodData.js` holds the meal database, each entry tagged with meal type, diet types, allergens, ingredients and the goals it suits.
3. The planner filters meals by **dietary preference**, removes any matching the user's **allergies** or **foods to avoid**, then prefers meals that suit the user's **goals**.
4. For each of the seven days it picks a breakfast, lunch, dinner and snack from the remaining pool, falling back to generic balanced suggestions if a pool is empty.
5. Condition-specific wellness notes are shown alongside the plan (for example, kidney disease directs users to their renal care team rather than a general plan).

---

## 🗺️ Roadmap

- [ ] Larger food database and recipe details
- [ ] Calorie and macro estimates
- [ ] Editable and swappable meals
- [ ] Automated tests for the planner and API
- [ ] Docker setup for one-command local start
- [ ] Deployment guide

---

## 🔒 Security Notes

- Never commit `.env`. It is already listed in `.gitignore`.
- Always set a strong `JWT_SECRET` in production. The server falls back to a development default if it is missing.
- Passwords are hashed with bcrypt (cost factor 12) and are never returned by the API.

---

## 🤝 Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you'd like to change.

## 📄 License

Add a license of your choice (for example MIT) and update this section.
