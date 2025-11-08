import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiBookOpen, HiMenu, HiPlus, HiX } from "react-icons/hi";
import { IoLogOutOutline } from "react-icons/io5";
import indiaIPOLogo from "../assets/indiaipo.jpg";

export default function Page({ title, children }) {
  const nav = useNavigate();
  const hasUser = !!localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [sidebarState, setsidebarState] = useState(
    localStorage.getItem("sidebarState")
  );
  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setOpen(false);
      nav("/");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("sidebarState")) {
      localStorage.setItem("sidebarState", false);
    }
  }, []);

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
          <div
            className={`h-full md:relative fixed overflow-hidden bg-white border-r border-gray-200 shadow-xl z-40 transition-all duration-300 flex flex-col ${
              sidebarState == "true" ? "left-0 w-64 md:w-80" : "-left-80 w-0 "
            }`}
          >
            {sidebarState == "false" && (
              <button
                onClick={() => {
                  localStorage.setItem("sidebarState", "true");
                  setsidebarState(localStorage.getItem("sidebarState", "true"));
                }}
                className="cursor-pointer top-5 fixed left-3 w-11 h-11 bg-blue-500 rounded-xl shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center"
              >
                <HiMenu className="w-5 h-5 text-white" />
              </button>
            )}

            <button
              onClick={() => {
                localStorage.setItem("sidebarState", "false");
                setsidebarState(localStorage.getItem("sidebarState"));
              }}
              className=" p-1 z-50 absolute right-5 top-5 text-2xl cursor-pointer  bg-blue-500 text-gray-50 rounded-lg font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <HiX />
            </button>

            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex my-5 items-center justify-start gap-3">
                <img
                  src={indiaIPOLogo}
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold"
                />
                <span className="font-semibold text-gray-800">
                  IPO World Magazine
                </span>
              </div>
            </div>

            <nav className="flex-[1] py-5 overflow-y-auto">
              <Link to={`/library`}>
                <div
                  onClick={() => {
                    localStorage.setItem("activeTab", "library");
                    localStorage.setItem("sidebarState", false);
                    setsidebarState(localStorage.getItem("sidebarState"));
                  }}
                  className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-all border-l-4 ${
                    localStorage.getItem("activeTab") === "library"
                      ? "bg-blue-50 text-[#3661fd] border-[#3661fd] font-medium"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                  }`}
                >
                  <HiBookOpen />
                  <p>Library</p>
                </div>
              </Link>
              <Link to={`/subscribe`}>
                <div
                  onClick={() => {
                    localStorage.setItem("activeTab", "subscribe");
                    localStorage.setItem("sidebarState", false);
                    setsidebarState(localStorage.getItem("sidebarState"));
                  }}
                  className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-all border-l-4 ${
                    localStorage.getItem("activeTab") === "subscribe"
                      ? "bg-blue-50 text-[#3661fd] border-[#3661fd] font-medium"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                  }`}
                >
                  <HiPlus />
                  <p className="">Subscribe</p>
                </div>
              </Link>
            </nav>

            <div className="p-6  border-t border-gray-200">
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <h4 className="text-xs uppercase tracking-wide text-blue-900 mb-1">
                  Current Plan
                </h4>
                <p className="text-sm text-gray-700">Digital only (Monthly)</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center cursor-pointer justify-center gap-2 px-4 py-3 bg-[#3661fd] text-white rounded-lg font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <IoLogOutOutline className="" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      <main className="w-[90%] mx-auto overflow-y-auto">
        {title && (
          <h2 className="mb-4 mx-auto flex justify-center my-5 text-2xl font-semibold">
            {title}
          </h2>
        )}
        {children}
      </main>
    </div>
  );
}
