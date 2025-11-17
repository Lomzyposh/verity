import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className=" pt-12 border-t bg-[#e7e7fa]"
      style={{
        borderColor: "#E5E7EB",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
        {/* BRAND */}
        <div>
          <div className="flex items-center mb-3">
            <img
              src="/images/logo.png"
              alt="Verity Gem"
              className="h-8 w-auto"
            />
            <h2
              className="text-xl font-semibold "
              style={{ color: "#111827" }}
            >
              Verity<span style={{ color: "#2563EB" }}>Gem</span>
            </h2>
          </div>
          <p style={{ color: "#6B7280" }}>
            Timeless jewelry crafted with elegance, precision and heart.
          </p>
        </div>

        {/* SHOP */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: "#111827" }}>
            Shop
          </h3>
          <ul className="space-y-2">
            <FooterLink to="/shop/rings" label="Rings" />
            <FooterLink to="/shop/necklaces" label="Necklaces" />
            <FooterLink to="/shop/bracelets" label="Bracelets" />
            <FooterLink to="/shop/earrings" label="Earrings" />
          </ul>
        </div>

        {/* CUSTOMER CARE */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: "#111827" }}>
            Support
          </h3>
          <ul className="space-y-2">
            <FooterLink to="/contact" label="Contact" />
            <FooterLink to="/shipping-info" label="Shipping & Returns" />
            <FooterLink to="/size-guide" label="Size Guide" />
            <FooterLink to="/faq" label="FAQ" />
          </ul>
        </div>

        {/* SOCIALS */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: "#111827" }}>
            Connect
          </h3>
          <ul className="space-y-2">
            <FooterLink to="#" label="Instagram" />
            <FooterLink to="#" label="TikTok" />
            <FooterLink to="#" label="Twitter" />
            <FooterLink to="#" label="WhatsApp" />
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div
        className="mt-12 py-6 text-center border-t"
        style={{ borderColor: "#E5E7EB" }}
      >
        <p className="text-sm" style={{ color: "#6B7280" }}>
          © {new Date().getFullYear()} VerityGem. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ to, label }) {
  return (
    <li>
      <Link
        to={to}
        className="hover:underline transition-colors"
        style={{ color: "#6B7280" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
      >
        {label}
      </Link>
    </li>
  );
}
