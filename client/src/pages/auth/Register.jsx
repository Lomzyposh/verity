import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth(); // we’ll log user in after successful registration
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
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
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 1) express-validator errors
        if (
          data.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        ) {
          throw new Error(data.errors[0].msg || "Invalid input");
        }

        // 2) custom error like "Email already registered"
        if (data.error) {
          throw new Error(data.error);
        }

        throw new Error("Registration failed");
      }

      // Auto-login after successful register
      await login({ email: form.email, password: form.password });

      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to create your account.");
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
        className="w-full max-w-5xl h-[600px] lg:h-[700px] grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div className="px-8 py-10 sm:px-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: "#111827" }}
            >
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Join VerityGem and start building your personal collection.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                className="text-sm font-medium"
                style={{ color: "#111827" }}
              >
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
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
              <label
                className="text-sm font-medium"
                style={{ color: "#111827" }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  color: "#111827",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Use at least 6 characters to keep your account secure.
              </p>
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
              {loading ? "Creating your account..." : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-sm" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium"
              style={{ color: "#2563EB" }}
            >
              Login instead
            </Link>
          </p>
        </div>

        {/* RIGHT: JEWELRY VISUAL / TRANSITION PANEL */}
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
                "radial-gradient(circle at top right, rgba(37,99,235,0.3), transparent 55%), radial-gradient(circle at bottom left, rgba(15,23,42,0.95), #020617)",
            }}
          />
          <img
            src="/images/jew2.jpg"
            alt="VerityGem collection"
            className="w-full h-full object-cover mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: "#E5E7EB" }}
              >
                NEW COLLECTION
              </p>
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Sign up to unlock <br /> early access & special drops.
              </h2>
            </div>

            <div className="space-y-2 text-sm" style={{ color: "#E5E7EB" }}>
              <p>
                Members receive early previews, curated recommendations and
                exclusive offers tailored to your style.
              </p>
              <p className="text-xs text-gray-300">
                No spam. Just carefully selected brilliance.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
