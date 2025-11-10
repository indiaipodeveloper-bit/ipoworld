import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/Page.jsx";
import { API } from "../api.js";
import indiaIPOLogo from "../assets/ipologo2.png";

const MONTHLY_PRICE = {
  digital: 149,
  hindi_digital: 149,
  print_only: 275,
  print: 349,
};

const DISCOUNT_PCT = { 1: 15, 2: 22, 3: 35 };

const plans = [
  { key: "digital_annual", label: "Digital only (Annual)" },
  { key: "hindi_digital_annual", label: "Hindi Digital only (Annual)" },
  { key: "print_only_annual", label: "Print only (Annual)" },
  { key: "print_annual", label: "Digital + Print (Annual)" },
];

const PLAN_LABEL = Object.fromEntries(plans.map((p) => [p.key, p.label]));
const fmt = new Intl.NumberFormat("en-IN");

function planTypeFromKey(k) {
  if (k.startsWith("hindi_digital")) return "hindi_digital";
  if (k.startsWith("print_only")) return "print_only";
  if (k.startsWith("print_")) return "print";
  return "digital";
}
function tabFromKey(k) {
  return k.startsWith("hindi_") ? "hindi" : "english";
}

const ENGLISH_PLANS = plans.filter((p) => !p.key.startsWith("hindi_"));
const HINDI_PLANS = plans.filter((p) => p.key.startsWith("hindi_"));

export default function Subscribe() {
  const nav = useNavigate();
  const [planKey, setPlanKey] = useState("digital_annual");
  const [termYears, setTermYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rzpReady, setRzpReady] = useState(!!window.Razorpay);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState("english");

  const isAnnual = planKey.endsWith("_annual");
  const needsAddress = planKey.startsWith("print_");
  const hasActive = me?.subscriptionStatus === "active";
  const isCurrentSelected = hasActive && me?.planKey === planKey;

  const adsConvFiredRef = useRef(false);
  useEffect(() => {
    if (adsConvFiredRef.current) return;
    adsConvFiredRef.current = true;
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "conversion", {
          send_to: "AW-16865507345/VSxgCMvO_KcbEJHwjOo-",
        });
      } else if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "ads_conversion_subscribe",
          send_to: "AW-16865507345/VSxgCMvO_KcbEJHwjOo-",
          page_path: "/subscribe",
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!window.Razorpay) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => setRzpReady(true);
      s.onerror = () => setErr("Failed to load Razorpay");
      document.body.appendChild(s);
    } else {
      setRzpReady(true);
    }
    API.get("/auth/me")
      .then(({ data }) => {
        setMe(data);
        if (
          data.subscriptionStatus === "active" &&
          data.planKey &&
          data.planKey.endsWith("_annual")
        ) {
          setPlanKey(data.planKey);
          setActiveTab(tabFromKey(data.planKey));
          setTermYears(1);
        } else {
          setActiveTab(tabFromKey("digital_annual"));
        }
      })
      .catch(() => {});
  }, []);

  const validateAddress = () => {
    if (!needsAddress) return true;
    const required = ["name", "phone", "line1", "city", "state", "pincode"];
    const missing = required.filter((k) => !address[k]?.trim());
    if (missing.length) {
      setErr("Please fill: " + missing.join(", "));
      return false;
    }
    return true;
  };

  const type = planTypeFromKey(planKey);
  const compareAt = useMemo(() => {
    if (!isAnnual) return null;
    return 12 * MONTHLY_PRICE[type] * termYears;
  }, [isAnnual, type, termYears]);

  const actualTotal = useMemo(() => {
    if (!isAnnual) return null;
    const pct = DISCOUNT_PCT[termYears] || 0;
    const base = 12 * MONTHLY_PRICE[type] * termYears;
    return Math.round(base * (1 - pct / 100));
  }, [isAnnual, type, termYears]);

  const startOneTime = async () => {
    const payload = { planKey, years: termYears };
    if (needsAddress) payload.address = address;
    const { data } = await API.post("/pay/create-order", payload);
    const rzp = new window.Razorpay({
      key: data.key,
      order_id: data.orderId,
      name: "India IPO Magazine",
      description: `${termYears}-Year Access`,
      handler: function () {
        nav("/library");
      },
      theme: { color: "#111827" },
      modal: {
        ondismiss: () => {
          setErr("");
          setPlanKey(me?.planKey || "digital_annual");
          setActiveTab(tabFromKey(me?.planKey || "digital_annual"));
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      setErr(resp?.error?.description || "Payment failed");
      setPlanKey(me?.planKey || "digital_annual");
      setActiveTab(tabFromKey(me?.planKey || "digital_annual"));
    });
    rzp.open();
  };

  const pay = async () => {
    setErr("");
    if (!rzpReady)
      return setErr("Payment is initializing. Please try again in a second.");
    if (!validateAddress()) return;
    setLoading(true);
    try {
      await startOneTime();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to start payment");
    } finally {
      setLoading(false);
    }
  };

  const addrField = (k, p, t = "text") => (
    <input
      className="input"
      type={t}
      placeholder={p}
      value={address[k]}
      onChange={(e) => setAddress({ ...address, [k]: e.target.value })}
      required={needsAddress}
    />
  );

  const shownPlans = activeTab === "hindi" ? HINDI_PLANS : ENGLISH_PLANS;

  const onSwitchTab = (tab) => {
    setActiveTab(tab);
    const isHindi = tab === "hindi";
    const validKeys = (isHindi ? HINDI_PLANS : ENGLISH_PLANS).map((p) => p.key);
    if (!validKeys.includes(planKey)) {
      const fallback = isHindi ? "hindi_digital_annual" : "digital_annual";
      setPlanKey(fallback);
      setTermYears(1);
    }
  };

  return (
    <Page
      title={
        <div className="flex  my-5 gap-x-5 gap-y-2 items-center">
          <img
            src={indiaIPOLogo}
            alt=""
            className="aspect-square h-[70px] mdx:m-0 m-auto"
          />
          <p className="font-bold text-xl lg:text-3xl">IPO World Magazine</p>
        </div>
      }
    >
      <div className="flex flex-col mx-auto justify-center items-center">
        {hasActive && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
            <span className="font-medium">Active plan:</span>{" "}
            {PLAN_LABEL[me?.planKey] || "—"}
          </div>
        )}

        <div className="mb-4  flex w-full max-w-2xl rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => onSwitchTab("english")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "english"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab("hindi")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "hindi"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            हिंदी
          </button>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          {shownPlans.map((p) => {
            const selected = planKey === p.key;
            const isThisAnnual = p.key.endsWith("_annual");
            const thisType = planTypeFromKey(p.key);
            const cardTerm = isThisAnnual ? termYears : 1;
            const cardCompareAt = isThisAnnual
              ? 12 * MONTHLY_PRICE[thisType] * cardTerm
              : MONTHLY_PRICE[thisType];
            const cardDiscount = isThisAnnual ? DISCOUNT_PCT[cardTerm] || 0 : 0;
            const cardActual = isThisAnnual
              ? Math.round(
                  12 *
                    MONTHLY_PRICE[thisType] *
                    cardTerm *
                    (1 - cardDiscount / 100)
                )
              : MONTHLY_PRICE[thisType];

            return (
              <label
                key={p.key}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  selected
                    ? "border-slate-900 shadow-lg"
                    : "border-slate-200 hover:shadow"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="plan"
                    className="mt-1"
                    checked={selected}
                    onChange={() => {
                      setPlanKey(p.key);
                      if (p.key.endsWith("_annual")) setTermYears(1);
                      const nextTab = tabFromKey(p.key);
                      if (nextTab !== activeTab) setActiveTab(nextTab);
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{p.label}</div>
                    {!isThisAnnual ? (
                      <div className="muted mt-1">
                        ₹{fmt.format(MONTHLY_PRICE[thisType])} / mo
                      </div>
                    ) : (
                      <div className="mt-1 text-sm">
                        <span className="line-through mr-2 text-slate-500">
                          ₹{fmt.format(cardCompareAt)}
                        </span>
                        <span className="font-semibold">
                          ₹{fmt.format(cardActual)} /{" "}
                          {cardTerm > 1 ? `${cardTerm} yrs` : "yr"}
                        </span>{" "}
                        <span className="text-green-700">
                          ({cardDiscount}% off)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {isAnnual && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm">Term:</span>
            <div className="flex gap-2">
              {[1, 2, 3].map((y) => (
                <button
                  key={y}
                  onClick={() => setTermYears(y)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    termYears === y
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {y} {y > 1 ? "years" : "year"}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsAddress && (
          <div className="mt-6 w-full max-w-3xl rounded-xl border p-4">
            <div className="mb-2 font-semibold">Shipping address</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {addrField("name", "Full name")}
              {addrField("phone", "Phone")}
              {addrField("line1", "Address line 1")}
              {addrField("line2", "Address line 2 (optional)")}
              {addrField("city", "City")}
              {addrField("state", "State")}
              {addrField("pincode", "Pincode")}
            </div>
          </div>
        )}

        <div className="mt-6">
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <div className="flex gap-3">
            <button
              className="btn"
              onClick={pay}
              disabled={
                loading || !rzpReady || (isCurrentSelected && termYears === 1)
              }
            >
              {loading
                ? "Starting…"
                : `Pay-One-Time (${termYears} yr${termYears > 1 ? "s" : ""}) →`}
            </button>

            {hasActive && (
              <button className="btn-secondary" onClick={() => nav("/library")}>
                Go to Library
              </button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
