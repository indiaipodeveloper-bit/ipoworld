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
  { key: "digital_monthly", label: "Digital only (Monthly)" },
  { key: "digital_annual", label: "Digital only (Annual)" },
  { key: "hindi_digital_monthly", label: "Hindi Digital only (Monthly)" },
  { key: "hindi_digital_annual", label: "Hindi Digital only (Annual)" },
  { key: "print_only", label: "Print only (Monthly)" },
  { key: "print_only_annual", label: "Print only (Annual)" },
  { key: "print_monthly", label: "Digital + Print (Monthly)" },
  { key: "print_annual", label: "Digital + Print (Annual)" },
];

const PLAN_LABEL = Object.fromEntries(plans.map((p) => [p.key, p.label]));
const fmt = new Intl.NumberFormat("en-IN");

function planTypeFromKey(k) {
  if (k.startsWith("hindi_digital")) return "hindi_digital";
  if (k.startsWith("digital")) return "digital";
  if (k.startsWith("print_only")) return "print_only";
  if (k.startsWith("print")) return "print";
  return "digital";
}

function tabFromKey(k) {
  return k.startsWith("hindi_") ? "hindi" : "english";
}

const ENGLISH_PLANS = plans.filter((p) => !p.key.startsWith("hindi_"));
const HINDI_PLANS = plans.filter((p) => p.key.startsWith("hindi_"));

export default function Subscribe() {
  const nav = useNavigate();
  const [planKey, setPlanKey] = useState("digital_monthly");
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
        if (data.subscriptionStatus === "active" && data.planKey) {
          setPlanKey(data.planKey);
          setActiveTab(tabFromKey(data.planKey));
          if (data.planKey.endsWith("_annual")) setTermYears(1);
        } else {
          setActiveTab(tabFromKey("digital_monthly"));
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
          setPlanKey(me?.planKey || "digital_monthly");
          setActiveTab(tabFromKey(me?.planKey || "digital_monthly"));
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      setErr(resp?.error?.description || "Payment failed");
      setPlanKey(me?.planKey || "digital_monthly");
      setActiveTab(tabFromKey(me?.planKey || "digital_monthly"));
    });
    rzp.open();
  };

  const startSubscription = async () => {
    const payload = { planKey };
    if (needsAddress) payload.address = address;
    const { data } = await API.post("/pay/create-subscription", payload);
    const rzp = new window.Razorpay({
      key: data.key,
      subscription_id: data.subscriptionId,
      name: "India IPO Magazine",
      description: "Magazine Subscription",
      handler: async function (resp) {
        try {
          await API.post("/pay/activate", {
            payment_id: resp.razorpay_payment_id,
            subscription_id: resp.razorpay_subscription_id,
            signature: resp.razorpay_signature,
          });
        } catch {}
        nav("/library");
      },
      theme: { color: "#111827" },
      modal: {
        ondismiss: () => {
          setErr("");
          setPlanKey(me?.planKey || "digital_monthly");
          setActiveTab(tabFromKey(me?.planKey || "digital_monthly"));
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      setErr(resp?.error?.description || "Payment failed");
      setPlanKey(me?.planKey || "digital_monthly");
      setActiveTab(tabFromKey(me?.planKey || "digital_monthly"));
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
      if (isAnnual) {
        await startOneTime();
      } else {
        await startSubscription();
      }
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
      const fallback = isHindi ? "hindi_digital_monthly" : "digital_monthly";
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
      <div className="w-full flex flex-col my-10 items-center">
        {hasActive && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
            <span className="font-medium">Active plan:</span>{" "}
            {PLAN_LABEL[me?.planKey] || "—"}
          </div>
        )}

        <div className="mb-4 flex w-full max-w-2xl rounded-full border border-slate-200 bg-white p-1">
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

        <div className="grid gap-3 max-w-2xl">
          <div className="grid md:grid-cols-2 gap-3">
            {shownPlans.map((p) => {
              const isCurrent = hasActive && me?.planKey === p.key;
              const isThisAnnual = p.key.endsWith("_annual");
              const thisType = planTypeFromKey(p.key);
              const selected = planKey === p.key;

              const cardTerm = selected && isThisAnnual ? termYears : 1;
              const cardCompareAt = isThisAnnual
                ? 12 * MONTHLY_PRICE[thisType] * cardTerm
                : null;
              const cardDiscount = isThisAnnual
                ? DISCOUNT_PCT[cardTerm] || 0
                : 0;
              const cardActual = isThisAnnual
                ? Math.round(cardCompareAt * (1 - cardDiscount / 100))
                : null;

              return (
                <label
                  key={p.key}
                  className={`rounded-2xl border p-4 cursor-pointer ${
                    selected ? "ring-2 ring-slate-300" : ""
                  } ${
                    isCurrent
                      ? "bg-green-50 border-green-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <input
                        type="radio"
                        name="plan"
                        value={p.key}
                        className="mr-2 accent-slate-900"
                        checked={selected}
                        onChange={() => {
                          setPlanKey(p.key);
                          if (p.key.endsWith("_annual")) setTermYears(1);
                          const nextTab = tabFromKey(p.key);
                          if (nextTab !== activeTab) setActiveTab(nextTab);
                        }}
                      />
                      <span className="font-semibold ml-1">{p.label}</span>

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

                    {isCurrent && (
                      <span className="ml-1 text-xs rounded-full px-2 py-2 bg-green-600 text-white text-center">
                        Current plan
                      </span>
                    )}
                  </div>

                  {selected && isThisAnnual && (
                    <div className="mt-3 flex gap-2">
                      {[1, 2, 3].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermYears(y);
                          }}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            termYears === y
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white hover:bg-slate-50"
                          }`}
                          title={`${y} year${y > 1 ? "s" : ""} — ${
                            DISCOUNT_PCT[y]
                          }% off`}
                        >
                          {y} yr{y > 1 ? "s" : ""} · {DISCOUNT_PCT[y]}% off
                        </button>
                      ))}
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          {needsAddress && (
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="font-semibold mb-2">
                Delivery address (required for Print plans)
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
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

          {err && <div className="text-red-600 text-sm">{err}</div>}
          <div className="flex gap-3">
            <button
              className="btn"
              onClick={pay}
              disabled={
                loading || !rzpReady || (isCurrentSelected && termYears === 1)
              }
              title={
                isCurrentSelected && termYears === 1
                  ? "This is your current plan"
                  : undefined
              }
            >
              {isAnnual
                ? loading
                  ? "Starting…"
                  : `Pay One-Time (${termYears} yr${
                      termYears > 1 ? "s" : ""
                    }) →`
                : loading
                ? "Starting…"
                : "Subscribe →"}
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
