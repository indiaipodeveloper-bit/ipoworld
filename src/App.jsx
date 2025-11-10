import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Subscribe from "./pages/Subscribe";
import Library from "./pages/Library";
import PreLogin from "./pages/PreLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useEffect } from "react";

function getAuth() {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const isLoggedIn = !!token;
  const isSubscribed = user?.subscriptionStatus === "active";
  return { isLoggedIn, isSubscribed };
}

function LibraryGuard({ children }) {
  const { isLoggedIn, isSubscribed } = getAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isSubscribed) return <Navigate to="/subscribe" replace />;
  return children;
}

function SubscribeGuard({ children }) {
  const { isLoggedIn } = getAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isLoggedIn, isSubscribed } = getAuth();
  const isActive = isLoggedIn && isSubscribed;

  useEffect(() => {
    if (!localStorage.getItem("sidebarState")) {
      localStorage.setItem("sidebarState", false);
    }
    if (!localStorage.getItem("activeTab")) {
      localStorage.setItem("activeTab", "library");
    }
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={isActive ? <Navigate to="/library" replace /> : <PreLogin />}
      />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/subscribe"
        element={
          <SubscribeGuard>
            <Subscribe />
          </SubscribeGuard>
        }
      />

      <Route
        path="/library"
        element={
          <LibraryGuard>
            <Library />
          </LibraryGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
