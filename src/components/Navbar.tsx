import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: isLanding ? "#how-it-works" : "/#how-it-works" },
    { label: "Instruments", href: isLanding ? "#instruments" : "/#instruments" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-200 ${
          scrolled ? "backdrop-blur-md bg-paper/80 shadow-card" : "bg-paper"
        }`}
      >
        <div className="container flex items-center justify-between max-w-6xl mx-auto px-6">
          <Link to="/" className="flex items-center gap-1.5 text-ink">
            <span className="text-2xl leading-none">𝄞</span>
            <span className="font-heading text-xl font-semibold">ScribeNoter</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-ink-soft hover:text-ink transition-colors duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-ink-soft hover:text-ink transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200">
              Sign In
            </button>
            <Link
              to="/app"
              className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
            >
              Try Free
            </Link>
          </div>

          <button
            className="md:hidden text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-16 bg-paper md:hidden">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg text-ink-soft py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-lg text-ink-soft py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <hr className="border-border" />
            <button className="px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium">
              Sign In
            </button>
            <Link
              to="/app"
              className="px-4 py-3 rounded-lg bg-gold text-white text-sm font-medium text-center"
              onClick={() => setMobileOpen(false)}
            >
              Try Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
