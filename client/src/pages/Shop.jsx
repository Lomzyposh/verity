import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useJewelry } from "../contexts/JewelryContext";

const CATEGORY_TILES = [
  {
    key: "necklace",
    label: "Necklaces",
    image: "https://media.tiffany.com/is/image/tco/2025_HOLIDAY_STILL_1x1_9-3",
  },
  {
    key: "earring",
    label: "Earrings",
    image: "https://media.tiffany.com/is/image/tco/2025_HOLIDAY_STILL_1x1_5-4",
  },
  {
    key: "bracelet",
    label: "Bracelets",
    image: "https://media.tiffany.com/is/image/tco/2025_HOLIDAY_STILL_1x1_38-1",
  },
  {
    key: "ring",
    label: "Rings",
    image: "https://media.tiffany.com/is/image/tco/2025_HOLIDAY_STILL_4X5_14-1",
  },
];

export default function Shop() {
  const navigate = useNavigate();
  const { jewelry, loadingJewelry, jewelryError } = useJewelry();

  const productsRef = useRef(null);

  const handleCategoryClick = (catKey) => {
    setActiveCategory((prev) => (prev === catKey ? "all" : catKey));
    // wait for layout to settle then scroll to products list with offset for navbar
    requestAnimationFrame(() => {
      if (!productsRef.current) return;
      const NAVBAR_OFFSET = 84; // adjust if your navbar height differs
      const top =
        productsRef.current.getBoundingClientRect().top +
        window.scrollY -
        NAVBAR_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [personalizeOnly, setPersonalizeOnly] = useState(false);

  // NEW filters
  const [metalColorFilter, setMetalColorFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let items = [...jewelry];

    if (activeCategory !== "all") {
      items = items.filter(
        (item) => item.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (personalizeOnly) {
      items = items.filter((item) => item.engraving?.available);
    }

    if (metalColorFilter !== "all") {
      items = items.filter(
        (item) =>
          item.metalColor?.toLowerCase() === metalColorFilter.toLowerCase()
      );
    }

    if (priceFilter !== "all") {
      items = items.filter((item) => {
        const price = item.price ?? item.finalPrice ?? 0;
        if (priceFilter === "0-1000") return price >= 0 && price <= 1000;
        if (priceFilter === "1000-2500") return price > 1000 && price <= 2500;
        if (priceFilter === "2500+") return price > 2500;
        return true;
      });
    }

    if (inStockOnly) {
      items = items.filter((item) => (item.stock ?? 0) > 0);
    }

    switch (sortBy) {
      case "price-asc":
        items.sort(
          (a, b) =>
            (a.price ?? a.finalPrice ?? 0) - (b.price ?? b.finalPrice ?? 0)
        );
        break;
      case "price-desc":
        items.sort(
          (a, b) =>
            (b.price ?? b.finalPrice ?? 0) - (a.price ?? a.finalPrice ?? 0)
        );
        break;
      case "newest":
        items.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case "rating":
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return items;
  }, [
    jewelry,
    activeCategory,
    sortBy,
    personalizeOnly,
    metalColorFilter,
    priceFilter,
    inStockOnly,
  ]);

  const handleCardClick = (slug) => {
    navigate(`/product/${slug}`);
  };

  return (
    <div style={{ background: "#F5F5F7" }}>
      {/* PAGE CONTAINER */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-16">
        {/* PAGE TITLE */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-semibold"
            style={{ color: "#111827" }}
          >
            Jewelry
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
            Discover crafted pieces across necklaces, earrings, bracelets and
            rings.
          </p>
        </div>

        {/* CATEGORY TILES (like Tiffany top row) */}
        <section className="mb-14">
          {/* <p style={{ color: "#6B7280" }}>
            Showing {filteredAndSorted.length} items
          </p> */}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            {CATEGORY_TILES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className="group flex flex-col text-left focus:outline-none"
              >
                <div
                  className="w-full aspect-4/5 rounded-2xl overflow-hidden mb-3 transition-transform group-hover:-translate-y-1"
                  style={{
                    background: "#E5E7EB",
                  }}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p
                  className="text-xs tracking-[0.2em] uppercase text-center"
                  style={{
                    color: activeCategory === cat.key ? "#111827" : "#6B7280",
                  }}
                >
                  {cat.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: "#111827" }}>
            {activeCategory === "all"
              ? "All Jewelries"
              : CATEGORY_TILES.find((cat) => cat.key === activeCategory)?.label}
          </h2>
        </div>

        <section className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex items-center border rounded-lg px-4 py-2 bg-white"
            style={{ borderColor: "#E5E7EB" }}
          >
            <span
              className="text-xs font-medium mr-3"
              style={{ color: "#6B7280" }}
            >
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm outline-none bg-transparent"
              style={{ color: "#111827" }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* right side controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category filter dropdown */}
            <div
              className="inline-flex items-center px-3 py-2 rounded-lg border bg-white text-xs sm:text-sm"
              style={{ borderColor: "#E5E7EB", color: "#111827" }}
            >
              <span className="mr-2">Category:</span>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="bg-transparent outline-none text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="ring">Rings</option>
                <option value="necklace">Necklaces</option>
                <option value="earring">Earrings</option>
                <option value="bracelet">Bracelets</option>
              </select>
            </div>

            {/* Personalize */}
            {/* <label
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white cursor-pointer text-xs sm:text-sm"
              style={{ borderColor: "#E5E7EB", color: "#111827" }}
            >
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={personalizeOnly}
                onChange={(e) => setPersonalizeOnly(e.target.checked)}
              />
              <span>Personalize</span>
            </label> */}

            {/* Metal color filter */}
            <div
              className="inline-flex items-center px-3 py-2 rounded-lg border bg-white text-xs sm:text-sm"
              style={{ borderColor: "#E5E7EB", color: "#111827" }}
            >
              <span className="mr-2">Metal color:</span>
              <select
                value={metalColorFilter}
                onChange={(e) => setMetalColorFilter(e.target.value)}
                className="bg-transparent outline-none text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="yellow">Yellow</option>
                <option value="white">White</option>
                <option value="rose">Rose</option>
              </select>
            </div>

            {/* Price filter */}
            <div
              className="inline-flex items-center px-3 py-2 rounded-lg border bg-white text-xs sm:text-sm"
              style={{ borderColor: "#E5E7EB", color: "#111827" }}
            >
              <span className="mr-2">Price</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-transparent outline-none text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="0-1000">$0 – $1,000</option>
                <option value="1000-2500">$1,000 – $2,500</option>
                <option value="2500+">$2,500+</option>
              </select>
            </div>

            {/* In stock only */}
            <label
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white cursor-pointer text-xs sm:text-sm"
              style={{ borderColor: "#E5E7EB", color: "#111827" }}
            >
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In stock only</span>
            </label>

            {/* product count */}
            <span className="text-xs sm:text-sm" style={{ color: "#6B7280" }}>
              {filteredAndSorted.length} products
            </span>
          </div>
        </section>

        {/* PRODUCTS GRID */}
        <section ref={productsRef}>
          {loadingJewelry ? (
            <p style={{ color: "#6B7280" }}>Loading jewelry…</p>
          ) : jewelryError ? (
            <p style={{ color: "#B91C1C" }}>{jewelryError}</p>
          ) : filteredAndSorted.length === 0 ? (
            <p style={{ color: "#6B7280" }}>
              No products match your current filters.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSorted.map((item) => (
                <article
                  key={item._id || item.sku || item.slug}
                  className="cursor-pointer"
                  onClick={() => handleCardClick(item.slug)}
                >
                  <div
                    className="w-full aspect-4/5 rounded-2xl overflow-hidden bg-white border mb-3"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <img
                      src={item.images?.[0]?.url || "/images/placeholder.jpg"}
                      alt={item.images?.[0]?.alt || item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      {item.name}
                    </h3>

                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      {item.metalType && item.metalColor
                        ? `${item.karat || ""}k ${capitalize(
                            item.metalColor
                          )} ${capitalize(item.metalType)}`
                        : item.category
                        ? capitalize(item.category)
                        : ""}
                    </p>

                    {/* PRICE + DISCOUNT SECTION */}
                    {item.discount?.isActive ? (
                      <div className="flex items-center gap-2">
                        {/* Discounted Price */}
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#111827" }}
                        >
                          {formatPrice(
                            item.price -
                              (item.price * item.discount.value) / 100,
                            item.currency
                          )}
                        </p>

                        {/* Old Price (Strikethrough) */}
                        <p
                          className="text-xs line-through"
                          style={{ color: "#9CA3AF" }}
                        >
                          {formatPrice(item.price, item.currency)}
                        </p>

                        {/* Discount Badge */}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-400 text-blue-900"
                        >
                          -{item.discount.value}%
                        </span>
                      </div>
                    ) : (
                      /* Normal Price */
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#111827" }}
                      >
                        {formatPrice(
                          item.price ?? item.finalPrice,
                          item.currency
                        )}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
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
