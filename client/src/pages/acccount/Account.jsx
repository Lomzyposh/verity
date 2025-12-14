import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function Account() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/user/profile");
        if (!mounted) return;
        setUser(res.data.user);
      } catch (e) {
        navigate("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const logout = async () => {
    setMsg("");
    try {
      // If you already have /api/auth/logout, use that.
      // Otherwise, just clear token cookie on backend.
      await api.post("/api/auth/logout");
      navigate("/login");
    } catch {
      // fallback: still redirect
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              My Account
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your profile, security and preferences — easy peasy 😄
            </p>
          </div>

          {msg && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              {msg}
            </div>
          )}

          {/* Top profile card */}
          <div
            className="rounded-2xl border shadow-sm mb-6"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(229,231,235,0.9)",
            }}
          >
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500">
                  SIGNED IN AS
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {loading ? "Loading..." : user?.name || "User"}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {loading ? " " : user?.email || ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/account/security"
                  className="h-11 px-5 rounded-xl text-white font-semibold shadow-sm grid place-items-center"
                  style={{ background: "#2563EB" }}
                >
                  Security
                </Link>

                <button
                  onClick={logout}
                  className="h-11 px-5 rounded-xl border font-semibold text-slate-800 hover:bg-slate-50"
                  style={{ borderColor: "rgba(17,24,39,0.10)" }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Action grid */}
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            <AccountCard
              title="Profile"
              desc="Update your name and basic details."
              to="/account/profile"
              emoji="👤"
            />
            <AccountCard
              title="Security"
              desc="Change email and password."
              to="/account/security"
              emoji="🔒"
            />
            <AccountCard
              title="Orders"
              desc="Track your purchases and delivery status."
              to="/orders"
              emoji="📦"
            />
            <AccountCard
              title="Addresses"
              desc="Manage shipping addresses for faster checkout."
              to="/account/addresses"
              emoji="📍"
            />
          </div>

          {/* Small footer note */}
          <div className="mt-8 text-xs text-slate-500">
            Tip: Keep your email and password updated — your future self will
            smile 🙂✨
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ title, desc, to, emoji }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border shadow-sm hover:shadow-md transition bg-white"
      style={{ borderColor: "rgba(229,231,235,0.9)" }}
    >
      <div className="p-5 sm:p-6 flex items-start gap-4">
        <div
          className="h-12 w-12 rounded-2xl grid place-items-center text-xl"
          style={{ background: "rgba(37,99,235,0.10)" }}
        >
          {emoji}
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <span className="text-slate-400 group-hover:text-slate-600 transition">
              →
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{desc}</p>
        </div>
      </div>
    </Link>
  );
}