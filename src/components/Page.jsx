import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiBookOpen, HiMenu, HiPlus, HiX } from "react-icons/hi";
import { IoLogOutOutline } from "react-icons/io5";

import indiaIPOLogo from "../assets/indiaipo.jpg";

export default function Page({ title, children }) {
  const nav = useNavigate();
  const hasUser = !!localStorage.getItem("token");
  // const hasUser = true;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const navItems = [
    { id: "library", label: "Library", icon: HiBookOpen },
    { id: "subscribe", label: "Subscribe", icon: HiPlus },
  ];
  const [activeNav, setActiveNav] = useState("library");

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setOpen(false);
      nav("/", { replace: true });
    }
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden">
      {hasUser && (
        <>
          <button
            onClick={() => setSidebarOpen(true)}
            className="xl:hidden cursor-pointer fixed top-5 left-2.5 z-50 w-11 h-11 bg-blue-500 rounded-xl shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center"
          >
            <HiMenu className="w-5 h-5 text-white" />
          </button>

          <div
            className={`fixed xl:relative h-screen bg-white border-r border-gray-200 shadow-xl z-40 transition-all duration-300 flex flex-col ${
              sidebarOpen ? "left-0 w-72" : "-left-72 w-0 xl:left-0 xl:w-72"
            }`}
          >
            <div className="px-6 py-6 border-b border-gray-200">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute xl:hidden p-1  text-8xl cursor-pointer top-2 right-2 bg-blue-500 text-gray-50 rounded-lg font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <HiX className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-start my-12 gap-3">
                <img
                  src={indiaIPOLogo}
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                />
                <span className="font-semibold text-gray-800">
                  India IPO Magazine
                </span>
              </div>
            </div>

            <nav className="flex-1 py-5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                    }}
                    className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-all border-l-4 ${
                      activeNav === item.id
                        ? "bg-blue-50 text-blue-500 border-blue-500 font-medium"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>
    
            <div className="p-6 border-t border-gray-200">
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <h4 className="text-xs uppercase tracking-wide text-blue-900 mb-1">
                  Current Plan
                </h4>
                <p className="text-sm text-gray-700">Digital only (Monthly)</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center cursor-pointer justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <IoLogOutOutline className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 overflow-y-auto py-8">
        {title && <h2 className="mb-4 text-2xl font-semibold">{title}</h2>}
        {children}
      </main>
    </div>
  );
}