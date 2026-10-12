import React, { useEffect, useState } from "react";

function Result() {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("suggestions") || "[]");
      if (Array.isArray(saved)) setSuggestions(saved);
    } catch (_) {
      setSuggestions([]);
    }
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Your Personalized Nutrition Plan</h1>
      <ul className="list-disc pl-5 text-green-800 bg-green-50 p-4 rounded-lg">
        {suggestions.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

export default Result;
