import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const categories = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Billing Question",
  "Other",
];

const ContactPage = () => {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isValid = email.trim() !== "" && category !== "" && message.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const subject = encodeURIComponent(`[ScribeNoter Feedback] ${category}`);
      const body = encodeURIComponent(`From: ${email}\nCategory: ${category}\n\n${message}`);
      window.open(`mailto:devops@scribenoter.com?subject=${subject}&body=${body}`, "_self");
      setSubmitted(true);
      setEmail("");
      setCategory("");
      setMessage("");
      toast.success("Thank you for your feedback! We'll get back to you within 48 hours.");
    } catch {
      toast.error("Something went wrong. Please email us directly at devops@scribenoter.com");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16" style={{ background: '#05050F' }}>
        <div className="container max-w-2xl mx-auto px-6">
          {/* Section 1 — Header */}
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl font-bold mb-4" style={{ color: '#F5F0E8' }}>Get in Touch</h1>
            <p className="text-lg mb-4" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Have a question, found a bug, or want to share feedback? We'd love to hear from you.
            </p>
            <a
              href="mailto:devops@scribenoter.com"
              className="text-gold hover:text-gold-dark font-medium transition-colors"
            >
              devops@scribenoter.com
            </a>
          </div>

          {/* Section 2 — Form */}
          {submitted ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-lg font-medium mb-2" style={{ color: '#F5F0E8' }}>Thank you for your feedback!</p>
              <p style={{ color: 'rgba(245,240,232,0.6)' }}>We'll get back to you within 48 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 rounded-lg bg-gold text-white font-medium hover:bg-gold-dark transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl p-8" style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#F5F0E8' }}>
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors"
                  style={{ background: 'rgba(5,5,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1.5" style={{ color: '#F5F0E8' }}>
                  What's this about?
                </label>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors"
                  style={{ background: 'rgba(5,5,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: '#F5F0E8' }}>
                  Your Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors resize-y"
                  style={{ background: 'rgba(5,5,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }}
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-white font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ContactPage;
