import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Upload, Wand2, Music, Mic2, Music2, Keyboard, FileText, Zap, Download, Shield, AlertTriangle, ArrowRight, Guitar, Drum } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoModal from "@/components/DemoModal";
import PricingCards from "@/components/PricingCards";

const features = [
  { icon: Music2, title: "Brass & Woodwinds Included", desc: "Most transcription tools only handle piano and guitar. ScribeNoter is one of the only tools that transcribes trumpet, trombone, saxophone, flute, clarinet, and all other brass and woodwind instruments with instrument-specific AI models.", highlight: true },
  { icon: FileText, title: "Real Sheet Music Output", desc: "Get print-ready PDF sheet music with proper notation, correct clef, and accurate rhythm — not just a piano roll. Download in PDF, MIDI, and MusicXML formats compatible with Sibelius, Finale, and MuseScore.", highlight: false },
  { icon: Mic2, title: "Vocals, Bass & More", desc: "Transcribe lead vocals, backing vocals, bass lines, piano, organ, and strings — each processed with a dedicated AI model trained specifically for that instrument.", highlight: false },
  { icon: Zap, title: "Results in Minutes", desc: "Upload your audio, select your instrument, and receive your sheet music in minutes — not hours. No manual note entry, no expensive software, no music theory knowledge required.", highlight: false },
  { icon: Download, title: "Multiple Export Formats", desc: "Download your transcription as PDF sheet music for printing, MIDI for your DAW, or MusicXML to import into any notation software. Pro and Studio plans include Guitar Pro export.", highlight: false },
  { icon: Shield, title: "Your Audio Stays Private", desc: "Your recordings are stored securely in your private account and are never shared or used to train AI models. Audio files are automatically deleted from our transcription processor within 14 days.", highlight: false },
];

const instrumentGroups = [
  {
    label: "VOCALS",
    badge: null,
    colorTheme: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: "text-rose-400",
      hover: "hover:bg-rose-100",
      gradient: "from-rose-50 to-rose-100",
    },
    instruments: [
      { icon: Mic2, name: "Lead Vocals" },
      { icon: Mic2, name: "Backing Vocals" },
    ],
  },
  {
    label: "STRINGS & KEYS",
    badge: null,
    colorTheme: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-500",
      hover: "hover:bg-amber-100",
      gradient: "from-amber-50 to-amber-100",
    },
    instruments: [
      { icon: Music, name: "Bass" },
      { icon: Keyboard, name: "Piano" },
      { icon: Keyboard, name: "Organ" },
      { icon: Music, name: "Strings" },
    ],
  },
  {
    label: "GUITAR",
    badge: null,
    colorTheme: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-400",
      hover: "hover:bg-orange-100",
      gradient: "from-orange-50 to-orange-100",
    },
    instruments: [
      { icon: Guitar, name: "Electric Guitar" },
      { icon: Guitar, name: "Acoustic Guitar" },
    ],
  },
  {
    label: "BRASS",
    badge: "★ Unique to ScribeNoter",
    colorTheme: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      icon: "text-yellow-600",
      hover: "hover:bg-yellow-100",
      gradient: "from-yellow-50 to-yellow-100",
      shimmer: true,
    },
    instruments: [
      { icon: Music2, name: "Trumpet" },
      { icon: Music2, name: "French Horn" },
      { icon: Music2, name: "Trombone" },
      { icon: Music2, name: "Tuba" },
      { icon: Music2, name: "Flugelhorn" },
      { icon: Music2, name: "Baritone/Euphonium" },
    ],
  },
  {
    label: "WOODWINDS",
    badge: "★ Unique to ScribeNoter",
    colorTheme: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      icon: "text-teal-500",
      hover: "hover:bg-teal-100",
      gradient: "from-teal-50 to-teal-100",
    },
    instruments: [
      { icon: Music, name: "Flute" },
      { icon: Music, name: "Oboe" },
      { icon: Music, name: "Clarinet" },
      { icon: Music, name: "Alto Saxophone" },
      { icon: Music, name: "Tenor Saxophone" },
      { icon: Music, name: "Soprano Saxophone" },
      { icon: Music, name: "Bassoon" },
    ],
  },
  {
    label: "PERCUSSION",
    badge: null,
    colorTheme: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-400",
      hover: "hover:bg-purple-100",
      gradient: "from-purple-50 to-purple-100",
    },
    instruments: [
      { icon: Music2, name: "Drums" },
    ],
  },
];

const disclaimers = [
  { title: "Transcription Accuracy", desc: "AI transcription is not perfect. Results depend on recording quality, mix clarity, and instrument isolation. Complex polyphonic recordings or heavily produced tracks may produce less accurate results. We recommend uploading clean, isolated recordings for best results." },
  { title: "Copyrighted Music", desc: "ScribeNoter is designed for transcribing music you own or have rights to — such as your own recordings, original compositions, or audio you have explicit permission to transcribe. Transcribing commercially released copyrighted music without authorization may violate copyright law. You confirm your rights at upload." },
  { title: "Beta Quality", desc: "ScribeNoter is currently in beta. Transcription quality is actively improving as we refine our AI models. If you encounter poor results, please send us feedback — it directly helps us improve." },
];

const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="relative" style={{ minHeight: '100vh' }}>
        {/* Chladni canvas */}
        <canvas id="chladni-hero" className="absolute inset-0 w-full h-full" style={{ zIndex: 0, background: '#000' }} />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)' }} />
        {/* Hero content */}
        <div className="relative flex flex-col items-center justify-center px-6 text-center" style={{ zIndex: 2, minHeight: '100vh' }}>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-8" style={{ background: 'rgba(0,0,0,0.82)', border: '1px solid #B8942A', color: '#D4AF37' }}>
            AI Music Transcription
          </span>

          {/* Frosted glass card */}
          <div className="mb-8 max-w-2xl w-full" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(184,148,42,0.28)', borderRadius: '16px', padding: '32px 40px' }}>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-1" style={{ color: '#F5F0E8' }}>
              Every song deserves
            </h1>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-5" style={{ color: '#D4AF37' }}>
              its sheet music.
            </h1>
            <p className="text-lg max-w-xl mx-auto mb-2" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Upload any audio, select your instruments, and receive sheet music, MIDI, and MusicXML in minutes.
            </p>
            <p className="text-base max-w-md mx-auto" style={{ color: '#4ECDC4' }}>
              From brass to bass — every instrument, every part.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              to="/app"
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #B8942A, #D4AF37)', color: '#fff', boxShadow: '0 0 24px rgba(212,175,55,0.4)' }}
            >
              Try It Free →
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
            >
              Watch Demo
            </button>
          </div>

          {/* YouTube URL input */}
          <div className="max-w-lg w-full mx-auto mb-8">
            <div className="flex rounded-lg overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Or paste a YouTube link..."
                className="flex-1 px-4 py-3 bg-transparent text-sm outline-none"
                style={{ color: '#F5F0E8', caretColor: '#D4AF37' }}
              />
              <button
                className="px-4 flex items-center justify-center transition-colors"
                style={{ background: '#B8942A', color: '#fff' }}
                aria-label="Submit YouTube link"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full mx-auto">
            {[
              { label: "22 Instruments", color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' },
              { label: "PDF · MIDI · MusicXML", color: '#4ECDC4', borderColor: 'rgba(78,205,196,0.3)' },
              { label: "Brass & Winds", color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' },
              { label: "Free", color: '#4ECDC4', borderColor: 'rgba(78,205,196,0.3)' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg px-4 py-3 text-center text-sm font-semibold" style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${s.borderColor}`, color: s.color, backdropFilter: 'blur(8px)' }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Why ScribeNoter? */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Why ScribeNoter?</h2>
          <p className="text-ink-soft mb-12 max-w-lg mx-auto">
            Professional-grade music transcription for every musician.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`rounded-xl p-7 shadow-card transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--gold)/0.18)] ${
                    f.highlight
                      ? "border-2 border-gold bg-[hsl(var(--ink)/0.03)]"
                      : "border border-border bg-surface"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      f.highlight ? "bg-gold/15" : "bg-gold-light"
                    }`}>
                      <Icon size={22} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-ink mb-2">{f.title}</h3>
                      <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-semibold text-ink text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[16.7%] right-[16.7%] h-px bg-border" />
            {[
              { icon: <Upload size={24} />, title: "Upload your audio", body: "Drop any MP3, WAV, FLAC, or M4A file. Up to 250MB supported.", step: 1 },
              { icon: <Wand2 size={24} />, title: "Select your instruments", body: "Our AI detects what's playing and pre-selects instruments for you. Confirm or adjust.", step: 2 },
              { icon: <Music size={24} />, title: "Get your sheet music", body: "Receive PDF sheet music, MIDI, and MusicXML. Edit, transpose, and export.", step: 3 },
            ].map((s) => (
              <div key={s.step} className="relative bg-surface border border-border rounded-xl p-6 shadow-card text-center">
                <div className="w-10 h-10 rounded-full bg-gold-light text-gold flex items-center justify-center mx-auto mb-4 text-sm font-bold relative z-10">
                  {s.step}
                </div>
                <div className="flex justify-center mb-3 text-gold">{s.icon}</div>
                <h3 className="font-heading text-lg font-semibold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instruments */}
      <section id="instruments" className="py-20 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Every instrument. Every part.</h2>
          <p className="text-ink-soft mb-12 max-w-lg mx-auto">
            From full bands to solo performances — ScribeNoter handles the complete musical spectrum.
          </p>
          <div className="space-y-10">
            {instrumentGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-sm font-bold tracking-widest text-gold uppercase">
                    {group.label}
                  </span>
                  {group.badge && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-500 text-white">
                      {group.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {group.instruments.map((inst) => {
                    const IconComponent = inst.icon;
                    const theme = group.colorTheme;
                    return (
                      <div
                        key={inst.name}
                        className={`${theme.bg} ${theme.border} border rounded-xl p-5 flex flex-col items-center justify-center gap-4 shadow-card hover:shadow-md hover:scale-105 transition-all duration-200 cursor-default min-h-[110px] min-w-[120px] ${theme.hover} relative overflow-hidden group`}
                      >
                        {/* Subtle gradient overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                        {/* Gold shimmer effect for BRASS */}
                        {theme.shimmer && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_ease-in-out]" />
                          </div>
                        )}
                        <IconComponent size={32} className={`${theme.icon} relative z-10`} />
                        <span className="text-base font-semibold text-ink relative z-10">{inst.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6" style={{ background: "#080810" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4">
            Ready to hear your music on paper?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
            Join musicians worldwide using AI to transcribe audio into professional sheet music.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="px-8 py-3.5 rounded-lg bg-gold text-white font-medium hover:bg-gold-dark transition-all duration-200 text-base"
            >
              Start Transcribing — It's Free →
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-3.5 rounded-lg border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-all duration-200 text-base"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-heading text-xl font-semibold text-ink text-center mb-8">A few important notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {disclaimers.map((d) => (
              <div key={d.title} className="bg-surface border border-border rounded-xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-gold shrink-0" />
                  <h4 className="font-heading text-sm font-semibold text-ink">{d.title}</h4>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Simple, transparent pricing</h2>
          <p className="text-ink-soft mb-10">Start free. Upgrade when you're ready.</p>
          <PricingCards />
        </div>
      </section>

      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

export default Index;
