import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/AuthModal";
import type { User } from "@supabase/supabase-js";

// Beta banner component
const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("betaBannerDismissed") === "true";
  });

  const handleDismiss = () => {
    sessionStorage.setItem("betaBannerDismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-[#0f0f1a] text-gold text-sm py-2 px-4 flex items-center justify-center relative">
      <span className="text-center">
        🎵 ScribeNoter is in Beta — transcription quality is actively improving. We'd love your{" "}
        <a href="mailto:devops@scribenoter.com" className="underline hover:text-gold-light transition-colors">
          feedback
        </a>.
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-4 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss beta banner"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAvatarMenuOpen(false);
  };

  const navLinks = [
    { label: "How It Works", href: isLanding ? "#how-it-works" : "/#how-it-works" },
    { label: "Instruments", href: isLanding ? "#instruments" : "/#instruments" },
    { label: "Pricing", href: "/pricing" },
  ];

  const userInitial = user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <BetaBanner />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-200 ${
          scrolled ? "backdrop-blur-md bg-paper/80 shadow-card" : "bg-paper"
        }`}
      >
        <div className="container flex items-center justify-between max-w-6xl mx-auto px-6">
          <Link to="/" className="flex items-center gap-1.5 text-ink">
            <span className="text-5xl leading-none">𝄞</span>
            <span className="font-heading text-3xl font-bold">ScribeNoter</span>
          </Link>

          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg text-ink-soft hover:text-ink transition-colors duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-lg text-ink-soft hover:text-ink transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div ref={avatarRef} className="relative">
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="w-9 h-9 rounded-full bg-gold/15 border-2 border-gold text-gold font-bold text-sm flex items-center justify-center hover:bg-gold/25 transition-colors"
                  >
                    {userInitial}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50">
                      <Link
                        to="/dashboard"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-paper transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-ink-muted" />
                        My Transcriptions
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-paper transition-colors"
                      >
                        <LogOut size={15} className="text-ink-muted" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
                >
                  Try Free
                </button>
              </>
            )}
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
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  My Transcriptions
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium"
                >
                  Sign Out
                </button>
                <Link
                  to="/app"
                  className="px-4 py-3 rounded-lg bg-gold text-white text-sm font-medium text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Try Free
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="px-4 py-3 rounded-lg bg-gold text-white text-sm font-medium text-center"
                >
                  Try Free
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
