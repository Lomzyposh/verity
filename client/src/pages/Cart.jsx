import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useState, useMemo, useEffect } from "react";
import { Trash2, ChevronLeft, ShieldCheck, Truck } from "lucide-react";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, updateCartItem, removeFromCart } = useCart();
  const [processingId, setProcessingId] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const hasItems = cartItems && cartItems.length > 0;

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

  const handleQtyChange = async (entry, direction) => {
    if (processingId) return;
    const currentQty = entry.quantity ?? 1;
    const nextQty =
      direction === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

    if (nextQty === currentQty) return;

    try {
      setProcessingId(entry._id);
      await updateCartItem(entry._id, nextQty);
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (entry) => {
    if (processingId) return;
    try {
      setProcessingId(entry._id);
      await removeFromCart(entry._id);
    } catch (err) {
      console.error("Error removing cart item:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // 👇 Logic so we don't show "Your bag is empty" during initial load
  const showInitialLoading = !hasMounted && !hasItems;
  const showLoading = loading || showInitialLoading;
  const showEmptyState = !showLoading && !hasItems;

  // Subtitle text under "Your bag"
  let subtitle = "";
  if (showLoading) {
    subtitle = "Checking your bag...";
  } else if (hasItems) {
    subtitle = `${cartItems.length} item${
      cartItems.length === 1 ? "" : "s"
    } in your cart`;
  } else {
    subtitle = "No pieces added yet.";
  }

  return (
    <main style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Top back / title */}
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
              Your bag
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {subtitle}
            </p>
          </div>

          {hasItems && !showLoading && (
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="text-xs font-medium underline self-start sm:self-auto"
              style={{ color: "#2563EB" }}
            >
              Continue shopping
            </button>
          )}
        </header>

        {/* MAIN CONTENT */}
        {showLoading ? (
          // 🔄 Loading view (only shows while actually loading or first mount)
          <section className="flex flex-col items-center justify-center py-16">
            <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
              Loading your cart...
            </p>
          </section>
        ) : showEmptyState ? (
          // 🧺 Truly empty cart (after loading finished)
          <EmptyCart />
        ) : (
          // 🛍 Cart has items
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-10 items-start">
            {/* LEFT: Items */}
            <section className="space-y-4">
              {cartItems.map((entry) => {
                const product = entry.product || {};
                const unitPrice =
                  product.price ?? product.finalPrice ?? entry.unitPrice ?? 0;
                const qty = entry.quantity ?? 1;
                const lineTotal = unitPrice * qty;
                const img =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : null;

                return (
                  <article
                    key={entry._id}
                    className="rounded-2xl border bg-white flex flex-col sm:flex-row gap-4 p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    {/* Image */}
                    <button
                      type="button"
                      onClick={() =>
                        product.slug && navigate(`/product/${product.slug}`)
                      }
                      className="w-full sm:w-40 rounded-xl overflow-hidden bg-[#F9FAFB]"
                    >
                      {img ? (
                        <img
                          src={img.url}
                          alt={img.alt || product.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center">
                          <span
                            className="text-xs"
                            style={{ color: "#9CA3AF" }}
                          >
                            No image
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                product.slug &&
                                navigate(`/product/${product.slug}`)
                              }
                              className="text-sm font-medium text-left"
                              style={{ color: "#111827" }}
                            >
                              {product.name || "Untitled piece"}
                            </button>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#6B7280" }}
                            >
                              {product.category && capitalize(product.category)}
                              {product.metalType &&
                                product.metalColor &&
                                ` · ${product.karat || ""}k ${capitalize(
                                  product.metalColor
                                )} ${product.metalType}`}
                              {product.stoneType &&
                                ` · ${capitalize(product.stoneType)}`}
                            </p>

                            {entry.customization?.engraving && (
                              <p
                                className="text-xs mt-1"
                                style={{ color: "#6B7280" }}
                              >
                                Engraving:{" "}
                                <span style={{ color: "#111827" }}>
                                  {entry.customization.engraving}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemove(entry)}
                            className="p-1 rounded-full border bg-white"
                            style={{
                              borderColor: "#E5E7EB",
                              color: "#6B7280",
                            }}
                            disabled={processingId === entry._id}
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Bottom row: quantity + price */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Quantity control */}
                        <div>
                          <p
                            className="text-[11px] mb-1"
                            style={{ color: "#6B7280" }}
                          >
                            Quantity
                          </p>
                          <div className="inline-flex items-center rounded-lg border bg-white">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(entry, "dec")}
                              disabled={processingId === entry._id || qty <= 1}
                              className="px-3 py-1.5 text-sm"
                              style={{ color: "#111827" }}
                            >
                              -
                            </button>
                            <span
                              className="px-4 py-1.5 text-sm border-l border-r"
                              style={{
                                borderColor: "#E5E7EB",
                                color: "#111827",
                              }}
                            >
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(entry, "inc")}
                              disabled={processingId === entry._id}
                              className="px-3 py-1.5 text-sm"
                              style={{ color: "#111827" }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line price */}
                        <div className="text-right">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#111827" }}
                          >
                            {formatPrice(
                              lineTotal,
                              product.currency || currency
                            )}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{ color: "#9CA3AF" }}
                          >
                            {qty} ×{" "}
                            {formatPrice(
                              unitPrice,
                              product.currency || currency
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* RIGHT: Summary */}
            <aside>
              <div
                className="rounded-2xl border bg-white p-5 mb-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <h2
                  className="text-sm font-semibold mb-4"
                  style={{ color: "#111827" }}
                >
                  Summary
                </h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#6B7280" }}>Subtotal</span>
                    <span style={{ color: "#111827" }}>
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "#9CA3AF" }}>Shipping & taxes</span>
                    <span style={{ color: "#9CA3AF" }}>
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full bg-[#111827] text-white rounded-lg text-sm font-medium py-3 text-center hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    navigate("/checkout");
                    console.log("Proceed to checkout");
                  }}
                >
                  Proceed to checkout
                </button>
              </div>

              <div
                className="rounded-2xl border bg-white p-4 text-xs space-y-2"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} style={{ color: "#10B981" }} />
                  <span style={{ color: "#6B7280" }}>
                    Secure payment and encrypted checkout.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} style={{ color: "#2563EB" }} />
                  <span style={{ color: "#6B7280" }}>
                    Insured delivery with tracking on every order.
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

function EmptyCart() {
  return (
    <section className="flex flex-col items-center justify-center py-16">
      <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
        Your bag is empty for now.
      </p>
      <Link
        to="/shop"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium"
        style={{ background: "#111827", color: "#FFFFFF" }}
      >
        Browse jewelry
      </Link>
    </section>
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