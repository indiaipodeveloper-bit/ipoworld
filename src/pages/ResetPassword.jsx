import { useMemo, useState } from "react";
import Page from "../components/Page.jsx";
import { API } from "../api.js";

function useToken() {
  return useMemo(() => {
    const u = new URL(window.location.href);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }, []);
}

export default function ResetPassword() {
  const token = useToken();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const valid = password.length >= 8 && password === confirm;

  async function onSubmit(e) {
    e.preventDefault();
    setOk("");
    setErr("");
    if (!valid) return;
    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setOk("Password updated. You can now log in.");
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Invalid or expired link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Reset Password">
      <div className="container py-10">
        <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
          <input
            className="input"
            type="password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" disabled={!valid || loading} className="btn">
            {loading ? "Updating…" : "Update Password"}
          </button>
          {!!ok && <p className="text-green-600">{ok}</p>}
          {!!err && <p className="text-red-600">{err}</p>}
        </form>
      </div>
    </Page>
  );
}
