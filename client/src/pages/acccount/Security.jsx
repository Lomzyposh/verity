import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function Security() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });

  const canSubmitEmail = useMemo(() => {
    return email.trim().length > 4 && emailPassword.length >= 6;
  }, [email, emailPassword]);

  const canSubmitPassword = useMemo(() => {
    return (
      currentPassword.length >= 6 &&
      newPassword.length >= 6 &&
      newPassword === confirmNewPassword
    );
  }, [currentPassword, newPassword, confirmNewPassword]);

  const setError = (text) => setMsg({ type: "error", text });
  const setSuccess = (text) => setMsg({ type: "success", text });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/user/profile");
        if (!mounted) return;
        setProfile(res.data.user);
        setEmail(res.data.user?.email || "");
      } catch (e) {
        // if token expired / not logged in
        navigate("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const submitEmail = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    try {
      const res = await api.patch("/api/user/email", {
        email: email.trim(),
        password: emailPassword,
      });
      setProfile(res.data.user);
      setEmail(res.data.user.email);
      setEmailPassword("");
      setSuccess("Email updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update email.");
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await api.patch("/api/user/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to update password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top spacing because your Navbar is fixed height ~h-20 */}
      <div className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Security
            </h1>
            <p className="text-slate-600 mt-1">
              Update your email and password — smooth and safe.
            </p>
          </div>

          {msg.text && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                msg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* main surface */}
          <div className="grid gap-6">
            {/* Change Email */}
            <div
              className="rounded-2xl border shadow-sm"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(229,231,235,0.9)",
              }}
            >
              <div className="p-5 sm:p-6 border-b" style={{ borderColor: "rgba(229,231,235,0.9)" }}>
                <h2 className="text-lg font-semibold text-slate-900">
                  Change email
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  You’ll use this to login and receive order updates.
                </p>
              </div>

              <form onSubmit={submitEmail} className="p-5 sm:p-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">
                    Email address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "rgba(17,24,39,0.08)" }}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">
                    Confirm with password
                  </label>
                  <input
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    type="password"
                    placeholder="Your current password"
                    className="h-11 rounded-xl border px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "rgba(17,24,39,0.08)" }}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmitEmail || loading}
                    className="h-11 px-5 rounded-xl text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#2563EB" }}
                  >
                    Update email
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/account")}
                    className="h-11 px-5 rounded-xl border font-semibold text-slate-800 hover:bg-slate-50"
                    style={{ borderColor: "rgba(17,24,39,0.10)" }}
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div
              className="rounded-2xl border shadow-sm"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(229,231,235,0.9)",
              }}
            >
              <div className="p-5 sm:p-6 border-b" style={{ borderColor: "rgba(229,231,235,0.9)" }}>
                <h2 className="text-lg font-semibold text-slate-900">
                  Change password
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Pick a strong one — future-you will say “thank you.”
                </p>
              </div>

              <form onSubmit={submitPassword} className="p-5 sm:p-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">
                    Current password
                  </label>
                  <input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    placeholder="Current password"
                    className="h-11 rounded-xl border px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "rgba(17,24,39,0.08)" }}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">
                    New password
                  </label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="New password (min 6 chars)"
                    className="h-11 rounded-xl border px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "rgba(17,24,39,0.08)" }}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">
                    Confirm new password
                  </label>
                  <input
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    type="password"
                    placeholder="Repeat new password"
                    className="h-11 rounded-xl border px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "rgba(17,24,39,0.08)" }}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitPassword || loading}
                  className="h-11 px-5 rounded-xl text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#111827" }}
                >
                  Update password
                </button>
              </form>
            </div>

            {profile?.email && (
              <div className="text-xs text-slate-500">
                Logged in as <span className="font-semibold">{profile.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
