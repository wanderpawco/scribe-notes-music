import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Upload, Wand2, Music, Mic2, Music2, Keyboard, FileText, Zap, Download, Shield, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoModal from "@/components/DemoModal";
import PricingCards from "@/components/PricingCards";

const instruments = [
  { icon: Mic2, name: "Lead Vocals" },
  { icon: Mic2, name: "Backing Vocals" },
  { icon: Music, name: "Bass" },
  { icon: Keyboard, name: "Piano" },
  { icon: Keyboard, name: "Organ" },
  { icon: Music, name: "Strings" },
  { icon: Music2, name: "Trumpet" },
  { icon: Music2, name: "French Horn" },
  { icon: Music2, name: "Trombone" },
  { icon: Music2, name: "Tuba" },
  { icon: Music2, name: "Flugelhorn" },
  { icon: Music2, name: "Baritone/Euphonium" },
  { icon: Music, name: "Flute" },
  { icon: Music, name: "Oboe" },
  { icon: Music, name: "Clarinet" },
  { icon: Music, name: "Alto Saxophone" },
  { icon: Music, name: "Tenor Saxophone" },
  { icon: Music, name: "Soprano Saxophone" },
  { icon: Music, name: "Bassoon" },
];

const features = [
  { icon: Music2, title: "Brass & Woodwinds Included", desc: "Most transcription tools only handle piano and guitar. ScribeNoter is one of the only tools that transcribes trumpet, trombone, saxophone, flute, clarinet, and all other brass and woodwind instruments with instrument-specific AI models." },
  { icon: FileText, title: "Real Sheet Music Output", desc: "Get print-ready PDF sheet music with proper notation, correct clef, and accurate rhythm — not just a piano roll. Download in PDF, MIDI, and MusicXML formats compatible with Sibelius, Finale, and MuseScore." },
  { icon: Mic2, title: "Vocals, Bass & More", desc: "Transcribe lead vocals, backing vocals, bass lines, piano, organ, and strings — each processed with a dedicated AI model trained specifically for that instrument." },
  { icon: Zap, title: "Results in Minutes", desc: "Upload your audio, select your instrument, and receive your sheet music in minutes — not hours. No manual note entry, no expensive software, no music theory knowledge required." },
  { icon: Download, title: "Multiple Export Formats", desc: "Download your transcription as PDF sheet music for printing, MIDI for your DAW, or MusicXML to import into any notation software. Pro and Studio plans include Guitar Pro export." },
  { icon: Shield, title: "Your Audio Stays Private", desc: "Your recordings are stored securely in your private account and are never shared or used to train AI models. Audio files are automatically deleted from our transcription processor within 14 days." },
];

const disclaimers = [
  { title: "Transcription Accuracy", desc: "AI transcription is not perfect. Results depend on recording quality, mix clarity, and instrument isolation. Complex polyphonic recordings or heavily produced tracks may produce less accurate results. We recommend uploading clean, isolated recordings for best results." },
  { title: "Copyrighted Music", desc: "ScribeNoter is designed for transcribing music you own or have rights to — such as your own recordings, original compositions, or audio you have explicit permission to transcribe. Transcribing commercially released copyrighted music without authorization may violate copyright law. You confirm your rights at upload." },
  { title: "Beta Quality", desc: "ScribeNoter is currently in beta. Transcription quality is actively improving as we refine our AI models. If you encounter poor results, please send us feedback — it directly helps us improve." },
];

const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 staff-lines">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-gold-light text-gold mb-6">
            AI Music Transcription
          </span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-ink leading-tight mb-5">
            Every song deserves its sheet music.
          </h1>
          <p className="text-lg text-ink-soft max-w-xl mx-auto mb-8">
            Upload any audio, select your instruments, and receive sheet music, MIDI, and MusicXML in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              to="/app"
              className="px-6 py-3 rounded-lg bg-gold text-white font-medium hover:bg-gold-dark transition-all duration-200"
            >
              Try It Free →
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="px-6 py-3 rounded-lg border border-border text-ink font-medium hover:bg-surface transition-all duration-200"
            >
              Watch Demo
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-ink-soft">
            {["No account needed", "MP3, WAV, FLAC, M4A", "Results in minutes"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={14} className="text-teal" /> {t}
              </span>
            ))}
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

      {/* Features — Why ScribeNoter? */}
      <section className="py-20 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Why ScribeNoter?</h2>
          <p className="text-ink-soft mb-12 max-w-lg mx-auto">
            Professional-grade music transcription for every musician.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-surface border border-border rounded-xl p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-ink mb-1.5">{f.title}</h3>
                      <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instruments */}
      <section id="instruments" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Every instrument. Every part.</h2>
          <p className="text-ink-soft mb-10 max-w-lg mx-auto">
            From full bands to solo performances — ScribeNoter handles the complete musical spectrum.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {instruments.map((inst) => {
              const IconComponent = inst.icon;
              return (
                <div
                  key={inst.name}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 shadow-card hover:border-gold hover:scale-105 transition-all duration-200 cursor-default min-h-[80px]"
                >
                  <IconComponent size={24} className="text-gold" />
                  <span className="text-sm font-medium text-ink">{inst.name}</span>
                </div>
              );
            })}
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
