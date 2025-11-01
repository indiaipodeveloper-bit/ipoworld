import { useState } from "react";
import Page from "../components/Page.jsx";
import { API } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setMsg("If that email exists, a reset link has been sent.");
    } catch {
      setMsg("If that email exists, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Forgot Password">
      <div className="container py-10">
        <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
          />
          <button type="submit" disabled={!email || loading} className="btn">
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
          {!!msg && <p className="text-green-600">{msg}</p>}
        </form>
      </div>
    </Page>
  );
}
