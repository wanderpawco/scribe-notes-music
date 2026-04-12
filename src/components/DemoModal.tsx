import { useState, useEffect, useCallback } from "react";
import { X, FileAudio, Check } from "lucide-react";
import { Link } from "react-router-dom";
import SheetMusicSVG from "@/components/SheetMusicSVG";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoModal = ({ open, onClose }: DemoModalProps) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detectedInstruments, setDetectedInstruments] = useState<number[]>([]);
  const [transcriptionStep, setTranscriptionStep] = useState(0);

  const resetDemo = useCallback(() => {
    setStage(0);
    setProgress(0);
    setDetectedInstruments([]);
    setTranscriptionStep(0);
  }, []);

  useEffect(() => {
    if (!open) {
      resetDemo();
      return;
    }

    // Stage 0: Upload progress
    if (stage === 0) {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStage(1), 400);
            return 100;
          }
          return p + 5;
        });
      }, 80);
      return () => clearInterval(interval);
    }

    // Stage 1: Instrument detection
    if (stage === 1) {
      const instruments = [0, 1, 2];
      instruments.forEach((i) => {
        setTimeout(() => {
          setDetectedInstruments((prev) => [...prev, i]);
        }, (i + 1) * 600);
      });
      setTimeout(() => setStage(2), 2400);
    }

    // Stage 2: Transcription
    if (stage === 2) {
      const steps = [0, 1, 2];
      steps.forEach((s) => {
        setTimeout(() => setTranscriptionStep(s + 1), (s + 1) * 600);
      });
      setTimeout(() => setStage(3), 2400);
    }
  }, [open, stage, resetDemo]);

  if (!open) return null;

  const instruments = [
    { icon: "🎸", name: "Guitar" },
    { icon: "🎸", name: "Bass" },
    { icon: "🥁", name: "Drums" },
  ];

  const transcriptionSteps = ["Separating stems", "Analyzing pitch", "Generating notation"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[720px] bg-surface rounded-[20px] p-8 md:p-10 shadow-card z-10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="font-heading text-2xl font-semibold text-ink text-center mb-8">
          See ScribeNoter in action
        </h2>

        <div className="space-y-6 min-h-[200px]">
          {/* Stage 0: Upload */}
          <div className={`transition-opacity duration-500 ${stage === 0 ? "opacity-100" : stage > 0 ? "opacity-40" : "opacity-0"}`}>
            <div className="flex items-center gap-3 mb-3">
              <FileAudio size={20} className="text-gold" />
              <span className="text-sm font-medium text-ink">Uploading BluesRiff_Take3.wav</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stage 1: Detection */}
          {stage >= 1 && (
            <div className={`transition-opacity duration-500 ${stage === 1 ? "opacity-100" : "opacity-40"}`}>
              <p className="text-sm font-medium text-ink mb-3">AI detecting instruments...</p>
              <div className="flex gap-4">
                {instruments.map((inst, i) => (
                  <div
                    key={inst.name}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-paper border border-border transition-all ${
                      detectedInstruments.includes(i) ? "animate-pop-in" : "opacity-0"
                    }`}
                  >
                    <span className="text-lg">{inst.icon}</span>
                    <span className="text-sm text-ink">{inst.name}</span>
                    {detectedInstruments.includes(i) && (
                      <Check size={14} className="text-teal" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 2: Transcription */}
          {stage >= 2 && (
            <div className={`transition-opacity duration-500 ${stage === 2 ? "opacity-100" : "opacity-40"}`}>
              <p className="text-sm font-medium text-ink mb-3">Transcribing stems...</p>
              <div className="h-2 bg-border rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${(transcriptionStep / 3) * 100}%` }}
                />
              </div>
              <div className="flex gap-3">
                {transcriptionSteps.map((step, i) => (
                  <span
                    key={step}
                    className={`text-xs transition-colors pl-2 ${
                      transcriptionStep > i ? "text-teal border-l-2 border-gold" : transcriptionStep === i + 1 ? "text-ink border-l-2 border-gold" : "text-ink-muted"
                    }`}
                  >
                    {step} {transcriptionStep > i && "✓"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stage 3: Result */}
          {stage >= 3 && (
            <div className="animate-fade-in">
              <p className="text-sm font-medium text-teal mb-4">✓ Your sheet music is ready.</p>
              <div className="p-4 bg-paper rounded-xl border border-border mb-4">
                <SheetMusicSVG />
              </div>
              <div className="flex gap-2 justify-center">
                {["PDF", "MIDI", "MusicXML"].map((fmt) => (
                  <button
                    key={fmt}
                    className="px-4 py-2 rounded-lg border border-border text-sm text-ink hover:bg-surface transition-all duration-200"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/app"
            onClick={onClose}
            className="inline-block px-6 py-3 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
          >
            Try It Yourself →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
