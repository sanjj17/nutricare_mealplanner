import React, { useEffect, useState } from "react";
import api from "./api";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.response?.data?.message || "Could not load your profile. Please sign in and try again."));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-green-800">Your Saved Profile</h1>
      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border px-3 py-2">Name</th>
            <th className="border px-3 py-2">Age</th>
            <th className="border px-3 py-2">Weight</th>
            <th className="border px-3 py-2">Gender</th>
            <th className="border px-3 py-2">Diabetes</th>
            <th className="border px-3 py-2">BP</th>
            <th className="border px-3 py-2">Cholesterol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{u.name}</td>
              <td className="border px-3 py-2">{u.age}</td>
              <td className="border px-3 py-2">{u.weight}</td>
              <td className="border px-3 py-2">{u.gender}</td>
              <td className="border px-3 py-2">{u.diabetes ? "Yes" : "No"}</td>
              <td className="border px-3 py-2">{u.bp ? "Yes" : "No"}</td>
              <td className="border px-3 py-2">{u.cholesterol ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
