import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

export default function PreLogin() {
  const nav = useNavigate();
  const hostRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const base =
      (import.meta && import.meta.env && import.meta.env.BASE_URL) || "/";
    const preloginBase = (base.endsWith("/") ? base : base + "/") + "prelogin/";
    const htmlURL = preloginBase + "index.html";

    const rewriteRelativeUrls = (html) => {
      let out = html;

      out = out.replace(
        /href=["'](?:\.\/)?prelogin\.css["']/g,
        `href="${preloginBase}prelogin.css"`
      );

      out = out.replace(
        /(src|href)=["'](?:\.\/)?assets\/([^"']+)["']/g,
        (_m, attr, rest) => `${attr}="${preloginBase}assets/${rest}"`
      );

      return out;
    };

    const executeScripts = () => {
      if (!hostRef.current) return;
      const scripts = hostRef.current.querySelectorAll("script");
      scripts.forEach((old) => {
        const s = document.createElement("script");
        for (const { name, value } of Array.from(old.attributes)) {
          s.setAttribute(name, value);
        }
        if (old.textContent) s.textContent = old.textContent;
        old.replaceWith(s);
      });
    };

    const attachDelegatedRouter = () => {
      if (!hostRef.current) return;
      const root = hostRef.current;

      const onClick = (e) => {
        const target = e.target;
        if (!target) return;

        const el = target.closest?.(
          'a,button,.btn-login,.login-link,.subscribe-link,[data-route="login"],[data-route="subscribe"],[data-route="library"]'
        );
        if (!el || !root.contains(el)) return;

        let to = null;

        if (
          el.matches(
            '[data-route="login"], .btn-login, .login-link, #login-link'
          )
        )
          to = "/login";
        else if (
          el.matches(
            '[data-route="subscribe"], .subscribe-link, #subscribe-link'
          )
        )
          to = "/subscribe";
        else if (el.matches('[data-route="library"], #library-link'))
          to = "/library";

        if (!to && el.tagName === "A") {
          const href = el.getAttribute("href");
          if (href === "/login") to = "/login";
          else if (href === "/subscribe") to = "/subscribe";
          else if (href === "/library") to = "/library";
        }

        if (!to) return;

        e.preventDefault();
        e.stopPropagation();
        nav(to);
      };

      root.addEventListener("click", onClick);
      return () => root.removeEventListener("click", onClick);
    };

    const wireRegistrationForm = () => {
      if (!hostRef.current) return;
      const form = hostRef.current.querySelector("#registrationForm");
      if (!form) return;

      const nameInput = form.querySelector('input[name="name"], #reg-name');
      const emailInput = form.querySelector('input[name="email"], #reg-email');
      const phoneInput = form.querySelector(
        'input[name="phoneNumber"], #reg-phone'
      );
      const passwordInput = form.querySelector(
        'input[name="password"], #reg-password'
      );
      const submitBtn = form.querySelector("#submitBtn");
      const statusEl =
        form.querySelector("#reg") || form.querySelector("#reg-msg");

      const API_BASE =
        (import.meta.env && import.meta.env.VITE_API_BASE) || "/api";

      const showMsg = (msg, color = "#334155") => {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.display = "block";
        statusEl.style.color = color;
      };

      const setBusy = (busy) => {
        if (!submitBtn) return;
        submitBtn.disabled = busy;
        submitBtn.style.opacity = busy ? "0.7" : "1";
        submitBtn.style.pointerEvents = busy ? "none" : "auto";
      };

      if (phoneInput) {
        phoneInput.setAttribute("type", "tel");
        phoneInput.setAttribute("inputmode", "numeric");
        phoneInput.setAttribute("autocomplete", "tel");
        phoneInput.setAttribute("maxlength", "10");
        phoneInput.setAttribute("pattern", "\\d{10}");
        phoneInput.setAttribute("title", "Enter 10 digit mobile number");

        const sanitize = () => {
          const digits = (phoneInput.value || "")
            .replace(/\D/g, "")
            .slice(0, 10);
          if (digits !== phoneInput.value) phoneInput.value = digits;

          if (submitBtn) submitBtn.disabled = !/^\d{10}$/.test(digits);
        };

        phoneInput.addEventListener("keydown", (e) => {
          const k = e.key;
          const ctrl = e.ctrlKey || e.metaKey || e.altKey;
          const navKey = [
            "Backspace",
            "Delete",
            "Tab",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
          ].includes(k);
          if (ctrl || navKey) return;
          if (!/^\d$/.test(k)) e.preventDefault();
          if ((phoneInput.value || "").length >= 10) {
            if (/^\d$/.test(k)) e.preventDefault();
          }
        });

        ["input", "change", "keyup"].forEach((ev) =>
          phoneInput.addEventListener(ev, sanitize)
        );

        phoneInput.addEventListener("paste", (e) => {
          e.preventDefault();
          const raw = (e.clipboardData?.getData("text") || "")
            .replace(/\D/g, "")
            .slice(0, 10);
          document.execCommand("insertText", false, raw);
        });

        sanitize();
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showMsg("Submitting…", "#64748b");
        setBusy(true);

        try {
          const phoneDigits = (phoneInput?.value || "").replace(/\D/g, "");

          const payload = {
            name: nameInput?.value?.trim() || "",
            email: emailInput?.value?.trim() || "",
            phoneNumber: phoneDigits,
            password: passwordInput?.value || "",
          };

          if (!payload.name || !payload.email || !payload.password) {
            showMsg("Please fill all required fields.", "#b91c1c");
            setBusy(false);
            return;
          }

          if (!/^\d{10}$/.test(payload.phoneNumber)) {
            showMsg("Please enter a valid 10 digit mobile number.", "#b91c1c");
            setBusy(false);
            return;
          }

          const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMsg(
              err?.error || `Registration failed (HTTP ${res.status})`,
              "#b91c1c"
            );
            setBusy(false);
            return;
          }

          const data = await res.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          showMsg("Welcome! Taking you to your Library…", "#166534");
          setTimeout(() => nav("/library"), 400);
        } catch (err) {
          console.error(err);
          showMsg("Network error. Please try again.", "#b91c1c");
        } finally {
          setBusy(false);
        }
      });
    };

    fetch(htmlURL, { credentials: "omit", cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((raw) => {
        if (cancelled) return;
        const html = rewriteRelativeUrls(raw);

        if (hostRef.current) {
          hostRef.current.innerHTML = html;
          executeScripts();

          const detachRouter = attachDelegatedRouter();

          wireRegistrationForm();

          if (detachRouter) {
            hostRef.current.__detachRouter = detachRouter;
          }
        }
      })
      .catch((err) => {
        console.error("PreLogin load failed:", err);
        if (!cancelled) {
          setError("Failed to load the welcome page. Please refresh.");
        }
      });

    return () => {
      cancelled = true;

      const node = hostRef.current;
      if (node && node.__detachRouter) {
        try {
          node.__detachRouter();
        } catch {}
        delete node.__detachRouter;
      }
    };
  }, [nav]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <div ref={hostRef} style={{ flex: 1, position: "relative" }}>
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: 8,
              margin: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
