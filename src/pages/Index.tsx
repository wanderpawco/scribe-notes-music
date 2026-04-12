import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Upload, Wand2, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoModal from "@/components/DemoModal";
import PricingCards from "@/components/PricingCards";

const instruments = [
  { emoji: "🎤", name: "Vocals" },
  { emoji: "🎙️", name: "Lead Vocals" },
  { emoji: "🎶", name: "Backing Vocals" },
  { emoji: "🥁", name: "Drums" },
  { emoji: "🎸", name: "Bass" },
  { emoji: "⚡", name: "Electric Guitar" },
  { emoji: "🪕", name: "Acoustic Guitar" },
  { emoji: "🎹", name: "Piano" },
  { emoji: "🎛️", name: "Organ" },
  { emoji: "🎻", name: "Strings" },
  { emoji: "🎺", name: "Brass" },
  { emoji: "🪈", name: "Woodwinds" },
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
            {/* Connector line (desktop only) */}
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
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink mb-3">Every instrument. Every part.</h2>
          <p className="text-ink-soft mb-10 max-w-lg mx-auto">
            From full bands to solo performances — ScribeNoter handles the complete musical spectrum.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {instruments.map((inst) => (
              <div
                key={inst.name}
                className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-2 shadow-card hover:border-gold hover:scale-105 transition-all duration-200 cursor-default"
              >
                <span className="text-2xl">{inst.emoji}</span>
                <span className="text-sm font-medium text-ink">{inst.name}</span>
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
