import { Link } from "react-router-dom";

export default function BusinessDiamondsSection() {
  return (
    <section
      className="w-full py-16"
      style={{ background: "#F5F5F7" }} // light page bg
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT: TEXT CONTENT */}
        <div className="space-y-5">
          <p
            className="text-xs font-medium tracking-[0.3em] uppercase"
            style={{ color: "#6B7280" }}
          >
            For your brand
          </p>

          <h2
            className="text-3xl sm:text-4xl font-semibold leading-snug"
            style={{ color: "#111827" }}
          >
            Get the best diamonds
            <br />
            for your business.
          </h2>

          <p
            className="text-sm sm:text-base max-w-md"
            style={{ color: "#6B7280" }}
          >
            Our expert team includes diamond setters, gemologists and jewelry
            specialists who help you source certified stones and signature
            pieces tailored to your brand.
          </p>

          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "#4B5563",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4B5563")
              }
            >
              Check more products
            </Link>
          </div>
        </div>

        {/* RIGHT: IMAGE CARD */}
        <div className="relative flex justify-center">
          {/* soft background panel like the dribbble shot */}
          <div
            className="absolute inset-y-4 right-0 left-8 rounded-3xl -z-10"
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
            }}
          />

          {/* framed image */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "2px solid #E5E7EB",
            }}
          >
            {/* outer decorative border */}
            <div
              className="absolute inset-3 rounded-3xl pointer-events-none"
              style={{
                border: "1px solid rgba(209,213,219,0.8)",
              }}
            />

            <img
              src="https://plus.unsplash.com/premium_photo-1681276169450-4504a2442173?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGlhbW9uZCUyMGpld2Vscnl8ZW58MHx8MHx8fDA%3D" // <- put your image in public/images with this name
              alt="Luxury jewelry model"
              className="w-[320px] sm:w-[360px] lg:w-[380px] h-[420px] object-cover rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
