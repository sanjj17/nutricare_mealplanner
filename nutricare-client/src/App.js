import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Profile from "./pages/Profile";
import Signup from "./pages/signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import CreateProfile from "./pages/CreateProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/create" element={<ProtectedRoute><CreateProfile /></ProtectedRoute>} />
        {/* Send old bookmarks to the unified dashboard instead of leaving duplicate flows. */}
        <Route path="/home" element={<Navigate to="/profile" replace />} />
        <Route path="/result" element={<Navigate to="/profile" replace />} />
        <Route path="/users" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
