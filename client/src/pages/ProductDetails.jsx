import { useParams, useNavigate, Link } from "react-router-dom";
import { useJewelry } from "../contexts/JewelryContext";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { ChevronLeft, Star, Heart, ShieldCheck, Truck } from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { jewelry, loadingJewelry } = useJewelry();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [engravingText, setEngravingText] = useState("");
  const [processingCart, setProcessingCart] = useState(false);

  const product = useMemo(
    () => jewelry.find((item) => item.slug === slug),
    [jewelry, slug]
  );

  useEffect(() => {
    setSelectedImageIndex(0);
    setEngravingText("");
    setQuantity(1);
    window.scrollTo({ top, behavior: "smooth" });
  }, [slug]);

  // Cart hooks must run on every render (place before any early returns)
  const { cartItems, addToCart, updateCartItem, removeFromCart } = useCart();

  // find a cart entry for this product (match by product id)
  const cartEntry = useMemo(() => {
    if (!cartItems || !product) return null;
    return cartItems.find((item) => {
      const pid = item.product?._id ?? item.product;
      return String(pid) === String(product._id);
    });
  }, [cartItems, product]);

  const cartQuantity = cartEntry?.quantity || 0;

  if (loadingJewelry && !product) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <p style={{ color: "#6B7280" }}>Loading piece…</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "#F5F5F7" }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-8 text-center shadow-sm"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
            We couldn’t find that piece anymore.
          </p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "#4B5563", color: "#FFFFFF" }}
          >
            Back to jewelry
          </button>
        </div>
      </main>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImageIndex] || images[0];

  const hasDiscount =
    product.discount && product.discount.isActive && product.discount.value > 0;

  const basePrice = product.price ?? product.finalPrice ?? 0;

  let discountedPrice = basePrice;
  if (hasDiscount) {
    if (product.discount.type === "percentage") {
      discountedPrice = Math.round(
        basePrice * (1 - product.discount.value / 100)
      );
    } else if (product.discount.type === "fixed") {
      discountedPrice = Math.max(0, basePrice - product.discount.value);
    }
  }

  const displayCurrency = product.currency || "USD";

  const engravingAvailable = product.engraving?.available;
  const engravingPrice = product.engraving?.price || 0;
  const engravingMax = product.engraving?.maxLength || 0;

  const inStock = (product.stock ?? 0) > 0;

  const handleAddToCart = () => {
    // Add the currently selected quantity (with engraving if supplied)
    (async () => {
      if (!inStock || processingCart) return;
      setProcessingCart(true);
      try {
        const customization = engravingText.trim()
          ? { engraving: engravingText.trim() }
          : {};
        await addToCart(product, quantity, customization);
      } catch (err) {
        console.error("Add to cart failed:", err);
      } finally {
        setProcessingCart(false);
      }
    })();
  };

  return (
    <main style={{ background: "#F5F5F7" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Back / breadcrumb */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs mb-6"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* LEFT: IMAGES */}
          <section>
            <div
              className="rounded-3xl overflow-hidden bg-white border mb-4"
              style={{ borderColor: "#E5E7EB" }}
            >
              {mainImage ? (
                <img
                  src={mainImage.url}
                  alt={mainImage.alt || product.name}
                  className="w-full h-[420px] lg:h-[480px] object-contain bg-white"
                />
              ) : (
                <div className="w-full h-[420px] flex items-center justify-center">
                  <span style={{ color: "#9CA3AF" }}>No image available</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className="flex-1 rounded-2xl overflow-hidden border bg-white"
                    style={{
                      borderColor:
                        index === selectedImageIndex ? "#4B5563" : "#E5E7EB",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `${product.name} view ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: DETAILS */}
          <section>
            <p
              className="text-xs tracking-[0.2em] uppercase mb-2"
              style={{ color: "#6B7280" }}
            >
              {product.brand || "VerityGem"}
            </p>

            <h1
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: "#111827" }}
            >
              {product.name}
            </h1>

            <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
              {product.category && capitalize(product.category)}{" "}
              {product.metalType &&
                product.metalColor &&
                `· ${product.karat || ""}k ${capitalize(product.metalColor)} ${
                  product.metalType
                }`}
              {product.stoneType && ` · ${capitalize(product.stoneType)}`}
            </p>

            {/* Rating + reviews */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              {product.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star size={14} style={{ color: "#F59E0B" }} />
                  <span style={{ color: "#111827" }}>
                    {product.rating.toFixed(1)}
                  </span>
                </span>
              )}
              {product.sku && (
                <span style={{ color: "#9CA3AF" }}>· SKU {product.sku}</span>
              )}
            </div>

            {/* PRICE */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-2xl font-semibold"
                  style={{ color: "#111827" }}
                >
                  {formatPrice(discountedPrice, displayCurrency)}
                </span>
                {hasDiscount && (
                  <>
                    <span
                      className="text-sm line-through"
                      style={{ color: "#9CA3AF" }}
                    >
                      {formatPrice(basePrice, displayCurrency)}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        background: "#EEF2FF",
                        color: "#4F46E5",
                      }}
                    >
                      -{product.discount.value}
                      {product.discount.type === "percentage" ? "%" : ""}
                    </span>
                  </>
                )}
              </div>
              {engravingAvailable && engravingPrice > 0 && (
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  + {formatPrice(engravingPrice, displayCurrency)} for engraving
                </p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="space-y-5 mb-8">
              {/* Quantity – only show when item is NOT yet in cart */}
              {cartQuantity === 0 && (
                <div>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: "#111827" }}
                  >
                    Quantity
                  </p>
                  <div className="inline-flex items-center rounded-lg border bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => (q > 1 ? q - 1 : q))}
                      className="px-3 py-1.5 text-sm"
                      style={{ color: "#111827" }}
                    >
                      -
                    </button>
                    <span
                      className="px-4 py-1.5 text-sm border-l border-r"
                      style={{ borderColor: "#E5E7EB", color: "#111827" }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-sm"
                      style={{ color: "#111827" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Engraving */}
              {engravingAvailable && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "#111827" }}
                    >
                      Engraving (optional)
                    </p>
                    {engravingMax > 0 && (
                      <span
                        className="text-[11px]"
                        style={{ color: "#9CA3AF" }}
                      >
                        {engravingText.length}/{engravingMax}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={engravingText}
                    maxLength={engravingMax || undefined}
                    onChange={(e) => setEngravingText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    placeholder="Add a short message"
                    style={{
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
              {cartQuantity > 0 ? (
                <div
                  className="w-full inline-flex justify-center items-center bg-white rounded-lg border"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (processingCart) return;
                      setProcessingCart(true);
                      try {
                        if (cartEntry.quantity > 1) {
                          await updateCartItem(
                            cartEntry._id,
                            cartEntry.quantity - 1
                          );
                        } else {
                          await removeFromCart(cartEntry._id);
                        }
                      } catch (err) {
                        console.error("Error decreasing cart qty", err);
                      } finally {
                        setProcessingCart(false);
                      }
                    }}
                    className="px-3 py-2 text-sm bg-white"
                    style={{ color: "#111827" }}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>

                  <span
                    className="px-4 py-2 text-sm"
                    style={{ color: "#111827" }}
                  >
                    {cartQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={async () => {
                      if (processingCart) return;
                      setProcessingCart(true);
                      try {
                        const customization = engravingText.trim()
                          ? { engraving: engravingText.trim() }
                          : {};
                        // using addToCart increments when same customization/product exists
                        await addToCart(product, 1, customization);
                      } catch (err) {
                        console.error("Error increasing cart qty", err);
                      } finally {
                        setProcessingCart(false);
                      }
                    }}
                    className="px-3 py-2 text-sm hover:bg-[#c7cef2] cursor-pointer font-extrabold rounded-3xl"
                    style={{ color: "#111827" }}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!inStock || processingCart}
                  onClick={handleAddToCart}
                  className="w-full rounded-lg text-sm font-medium p-3 text-center transition"
                  style={{
                    background: inStock ? "#111827" : "#9CA3AF",
                    color: "#FFFFFF",
                  }}
                >
                  {inStock
                    ? processingCart
                      ? "Adding…"
                      : "Add to cart"
                    : "Out of stock"}
                </button>
              )}

              <button
                type="button"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#111827",
                  background: "#FFFFFF",
                }}
              >
                <Heart size={16} className="mr-2" />
                Save
              </button>
            </div>

            {/* TRUST / INFO STRIP */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: "#10B981" }} />
                <span style={{ color: "#6B7280" }}>
                  Certified materials and quality-checked before shipping.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} style={{ color: "#2563EB" }} />
                <span style={{ color: "#6B7280" }}>
                  Insured delivery with tracking on every order.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* DESCRIPTION / DETAILS SECTION */}
        <section className="mt-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Description
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>
              {product.description}
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              {product.metalType && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Metal</dt>
                  <dd style={{ color: "#111827" }}>
                    {product.karat && `${product.karat}k `}{" "}
                    {capitalize(product.metalColor)}{" "}
                    {capitalize(product.metalType)}
                  </dd>
                </>
              )}
              {product.stoneType && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Stone</dt>
                  <dd style={{ color: "#111827" }}>
                    {capitalize(product.stoneType)}{" "}
                    {product.stoneColor &&
                      `· ${product.stoneColor
                        .split("-")
                        .map(capitalize)
                        .join(" ")}`}
                  </dd>
                </>
              )}
              {product.gender && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Designed for</dt>
                  <dd style={{ color: "#111827" }}>
                    {capitalize(product.gender)}
                  </dd>
                </>
              )}
              {product.occasions && product.occasions.length > 0 && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Occasions</dt>
                  <dd style={{ color: "#111827" }}>
                    {product.occasions.map(capitalize).join(", ")}
                  </dd>
                </>
              )}
              {product.styleTags && product.styleTags.length > 0 && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Style</dt>
                  <dd style={{ color: "#111827" }}>
                    {product.styleTags.map(capitalize).join(", ")}
                  </dd>
                </>
              )}
              {typeof product.stock === "number" && (
                <>
                  <dt style={{ color: "#9CA3AF" }}>Availability</dt>
                  <dd
                    style={{
                      color: inStock ? "#16A34A" : "#B91C1C",
                    }}
                  >
                    {inStock
                      ? `${product.stock} in stock`
                      : "Currently unavailable"}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </section>

        {/* simple “see all” link */}
        <div className="mt-12 text-center">
          <Link
            to="/shop"
            className="text-xs font-medium underline"
            style={{ color: "#2563EB" }}
          >
            Browse all jewelry
          </Link>
        </div>
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

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
