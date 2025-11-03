import React, { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import { useNavigate } from "react-router-dom";
import { HiSearch } from "react-icons/hi";
import PdfViewer from "./prelogin/PdfViewer.jsx";

const PLAN_LABEL = {
  digital_monthly: "Digital only (Monthly)",
  digital_annual: "Digital only (Annual)",
  print_monthly: "Digital + Print (Monthly)",
  print_annual: "Digital + Print (Annual)",
};

export default function Library() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [me, setMe] = useState(null);
  const nav = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isReader, setisReader] = useState(false);
  const filters = ["All", "2025", "2024", "PDF", "Recent"];
  const stats = [
    { label: "Total Magazines", value: "3" },
    { label: "This Month", value: "1" },
    { label: "Reading Time", value: "2.5h" },
  ];

  const magazines = [
    {
      id: 1,
      title: "IPO World Magazine Vol. 5",
      date: "October 2025",
      pages: 45,
      gradient: "from-blue-500 to-blue-700",
    },
    {
      id: 2,
      title: "IPO World Magazine Vol. 4",
      date: "September 2025",
      pages: 42,
      gradient: "from-green-500 to-green-600",
    },
    {
      id: 3,
      title: "IPO World Magazine Vol. 3",
      date: "August 2025",
      pages: 48,
      gradient: "from-pink-500 to-orange-500",
    },
  ];

  useEffect(() => {
    API.get("/auth/me")
      .then(({ data }) => setMe(data))
      .catch(() => {});

    API.get("/pdfs")
      .then(({ data }) => {
        setItems(data);
      })
      .catch((e) => {
        const msg = e?.response?.data?.error || "Failed to load library";
        setError(msg);
      });
  }, []);

  const openPdf = async (id) => {
    try {
      const { data } = await API.post(`/pdfs/${id}/view-token`);
      const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const url = `${api}/pdfs/secure/${data.token}#toolbar=0&navpanes=0&scrollbar=0`;
      setActiveUrl(url);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to open PDF");
    }
  };

  const planLine =
    me?.subscriptionStatus === "active"
      ? PLAN_LABEL[me?.planKey] || "Active subscription"
      : null;

  return (
    <Page>

      {error === "Subscription required" && (
        <div className="mt-4">
          <button className="btn" onClick={() => nav("/subscribe")}>
            Subscribe now →
          </button>
        </div>
      )}

      <main className="fle w-full  overflow-y-auto mx-auto  p-6 lg:p-10">
        {/* Header */}
        <div className="mb-10 lg:ml-0 ml-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            Your Library
          </h1>
          <p className="text-gray-600">
            Browse and read your IPO Magazine collection
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search magazines..."
            className="w-full pl-12 pr-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter.toLowerCase())}
              className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-all ${
                activeFilter === filter.toLowerCase()
                  ? "bg-blue-50 text-[#3661fd] border-2 border-[#3661fd]"
                  : "bg-white text-gray-600 border-2 border-gray-200 hover:border-[#3661fd] hover:bg-blue-50 hover:text-[#3661fd]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="text-sm text-gray-600 mb-2">{stat.label}</h4>
              <div className="text-3xl font-bold text-[#3661fd]">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Magazines Grid */}
        <div
          className={`grid ${
            isReader && "hidden"
          } grid-cols-1 transition-all duration-1000 md:grid-cols-2 lg:grid-cols-3 gap-6`}
        >
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {!items.length && !error && (
            <div className="muted">No issues yet.</div>
          )}

          {!!items.length &&
            items.map((magazine) => (
              <div
                key={magazine._id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-2 transition-all"
              >
                <div
                  className={`h-48 bg-gradient-to-br ${magazine.gradient} flex items-center justify-center text-white text-2xl font-bold relative`}
                >
                  <span>VOL. {magazine.id + 2}</span>
                  <span className="absolute top-4 right-4 bg-white text-[#3661fd] text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    PDF
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {magazine.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>📅 {magazine.date}</span>
                    <span>📄 {magazine.pages} pages</span>
                  </div>
                  <button
                    onClick={() => {
                      openPdf(magazine._id);
                      setisReader(true);
                    }}
                    className="w-full py-2.5 cursor-pointer bg-[#3661fd] text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                  >
                    View inline
                  </button>
                </div>
              </div>
            ))}
        </div>
        {activeUrl && (
          <div className="mt-4 w-full">
            <div className="flex  items-center justify-between">
              <strong>Viewer</strong>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setActiveUrl("");
                    setisReader(false);
                  }}
                >
                  Close
                </button>
                {/* <button
                  className="btn-secondary"
                  onClick={() =>
                    window.open(activeUrl.replace("#toolbar=0", ""), "_blank")
                  }
                >
                  Open in new tab
                </button> */}
              </div>
            </div>
            {/* <iframe
              title="pdf"
              src={activeUrl}
              className="mt-2 w-full h-[70vh] md:h-[80vh] rounded-xl border border-slate-200"
            /> */}
            <div className="magazine-card w-full  overflow-hidden backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/70 relative">
              <PdfViewer url={activeUrl} />
            </div>
          </div>
        )}
      </main>
    </Page>
  );
}