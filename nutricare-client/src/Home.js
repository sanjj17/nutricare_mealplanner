import React, { useState, useEffect } from "react";
import api from "./api";
import { parseGoals } from "./session";
import { useNavigate } from "react-router-dom";
import foodData from "./FoodData";



const getSuggestions = (formData) => {
  const { conditions, weight, age, goals } = formData;
  const suggestions = [];

  if (goals.includes("lose_weight")) {
    suggestions.push("Avoid fried foods and sugary drinks");
    suggestions.push("Eat more salads, sprouts, and portion-controlled meals");
    suggestions.push("Have early dinners and drink more water");
  }
  if (goals.includes("gain_weight")) {
    suggestions.push("Include calorie-dense healthy foods like bananas, nuts, paneer");
    suggestions.push("Eat 5-6 small meals throughout the day");
    suggestions.push("Add ghee, jaggery, and full-fat milk to your diet");
  }
  if (goals.includes("maintain_health")) {
    suggestions.push("Stick to a balanced diet with roti, dal, sabzi, and curd");
    suggestions.push("Avoid excess salt and sugar even if you're healthy");
    suggestions.push("Do light exercise like walking daily");
  }
  if (goals.includes("improve_condition")) {
    suggestions.push("Track blood reports every 3–6 months");
    suggestions.push("Eat foods known to help manage your condition consistently");
    suggestions.push("Cut down on processed/packaged items");
  }

  if (conditions.diabetes) {
    suggestions.push("Avoid sugar, white rice, and potatoes");
    suggestions.push("Include oats, barley, and methi seeds");
  }
  if (conditions.bp) {
    suggestions.push("Reduce salt, pickles, and processed foods");
    suggestions.push("Eat potassium-rich foods like bananas, spinach, and oranges");
  }
  if (conditions.cholesterol) {
    suggestions.push("Avoid fried food and saturated fats like butter and cream");
    suggestions.push("Include flax seeds, walnuts, and oats daily");
  }

  if (weight < 45) {
    suggestions.push("Eat more dal, paneer, eggs, and milk");
  }
  if (age > 50) {
    suggestions.push("Ensure calcium intake from curd, sesame seeds, ragi");
  }

  const allTags = [...goals, ...Object.keys(conditions).filter((c) => conditions[c])];
  if (age > 50) allTags.push("age_above_50");

  const mealSuggestions = { breakfast: [], lunch: [], dinner: [] };
  foodData.forEach((item) => {
    if (item.suitableFor.some((tag) => allTags.includes(tag))) {
      const line = `${item.name} – ${item.benefits.join(", ")}`;
      if (mealSuggestions[item.meal]) {
        mealSuggestions[item.meal].push(line);
      }
    }
  });

  for (let meal in mealSuggestions) {
    if (mealSuggestions[meal].length) {
      suggestions.push(`🍽 ${meal.charAt(0).toUpperCase() + meal.slice(1)}:`);
      suggestions.push(...mealSuggestions[meal]);
    }
  }
  return suggestions;
};

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");

  const [nutritionTips, setNutritionTips] = useState([]);
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    gender: "",
    goals: [],
    conditions: { diabetes: false, bp: false, cholesterol: false },
  });

  useEffect(() => {
    if (userEmail) {
      api.get("/profile")
        .then((res) => {
          const user = res.data?.user || res.data;
          setFormData({
            name: user.name || "",
            age: user.age || "",
            weight: user.weight || "",
            gender: user.gender || "",
            goals: parseGoals(user.goals),
            conditions: {
              diabetes: user.diabetes || false,
              bp: user.bp || false,
              cholesterol: user.cholesterol || false,
            },
          });
        })
        .catch((err) => console.error("Error loading profile:", err));
    }
  }, [userEmail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name in formData.conditions) {
      setFormData((prev) => ({
        ...prev,
        conditions: { ...prev.conditions, [name]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/profile", {
        ...formData,
        age: Number(formData.age),
        weight: Number(formData.weight),
        conditions: formData.conditions,
      });
      const suggestions = getSuggestions(formData);
      localStorage.setItem("suggestions", JSON.stringify(suggestions));
      alert("✅ Profile saved successfully!");
      setFormData({ name: "", age: "", weight: "", gender: "", goals: [], conditions: { diabetes: false, bp: false, cholesterol: false } });
      navigate("/result");
    } catch (error) {
      console.error("Submission error:", error);
      alert("❌ Failed to submit.");
    }
  };

  const generateWeeklyPlan = () => {
    const meals = { breakfast: [], lunch: [], dinner: [], current: null };
    nutritionTips.forEach((tip) => {
      if (tip.startsWith("🍽 Breakfast:")) meals.current = "breakfast";
      else if (tip.startsWith("🍽 Lunch:")) meals.current = "lunch";
      else if (tip.startsWith("🍽 Dinner:")) meals.current = "dinner";
      else if (meals.current) meals[meals.current].push(tip);
    });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => ({
      day,
      breakfast: meals.breakfast[i % meals.breakfast.length] || "-",
      lunch: meals.lunch[i % meals.lunch.length] || "-",
      dinner: meals.dinner[i % meals.dinner.length] || "-",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">NutriCare – User Profile Form</h2>

        {!isLoggedIn ? (
          <div className="flex space-x-2 mb-6">
            <button onClick={() => navigate("/signup")} className="w-1/2 bg-purple-100 text-purple-700 py-2 rounded hover:bg-purple-200 border border-purple-300 transition">Sign Up</button>
            <button onClick={() => navigate("/login")} className="w-1/2 bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 border border-blue-300 transition">Log In</button>
          </div>
        ) : (
          <>
            <p className="text-green-700 font-medium mb-4 text-center">✅ You're signed in! Please enter your health profile below.</p>
            <button onClick={() => {
              localStorage.clear();
              alert("Logged out!");
              navigate("/login");
            }} className="bg-red-500 text-white py-1 px-4 rounded mb-4">Logout</button>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" />
          <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Age" className="w-full p-2 border rounded" />
          <input name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="Weight (kg)" className="w-full p-2 border rounded" />
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <div>
            <label className="block mb-1">Goals:</label>
            {["lose_weight", "gain_weight", "improve_diabetes", "lower_bp", "lower_cholesterol", "maintain_health"].map((goalKey) => (
              <label key={goalKey} className="block">
                <input type="checkbox" name="goals" value={goalKey} checked={formData.goals.includes(goalKey)} onChange={(e) => {
                  const { value, checked } = e.target;
                  setFormData((prev) => ({
                    ...prev,
                    goals: checked ? [...prev.goals, value] : prev.goals.filter((g) => g !== value),
                  }));
                }} />
                <span className="ml-2 capitalize">{goalKey.replace("_", " ")}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block">Medical Conditions:</label>
            {Object.keys(formData.conditions).map((cond) => (
              <label key={cond} className="block">
                <input type="checkbox" name={cond} checked={formData.conditions[cond]} onChange={handleChange} />
                <span className="ml-2 capitalize">{cond}</span>
              </label>
            ))}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit</button>
          <label className="flex items-center gap-2 text-sm text-blue-800 mt-4">
            <input type="checkbox" checked={showWeeklyPlan} onChange={() => setShowWeeklyPlan(!showWeeklyPlan)} /> Show Weekly Diet Plan
          </label>
        </form>

        {nutritionTips.length > 0 && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50">
            <h2 className="text-lg font-bold mb-2 text-green-700">Nutrition Suggestions:</h2>
            <ul className="list-disc pl-5 text-green-800">
              {nutritionTips.map((tip, index) => <li key={index}>{tip}</li>)}
            </ul>
          </div>
        )}

        {showWeeklyPlan && nutritionTips.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-blue-800 mb-2">📅 Weekly Diet Plan</h3>
            <table className="w-full text-sm border border-gray-300 text-left bg-white rounded-md overflow-hidden">
              <thead className="bg-blue-100 text-blue-700">
                <tr>
                  <th className="p-2">Day</th>
                  <th className="p-2">Breakfast</th>
                  <th className="p-2">Lunch</th>
                  <th className="p-2">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {generateWeeklyPlan().map((day, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-semibold">{day.day}</td>
                    <td className="p-2">{day.breakfast}</td>
                    <td className="p-2">{day.lunch}</td>
                    <td className="p-2">{day.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
