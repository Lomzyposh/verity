import { Link } from "react-router-dom";

export default function CraftingSection() {
  return (
    <section
      className="w-full py-16"
      style={{
        background: "#0f1724",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 lg:px-10 rounded-3xl grid lg:grid-cols-2 gap-10 items-stretch"
        style={{
          background: "#0f1724",
          color: "#FFFFFF",
          border: "1px solid rgba(229,231,235,0.06)",
        }}
      >
        {/* LEFT: GRID CARDS / IMAGES */}
        <div className="grid grid-cols-2 gap-4 py-8">
          {/* New Rings card */}
          <div
            className="col-span-1 rounded-2xl p-5 flex flex-col justify-between"
            style={{
              border: "1px solid rgba(96, 165, 250, 0.3)",
              background: "rgba(96, 165, 250, 0.06)",
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{
                  border: "1px solid rgba(96, 165, 250, 0.5)",
                  color: "#60A5FA",
                }}
              >
                {/* simple ring icon circle */}○
              </div>
              <h3 className="text-lg font-semibold mb-2">New Rings</h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#CBD5E1" }}
              >
                Explore our latest cuts, stones and settings designed for modern
                stories with timeless sparkle.
              </p>
            </div>
          </div>

          {/* Main vertical image */}
          <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1740750047180-934643ebdf21?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGRpYW1vbmQlMjBqZXdlbHJ5fGVufDB8fDB8fHww"
              alt="Jewelry close-up"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Portrait image */}
          <div className="col-span-1 rounded-2xl overflow-hidden">
            <img
              src="https://plus.unsplash.com/premium_photo-1670537037688-94a5428256b7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGRpYW1vbmQlMjBqZXdlbHJ5fGVufDB8fDB8fHww"
              alt="Model wearing jewelry"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Icon card */}
          <div
            className="col-span-1 rounded-2xl p-5 flex flex-col items-start justify-between"
            style={{
              border: "1px solid rgba(148, 163, 184, 0.2)",
              background: "rgba(148, 163, 184, 0.06)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                color: "#CBD5E1",
              }}
            >
              ♕
            </div>
            <p className="text-xs" style={{ color: "#CBD5E1" }}>
              Hand-finished details and ethically sourced stones in every piece.
            </p>
          </div>
        </div>

        {/* RIGHT: STORY / COPY */}
        <div className="py-10 flex flex-col justify-center">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
            Crafting Jewellery
            <br />
            Since 1988.
          </h2>

          <p
            className="text-sm sm:text-base leading-relaxed mb-6 max-w-xl"
            style={{ color: "#CBD5E1" }}
          >
            As we all know, smaller gifts tend to be the most treasured, and few
            things feel as special as a carefully chosen piece of jewelry. At
            VerityGem, our master artisans bring decades of experience to every
            setting, cut and clasp so that each piece becomes part of your story
            — not just your collection.
          </p>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl"
            style={{ color: "#9CA3AF" }}
          >
            From classic heirlooms to modern silhouettes, we&apos;ve spent
            generations refining our craft so you can celebrate life&apos;s
            brightest moments with confidence.
          </p>

          <div className="mt-6">
            <Link
              to="/about"
              className="inline-flex items-center text-sm font-medium"
              style={{ color: "#60A5FA" }}
            >
              Learn more about our story →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}