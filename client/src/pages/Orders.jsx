import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import {
  ChevronLeft,
  Package,
  Calendar,
  CreditCard,
  Truck,
  ArrowRight,
  Info,
} from "lucide-react";

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/api/orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Error loading orders:", err);
        setError(
          err?.response?.data?.error ||
            "We couldn’t load your orders right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const hasOrders = orders && orders.length > 0;

  const totalSpent = useMemo(() => {
    if (!hasOrders) return 0;
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders, hasOrders]);

  const currency = orders[0]?.currency || "USD";

  if (authLoading || (user && loading && !hasOrders)) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <p style={{ color: "#6B7280" }}>Loading your orders…</p>
      </main>
    );
  }

  return (
    <main style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
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

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-semibold"
              style={{ color: "#111827" }}
            >
              Your orders
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Track your recent purchases and order history.
            </p>
          </div>

          {hasOrders && (
            <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
              <p style={{ color: "#6B7280" }}>
                {orders.length} order{orders.length === 1 ? "" : "s"} placed
              </p>
              <p style={{ color: "#111827" }}>
                Total spent:{" "}
                <span className="font-semibold">
                  {formatPrice(totalSpent, currency)}
                </span>
              </p>
            </div>
          )}
        </header>

        {/* 🔎 STATUS EXPLANATION NOTE */}
        <section className="mb-6">
          <div
            className="rounded-2xl border px-4 py-3 flex flex-col gap-1 text-[11px] sm:text-xs"
            style={{
              borderColor: "#E5E7EB",
              background: "#F9FAFB",
              color: "#4B5563",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} />
              <span className="font-medium">Order status guide</span>
            </div>
            <p>
              <span className="font-semibold">Processing</span> – You’ve been
              sent an email with instructions on how to pay. We’re still waiting
              for your payment.
            </p>
            <p>
              <span className="font-semibold">Pending</span> – You’ve already
              made payment, but your product hasn’t been delivered yet.
            </p>
          </div>
        </section>

        {/* Error */}
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

        {/* No orders state */}
        {!hasOrders && !loading && !error && (
          <section className="flex flex-col items-center justify-center py-16">
            <Package size={32} style={{ color: "#9CA3AF" }} />
            <p className="text-sm mt-3 mb-3" style={{ color: "#6B7280" }}>
              You haven’t placed any orders yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "#111827", color: "#FFFFFF" }}
            >
              Start shopping
            </Link>
          </section>
        )}

        {/* Orders list */}
        {hasOrders && (
          <section className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order }) {
  const {
    _id,
    orderNumber,
    createdAt,
    items = [],
    total,
    subtotal,
    shippingCost,
    tax,
    currency = "USD",
    paymentMethod,
    orderStatus: status,
    shippingAddress,
  } = order;

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const firstItem = items[0];
  const firstProduct = firstItem?.product || {};
  const firstImage =
    firstProduct.images && firstProduct.images.length > 0
      ? firstProduct.images[0]
      : null;

  const placedDate = createdAt ? new Date(createdAt).toLocaleDateString() : "";

  const displayStatus = (status || "processing").toLowerCase();
  const statusColor = getStatusStyles(displayStatus);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setResendMessage("");
      setResendError("");

      const res = await api.post(`/api/orders/${_id}/resend-confirmation`);

      setResendMessage(
        res.data.message || "We’ve resent the email linked to this order."
      );
    } catch (err) {
      console.error("Resend email error:", err);
      setResendError(
        err?.response?.data?.error ||
          "We couldn’t resend the email right now. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <article
      className="rounded-3xl border bg-white p-5 sm:p-6 flex flex-col gap-4"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Top row: basic info */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <p
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: "#6B7280" }}
          >
            Order {orderNumber || ""}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              className="inline-flex items-center gap-1"
              style={{ color: "#6B7280" }}
            >
              <Calendar size={14} />
              Placed on {placedDate || "—"}
            </span>
            <span
              className="inline-flex items-center gap-1"
              style={{ color: "#6B7280" }}
            >
              <Package size={14} />
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            {paymentMethod && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: "#6B7280" }}
              >
                <CreditCard size={14} />
                {formatPayment(paymentMethod)}
              </span>
            )}
          </div>
        </div>

        {/* Status pill + total */}
        <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full"
            style={{
              background: statusColor.bg,
              color: statusColor.text,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full mr-1"
              style={{ background: statusColor.dot }}
            />
            {capitalize(displayStatus)}
          </span>
          <p style={{ color: "#6B7280" }}>
            Order total:{" "}
            <span className="font-semibold" style={{ color: "#111827" }}>
              {formatPrice(total ?? subtotal ?? 0, currency)}
            </span>
          </p>
        </div>
      </div>

      {/* Middle: item preview */}
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F9FAFB] shrink-0">
          {firstImage ? (
            <img
              src={firstImage.url}
              alt={firstImage.alt || firstProduct.name}
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
          <p
            className="text-sm font-medium truncate"
            style={{ color: "#111827" }}
          >
            {firstProduct.name || "Jewelry piece"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
            {itemCount === 1
              ? "1 item in this order"
              : `${itemCount} items in this order`}
          </p>
          {shippingAddress?.city && (
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
              Shipping to {shippingAddress.city}
              {shippingAddress.country ? `, ${shippingAddress.country}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: breakdown + CTA + resend */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex flex-wrap gap-3 text-[11px]">
          <SummaryRow
            label="Subtotal"
            value={formatPrice(subtotal ?? 0, currency)}
          />
          <SummaryRow
            label="Shipping"
            value={
              shippingCost != null ? formatPrice(shippingCost, currency) : "—"
            }
          />
          <SummaryRow
            label="Tax"
            value={tax != null ? formatPrice(tax, currency) : "—"}
          />
          <SummaryRow
            label="Total"
            bold
            value={formatPrice(total ?? subtotal ?? 0, currency)}
          />
        </div>

        <div className="flex flex-col sm:items-end gap-2 text-[11px]">
          <div className="flex items-center gap-1" style={{ color: "#6B7280" }}>
            <Truck size={14} />
            <span>Track details in your confirmation email.</span>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <p style={{ color: "#6B7280" }}>
              Didn’t receive the mail linked to this order? Check your spam
              folder <span className="text-orange-500 text-xl">OR</span>
            </p>
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{
                background: "#111827",
                color: "#FFFFFF",
                opacity: resending ? 0.8 : 1,
              }}
            >
              {resending ? "Resending…" : "Resend email"}
              {!resending && <ArrowRight size={12} />}
            </button>

            {resendMessage && (
              <p className="mt-0.5" style={{ color: "#16A34A" }}>
                {resendMessage}
              </p>
            )}
            {resendError && (
              <p className="mt-0.5" style={{ color: "#B91C1C" }}>
                {resendError}
              </p>
            )}
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs">
          <span className="text-sm text-green-600 font-extrabold">Note</span>: Some mails may be delivered to your spam folder
        </p>
      </div>
    </article>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ color: "#9CA3AF" }}>{label}:</span>
      <span
        className={bold ? "font-semibold" : ""}
        style={{ color: "#111827" }}
      >
        {value}
      </span>
    </div>
  );
}

/* helpers */
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

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPayment(method) {
  const m = (method || "").toLowerCase();
  if (m === "card") return "Card";
  if (m === "transfer") return "Transfer / Wallet";
  return capitalize(method || "");
}

function getStatusStyles(status) {
  const s = status.toLowerCase();

  if (s.includes("pending")) {
    // Pending = paid, waiting for delivery
    return {
      bg: "#FEF3C7",
      text: "#92400E",
      dot: "#F59E0B",
    };
  }

  if (s.includes("deliver") || s.includes("completed")) {
    return {
      bg: "#ECFDF3",
      text: "#166534",
      dot: "#16A34A",
    };
  }

  if (s.includes("cancel")) {
    return {
      bg: "#FEF2F2",
      text: "#B91C1C",
      dot: "#EF4444",
    };
  }

  if (s.includes("return")) {
    return {
      bg: "#EEF2FF",
      text: "#3730A3",
      dot: "#4F46E5",
    };
  }

  // Default: processing (email sent with how to pay)
  return {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    dot: "#3B82F6",
  };
}
