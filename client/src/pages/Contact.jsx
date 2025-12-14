import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function Contact() {
  // ✅ Edit these to yours
  const BRAND = "VerityGem";
  const EMAIL = "veritygem47@gmail.com";
  const PHONE = "+19297829204";
  const WHATSAPP = "+19297829204";
  const ADDRESS_LINE = "United States, Los Angeles, CA";
  const HOURS = "Mon–Sat · 9:00am – 6:00pm (WAT)";

  const socials = [
    { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "X (Twitter)", icon: Twitter, href: "https://x.com" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Back (optional) */}
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs"
            style={{ color: "#6B7280" }}
          >
            <ChevronLeft size={16} />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: "#111827" }}
          >
            Contact Us
          </h1>
          <p
            className="text-sm sm:text-base mt-2 max-w-2xl"
            style={{ color: "#6B7280" }}
          >
            Need help with an order, delivery, sizing, or product info? Reach us
            through any channel below — we respond as fast as humanly possible
            (with classy vibes).
          </p>
        </header>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {/* Left: Primary contact options */}
          <section className="lg:col-span-2 space-y-5">
            <div
              className="rounded-3xl border bg-white p-6 sm:p-7 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "#111827" }}
              >
                Quick contact
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Choose what’s easiest for you.
              </p>

              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <ContactCard
                  icon={Mail}
                  title="Email"
                  subtitle="Best for receipts, invoices & detailed support"
                  value={EMAIL}
                  href={`mailto:${EMAIL}?subject=${encodeURIComponent(
                    `${BRAND} Support`
                  )}`}
                />
                <ContactCard
                  icon={Phone}
                  title="Phone"
                  subtitle="For urgent order updates"
                  value={PHONE}
                  href={`tel:${PHONE.replace(/\s/g, "")}`}
                />
                <ContactCard
                  icon={MessageCircle}
                  title="WhatsApp"
                  subtitle="Fast replies (chat-friendly support)"
                  value={PHONE}
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                    `Hi ${BRAND} Support, I need help with my order.`
                  )}`}
                />
                <ContactCard
                  icon={MapPin}
                  title="Location"
                  subtitle="Service area / pick-up info"
                  value={ADDRESS_LINE}
                  href={null}
                />
              </div>
            </div>

            <div
              className="rounded-3xl border bg-white p-6 sm:p-7 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "#111827" }}
              >
                Social channels
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                For updates, drops, and announcements.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-xs font-semibold hover:bg-slate-50 transition"
                      style={{
                        borderColor: "#E5E7EB",
                        color: "#111827",
                        background: "#FFFFFF",
                      }}
                    >
                      <Icon size={14} />
                      {s.name}
                    </a>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-3xl border bg-white p-6 sm:p-7 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-2xl grid place-items-center"
                  style={{ background: "rgba(37,99,235,0.10)" }}
                >
                  <ShieldCheck size={18} style={{ color: "#2563EB" }} />
                </div>
                <div className="flex-1">
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Support policy
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    To protect customers, we only discuss order details with the
                    email/phone used at checkout. For returns/exchanges, please
                    include your order number and a clear photo if needed.
                  </p>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <InfoTile
                      title="Order help"
                      text="Send your order number + the issue. We’ll guide you step-by-step."
                    />
                    <InfoTile
                      title="Returns / exchanges"
                      text="Eligible within your return window. Condition must be unused with packaging."
                    />
                    <InfoTile
                      title="Shipping updates"
                      text="Share your order number for tracking details and delivery ETA."
                    />
                    <InfoTile
                      title="Product questions"
                      text="Ask about sizing, materials, warranty, and care tips — we’ve got you."
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Business hours + note */}
          <aside className="space-y-5">
            <div
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: "#111827" }} />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "#111827" }}
                >
                  Business hours
                </h3>
              </div>

              <p className="text-xs mt-3" style={{ color: "#6B7280" }}>
                {HOURS}
              </p>

              <div
                className="mt-4 rounded-2xl border px-4 py-3 text-xs"
                style={{
                  borderColor: "#E5E7EB",
                  background: "#F9FAFB",
                  color: "#6B7280",
                }}
              >
                Tip: For fastest support, send your{" "}
                <span style={{ color: "#111827" }}>order number</span> in your
                first message.
              </div>
            </div>

            <div
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "#111827" }}
              >
                Corporate / Partnerships
              </h3>
              <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                For collaborations, wholesale, or press:
              </p>

              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent(
                  `${BRAND} Partnerships`
                )}`}
                className="mt-4 inline-flex items-center justify-center h-11 w-full rounded-xl text-sm font-semibold"
                style={{ background: "#111827", color: "#FFFFFF" }}
              >
                Email partnerships
              </a>

              <p className="text-[11px] mt-3" style={{ color: "#9CA3AF" }}>
                We typically respond within 24–48 hours (business days).
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ContactCard({ icon: Icon, title, subtitle, value, href }) {
  return (
    <div
      className="rounded-2xl border p-4 flex gap-3"
      style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}
    >
      <div
        className="h-10 w-10 rounded-2xl grid place-items-center"
        style={{ background: "#F9FAFB" }}
      >
        <Icon size={18} style={{ color: "#111827" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "#111827" }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
          {subtitle}
        </p>

        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="mt-2 inline-block text-xs font-semibold break-all"
            style={{ color: "#2563EB" }}
          >
            {value} →
          </a>
        ) : (
          <p
            className="mt-2 text-xs font-semibold break-all"
            style={{ color: "#111827" }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoTile({ title, text }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}
    >
      <p className="text-xs font-semibold" style={{ color: "#111827" }}>
        {title}
      </p>
      <p className="text-[11px] mt-1" style={{ color: "#6B7280" }}>
        {text}
      </p>
    </div>
  );
}
