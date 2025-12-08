import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShoppingCart, Heart, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../contexts/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // detect scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    if (location.pathname.startsWith("/account")) {
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;
  const isHomepage = location.pathname === "/";
  const shouldDarkText = scrolled || !isHomepage;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-200 ${
        scrolled || !isHomepage ? "border-b" : ""
      }`}
      style={{
        background: scrolled || !isHomepage ? "#FAFBFC" : "#00000080",
        backdropFilter: "blur(6px)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-6 h-20 flex items-center justify-between gap-6">
        {/* LOGO */}
        <div className="flex items-center">
          <Link
            to="/"
            className={`flex text-2xl font-semibold tracking-tight ${
              shouldDarkText ? "text-gray-900" : "text-white"
            }`}
          >
            <img
              src="/images/logo.png"
              alt="Verity Gem"
              className="h-8 w-auto"
            />
            Verity
            <span style={{ color: shouldDarkText ? "#2563EB" : "#60A5FA" }}>
              Gem
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center gap-8 text-sm font-medium">
            <NavLink
              to="/shop"
              label="Shop"
              active={isActive("/shop")}
              scrolled={scrolled}
              isHomepage={isHomepage}
            />
            <NavLink
              to="/blog"
              label="Blog"
              active={isActive("/blog")}
              scrolled={scrolled}
              isHomepage={isHomepage}
            />
            {/* <NavLink
              to="/about"
              label="About"
              active={isActive("/about")}
              scrolled={scrolled}
              isHomepage={isHomepage}
            /> */}
            <NavLink
              to="/contact"
              label="Contact"
              active={isActive("/contact")}
              scrolled={scrolled}
              isHomepage={isHomepage}
            />
            <NavLink
              to="/orders"
              label="Orders"
              active={isActive("/orders")}
              scrolled={scrolled}
              isHomepage={isHomepage}
            />
          </div>
        </div>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-4">
          {/* <button
            type="button"
            className="p-2 rounded-full transition hover:bg-white/10"
            style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
            aria-label="Search"
          >
            <Search size={18} />
          </button> */}

          <Link
            to="/favorites"
            className="p-2 rounded-full transition hover:bg-white/10"
            style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
            aria-label="Favorites"
          >
            <Heart size={18} />
          </Link>

          <Link
            to="/cart"
            className="p-2 rounded-full transition hover:bg-white/10 relative"
            style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
            aria-label="Cart"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span
                className="
    bg-blue-500 
    absolute -top-1 -right-1 
    text-[10px] font-semibold 
    w-5 h-5 
    rounded-full 
    flex items-center justify-center 
    text-white
  "
              >
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account / Auth */}
          {!user ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition border"
              style={{
                background: shouldDarkText ? "#FFFFFF" : "transparent",
                color: shouldDarkText ? "#111827" : "#FFFFFF",
                borderColor: shouldDarkText
                  ? "rgba(17,24,39,0.06)"
                  : "rgba(255,255,255,0.25)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = shouldDarkText
                  ? "#F8FAFC"
                  : "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = shouldDarkText
                  ? "#FFFFFF"
                  : "transparent")
              }
            >
              <User size={16} />
              <span className="hidden sm:inline">Login</span>
            </button>
          ) : (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="p-2 rounded-full border transition hover:bg-white/10"
                style={{
                  borderColor: shouldDarkText
                    ? "rgba(17,24,39,0.06)"
                    : "rgba(255,255,255,0.25)",
                  color: shouldDarkText ? "#111827" : "#FFFFFF",
                  background: shouldDarkText ? "#FFFFFF" : "transparent",
                }}
                aria-haspopup="true"
                aria-expanded={open}
              >
                <User size={18} />
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-3 w-44 rounded-xl shadow-lg p-2 z-30"
                  style={{
                    background: shouldDarkText ? "#FFFFFF" : "#020617",
                    border: shouldDarkText
                      ? "1px solid rgba(229,231,235,0.8)"
                      : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Link
                    to="/account"
                    className="block px-3 py-2 rounded-md text-sm hover:bg-black/5"
                    style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
                    onClick={() => setOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    to="/account/orders"
                    className="block px-3 py-2 rounded-md text-sm hover:bg-black/5"
                    style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
                    onClick={() => setOpen(false)}
                  >
                    Orders
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      navigate("/");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-black/5"
                    style={{ color: shouldDarkText ? "#111827" : "#FFFFFF" }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* MOBILE LINKS */}
      <div
        className="md:hidden border-t"
        style={{
          borderColor:
            scrolled || !isHomepage
              ? "rgba(229,231,235,0.8)"
              : "rgba(229,231,235,0.12)",
        }}
      >
        <div className="flex items-center justify-center gap-6 py-3 text-xs font-medium">
          <NavLink
            to="/shop"
            label="Shop"
            active={isActive("/shop")}
            scrolled={scrolled}
            isHomepage={isHomepage}
          />
          <NavLink
            to="/blog"
            label="Blog"
            active={isActive("/blog")}
            scrolled={scrolled}
            isHomepage={isHomepage}
          />
          <NavLink
            to="/about"
            label="About"
            active={isActive("/about")}
            scrolled={scrolled}
            isHomepage={isHomepage}
          />
          <NavLink
            to="/contact"
            label="Contact"
            active={isActive("/contact")}
            scrolled={scrolled}
            isHomepage={isHomepage}
          />
          <NavLink
            to="/orders"
            label="Orders"
            active={isActive("/orders")}
            scrolled={scrolled}
            isHomepage={isHomepage}
          />
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, active, scrolled, isHomepage }) {
  const baseColor = isHomepage ? (scrolled ? "#111827" : "#FFFFFF") : "#111827";
  const activeColor = isHomepage
    ? scrolled
      ? "#2563EB"
      : "#60A5FA"
    : "#2563EB";

  return (
    <Link
      to={to}
      className="relative pb-1"
      style={{ color: active ? activeColor : baseColor }}
    >
      {label}
      {active && (
        <span
          className="absolute left-0 -bottom-0.5 h-0.5 w-full rounded-full"
          style={{ background: activeColor }}
        />
      )}
    </Link>
  );
}
