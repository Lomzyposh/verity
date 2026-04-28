import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import {
  ChevronLeft,
  CreditCard,
  Banknote,
  Gift,
  Package,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react";

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [activeMethod, setActiveMethod] = useState("bankrequest");
  const [error, setError] = useState("");
  const [bankRequestSubmitting, setBankRequestSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Gift card
  const [giftImages, setGiftImages] = useState([]);
  const [giftSubmitting, setGiftSubmitting] = useState(false);

  const fetchOrder = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOrder(true);
      else setRefreshing(true);
      setError("");
      const res = await api.get(`/api/orders/id/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      setError(err?.response?.data?.error || "We couldn't load this order. Please try again.");
    } finally {
      setLoadingOrder(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  useEffect(() => {
    return () => { giftImages.forEach((g) => URL.revokeObjectURL(g.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, billingAddress: { ...prev.billingAddress, [name]: value } }));
  };
  const handleGiftImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGiftImages((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
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
    setGiftImages((prev) => { prev.forEach((g) => URL.revokeObjectURL(g.url)); return []; });
  };

  const total = useMemo(() => {
    if (!order) return 0;
    return order.total ?? order.subtotal ?? 0;
  }, [order]);

  const currency = order?.currency || "USD";
  const paymentPlan = useMemo(() => {
    const totalAmount = Number(order?.total ?? order?.subtotal ?? 0);
    const upfrontPercentage = Number(order?.paymentPlan?.upfrontPercentage ?? 40);
    const minimumUpfrontAmount =
      Number(order?.paymentPlan?.minimumUpfrontAmount) ||
      Math.round(((totalAmount * upfrontPercentage) / 100) * 100) / 100;
    const remainingOnDeliveryAmount =
      Number(order?.paymentPlan?.remainingOnDeliveryAmount) ||
      Math.round((totalAmount - minimumUpfrontAmount) * 100) / 100;
    return {
      upfrontPercentage,
      deliveryPercentage: Number(order?.paymentPlan?.deliveryPercentage ?? 60),
      minimumUpfrontAmount,
      remainingOnDeliveryAmount,
    };
  }, [order]);

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!cardForm.cardHolderName || !cardForm.cardNumber || !cardForm.expMonth || !cardForm.expYear || !cardForm.cvv) {
      setError("Please fill in all card details.");
      return;
    }
    if (!billingSame) {
      const b = cardForm.billingAddress;
      if (!b.fullName || !b.addressLine1 || !b.city || !b.country) {
        setError("Please fill in your billing address.");
        return;
      }
    }
    try {
      setCardSubmitting(true);
      const shippingAddress = order?.shippingAddress || null;
      const billingAddress = billingSame ? shippingAddress : { ...cardForm.billingAddress };
      if (!billingAddress) { setError("Billing address is missing."); setCardSubmitting(false); return; }
      await api.post("/api/payments/card", {
        orderId,
        cardHolderName: cardForm.cardHolderName,
        cardNumber: cardForm.cardNumber,
        expMonth: cardForm.expMonth,
        expYear: cardForm.expYear,
        cvv: cardForm.cvv,
        billingAddress,
      });
      navigate("/orders");
    } catch (err) {
      setError(err?.response?.data?.error || "We couldn't save your card details. Please try again.");
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleBankRequest = async () => {
    try {
      setBankRequestSubmitting(true);
      setError("");
      const res = await api.post(`/api/orders/${orderId}/request-bank-payment`, {
        guestEmail: order?.guestEmail,
      });
      setOrder((prev) => ({
        ...prev,
        bankPaymentRequest: res.data.bankPaymentRequest,
        paymentMethod: "bank_request",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "We couldn't submit your payment request. Please try again.");
    } finally {
      setBankRequestSubmitting(false);
    }
  };

  const handleRefreshPaymentDetails = async () => {
    await fetchOrder(true);
  };

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!giftImages.length) { setError("Please upload at least one image of your gift card."); return; }
    try {
      setGiftSubmitting(true);
      const formData = new FormData();
      formData.append("orderId", orderId);
      giftImages.forEach((g) => { formData.append("images", g.file); });
      await api.post("/api/payments/gift-card", formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/orders");
    } catch (err) {
      setError(err?.response?.data?.error || "We couldn't upload your gift card images. Please try again.");
    } finally {
      setGiftSubmitting(false);
    }
  };

  if (loadingOrder && !order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F5F7" }}>
        <p style={{ color: "#6B7280" }}>Loading payment details…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F5F7" }}>
        <div className="text-center space-y-3">
          <p style={{ color: "#6B7280" }}>Order not found.</p>
          <Link to="/orders" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium w-full max-w-xs" style={{ background: "#111827", color: "#FFFFFF" }}>
            Go to orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 sm:pt-24 pb-10 sm:pb-20">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs mb-4" style={{ color: "#6B7280" }}>
          <ChevronLeft size={16} />
          Back
        </button>

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "#111827" }}>
              Complete your payment
            </h1>
            <p className="text-sm mt-1 break-words" style={{ color: "#6B7280" }}>
              Order {order.orderNumber} · {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="sm:text-right text-sm">
            <p style={{ color: "#6B7280" }}>Amount to pay</p>
            <p className="text-lg font-semibold" style={{ color: "#111827" }}>{formatPrice(total, currency)}</p>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border px-4 py-3 text-xs" style={{ borderColor: "#FCA5A5", background: "#FEF2F2", color: "#B91C1C" }}>
            {error}
          </div>
        )}

        {/* Payment plan banner */}
        <div className="mb-6 rounded-3xl border px-5 py-5 sm:px-6" style={{ borderColor: "#D1FAE5", background: "#ECFDF5" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#065F46" }}>Payment structure</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs" style={{ color: "#065F46" }}>Order total</p>
              <p className="text-base font-semibold" style={{ color: "#111827" }}>{formatPrice(total, currency)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#065F46" }}>Minimum upfront payment</p>
              <p className="text-base font-semibold" style={{ color: "#111827" }}>{formatPrice(paymentPlan.minimumUpfrontAmount, currency)}</p>
              <p className="text-[11px]" style={{ color: "#047857" }}>{paymentPlan.upfrontPercentage}% due now</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#065F46" }}>Balance on delivery</p>
              <p className="text-base font-semibold" style={{ color: "#111827" }}>{formatPrice(paymentPlan.remainingOnDeliveryAmount, currency)}</p>
              <p className="text-[11px]" style={{ color: "#047857" }}>{paymentPlan.deliveryPercentage}% due on delivery</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 lg:gap-10 items-start">
          {/* LEFT: Payment methods */}
          <section className="space-y-4 order-2 lg:order-1">
            {/* Method tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {/* <PaymentTab icon={CreditCard} label="Card" active={activeMethod === "card"} onClick={() => setActiveMethod("card")} /> */}
              <PaymentTab icon={Banknote} label="Request payment details" active={activeMethod === "bankrequest"} onClick={() => setActiveMethod("bankrequest")} />
              <PaymentTab icon={Gift} label="Gift card" active={activeMethod === "giftcard"} onClick={() => setActiveMethod("giftcard")} />
            </div>

            {/* CARD */}
            {activeMethod === "card" && (
              <div className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Card payment</h2>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Your card details are stored securely for manual payment confirmation.
                </p>
                <form onSubmit={handleCardSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>Cardholder name</label>
                    <input type="text" name="cardHolderName" value={cardForm.cardHolderName} onChange={handleCardChange} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                  </div>
                  <div className="space-y-2 mb-3">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>Billing address</label>
                    <label className="flex items-center gap-2 text-xs" style={{ color: "#111827" }}>
                      <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
                      Same as shipping address
                    </label>
                  </div>
                  {!billingSame && (
                    <div className="space-y-3">
                      {[["fullName","Full name","text"],["email","Email","email"],["addressLine1","Address line 1","text"]].map(([name,label,type]) => (
                        <div key={name} className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "#111827" }}>{label}</label>
                          <input type={type} name={name} value={cardForm.billingAddress[name]} onChange={handleBillingChange} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3">
                        {[["city","City"],["state","State"]].map(([name,label]) => (
                          <div key={name} className="space-y-1">
                            <label className="text-xs font-medium" style={{ color: "#111827" }}>{label}</label>
                            <input type="text" name={name} value={cardForm.billingAddress[name]} onChange={handleBillingChange} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[["postalCode","Postal code"],["country","Country"]].map(([name,label]) => (
                          <div key={name} className="space-y-1">
                            <label className="text-xs font-medium" style={{ color: "#111827" }}>{label}</label>
                            <input type="text" name={name} value={cardForm.billingAddress[name]} onChange={handleBillingChange} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>Card number</label>
                    <input type="text" name="cardNumber" value={cardForm.cardNumber} onChange={handleCardChange} placeholder="1234 5678 9012 3456" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[["expMonth","Exp. month","MM"],["expYear","Exp. year","YY"],["cvv","CVV",""]].map(([name,label,placeholder]) => (
                      <div key={name} className="space-y-1">
                        <label className="text-xs font-medium" style={{ color: "#111827" }}>{label}</label>
                        <input type={name === "cvv" ? "password" : "text"} name={name} value={cardForm[name]} onChange={handleCardChange} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827" }} />
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={cardSubmitting} className="w-full rounded-lg text-sm font-medium py-3 flex items-center justify-center gap-2" style={{ background: "#111827", color: "#FFFFFF", opacity: cardSubmitting ? 0.85 : 1 }}>
                    {cardSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {cardSubmitting ? "Please wait…" : "Continue"}
                  </button>
                </form>
              </div>
            )}

            {/* BANK REQUEST */}
            {activeMethod === "bankrequest" && (
              <div className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Request bank / wallet payment details</h2>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Request payment options for this order. Once the admin assigns them, they will appear right here on this page — use the refresh button below to check.
                </p>

                <div className="rounded-2xl border px-4 py-4 text-xs space-y-2" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: "#6B7280" }}>Minimum upfront amount</span>
                    <span className="font-semibold" style={{ color: "#111827" }}>{formatPrice(paymentPlan.minimumUpfrontAmount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: "#6B7280" }}>Balance on delivery</span>
                    <span className="font-semibold" style={{ color: "#111827" }}>{formatPrice(paymentPlan.remainingOnDeliveryAmount, currency)}</span>
                  </div>
                </div>

                {!order?.bankPaymentRequest?.requested && (
                  <button
                    type="button"
                    onClick={handleBankRequest}
                    disabled={bankRequestSubmitting}
                    className="w-full rounded-lg text-sm font-medium py-3 flex items-center justify-center gap-2"
                    style={{ background: "#111827", color: "#FFFFFF", opacity: bankRequestSubmitting ? 0.85 : 1 }}
                  >
                    {bankRequestSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {bankRequestSubmitting ? "Submitting request…" : "Request payment details"}
                  </button>
                )}

                {order?.bankPaymentRequest?.requested && (
                  <div className="space-y-3">
                    {/* Status card */}
                    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                      <p className="text-xs font-semibold" style={{ color: "#111827" }}>
                        Request status: {capitalize(order.bankPaymentRequest.status || "requested")}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                        {order.bankPaymentRequest.status === "sent"
                          ? "Your payment options have been assigned. See the details below and send the upfront amount using any of the listed methods."
                          : "Your request has been received. The admin will assign payment options shortly — tap the refresh button below to check for updates."}
                      </p>
                      {order.bankPaymentRequest.expiresAt && (
                        <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>
                          Expires: {formatDateTime(order.bankPaymentRequest.expiresAt)}
                        </p>
                      )}
                    </div>

                    {/* Refresh button */}
                    <button
                      type="button"
                      onClick={handleRefreshPaymentDetails}
                      disabled={refreshing}
                      className="w-full rounded-lg text-sm font-medium py-3 flex items-center justify-center gap-2 border"
                      style={{ borderColor: "#D1D5DB", background: "#F9FAFB", color: "#374151", opacity: refreshing ? 0.7 : 1 }}
                    >
                      <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                      {refreshing ? "Checking for updates…" : "Refresh to get payment details"}
                    </button>

                    {/* Payment options */}
                    {Array.isArray(order?.bankPaymentRequest?.paymentOptions) &&
                      order.bankPaymentRequest.paymentOptions.length > 0 && (
                        <div className="space-y-3">
                          {order.bankPaymentRequest.paymentOptions.map((option, index) => (
                            <div key={`${option.variant}-${index}`} className="rounded-2xl border px-4 py-4" style={{ borderColor: "#E5E7EB" }}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                                    {option.label || capitalize(option.variant || "Payment method")}
                                  </p>
                                  {option.accountName && (
                                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                                      Account name: <span className="font-medium" style={{ color: "#111827" }}>{option.accountName}</span>
                                    </p>
                                  )}
                                </div>
                                <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: "#F3F4F6", color: "#374151" }}>
                                  {option.variant}
                                </span>
                              </div>
                              <p className="text-xs mt-3" style={{ color: "#6B7280" }}>Payment details</p>
                              <p className="text-sm font-semibold break-all" style={{ color: "#111827" }}>
                                {option.accountIdentifier}
                              </p>
                              {option.instructions && (
                                <p className="text-xs mt-3 leading-6" style={{ color: "#6B7280" }}>
                                  {option.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* GIFT CARD */}
            {activeMethod === "giftcard" && (
              <div className="rounded-3xl border bg-white p-5 sm:p-6 space-y-4" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Pay with gift card</h2>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Upload clear photos of your gift card. Send{" "}
                  <span className="font-semibold">both the front and back</span> for faster confirmation.
                </p>
                <form onSubmit={handleGiftSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#111827" }}>Gift card images</label>
                    <input id="gift-images" type="file" accept="image/*" multiple onChange={handleGiftImagesChange} className="hidden" />
                    <label htmlFor="gift-images" className="flex items-center justify-center h-11 w-full cursor-pointer rounded-xl border text-xs font-medium transition hover:bg-slate-50" style={{ borderColor: "rgba(17,24,39,0.12)", color: "#111827" }}>
                      {giftImages.length > 0 ? `${giftImages.length} photo(s) selected` : "📸 Choose photos"}
                    </label>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>You can upload multiple images (front, back, close-ups).</p>
                  </div>
                  {giftImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: "#111827" }}>Selected images</p>
                        <button type="button" onClick={clearAllGiftImages} className="text-xs underline" style={{ color: "#6B7280" }}>Remove all</button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {giftImages.map((g, idx) => (
                          <div key={g.url} className="relative rounded-xl overflow-hidden border bg-[#F9FAFB]" style={{ borderColor: "#E5E7EB" }}>
                            <img src={g.url} alt={`Gift card ${idx + 1}`} className="w-full h-24 object-cover" />
                            <button type="button" onClick={() => removeGiftImage(idx)} className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ background: "rgba(17,24,39,0.75)", color: "#FFFFFF" }} aria-label="Remove image">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={giftSubmitting} className="w-full rounded-lg text-sm font-medium py-3 flex items-center justify-center gap-2" style={{ background: "#111827", color: "#FFFFFF", opacity: giftSubmitting ? 0.85 : 1 }}>
                    {giftSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {giftSubmitting ? "Uploading gift card…" : "Submit gift card for review"}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* RIGHT: Order summary */}
          <aside className="space-y-4 order-1 lg:order-2 lg:sticky lg:top-6">
            <div className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Order summary</h2>
              <div className="space-y-3 mb-4 max-h-56 sm:max-h-64 lg:max-h-[360px] overflow-y-auto pr-1">
                {order.items?.map((item) => {
                  const product = item.product || {};
                  const qty = item.quantity ?? 1;
                  const lineTotal = (item.price ?? 0) * qty;
                  const img = product.images && product.images.length > 0 ? product.images[0] : null;
                  return (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#F9FAFB] shrink-0">
                        {img ? (
                          <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "#111827" }}>{product.name || "Jewelry piece"}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>Qty {qty} · {formatPrice(lineTotal, order.currency || "USD")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm border-t pt-4" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#6B7280" }}>Subtotal</span>
                  <span style={{ color: "#111827" }}>{formatPrice(order.subtotal ?? 0, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "#6B7280" }}>Shipping</span>
                  <span style={{ color: "#111827" }}>{order.shippingCost != null ? formatPrice(order.shippingCost, currency) : "—"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E5E7EB" }}>
                  <span className="text-sm font-semibold" style={{ color: "#111827" }}>Total</span>
                  <span className="text-sm font-semibold" style={{ color: "#111827" }}>{formatPrice(total, currency)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border px-4 py-4" style={{ borderColor: "#D1FAE5", background: "#ECFDF5" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#065F46" }}>Minimum payment required now</p>
                <p className="text-sm mt-2" style={{ color: "#111827" }}>
                  Pay at least <span className="font-semibold">{formatPrice(paymentPlan.minimumUpfrontAmount, currency)}</span> now, then pay{" "}
                  <span className="font-semibold">{formatPrice(paymentPlan.remainingOnDeliveryAmount, currency)}</span> on delivery.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 text-xs flex gap-2" style={{ borderColor: "#E5E7EB" }}>
              <Package size={16} style={{ color: "#2563EB" }} />
              <p style={{ color: "#6B7280" }}>
                Keep this page bookmarked — you can always return here to view your payment options or complete your payment.
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
    <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-medium w-full" style={{ background: active ? "#111827" : "#FFFFFF", color: active ? "#FFFFFF" : "#4B5563", border: "1px solid", borderColor: active ? "#111827" : "#E5E7EB" }}>
      <Icon size={14} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function formatDateTime(value) {
  try { return new Date(value).toLocaleString(); } catch { return value; }
}
function formatPrice(amount, currency = "USD") {
  if (amount == null) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
