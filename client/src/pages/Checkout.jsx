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

  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "transfer" | "giftcard"
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
        paymentMethod,
        currency: "USD",
      };

      console.log("Checkout payload:", {
        ...payload,
        totals: { subtotal, shippingFee, total, currency },
      });

      const response = await api.post("/api/orders", payload);
      await fetchCartFromServer();
      console.log("Order response:", response.data);
      toast.success("Processing your payment… Check your spam folder if you don't see an email shortly.");

      navigate(`/orders`);
    } catch (err) {
      console.error("Checkout error:", err.response?.data || err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "We couldn’t place your order right now. Please try again."
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
        <p style={{ color: "#6B7280" }}>Loading your bag…</p>
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

                {/* PAYMENT METHOD SECTION */}
                <div
                  className="space-y-2 pt-2 border-t"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Payment method
                  </h2>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>
                    Choose how you’d like to pay for this order.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {/* Card payment */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className="w-full text-left rounded-2xl p-3 sm:p-4 lg:p-5 border flex flex-col gap-2 transition-all"
                      style={{
                        borderColor:
                          paymentMethod === "card" ? "#111827" : "#E5E7EB",
                        background:
                          paymentMethod === "card" ? "#F3F4F6" : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border flex items-center justify-center"
                            style={{
                              borderColor:
                                paymentMethod === "card"
                                  ? "#111827"
                                  : "#D1D5DB",
                            }}
                          >
                            {paymentMethod === "card" && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#111827" }}
                              />
                            )}
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#111827" }}
                          >
                            Card payment
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px]" style={{ color: "#6B7280" }}>
                        Pay securely with your debit or credit card.
                      </p>
                      <div className="mt-1 h-6 flex items-center gap-2">
                        <img
                          src="/images/card.png"
                          className="h-10 w-12 rounded"
                        />
                      </div>
                    </button>

                    {/* Transfer / wallets */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className="w-full text-left rounded-2xl p-3 sm:p-4 lg:p-5 border flex flex-col gap-2 transition-all"
                      style={{
                        borderColor:
                          paymentMethod === "transfer" ? "#111827" : "#E5E7EB",
                        background:
                          paymentMethod === "transfer" ? "#F3F4F6" : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border flex items-center justify-center"
                            style={{
                              borderColor:
                                paymentMethod === "transfer"
                                  ? "#111827"
                                  : "#D1D5DB",
                            }}
                          >
                            {paymentMethod === "transfer" && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#111827" }}
                              />
                            )}
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#111827" }}
                          >
                            Transfer / Wallets
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px]" style={{ color: "#6B7280" }}>
                        Complete payment via PayPal, Cash App or Zelle transfer.
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="h-6 w-12 rounded bg-[#E5E7EB] flex items-center justify-center text-[9px]"
                          style={{ color: "#4B5563" }}
                        >
                          PayPal
                        </div>
                        <div
                          className="h-6 w-12 rounded bg-[#E5E7EB] flex items-center justify-center text-[9px]"
                          style={{ color: "#4B5563" }}
                        >
                          CashApp
                        </div>
                        <div
                          className="h-6 w-12 rounded bg-[#E5E7EB] flex items-center justify-center text-[9px]"
                          style={{ color: "#4B5563" }}
                        >
                          Zelle
                        </div>
                        <div
                          className="h-6 w-12 rounded bg-[#E5E7EB] flex items-center justify-center text-[9px]"
                          style={{ color: "#4B5563" }}
                        >
                          Others
                        </div>
                      </div>
                    </button>

                    {/* Gift card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("giftcard")}
                      className="w-full text-left rounded-2xl p-3 sm:p-4 lg:p-5 border flex flex-col gap-2 transition-all"
                      style={{
                        borderColor:
                          paymentMethod === "giftcard" ? "#111827" : "#E5E7EB",
                        background:
                          paymentMethod === "giftcard" ? "#F3F4F6" : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border flex items-center justify-center"
                            style={{
                              borderColor:
                                paymentMethod === "giftcard"
                                  ? "#111827"
                                  : "#D1D5DB",
                            }}
                          >
                            {paymentMethod === "giftcard" && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#111827" }}
                              />
                            )}
                          </span>
                          <span
                            className="text-xs font-medium flex items-center gap-1"
                            style={{ color: "#111827" }}
                          >
                            <Gift size={12} />
                            Gift card
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px]" style={{ color: "#6B7280" }}>
                        Use a supported gift card and upload it after placing
                        your order.
                      </p>
                    </button>
                  </div>
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
                  {submitting ? "Processing…" : "Place order"}
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
                              product.currency || currency
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
