import { useMemo, useState } from "react";

const FAQS = [
  {
    category: "Orders & Shipping",
    q: "How long does shipping take?",
    a: `Shipping time depends on your location and the shipping option selected at checkout.
Typically:
• Processing: 1–3 business days (we prepare, package, and verify your item)
• Delivery: 2–7 business days after dispatch
You’ll receive tracking details once your order ships.`,
  },
  {
    category: "Orders & Shipping",
    q: "Do you ship internationally?",
    a: `Yes — we can ship internationally where supported by our delivery partners.
International shipping costs and delivery timelines will show at checkout.`,
  },
  {
    category: "Orders & Shipping",
    q: "How can I track my order?",
    a: `Once your order is dispatched, we send you a tracking link by email/SMS (if provided).
If you didn’t receive it, contact support with your order number and we’ll help you track it.`,
  },

  {
    category: "Returns & Exchanges",
    q: "What is your return policy?",
    a: `We accept returns for eligible items within a specified return window after delivery.
Items must be unused, in original packaging, and in resellable condition.
Some items (like custom pieces) may be non-returnable. If you need help, contact support.`,
  },
  {
    category: "Returns & Exchanges",
    q: "Can I exchange an item instead of returning?",
    a: `Yes, exchanges are possible depending on stock availability.
If your preferred item isn’t available, we’ll offer alternatives or a return/refund option where applicable.`,
  },

  {
    category: "Payments & Security",
    q: "What payment methods do you accept?",
    a: `We support secure payments via available methods on checkout (card, transfer, gift card options, etc.).
All card payments are processed through secure channels to protect your information.`,
  },
  {
    category: "Payments & Security",
    q: "Is it safe to pay on your website?",
    a: `Yes. We take security seriously and use secure payment processing.
We also recommend using a trusted device/network when placing orders for extra safety.`,
  },
  {
    category: "Payments & Security",
    q: "Can I pay by bank transfer?",
    a: `If bank transfer is available at checkout, you can select it.
After payment, please follow the instructions shown to confirm your transfer (if required).`,
  },

  {
    category: "Product & Authenticity",
    q: "Are your products authentic?",
    a: `We prioritize quality and authenticity. Our pieces are sourced and crafted with care.
If a product includes specific materials (like gold plating, sterling silver, gemstones), it will be stated on the product page.`,
  },
  {
    category: "Product & Authenticity",
    q: "Will the color fade or tarnish?",
    a: `Some materials naturally change over time depending on use and exposure.
To keep your jewelry looking fresh:
• Avoid water, perfume, and harsh chemicals
• Store in a dry pouch/box
• Wipe gently after wearing
If you want, tell us the item type and we’ll advise the best care routine.`,
  },
  {
    category: "Product & Authenticity",
    q: "Do you offer custom jewelry?",
    a: `Custom orders may be available depending on the design.
Send us a reference photo and your budget, and we’ll confirm what’s possible, timeline, and pricing.`,
  },

  {
    category: "Sizing & Fit",
    q: "How do I know my ring size?",
    a: `If you’re unsure, the easiest way is:
• Measure an existing ring’s inner diameter
• Or use a ring sizer (recommended)
If you tell us your country/region, we can help convert your sizing standard.`,
  },
  {
    category: "Sizing & Fit",
    q: "What if the item doesn’t fit?",
    a: `If the item doesn’t fit, contact support as soon as possible.
Depending on the product type, we may offer an exchange, resizing guidance, or alternatives.`,
  },

  {
    category: "Care & Maintenance",
    q: "How should I care for my jewelry?",
    a: `Treat your jewelry like royalty 👑:
• Remove before bathing/swimming
• Avoid perfumes/lotions directly on the piece
• Store separately to prevent scratches
• Clean with a soft cloth (not rough materials)
For gemstone pieces, avoid harsh cleaners.`,
  },
  {
    category: "Care & Maintenance",
    q: "Can I wear it every day?",
    a: `Many pieces can be worn daily, but longevity depends on material and lifestyle.
If your routine includes water, sweat, or chemicals often, choose durable pieces and follow care tips.`,
  },

  {
    category: "Gift Cards & Promotions",
    q: "Do you sell gift cards?",
    a: `Yes (if enabled on the store). Gift cards are a great option when you’re not sure about size or style.
If you’re having trouble redeeming a gift card, contact support with the code.`,
  },
  {
    category: "Gift Cards & Promotions",
    q: "My discount code isn’t working — what should I do?",
    a: `Common reasons:
• Code expired
• Minimum order amount not met
• Code applies to specific categories only
Try again carefully, and if it still fails, send us a screenshot and we’ll help.`,
  },

  {
    category: "Support",
    q: "How do I contact support?",
    a: `You can reach us via the contact page or the support channel listed on the website.
Include your order number (if you have one) so we can assist faster.`,
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(FAQS.map((f) => f.category)))];

function Chevron({ open }) {
  return (
    <span
      className={[
        "inline-block transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
    >
      ▾
    </span>
  );
}

export default function Faq() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [openIndex, setOpenIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((item) => {
      const inCat = activeCat === "All" || item.category === activeCat;
      const inQuery =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [query, activeCat]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        {/* Hero */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Smooth answers for shiny decisions ✨ If you don’t see your
                question, message us.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              💎 VerityGem Help Desk
            </div>
          </div>

          {/* Search */}
          <div className="mt-5">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenIndex(0);
              }}
              placeholder="Search… e.g. shipping, ring size, returns"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            />
          </div>

          {/* Categories */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c === activeCat;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCat(c);
                    setOpenIndex(0);
                  }}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion */}
        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              No results found. Try another keyword like{" "}
              <span className="font-semibold">returns</span> or{" "}
              <span className="font-semibold">ring size</span>.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const open = idx === openIndex;
              return (
                <div
                  key={`${item.category}-${item.q}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? -1 : idx)}
                    className="w-full px-4 py-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        {item.category}
                      </div>
                      <div className="mt-1 text-sm sm:text-base font-semibold text-slate-900">
                        {item.q}
                      </div>
                    </div>

                    <div className="mt-1 text-slate-700">
                      <Chevron open={open} />
                    </div>
                  </button>

                  <div
                    className={[
                      "grid transition-all duration-200 ease-in-out",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">
            Still got questions?
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Send us your order number (if you have one) and we’ll respond fast.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Contact Support
            </a>
            <a
              href="/shop"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
