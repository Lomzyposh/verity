import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = send code, 2 = reset password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/forgot-password", { email });
      setMessage(data.message || "Reset code sent to your email.");
      setStep(2);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to send reset code. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/reset-password", {
        email,
        code,
        newPassword: password,
      });

      setMessage(data.message || "Password reset successful.");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to reset password. Please check the code and try again.";
      setError(msg);
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
        className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        {/* LEFT: FORM */}
        <div className="px-8 py-10 sm:px-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: "#111827" }}
            >
              {step === 1 ? "Forgot password" : "Reset your password"}
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {step === 1
                ? "Enter your email and we’ll send you a one-time code to reset your password."
                : "Enter the code we sent to your email and choose a new password."}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <p className="text-sm" style={{ color: "#B91C1C" }}>
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm" style={{ color: "#16A34A" }}>
                  {message}
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
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    border: "1px solid #E5E7EB",
                    background: "#E5E7EB",
                    color: "#6B7280",
                  }}
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#111827" }}
                >
                  Reset code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none tracking-[0.3em] text-center"
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
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    color: "#111827",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#B91C1C" }}>
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm" style={{ color: "#16A34A" }}>
                  {message}
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
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm" style={{ color: "#6B7280" }}>
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-medium"
              style={{ color: "#2563EB" }}
            >
              Back to login
            </Link>
          </p>
        </div>

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
            src="/images/jew3.jpg"
            alt="VerityGem reset"
            className="w-full h-150 object-cover mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: "#E5E7EB" }}
              >
                VERITYGEM
              </p>
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Reset access, not your shine.
              </h2>
            </div>
            <div className="space-y-2 text-sm" style={{ color: "#E5E7EB" }}>
              <p>
                Your account stays safe with one-time codes and secure reset
                flows.
              </p>
              <p className="text-xs text-gray-300">
                Secure verification · One-time reset codes · Encrypted passwords
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}