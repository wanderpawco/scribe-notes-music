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
    <div className="text-[#05050F] text-base py-3 px-6 flex items-center justify-center relative" style={{ background: '#D4AF37', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
      <span className="text-center">
        <span className="text-lg">🎵</span> ScribeNoter is in Beta — transcription quality is actively improving. We'd love your{" "}
        <Link to="/contact" className="underline decoration-[#4ECDC4] decoration-2 text-[#05050F] hover:text-[#05050F] transition-colors">
          feedback
        </Link>.
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-4 p-1 text-[#05050F] hover:bg-black/10 rounded transition-colors"
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
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <BetaBanner />
        <nav
          className={`h-16 flex items-center transition-all duration-200 ${
            scrolled ? "backdrop-blur-md shadow-card" : ""
          }`}
          style={{
            background: scrolled ? 'rgba(5,5,15,0.9)' : 'rgba(5,5,15,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="grid grid-cols-3 items-center max-w-6xl mx-auto px-6 w-full">
          <Link to="/" className="flex items-center gap-1.5" style={{ color: '#F5F0E8' }}>
            <span className="text-5xl leading-none">𝄞</span>
            <span className="font-heading text-3xl font-bold">ScribeNoter</span>
          </Link>

          <div className="hidden md:flex items-center justify-center gap-12">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg transition-colors duration-200"
                  style={{ color: 'rgba(245,240,232,0.6)' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#F5F0E8'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,240,232,0.6)'}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-lg transition-colors duration-200"
                  style={{ color: 'rgba(245,240,232,0.6)' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#F5F0E8'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,240,232,0.6)'}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center justify-end gap-3">
            {user ? (
              <div ref={avatarRef} className="relative">
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="w-9 h-9 rounded-full bg-gold/15 border-2 border-gold text-gold font-bold text-sm flex items-center justify-center hover:bg-gold/25 transition-colors"
                  >
                    {userInitial}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 rounded-xl shadow-lg py-1.5 z-50" style={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#F5F0E8' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}
                      >
                        <LayoutDashboard size={15} style={{ color: 'rgba(245,240,232,0.4)' }} />
                        My Transcriptions
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#F5F0E8' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}
                      >
                        <LogOut size={15} style={{ color: 'rgba(245,240,232,0.4)' }} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(245,240,232,0.8)' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}
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
            className="md:hidden"
            style={{ color: '#F5F0E8' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-16 md:hidden" style={{ background: '#05050F' }}>
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg py-2"
                  style={{ color: 'rgba(245,240,232,0.6)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-lg py-2"
                  style={{ color: 'rgba(245,240,232,0.6)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-3 rounded-lg text-sm font-medium text-center"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(245,240,232,0.8)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  My Transcriptions
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="px-4 py-3 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(245,240,232,0.8)' }}
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
                  className="px-4 py-3 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(245,240,232,0.8)' }}
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
    </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
