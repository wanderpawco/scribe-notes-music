import { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Mic, Upload, X, Check, Mic2, Music2, Guitar, Keyboard,
  FileText, FileCode, Lock, ChevronDown, RefreshCw, ArrowUpDown, Minus, Plus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SheetMusicSVG from "@/components/SheetMusicSVG";

const stepLabels = ["Upload", "Select Instruments", "Get Results"];

const allInstruments = [
  { icon: Mic2, name: "Vocals" },
  { icon: Mic2, name: "Lead Vocals" },
  { icon: Mic2, name: "Backing Vocals" },
  { icon: Music2, name: "Drums" },
  { icon: Music, name: "Bass" },
  { icon: Guitar, name: "Electric Guitar" },
  { icon: Guitar, name: "Acoustic Guitar" },
  { icon: Music, name: "Piano" },
  { icon: Keyboard, name: "Organ" },
  { icon: Music, name: "Strings" },
  { icon: Music2, name: "Brass" },
  { icon: Music, name: "Woodwinds" },
];

const defaultDetected = ["Electric Guitar", "Bass", "Drums"];

const allKeys = [
  "C Major", "C# Major", "D Major", "Eb Major", "E Major", "F Major",
  "F# Major", "G Major", "Ab Major", "A Major", "Bb Major", "B Major",
];

const exportOptions = [
  { icon: FileText, name: "PDF Sheet Music", desc: "Print-ready notation", free: true },
  { icon: Music, name: "MIDI File", desc: "For any DAW or notation software", free: false },
  { icon: FileCode, name: "MusicXML", desc: "For Sibelius, Finale, MuseScore", free: false },
  { icon: Guitar, name: "Guitar Pro", desc: "Tabs and notation for guitarists", free: false },
];

/* ── Processing steps config ── */
const processingSteps = [
  { label: "Uploading file", duration: 0 },
  { label: "Separating stems", duration: 1500 },
  { label: "Analyzing pitch and rhythm", duration: 1500 },
  { label: "Generating notation", duration: 1000 },
];

const AppPage = () => {
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 1
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Stage 2
  const [processing, setProcessing] = useState(true);
  const [procStep, setProcStep] = useState(0);
  const [selectedKey, setSelectedKey] = useState("C Major");
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [bpm, setBpm] = useState(120);

  /* ── File selection handler ── */
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setStage(1);
    setScanning(true);
    setSelected([]);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  /* ── Stage 1: scanning animation ── */
  useEffect(() => {
    if (stage !== 1 || !scanning) return;
    const t = setTimeout(() => {
      setScanning(false);
      setSelected([...defaultDetected]);
    }, 1500);
    return () => clearTimeout(t);
  }, [stage, scanning]);

  /* ── Stage 2: processing animation ── */
  useEffect(() => {
    if (stage !== 2 || !processing) return;
    setProcStep(0);

    // Step 0 completes instantly
    let cumulative = 200;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // complete step 0 immediately
    timers.push(setTimeout(() => setProcStep(1), cumulative));

    for (let i = 1; i < processingSteps.length; i++) {
      cumulative += processingSteps[i].duration;
      timers.push(setTimeout(() => setProcStep(i + 1), cumulative));
    }

    timers.push(setTimeout(() => setProcessing(false), cumulative + 400));
    return () => timers.forEach(clearTimeout);
  }, [stage, processing]);

  const toggleInstrument = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const goToStage = (s: number) => {
    setStage(s);
    if (s === 2) setProcessing(true);
  };

  const resetAll = () => {
    setStage(0);
    setFileName("");
    setSelected([]);
    setScanning(true);
    setProcessing(true);
    setProcStep(0);
    setSelectedKey("C Major");
    setBpm(120);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeStep = stage === 0 ? 0 : stage === 1 ? 1 : 2;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="max-w-[800px] mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {stepLabels.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                      i <= activeStep
                        ? "bg-gold text-white"
                        : "bg-surface border border-border text-ink-muted"
                    }`}
                  >
                    {i < activeStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${
                      i <= activeStep ? "text-gold" : "text-ink-muted"
                    }`}
                  >
                    {step}
                  </span>
                  {i <= activeStep && (
                    <div className="h-0.5 w-full bg-gold mt-1 rounded-full" />
                  )}
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-px mx-2 mb-5 transition-colors duration-300 ${
                      i < activeStep ? "bg-gold" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ═══════════ STAGE 0: Upload ═══════════ */}
          <div
            className={`transition-all duration-400 ${
              stage === 0
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 hidden"
            }`}
          >
            <div
              className={`min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer ${
                dragOver
                  ? "border-gold bg-gold-light"
                  : "border-border hover:border-ink-muted"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".mp3,.wav,.flac,.m4a"
                className="hidden"
                onChange={onFileInput}
              />
              <Music size={40} className="text-gold mb-4" />
              <h2 className="font-heading text-xl font-semibold text-ink mb-2">
                Drop your audio file here
              </h2>
              <p className="text-sm text-ink-muted mb-5">
                MP3, WAV, FLAC, M4A — up to 250MB
              </p>
              <button
                className="px-5 py-2.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                Browse Files
              </button>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-ink-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200">
              <Mic size={16} />
              Record live audio
            </button>

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

            <p className="text-center text-xs text-ink-muted mt-6">
              No account needed to try — sign up free to save and export your results
            </p>
          </div>

          {/* ═══════════ STAGE 1: Select Instruments ═══════════ */}
          <div
            className={`transition-all duration-400 ${
              stage === 1
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 hidden"
            }`}
          >
            {/* File pill */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-ink">
                <Music size={14} className="text-gold" />
                <span className="truncate max-w-[200px]">{fileName}</span>
                <button
                  onClick={resetAll}
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {scanning ? (
              <div className="text-center py-16 animate-fade-in">
                <p className="text-sm font-medium text-ink mb-4">Analyzing your audio...</p>
                <div className="max-w-xs mx-auto h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full animate-scan-bar" />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-semibold text-ink text-center mb-2">
                  What do you want to transcribe?
                </h2>
                <p className="text-sm text-ink-soft text-center mb-8">
                  Our AI detected these instruments in your audio. Select all that apply.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allInstruments.map((inst) => {
                    const Icon = inst.icon;
                    const isSelected = selected.includes(inst.name);
                    return (
                      <button
                        key={inst.name}
                        onClick={() => toggleInstrument(inst.name)}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl min-h-[80px] transition-all duration-200 ${
                          isSelected
                            ? "bg-gold-light border-2 border-gold"
                            : "bg-surface border border-border hover:border-ink-muted"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check size={14} className="text-gold" />
                          </div>
                        )}
                        <Icon size={24} className="text-gold" />
                        <span className="text-sm font-medium text-ink">{inst.name}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm text-ink-soft text-center mt-6">
                  {selected.length} instrument{selected.length !== 1 ? "s" : ""} selected
                </p>

                <button
                  onClick={() => goToStage(2)}
                  disabled={selected.length === 0}
                  className={`w-full mt-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selected.length > 0
                      ? "bg-gold text-white hover:bg-gold-dark"
                      : "bg-border text-ink-muted cursor-not-allowed"
                  }`}
                >
                  Transcribe Selected Instruments →
                </button>
              </div>
            )}
          </div>

          {/* ═══════════ STAGE 2: Processing + Results ═══════════ */}
          <div
            className={`transition-all duration-400 ${
              stage === 2
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 hidden"
            }`}
          >
            {processing ? (
              <ProcessingView procStep={procStep} />
            ) : (
              <ResultsView
                fileName={fileName}
                selected={selected}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
                keyDropdownOpen={keyDropdownOpen}
                setKeyDropdownOpen={setKeyDropdownOpen}
                bpm={bpm}
                setBpm={setBpm}
                resetAll={resetAll}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ── Processing sub-view ── */
const ProcessingView = ({ procStep }: { procStep: number }) => (
  <div className="text-center py-12 animate-fade-in">
    <h2 className="font-heading text-2xl font-semibold text-ink mb-10">
      Transcribing your music...
    </h2>
    <div className="max-w-md mx-auto space-y-0">
      {processingSteps.map((step, i) => {
        const completed = procStep > i;
        const active = procStep === i;
        return (
          <div key={step.label}>
            <div className="flex items-center gap-3 py-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  completed
                    ? "bg-teal text-white"
                    : active
                    ? "bg-teal/20 text-teal"
                    : "bg-surface border border-border text-ink-muted"
                }`}
              >
                {completed ? <Check size={14} /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <div className="flex-1 text-left">
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    completed ? "text-teal" : active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {step.label}
                </span>
                {active && step.duration > 0 && (
                  <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full animate-scan-bar"
                      style={{ animationDuration: `${step.duration}ms` }}
                    />
                  </div>
                )}
              </div>
            </div>
            {i < processingSteps.length - 1 && (
              <div className="ml-3.5 w-px h-3 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

/* ── Results sub-view ── */
interface ResultsViewProps {
  fileName: string;
  selected: string[];
  selectedKey: string;
  setSelectedKey: (k: string) => void;
  keyDropdownOpen: boolean;
  setKeyDropdownOpen: (o: boolean) => void;
  resetAll: () => void;
}

const ResultsView = ({
  fileName,
  selected,
  selectedKey,
  setSelectedKey,
  keyDropdownOpen,
  setKeyDropdownOpen,
  resetAll,
}: ResultsViewProps) => {
  const displayName = fileName.replace(/\.[^/.]+$/, "");

  return (
    <div className="animate-fade-in">
      {/* Success banner */}
      <div className="flex items-center justify-center gap-2 bg-teal text-white rounded-xl py-3 px-4 mb-8">
        <Check size={18} />
        <span className="text-sm font-medium">Your sheet music is ready</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Sheet music preview */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold text-ink mb-4">
            {displayName}
          </h3>
          <SheetMusicSVG />

          {/* Instrument tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selected.map((name) => (
              <span
                key={name}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-gold-light text-gold border border-gold/20"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-ink-muted bg-surface px-2.5 py-1 rounded-full border border-border">
              Key: {selectedKey}
            </span>
            <span className="text-xs text-ink-muted bg-surface px-2.5 py-1 rounded-full border border-border">
              Tempo: 120 BPM
            </span>
          </div>

          {/* Transpose */}
          <div className="relative mt-4">
            <button
              onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-ink hover:bg-surface transition-all duration-200"
            >
              <ArrowUpDown size={14} />
              Transpose key
              <ChevronDown size={14} className={`transition-transform ${keyDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {keyDropdownOpen && (
              <div className="absolute z-20 mt-1 left-0 w-48 bg-surface border border-border rounded-xl shadow-card p-1 max-h-60 overflow-y-auto">
                {allKeys.map((k) => (
                  <button
                    key={k}
                    onClick={() => { setSelectedKey(k); setKeyDropdownOpen(false); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      k === selectedKey
                        ? "bg-gold-light text-gold font-medium"
                        : "text-ink hover:bg-paper"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Export panel */}
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink mb-4">
            Download your files
          </h3>
          <div className="space-y-3">
            {exportOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.name}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl"
                >
                  <div className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-ink">{opt.name}</span>
                      {!opt.free && (
                        <span className="text-[10px] font-bold bg-gold-light text-gold px-1.5 py-0.5 rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">{opt.desc}</p>
                  </div>
                  {opt.free ? (
                    <button className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all duration-200">
                      Download
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1.5 rounded-lg bg-border text-ink-muted text-xs font-medium cursor-not-allowed flex items-center gap-1"
                      title="Upgrade to Pro to unlock"
                    >
                      <Lock size={12} />
                      Download
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={resetAll}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200"
          >
            <RefreshCw size={14} />
            Start a new transcription
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppPage;
