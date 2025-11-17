import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to log you in. Please check your details.";
      setError(message || "Unable to log you in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F5F5F7" }}
    >
      <div
        className="w-full bg-white max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl"
        style={{ border: "1px solid #E5E7EB" }}
      >
        {/* LEFT: FORM */}
        <div className="px-8 py-10 sm:px-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-[poppins] font-bold text-[#2564eb] mb-2">
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Log in to continue exploring timeless pieces from VerityGem.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                className="text-sm font-medium"
                style={{ color: "#111827" }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  color: "#111827",
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-medium"
                  style={{ color: "#2563EB" }}
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  color: "#111827",
                }}
              />
            </div>

            {error && (
              <p className="text-sm mt-2" style={{ color: "#B91C1C" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-lg text-sm font-medium py-2.5 transition"
              style={{
                background: loading ? "#6B7280" : "#4B5563",
                color: "#FFFFFF",
              }}
            >
              {loading ? "Signing you in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm" style={{ color: "#6B7280" }}>
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium"
              style={{ color: "#2563EB" }}
            >
              Create one
            </Link>
          </p>
        </div>

        {/* RIGHT: JEWELRY IMAGE / TRANSITION PANEL */}
        <motion.div
          className="hidden lg:block relative"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top left, rgba(37,99,235,0.2), transparent 55%), radial-gradient(circle at bottom right, rgba(15,23,42,0.9), #020617)",
            }}
          />
          <img
            src="/images/jew1.jpg"
            alt="Jewelry showcase"
            className="w-full h-150 object-cover mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: "#E5E7EB" }}
              >
                VERITYGEM
              </p>
              <h2 className="text-2xl font-semibold leading-tight text-white">
                The perfect jewels <br /> for every moment.
              </h2>
            </div>

            <div className="space-y-2 text-sm" style={{ color: "#E5E7EB" }}>
              <p>
                Curated pieces crafted with precision, made to shine with you in
                every season.
              </p>
              <p className="text-xs text-gray-300">
                Secure checkout · Insured delivery · Certified materials
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
