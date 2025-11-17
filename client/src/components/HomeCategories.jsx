import { Link } from "react-router-dom";

const categories = [
  {
    slug: "rings",
    label: "Rings",
    description: "Solitaire, eternity & statement rings for every moment.",
    image: "https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmluZ3N8ZW58MHx8MHx8fDA%3D",
  },
  {
    slug: "necklaces",
    label: "Necklaces",
    description: "Delicate chains, pendants and layered looks.",
    image: "https://plus.unsplash.com/premium_photo-1681276170092-446cd1b5b32d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    slug: "bracelets",
    label: "Bracelets",
    description: "Tennis bracelets, cuffs and everyday stacks.",
    image: "/images/jew3.jpg",
  },
  {
    slug: "earrings",
    label: "Earrings",
    description: "Hoops, studs and drops with timeless sparkle.",
    image: "https://images.unsplash.com/photo-1590166223826-12dee1677420?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    slug: "couple-rings",
    label: "Couple Rings",
    description: "Matching sets to celebrate your story together.",
    image: "https://images.unsplash.com/photo-1561828995-aa79a2db86dd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
  },
  {
    slug: "watches",
    label: "Watches",
    description: "Minimal timepieces with jewelry-level detail.",
    image: "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2F0Y2hlc3xlbnwwfHwwfHx8MA%3D%3D",
  },
];

export default function HomeCategories() {
  return (
    <section
      className="w-full py-16"
      style={{ background: "#F5F5F7" }} // light background
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p
              className="text-xs font-medium tracking-[0.3em] uppercase"
              style={{ color: "#6B7280" }}
            >
              Shop by category
            </p>
            <h2
              className="mt-2 text-2xl sm:text-3xl font-semibold"
              style={{ color: "#111827" }}
            >
              Discover your next favourite piece
            </h2>
          </div>

          <Link
            to="/shop"
            className="text-sm font-medium"
            style={{ color: "#2563EB" }}
          >
            View all jewelry →
          </Link>
        </div>

        {/* Category grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop/${cat.slug}`}
              className="group rounded-2xl overflow-hidden h-full flex flex-col justify-between transition-transform"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
              }}
            >
              {/* IMAGE */}
              <div className="w-full bg-gray-200 aspect-video overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#111827" }}
                  >
                    {cat.label}
                  </h3>
                  <span
                    className="text-[11px] px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(37,99,235,0.06)",
                      color: "#2563EB",
                    }}
                  >
                    Explore
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  {cat.description}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: "#6B7280" }}>
                    View collection
                  </span>
                  <span
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: "#2563EB" }}
                  >
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
