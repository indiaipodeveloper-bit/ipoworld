import React, { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import { useNavigate } from "react-router-dom";
import { HiSearch } from "react-icons/hi";
import PdfViewer from "./prelogin/PdfViewer.jsx";
import indiaIPOLogo from "../assets/ipologo2.png";
import magzineCover from "./prelogin/assets/mag5.webp";

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
  const [isReader, setisReader] = useState(false);

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

      <main className="w-full overflow-y-auto mx-auto  p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-x-5 gap-y-2 mt-8 items-center">
            <img
              src={indiaIPOLogo}
              alt=""
              className="aspect-square h-[70px] mdx:m-0"
            />
            <p className="font-bold text-xl lg:text-3xl">IPO World Magazine</p>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 m-auto w-full lg:w-1/2">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search magazines..."
              className="w-full pl-12 pr-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="mb-10 ">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Your Library
            </h1>
            <p className="text-gray-600">
              Browse and read your IPO Magazine collection
            </p>
          </div>
        </div>

        <div
          className={`flex flex-wrap
             justify-between transition-all duration-1000 gap-y-10
    ${isReader ? "hidden" : ""}
  `}
        >
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {!items.length && !error && (
            <div className="muted">No issues yet.</div>
          )}

          {!!items.length &&
            items.map((magazine) => (
              <div
                key={magazine._id}
                className="bg-white rounded-xl w-full  lg:w-[30%] max-h-[600px] overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-2 transition-all"
              >
                <div
                  className={` bg-gradient-to-br ${magazine.gradient}  overflow-hidden h-[400px] items-center justify-center text-white text-2xl font-bold relative`}
                >
                  {!magazine.cover ? (
                    <img
                      src={magzineCover}
                      alt="image"
                      className="object-contain w-full "
                    />
                  ) : (
                    <img
                      src={magazine.cover}
                      alt="image"
                      className="object-contain w-full "
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {magazine.title}
                  </h3>

                  <button
                    onClick={() => {
                      openPdf(magazine._id);
                      setisReader(true);
                    }}
                    className="w-full py-2.5 cursor-pointer bg-[#3661fd] text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                  >
                    Read Now
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
              </div>
            </div>
            <div className="w-full  overflow-hidden backdrop-blur-xl py-5  rounded-3xl shadow-xl border border-white/70 relative">
              <PdfViewer url={activeUrl} />
            </div>
          </div>
        )}
      </main>
    </Page>
  );
}
