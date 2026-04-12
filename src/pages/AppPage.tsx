import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Music, Mic, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = ["Upload", "Select Instruments", "Get Results"];

const AppPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="max-w-[800px] mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-gold text-white"
                        : "bg-surface border border-border text-ink-muted"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium ${
                      i === 0 ? "text-gold" : "text-ink-muted"
                    }`}
                  >
                    {step}
                  </span>
                  {i === 0 && <div className="h-0.5 w-full bg-gold mt-1 rounded-full" />}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-16 md:w-24 h-px bg-border mx-2 mb-5" />
                )}
              </div>
            ))}
          </div>

          {/* Upload dropzone */}
          <div
            className={`min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-gold bg-gold-light"
                : "border-border hover:border-ink-muted"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} accept=".mp3,.wav,.flac,.m4a" className="hidden" />
            <Music size={40} className="text-gold mb-4" />
            <h2 className="font-heading text-xl font-semibold text-ink mb-2">
              Drop your audio file here
            </h2>
            <p className="text-sm text-ink-muted mb-5">MP3, WAV, FLAC, M4A — up to 250MB</p>
            <button
              className="px-5 py-2.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Browse Files
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-ink-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Record button */}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200">
            <Mic size={16} />
            Record live audio
          </button>

          {/* Format pills */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {["MP3", "WAV", "FLAC", "M4A"].map((fmt) => (
              <span
                key={fmt}
                className="px-3 py-1 rounded-full text-xs text-ink-soft bg-surface border border-border"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Note */}
          <p className="text-center text-xs text-ink-muted mt-6">
            No account needed to try — sign up free to save and export your results
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppPage;
