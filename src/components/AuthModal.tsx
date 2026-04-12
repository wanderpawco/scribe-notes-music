import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Check, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const switchTab = (newTab: "signin" | "signup") => {
    setTab(newTab);
    resetForm();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Welcome!");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email to confirm your account");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] mx-4 bg-surface rounded-[20px] p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span className="text-3xl leading-none">𝄞</span>
          <span className="font-heading text-2xl font-semibold text-ink">ScribeNoter</span>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <Check size={24} className="text-gold" />
            </div>
            <p className="text-ink font-medium text-center">{success}</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-0 mb-6 border-b border-border">
              <button
                onClick={() => switchTab("signin")}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  tab === "signin"
                    ? "text-gold border-b-2 border-gold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchTab("signup")}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  tab === "signup"
                    ? "text-gold border-b-2 border-gold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-paper text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-paper text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {tab === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-paper text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-3 text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full px-4 py-3 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-ink-muted">
              {tab === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => switchTab("signup")} className="text-gold hover:text-gold-dark font-medium">
                    Sign up →
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => switchTab("signin")} className="text-gold hover:text-gold-dark font-medium">
                    Sign in →
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
