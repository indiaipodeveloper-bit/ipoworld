import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import cover from "../assets/mag5.webp";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    API.get("/auth/me")
      .then(({ data }) => {
        if (data.subscriptionStatus === "active") nav("/library");
        else nav("/subscribe");
      })
      .catch(() => {});
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await API.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user?.subscriptionStatus === "active") nav("/library");
      else nav("/subscribe");
    } catch (e) {
      setErr(e?.response?.data?.error || "Login failed");
    }
  };

  return (
    <Page>
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="hidden lg:block">
          <div className="relative h-full min-h-[520px] overflow-hidden rounded-2xl">
            <img
              src={cover}
              className="absolute inset-0 h-full w-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-saffron/10 to-transparent" />
          </div>
        </div>

        <div className="card p-8">
          {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
          <form onSubmit={submit} className="grid gap-4 max-w-md">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </Page>
  );
}
