import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import cover from "../assets/mag5.webp";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await API.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      nav("/subscribe");
    } catch (e) {
      setErr(e?.response?.data?.error || "Registration failed");
    }
  };

  return (
    <Page>
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="hidden lg:block">
          <div className="relative h-full min-h-[560px] overflow-hidden">
            <img
              src={cover}
              className="absolute inset-0 h-full w-full object-contain rounded-2xl"
            />
          </div>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
          <p className="muted mb-6">
            Access all digital issues, and optionally the print edition.
          </p>
          {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
          <form onSubmit={submit} className="grid gap-4 max-w-md">
            <input
              className="input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
            <button type="submit" className="btn">
              Register
            </button>
          </form>
          <p className="muted mt-4">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </Page>
  );
}
