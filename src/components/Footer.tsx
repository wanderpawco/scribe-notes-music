import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer style={{ background: '#030308', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-1.5 mb-3" style={{ color: '#F5F0E8' }}>
              <span className="text-2xl leading-none">𝄞</span>
              <span className="font-heading text-xl font-semibold">ScribeNoter</span>
            </Link>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
              AI-powered music transcription for every musician.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4" style={{ color: '#F5F0E8' }}>Product</h4>
            <ul className="space-y-2">
              <li><Link to="/app" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>App</Link></li>
              <li><Link to="/pricing" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>Pricing</Link></li>
              <li><a href="/#how-it-works" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4" style={{ color: '#F5F0E8' }}>Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>Terms</Link></li>
              <li><Link to="/privacy" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>Privacy</Link></li>
              <li><Link to="/contact" className="text-sm transition-colors hover:text-gold" style={{ color: 'rgba(245,240,232,0.4)' }}>Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.3)' }}>© 2025 ScribeNoter. Built for musicians.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
