import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-1.5 text-ink mb-3">
              <span className="text-2xl leading-none">𝄞</span>
              <span className="font-heading text-xl font-semibold">ScribeNoter</span>
            </Link>
            <p className="text-sm text-ink-soft">
              AI-powered music transcription for every musician.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold text-ink mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/app" className="text-sm text-ink-soft hover:text-ink transition-colors">App</Link></li>
              <li><Link to="/pricing" className="text-sm text-ink-soft hover:text-ink transition-colors">Pricing</Link></li>
              <li><a href="/#how-it-works" className="text-sm text-ink-soft hover:text-ink transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold text-ink mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-ink-soft hover:text-ink transition-colors">Terms</a></li>
              <li><a href="#" className="text-sm text-ink-soft hover:text-ink transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-ink-soft hover:text-ink transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-sm text-ink-muted">© 2025 ScribeNoter. Built for musicians.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
