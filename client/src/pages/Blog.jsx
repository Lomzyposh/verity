import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Tag, Search } from "lucide-react";

const BLOG_POSTS = [
  {
    id: "how-to-choose-diamond-cut",
    title: "How to Choose the Perfect Diamond Cut",
    excerpt:
      "Round, princess, oval… the cut is what makes your diamond dance. Here’s how to pick the one that fits your style.",
    category: "Diamond Guide",
    date: "2025-12-10",
    readTime: "5 min read",
    cover:
      "https://images.unsplash.com/photo-1589674668791-4889d2bba4c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGlhbW9uZCUyMGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
    featured: true,
  },
  {
    id: "gold-karat-explained",
    title: "Gold Karats Explained: 18K vs 14K vs 24K",
    excerpt:
      "Karats aren’t just numbers — they’re a balance of purity, durability, and price. Let’s make it simple.",
    category: "Gold Basics",
    date: "2025-11-28",
    readTime: "4 min read",
    cover:
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z29sZCUyMGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "care-tips-jewelry",
    title: "Jewelry Care 101: Keep Your Shine Forever",
    excerpt:
      "Daily habits that protect your sparkle — from storage tricks to what not to spray near your stones.",
    category: "Care Tips",
    date: "2025-11-20",
    readTime: "6 min read",
    cover:
      "https://images.unsplash.com/photo-1599458349289-18f0ee82e6ed?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "ring-size-at-home",
    title: "How to Measure Your Ring Size at Home",
    excerpt:
      "No stress, no guessing. A simple guide to get the perfect fit without leaving your house.",
    category: "Buying Guide",
    date: "2025-11-12",
    readTime: "3 min read",
    cover:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "engagement-ring-budget",
    title: "Engagement Rings on a Budget (Still Looks Premium)",
    excerpt:
      "You can spend smart and still get a ring that looks like it walked out of a luxury boutique.",
    category: "Buying Guide",
    date: "2025-10-29",
    readTime: "7 min read",
    cover:
      "https://images.unsplash.com/photo-1669859130036-e84fed5b19c4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cmluZyUyMGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "moissanite-vs-diamond",
    title: "Moissanite vs Diamond: What’s the Real Difference?",
    excerpt:
      "They both sparkle, but they’re not the same. Here’s what matters: look, durability, price, and vibe.",
    category: "Diamond Guide",
    date: "2025-10-14",
    readTime: "6 min read",
    cover:
      "https://plus.unsplash.com/premium_photo-1681276170092-446cd1b5b32d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
];

const CATEGORIES = [
  "All",
  "Buying Guide",
  "Gold Basics",
  "Diamond Guide",
  "Care Tips",
];

export default function Blog() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const featured = useMemo(
    () => BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return BLOG_POSTS.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <main className="min-h-screen" style={{ background: "#F5F5F7" }}>
      {/* padding for fixed navbar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Header */}
        <header className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: "#111827" }}
          >
            Blog & Insights
          </h1>
          <p
            className="text-sm sm:text-base mt-2 max-w-2xl"
            style={{ color: "#6B7280" }}
          >
            Guides, care tips, and buying wisdom — so your next jewelry choice
            feels easy, confident, and ✨ expensive ✨.
          </p>

          {/* Search */}
          <div className="mt-5">
            <div
              className="flex items-center gap-2 rounded-2xl border bg-white px-4 h-12 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <Search size={16} style={{ color: "#6B7280" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="w-full text-sm outline-none"
                style={{ color: "#111827" }}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-full text-xs font-medium border transition"
                  style={{
                    background: active ? "#111827" : "#FFFFFF",
                    color: active ? "#FFFFFF" : "#4B5563",
                    borderColor: active ? "#111827" : "#E5E7EB",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </header>

        {/* Featured */}
        {featured && (
          <section className="mb-8">
            <div
              className="rounded-3xl border overflow-hidden bg-white shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative">
                  <img
                    src={featured.cover}
                    alt={featured.title}
                    className="w-full h-56 lg:h-full object-cover"
                  />
                  <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: "rgba(17,24,39,0.85)",
                      color: "#FFFFFF",
                    }}
                  >
                    Featured
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div
                    className="flex items-center gap-2 text-xs mb-3"
                    style={{ color: "#6B7280" }}
                  >
                    <Tag size={14} />
                    <span>{featured.category}</span>
                    <span>•</span>
                    <Calendar size={14} />
                    <span>{formatDate(featured.date)}</span>
                    <span>•</span>
                    <span>{featured.readTime}</span>
                  </div>

                  <h2
                    className="text-xl sm:text-2xl font-bold"
                    style={{ color: "#111827" }}
                  >
                    {featured.title}
                  </h2>

                  <p className="text-sm mt-3" style={{ color: "#6B7280" }}>
                    {featured.excerpt}
                  </p>

                  <div className="mt-5">
                    <Link
                      to={`/blog/${featured.id}`}
                      className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-semibold"
                      style={{ background: "#2563EB", color: "#FFFFFF" }}
                    >
                      Read article →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Grid */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>
              Latest posts
            </h3>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {filtered.length} article{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div
              className="rounded-3xl border bg-white p-8 text-center"
              style={{ borderColor: "#E5E7EB" }}
            >
              <p className="text-sm font-medium" style={{ color: "#111827" }}>
                No articles found
              </p>
              <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                Try a different keyword or pick another category.
              </p>

              <button
                className="mt-4 h-11 px-5 rounded-xl text-sm font-semibold border"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#111827",
                  background: "#FFFFFF",
                }}
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <Link to={`/blog/${post.id}`} className="block">
                    <div className="h-44 bg-[#F3F4F6]">
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </Link>

                  <div className="p-5">
                    <div
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: "#6B7280" }}
                    >
                      <span className="font-medium">{post.category}</span>
                      <span>•</span>
                      <span>{formatDate(post.date)}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h4
                      className="mt-2 text-base font-semibold leading-snug"
                      style={{ color: "#111827" }}
                    >
                      <Link to={`/blog/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h4>

                    <p
                      className="text-sm mt-2 line-clamp-3"
                      style={{ color: "#6B7280" }}
                    >
                      {post.excerpt}
                    </p>

                    <div className="mt-4">
                      <Link
                        to={`/blog/${post.id}`}
                        className="text-xs font-semibold"
                        style={{ color: "#2563EB" }}
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
