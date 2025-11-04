import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import cover from "../assets/mag5.webp";
import indiaipologo from "./prelogin/assets/logo.jpeg"

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="fixed w-full bg-white mx-2 top-0">
        <div className="w-full flex justify-center items-center gap-5">

        <img src={indiaipologo} alt="" />
        <p className="text-3xl font-bold">IPO World Magzines</p>
        </div>
      </div>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="aspect-[4/5] flex  p-10 justify-center ">
          <img
            src={cover}
            alt="cover image"
            className=" w-full max-w-[400px] rounded-lg min-w-[200px]"
          />
        </div>
        <form
          onSubmit={submit}
          className="space-y-5 min-w-[300px] bg-blue-50 w-1/3 p-10  rounded-lg  flex flex-col justify-center "
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">✉️</span>
              </div>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition outline-none"
                type="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔒</span>
              </div>
              <input
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition outline-none"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                <span className="text-xl">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Login
          </button>
        </form>
      </div>
    </Page>
  );
}
