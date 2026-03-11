import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import {
  ChevronLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  Gift,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import LoaderSpinner from "../components/LoaderSpinner";
import toast from "react-hot-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, loading: loadingCart, fetchCartFromServer } = useCart();

  const hasItems = cartItems && cartItems.length > 0;

  // Basic checkout form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user, loading } = useAuth();

  // Totals
  const { subtotal, currency } = useMemo(() => {
    if (!hasItems) return { subtotal: 0, currency: "USD" };

    let cur = "USD";
    let sum = 0;

    cartItems.forEach((entry) => {
      const product = entry.product || {};
      const unit = product.price ?? product.finalPrice ?? entry.unitPrice ?? 0;
      const qty = entry.quantity ?? 1;
      sum += unit * qty;
      if (product.currency) cur = product.currency;
    });

    return { subtotal: sum, currency: cur };
  }, [cartItems, hasItems]);

  const shippingFee = hasItems ? 25 : 0;
  const total = subtotal + shippingFee;
  const minimumUpfrontAmount = Math.round(total * 0.4 * 100) / 100;
  const remainingOnDeliveryAmount = Math.round((total - minimumUpfrontAmount) * 100) / 100;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasItems && !loadingCart) {
      navigate("/cart");
      return;
    }

    if (!form.fullName || !form.email || !form.addressLine1 || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const items = cartItems.map((entry) => ({
        productId: entry.product?._id,
        quantity: entry.quantity ?? 1,
        customization: entry.customization || {},
      }));

      const shippingAddress = {
        fullName: form.fullName,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        country: form.country,
        postalCode: form.postalCode,
      };

      const payload = {
        items,
        shippingAddress,
        currency: "USD",
      };

      console.log("Checkout payload:", {
        ...payload,
        totals: { subtotal, shippingFee, total, currency },
      });

      const response = await api.post("/api/orders", payload);
      await fetchCartFromServer();
      console.log("Order response:", response.data);
      toast.success(
        "Processing your payment… Check your spam folder if you don't see an email shortly.",
      );
      const redirect = response.data?.redirect;
      if (redirect) {
        const url = new URL(redirect);
        console.log("Redirecting to payment URL:", url.pathname);
        navigate(url.pathname);
      } else {
        console.log("No redirect URL, navigating to order payment page");
        navigate(`/payment/${response.data.order?._id}`);
      }
    } catch (err) {
      console.error("Checkout error:", err.response?.data || err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "We couldn’t place your order right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loadingCart) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <LoaderSpinner label="Loading your cart..." />
      </main>
    );
  }

  return (
    <main style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-20 sm:pt-28 pb-10 sm:pb-20">
        {/* Back + title */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs mb-4"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-10">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-semibold"
              style={{ color: "#111827" }}
            >
              Checkout
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Securely complete your order.
            </p>
          </div>

          {hasItems && (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {cartItems.length} item{cartItems.length === 1 ? "" : "s"} in your
              bag
            </p>
          )}
        </header>

        {!hasItems ? (
          <section className="flex flex-col items-center justify-center py-16">
            <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
              Your bag is empty.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "#111827", color: "#FFFFFF" }}
            >
              Browse jewelry
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 lg:gap-10 items-start">
            {/* LEFT: FORM */}
            <section>
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border bg-white p-6 sm:p-7 space-y-6"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2
                  className="text-sm font-semibold mb-1"
                  style={{ color: "#111827" }}
                >
                  Shipping details
                </h2>
                <p className="text-xs mb-2" style={{ color: "#6B7280" }}>
                  We’ll use this information to deliver your order.
                </p>

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      Full name<span style={{ color: "#B91C1C" }}> *</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
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
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      Email<span style={{ color: "#B91C1C" }}> *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        color: "#111827",
                      }}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#111827" }}
                  >
                    Phone number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>

                {/* Address lines */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#111827" }}
                  >
                    Address line 1<span style={{ color: "#B91C1C" }}> *</span>
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    placeholder="Street, building, house number"
                    style={{
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#111827" }}
                  >
                    Address line 2{" "}
                    <span className="font-normal" style={{ color: "#9CA3AF" }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    placeholder="Apartment, suite, landmark"
                    style={{
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>

                {/* City / State */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      City<span style={{ color: "#B91C1C" }}> *</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
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
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      State / Region
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        color: "#111827",
                      }}
                    />
                  </div>
                </div>

                {/* Postal / Country */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      Postal code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
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
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      placeholder="e.g. United states"
                      style={{
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        color: "#111827",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#111827" }}
                  >
                    Order notes{" "}
                    <span className="font-normal" style={{ color: "#9CA3AF" }}>
                      (optional)
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    placeholder="Delivery instructions, preferred time, etc."
                    style={{
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>


                {error && (
                  <p className="text-xs" style={{ color: "#B91C1C" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg text-sm font-medium py-3 sm:py-4 text-center mt-2 flex items-center justify-center gap-2"
                  style={{
                    background: "#111827",
                    color: "#FFFFFF",
                    opacity: submitting ? 0.85 : 1,
                  }}
                >
                  <CreditCard size={16} />
                  {submitting ? "Processing…" : "Continue to payment"}
                </button>

                {/* Security note */}
                <div className="flex items-center gap-2 text-[11px] mt-3">
                  <ShieldCheck size={14} style={{ color: "#10B981" }} />
                  <p style={{ color: "#6B7280" }}>
                    Your details are encrypted and used only to fulfill your
                    order.
                  </p>
                </div>
              </form>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-4">
              <div
                className="rounded-3xl border bg-white p-4 sm:p-5 lg:p-6"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2
                  className="text-sm font-semibold mb-4"
                  style={{ color: "#111827" }}
                >
                  Order summary
                </h2>

                {/* Items list */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {cartItems.map((entry) => {
                    const product = entry.product || {};
                    const qty = entry.quantity ?? 1;
                    const unitPrice =
                      product.price ??
                      product.finalPrice ??
                      entry.unitPrice ??
                      0;
                    const lineTotal = unitPrice * qty;
                    const img =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : null;

                    return (
                      <div key={entry._id} className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F9FAFB] shrink-0">
                          {img ? (
                            <img
                              src={img.url}
                              alt={img.alt || product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span
                                className="text-[10px]"
                                style={{ color: "#9CA3AF" }}
                              >
                                No image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className="text-xs font-medium truncate"
                            style={{ color: "#111827" }}
                          >
                            {product.name || "Untitled piece"}
                          </p>
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "#6B7280" }}
                          >
                            Qty {qty} ·{" "}
                            {formatPrice(
                              lineTotal,
                              product.currency || currency,
                            )}
                          </p>
                          {entry.customization?.engraving && (
                            <p
                              className="text-[11px] mt-0.5"
                              style={{ color: "#9CA3AF" }}
                            >
                              Engraving: {entry.customization.engraving}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div
                  className="space-y-2 text-sm border-t pt-4"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#6B7280" }}>Subtotal</span>
                    <span style={{ color: "#111827" }}>
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Shipping</span>
                    <span style={{ color: "#111827" }}>
                      {shippingFee > 0
                        ? formatPrice(shippingFee, currency)
                        : "Calculated at checkout"}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2 border-t"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#111827" }}
                    >
                      Total
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#111827" }}
                    >
                      {formatPrice(total, currency)}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 rounded-2xl border px-4 py-4"
                  style={{
                    borderColor: "#D1FAE5",
                    background: "#ECFDF5",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#065F46" }}
                  >
                    Flexible payment plan
                  </p>
                  <p className="text-sm mt-2" style={{ color: "#111827" }}>
                    You will pay <span className="font-semibold">40% upfront</span> and the remaining <span className="font-semibold">60% on delivery</span>.
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#065F46" }}>Minimum upfront payment</span>
                      <span className="font-semibold" style={{ color: "#111827" }}>
                        {formatPrice(minimumUpfrontAmount, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#065F46" }}>Balance on delivery</span>
                      <span className="font-semibold" style={{ color: "#111827" }}>
                        {formatPrice(remainingOnDeliveryAmount, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping note */}
              <div
                className="rounded-2xl border bg-white p-3 sm:p-4 text-xs space-y-2"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-center gap-2">
                  <Truck size={16} style={{ color: "#2563EB" }} />
                  <span style={{ color: "#6B7280" }}>
                    Orders are typically dispatched within 2–4 business days.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function formatPrice(amount, currency = "USD") {
  if (amount == null) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
