import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import {
  ChevronLeft,
  CreditCard,
  Banknote,
  Gift,
  Package,
  Loader2,
  X,
} from "lucide-react";

export default function Payment() {
  const { orderId } = useParams(); // /payment/:orderId
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [activeMethod, setActiveMethod] = useState("card"); // "card" | "transfer" | "giftcard"
  const [error, setError] = useState("");

  // Card + billing form
  const [cardForm, setCardForm] = useState({
    cardHolderName: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    billingAddress: {
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const [billingSame, setBillingSame] = useState(true);
  const [cardSubmitting, setCardSubmitting] = useState(false);

  // Gift card images (store file + preview url)
  const [giftImages, setGiftImages] = useState([]); // [{ file, url }]
  const [giftSubmitting, setGiftSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoadingOrder(true);
        setError("");
        const res = await api.get(`/api/orders/id/${orderId}`);
        setOrder(res.data.order);
      } catch (err) {
        console.error("Error loading order:", err);
        setError(
          err?.response?.data?.error ||
            "We couldn’t load this order. Please try again."
        );
      } finally {
        setLoadingOrder(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoadingWallets(true);
        const res = await api.get("/api/payment-accounts");
        setWallets(res.data.accounts || []);
      } catch (err) {
        console.error("Error loading payment accounts:", err);
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, []);

  // Cleanup gift preview urls on unmount
  useEffect(() => {
    return () => {
      giftImages.forEach((g) => URL.revokeObjectURL(g.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [name]: value,
      },
    }));
  };

  const handleGiftImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // convert to {file, url}
    const mapped = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    // add to existing (so they can pick multiple times)
    setGiftImages((prev) => [...prev, ...mapped]);

    // allow selecting same file again later
    e.target.value = "";
  };

  const removeGiftImage = (index) => {
    setGiftImages((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const clearAllGiftImages = () => {
    setGiftImages((prev) => {
      prev.forEach((g) => URL.revokeObjectURL(g.url));
      return [];
    });
  };

  const total = useMemo(() => {
    if (!order) return 0;
    return order.total ?? order.subtotal ?? 0;
  }, [order]);

  const currency = order?.currency || "USD";

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !cardForm.cardHolderName ||
      !cardForm.cardNumber ||
      !cardForm.expMonth ||
      !cardForm.expYear ||
      !cardForm.cvv
    ) {
      setError("Please fill in all card details.");
      return;
    }

    // If billing is not same as shipping, make sure at least some key fields are present
    if (!billingSame) {
      const b = cardForm.billingAddress;
      if (!b.fullName || !b.addressLine1 || !b.city || !b.country) {
        setError("Please fill in your billing address.");
        return;
      }
    }

    try {
      setCardSubmitting(true);

      // Shipping address comes from the order (saved at checkout)
      const shippingAddress = order?.shippingAddress || null;

      const billingAddress = billingSame
        ? shippingAddress
        : { ...cardForm.billingAddress };

      if (!billingAddress) {
        setError("Billing address is missing.");
        setCardSubmitting(false);
        return;
      }

      const payload = {
        orderId,
        cardHolderName: cardForm.cardHolderName,
        cardNumber: cardForm.cardNumber,
        expMonth: cardForm.expMonth,
        expYear: cardForm.expYear,
        cvv: cardForm.cvv,
        billingAddress,
      };

      await api.post("/api/payments/card", payload);

      navigate("/orders");
    } catch (err) {
      console.error("Card payment error:", err);
      setError(
        err?.response?.data?.error ||
          "We couldn’t save your card details. Please try again."
      );
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!giftImages.length) {
      setError("Please upload at least one image of your gift card.");
      return;
    }

    try {
      setGiftSubmitting(true);

      const formData = new FormData();
      formData.append("orderId", orderId);
      giftImages.forEach((g) => {
        formData.append("images", g.file);
      });

      await api.post("/api/payments/gift-card", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/orders");
    } catch (err) {
      console.error("Gift card payment error:", err);
      setError(
        err?.response?.data?.error ||
          "We couldn’t upload your gift card images. Please try again."
      );
    } finally {
      setGiftSubmitting(false);
    }
  };

  if (authLoading || (loadingOrder && !order)) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <p style={{ color: "#6B7280" }}>Loading payment details…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <div className="text-center space-y-3">
          <p style={{ color: "#6B7280" }}>Order not found.</p>
          <Link
            to="/orders"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "#111827", color: "#FFFFFF" }}
          >
            Go to orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Back + heading */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs mb-4"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-semibold"
              style={{ color: "#111827" }}
            >
              Complete your payment
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Order {order.orderNumber} · {order.items?.length || 0} item
              {order.items?.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="text-right text-sm">
            <p style={{ color: "#6B7280" }}>Amount to pay</p>
            <p className="text-lg font-semibold" style={{ color: "#111827" }}>
              {formatPrice(total, currency)}
            </p>
          </div>
        </header>

        {error && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-xs"
            style={{
              borderColor: "#FCA5A5",
              background: "#FEF2F2",
              color: "#B91C1C",
            }}
          >
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-10 items-start">
          {/* LEFT: Payment methods */}
          <section className="space-y-4">
            {/* Tabs / buttons */}
            <div className="grid sm:grid-cols-3 gap-2 mb-2">
              <PaymentTab
                icon={CreditCard}
                label="Card"
                active={activeMethod === "card"}
                onClick={() => setActiveMethod("card")}
              />
              <PaymentTab
                icon={Banknote}
                label="Transfer / Wallet"
                active={activeMethod === "transfer"}
                onClick={() => setActiveMethod("transfer")}
              />
              <PaymentTab
                icon={Gift}
                label="Gift card"
                active={activeMethod === "giftcard"}
                onClick={() => setActiveMethod("giftcard")}
              />
            </div>

            {activeMethod === "card" && (
              <div
                className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>
                  Card payment
                </h2>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Your card details are stored securely for manual payment confirmation.
                  In production, use a PCI-compliant provider like Stripe or Paystack
                  instead of saving raw card data.
                </p>

                <form onSubmit={handleCardSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>
                      Cardholder name
                    </label>
                    <input
                      type="text"
                      name="cardHolderName"
                      value={cardForm.cardHolderName}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        color: "#111827",
                      }}
                    />
                  </div>

                  <div className="space-y-2 mb-3">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>
                      Billing address
                    </label>

                    <label className="flex items-center gap-2 text-xs" style={{ color: "#111827" }}>
                      <input
                        type="checkbox"
                        checked={billingSame}
                        onChange={(e) => setBillingSame(e.target.checked)}
                      />
                      Same as shipping address
                    </label>
                  </div>

                  {!billingSame && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium" style={{ color: "#111827" }}>
                          Full name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={cardForm.billingAddress.fullName}
                          onChange={handleBillingChange}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            border: "1px solid #E5E7EB",
                            background: "#F9FAFB",
                            color: "#111827",
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium" style={{ color: "#111827" }}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={cardForm.billingAddress.email}
                          onChange={handleBillingChange}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            border: "1px solid #E5E7EB",
                            background: "#F9FAFB",
                            color: "#111827",
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium" style={{ color: "#111827" }}>
                          Address line 1
                        </label>
                        <input
                          type="text"
                          name="addressLine1"
                          value={cardForm.billingAddress.addressLine1}
                          onChange={handleBillingChange}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            border: "1px solid #E5E7EB",
                            background: "#F9FAFB",
                            color: "#111827",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "#111827" }}>
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={cardForm.billingAddress.city}
                            onChange={handleBillingChange}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E7EB",
                              background: "#F9FAFB",
                              color: "#111827",
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "#111827" }}>
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={cardForm.billingAddress.state}
                            onChange={handleBillingChange}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E7EB",
                              background: "#F9FAFB",
                              color: "#111827",
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "#111827" }}>
                            Postal code
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={cardForm.billingAddress.postalCode}
                            onChange={handleBillingChange}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E7EB",
                              background: "#F9FAFB",
                              color: "#111827",
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "#111827" }}>
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={cardForm.billingAddress.country}
                            onChange={handleBillingChange}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E7EB",
                              background: "#F9FAFB",
                              color: "#111827",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>
                      Card number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardForm.cardNumber}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      placeholder="1234 5678 9012 3456"
                      style={{
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        color: "#111827",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: "#111827" }}>
                        Exp. month
                      </label>
                      <input
                        type="text"
                        name="expMonth"
                        value={cardForm.expMonth}
                        onChange={handleCardChange}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        placeholder="MM"
                        style={{
                          border: "1px solid #E5E7EB",
                          background: "#F9FAFB",
                          color: "#111827",
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: "#111827" }}>
                        Exp. year
                      </label>
                      <input
                        type="text"
                        name="expYear"
                        value={cardForm.expYear}
                        onChange={handleCardChange}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        placeholder="YY"
                        style={{
                          border: "1px solid #E5E7EB",
                          background: "#F9FAFB",
                          color: "#111827",
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: "#111827" }}>
                        CVV
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        value={cardForm.cvv}
                        onChange={handleCardChange}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          border: "1px solid #E5E7EB",
                          background: "#F9FAFB",
                          color: "#111827",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cardSubmitting}
                    className="w-full rounded-lg text-sm font-medium py-3 text-center flex items-center justify-center gap-2"
                    style={{
                      background: "#111827",
                      color: "#FFFFFF",
                      opacity: cardSubmitting ? 0.85 : 1,
                    }}
                  >
                    {cardSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {cardSubmitting ? "Please wait...." : "Continue"}
                  </button>
                </form>
              </div>
            )}

            {activeMethod === "transfer" && (
              <div
                className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>
                  Bank / wallet transfer
                </h2>

                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Send the exact order amount to any of the accounts below. After payment,
                  reply the email you received with your proof of payment for faster confirmation.
                </p>

                <div
                  className="rounded-xl px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center sm:gap-2 bg-green-100"
                  style={{ color: "#374151", border: "1px solid #E5E7EB" }}
                >
                  <span className="font-medium text-center sm:text-left">
                    Note: Send Receipt to
                  </span>

                  <span
                    className="font-semibold text-center sm:text-left text-[#111827] break-all"
                  >
                    veritygem47@gmail.com
                  </span>

                  <span className="text-center sm:text-left">for confirmation.</span>
                </div>

                {loadingWallets ? (
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    Loading accounts…
                  </p>
                ) : wallets.length === 0 ? (
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    No payment accounts are available at the moment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {wallets.map((acc) => (
                      <div
                        key={acc._id}
                        className="rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        style={{ borderColor: "#E5E7EB" }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {acc.logoUrl && (
                            <img
                              src={acc.logoUrl}
                              alt={acc.name}
                              className="w-8 h-8 rounded-full object-contain bg-[#F3F4F6]"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: "#111827" }}
                            >
                              {acc.displayName || acc.name}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>
                              {acc.details}
                            </p>
                          </div>
                        </div>
                        <div className="text-[11px] text-right">
                          {acc.accountNumber && (
                            <p style={{ color: "#111827" }}>{acc.accountNumber}</p>
                          )}
                          {acc.bankName && (
                            <p style={{ color: "#6B7280" }}>{acc.bankName}</p>
                          )}
                          {acc.type && (
                            <p style={{ color: "#9CA3AF" }}>{acc.type.toUpperCase()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeMethod === "giftcard" && (
              <div
                className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>
                  Pay with gift card
                </h2>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Upload clear photos of your gift card. It’s best to send{" "}
                  <span className="font-semibold">both the front and back images</span>{" "}
                  for faster confirmation.
                </p>

                <form onSubmit={handleGiftSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>
                      Gift card images
                    </label>

                    <input
                      id="gift-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGiftImagesChange}
                      className="hidden"
                    />

                    <label
                      htmlFor="gift-images"
                      className="flex items-center justify-center h-11 w-full cursor-pointer rounded-xl border text-xs font-medium transition hover:bg-slate-50"
                      style={{
                        borderColor: "rgba(17,24,39,0.12)",
                        color: "#111827",
                      }}
                    >
                      {giftImages.length > 0
                        ? `${giftImages.length} photo(s) selected`
                        : "📸 Choose photos"}
                    </label>

                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      You can upload multiple images (front, back, close-ups).
                    </p>
                  </div>

                  {/* Previews with remove */}
                  {giftImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: "#111827" }}>
                          Selected images
                        </p>
                        <button
                          type="button"
                          onClick={clearAllGiftImages}
                          className="text-xs underline"
                          style={{ color: "#6B7280" }}
                        >
                          Remove all
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {giftImages.map((g, idx) => (
                          <div
                            key={g.url}
                            className="relative rounded-xl overflow-hidden border bg-[#F9FAFB]"
                            style={{ borderColor: "#E5E7EB" }}
                          >
                            <img
                              src={g.url}
                              alt={`Gift card ${idx + 1}`}
                              className="w-full h-24 object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => removeGiftImage(idx)}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-sm"
                              style={{
                                background: "rgba(17,24,39,0.75)",
                                color: "#FFFFFF",
                              }}
                              aria-label="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={giftSubmitting}
                    className="w-full rounded-lg text-sm font-medium py-3 text-center flex items-center justify-center gap-2"
                    style={{
                      background: "#111827",
                      color: "#FFFFFF",
                      opacity: giftSubmitting ? 0.85 : 1,
                    }}
                  >
                    {giftSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {giftSubmitting ? "Uploading gift card…" : "Submit gift card for review"}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* RIGHT: Order summary */}
          <aside className="space-y-4">
            <div
              className="rounded-3xl border bg-white p-5 sm:p-6"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
                Order summary
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {order.items?.map((item) => {
                  const product = item.product || {};
                  const qty = item.quantity ?? 1;
                  const lineTotal = (item.price ?? 0) * qty;
                  const img =
                    product.images && product.images.length > 0 ? product.images[0] : null;

                  return (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F9FAFB] shrink-0">
                        {img ? (
                          <img
                            src={img.url}
                            alt={img.alt || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "#111827" }}>
                          {product.name || "Jewelry piece"}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                          Qty {qty} · {formatPrice(lineTotal, order.currency || "USD")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm border-t pt-4" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#6B7280" }}>Subtotal</span>
                  <span style={{ color: "#111827" }}>
                    {formatPrice(order.subtotal ?? 0, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "#6B7280" }}>Shipping</span>
                  <span style={{ color: "#111827" }}>
                    {order.shippingCost != null
                      ? formatPrice(order.shippingCost, currency)
                      : "—"}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                    Total
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border bg-white p-4 text-xs flex gap-2"
              style={{ borderColor: "#E5E7EB" }}
            >
              <Package size={16} style={{ color: "#2563EB" }} />
              <p style={{ color: "#6B7280" }}>
                This payment link was also sent to your email with your order confirmation.
                You can always come back to complete payment from there.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PaymentTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium"
      style={{
        background: active ? "#111827" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#4B5563",
        border: "1px solid",
        borderColor: active ? "#111827" : "#E5E7EB",
      }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
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