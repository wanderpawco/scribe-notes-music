import { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Mic, Upload, X, Check, Mic2, Music2, Guitar, Keyboard,
  FileText, FileCode, Lock, ChevronDown, RefreshCw, ArrowUpDown, Minus, Plus,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SheetMusicSVG from "@/components/SheetMusicSVG";
import SheetMusicRenderer from "@/components/SheetMusicRenderer";
import { supabase } from "@/integrations/supabase/client";

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
  { icon: FileText, name: "PDF Sheet Music", desc: "Print-ready notation", tier: "free" as const },
  { icon: Music, name: "MIDI File", desc: "For any DAW or notation software", tier: "pro" as const },
  { icon: FileCode, name: "MusicXML", desc: "For Sibelius, Finale, MuseScore", tier: "pro" as const },
  { icon: Guitar, name: "Guitar Pro", desc: "Tabs and notation for guitarists", tier: "studio" as const },
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
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
  const [uploading, setUploading] = useState(false);

  // Transcription tracking
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [transcriptionOutputs, setTranscriptionOutputs] = useState<Array<{
    instrument: string;
    format: string;
    file_path: string;
  }>>([]);

  /* ── File selection handler ── */
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setAudioFile(file);
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

  /* ── Stage 2: poll transcription status ── */
  useEffect(() => {
    if (stage !== 2 || !processing || !transcriptionId) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("transcriptions")
        .select("status, error_message")
        .eq("id", transcriptionId)
        .single();

      if (error) {
        console.error("Poll error:", error);
        return;
      }

      if (!data) return;

      switch (data.status) {
        case "pending":
          setProcStep(0);
          break;
        case "separating":
          setProcStep(1);
          break;
        case "transcribing":
          setProcStep(3);
          break;
        case "completed":
          setProcStep(4);
          setTimeout(() => setProcessing(false), 600);
          clearInterval(interval);
          break;
        case "failed":
          setTranscriptionError(data.error_message || "An unknown error occurred");
          clearInterval(interval);
          break;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [stage, processing, transcriptionId]);

  /* ── Load outputs when processing completes ── */
  useEffect(() => {
    if (stage !== 2 || processing || !transcriptionId) return;

    const loadOutputs = async () => {
      const { data, error } = await supabase
        .from("transcription_outputs")
        .select("instrument, format, file_path")
        .eq("transcription_id", transcriptionId);

      if (!error && data) {
        setTranscriptionOutputs(data);
      }
    };
    loadOutputs();
  }, [stage, processing, transcriptionId]);

  const toggleInstrument = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  /* ── Transcribe handler ── */
  const handleTranscribe = async () => {
    if (!audioFile || selected.length === 0) return;

    setUploading(true);
    setTranscriptionError(null);

    try {
      // A) Upload audio to Supabase Storage
      const fileId = crypto.randomUUID();
      const storagePath = `${fileId}/${audioFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-uploads")
        .upload(storagePath, audioFile);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("audio-uploads")
        .getPublicUrl(storagePath);

      const audioUrl = urlData.publicUrl;

      // B) Insert transcription row
      const { data: insertData, error: insertError } = await supabase
        .from("transcriptions")
        .insert({
          file_name: audioFile.name,
          file_path: storagePath,
          status: "pending",
          selected_instruments: selected,
          detected_key: "C Major",
          detected_bpm: 120,
        })
        .select("id")
        .single();

      if (insertError || !insertData) throw new Error(`Insert failed: ${insertError?.message}`);

      const newId = insertData.id;
      setTranscriptionId(newId);

      // C) Call edge function (fire and forget — it runs async)
      supabase.functions.invoke("process-transcription", {
        body: {
          transcription_id: newId,
          audio_url: audioUrl,
          selected_instruments: selected,
        },
      }).catch((err) => console.error("Edge function invoke error:", err));

      // D) Advance to Stage 2
      setUploading(false);
      setStage(2);
      setProcessing(true);
      setProcStep(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setTranscriptionError(msg);
      setUploading(false);
    }
  };

  const resetAll = () => {
    setStage(0);
    setFileName("");
    setAudioFile(null);
    setSelected([]);
    setScanning(true);
    setProcessing(true);
    setProcStep(0);
    setSelectedKey("C Major");
    setBpm(120);
    setUploading(false);
    setTranscriptionId(null);
    setTranscriptionError(null);
    setTranscriptionOutputs([]);
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

                {transcriptionError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {transcriptionError}
                  </div>
                )}

                <button
                  onClick={handleTranscribe}
                  disabled={selected.length === 0 || uploading}
                  className={`w-full mt-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    selected.length > 0 && !uploading
                      ? "bg-gold text-white hover:bg-gold-dark"
                      : "bg-border text-ink-muted cursor-not-allowed"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Transcribe Selected Instruments →"
                  )}
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
              transcriptionError ? (
                <div className="text-center py-12 animate-fade-in">
                  <h2 className="font-heading text-2xl font-semibold text-ink mb-4">
                    Transcription Failed
                  </h2>
                  <p className="text-sm text-ink-soft mb-6 max-w-md mx-auto">
                    {transcriptionError}
                  </p>
                  <button
                    onClick={resetAll}
                    className="px-6 py-3 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all duration-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <ProcessingView procStep={procStep} />
              )
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
                outputs={transcriptionOutputs}
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
                {active && (
                  <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full animate-scan-bar" />
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
  bpm: number;
  setBpm: (b: number) => void;
  resetAll: () => void;
  outputs: Array<{ instrument: string; format: string; file_path: string }>;
}

const ResultsView = ({
  fileName,
  selected,
  selectedKey,
  setSelectedKey,
  keyDropdownOpen,
  setKeyDropdownOpen,
  bpm,
  setBpm,
  resetAll,
  outputs,
}: ResultsViewProps) => {
  const displayName = fileName.replace(/\.[^/.]+$/, "");
  const [activeInstrument, setActiveInstrument] = useState(0);

  const activeInstrumentName = selected[activeInstrument];
  const activeXmlOutput = outputs.find(
    (o) => o.instrument === activeInstrumentName && o.format === "musicxml"
  );
  const activeMusicXml = activeXmlOutput?.file_path ?? null;

  const handleDownload = (output: { instrument: string; format: string; file_path: string }) => {
    const base64Data = output.file_path;
    let mimeType: string;
    let extension: string;

    if (output.format === "midi") {
      mimeType = "audio/midi";
      extension = "mid";
    } else {
      mimeType = "application/vnd.recordare.musicxml+xml";
      extension = "musicxml";
    }

    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${displayName}_${output.instrument.toLowerCase().replace(/\s+/g, "_")}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hidden printable sheet */}
      <div id="print-sheet" className="hidden">
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", marginBottom: "4px" }}>{displayName}</h1>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{selected[activeInstrument]}</p>
        <SheetMusicSVG />
      </div>

      {/* Success banner */}
      <div className="flex items-center justify-center gap-2 bg-teal text-white rounded-xl py-3 px-4 mb-8">
        <Check size={18} />
        <span className="text-sm font-medium">Your sheet music is ready</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Sheet music preview */}
        <div className="bg-white border border-border rounded-xl p-6">
          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-ink">{displayName}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 mb-4">
            <Music size={12} className="text-ink-soft" />
            <span className="text-sm text-ink-soft">{selected[activeInstrument]}</span>
          </div>

          {/* Stem tabs */}
          {selected.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
              {selected.map((name, i) => (
                <button
                  key={name}
                  onClick={() => setActiveInstrument(i)}
                  className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all duration-200 ${
                    i === activeInstrument
                      ? "bg-gold text-white border-gold font-medium"
                      : "bg-surface text-ink-soft border-border hover:border-ink-muted"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <span className="px-3 py-1.5 text-xs rounded-full bg-gold text-white border border-gold font-medium">
                {selected[0]}
              </span>
            </div>
          )}

          <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} />


          {/* ── ORIGINAL RECORDING ── */}
          <div className="border-t border-border mt-4 pt-4">
            <span className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
              Original Recording
            </span>
            <div className="flex items-center bg-paper border border-border rounded-lg px-4 py-3 mt-2">
              <div>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Key</span>
                <span className="text-sm font-medium text-ink">C Major</span>
              </div>
              <div className="w-px bg-border self-stretch mx-4" />
              <div>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider block">BPM</span>
                <span className="text-sm font-medium text-ink">120</span>
              </div>
            </div>
          </div>

          {/* ── ADJUSTMENTS ── */}
          <div className="border-t border-border mt-4 pt-4">
            <span className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">
              Adjustments
            </span>
            <div className="flex gap-2 mt-2">
              {/* Transpose */}
              <div className="relative">
                <button
                  onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-ink hover:bg-surface transition-all duration-200 h-10"
                >
                  <ArrowUpDown size={14} />
                  {selectedKey}
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

              {/* BPM control */}
              <div className="inline-flex items-center border border-border rounded-lg h-10">
                <button
                  onClick={() => setBpm(Math.max(40, bpm - 5))}
                  className="px-2 text-ink-soft hover:text-ink transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium text-ink min-w-[36px] text-center">{bpm}</span>
                <button
                  onClick={() => setBpm(Math.min(240, bpm + 5))}
                  className="px-2 text-ink-soft hover:text-ink transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-[10px] text-ink-muted self-center ml-1">BPM</span>
            </div>
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
              // Check if we have real outputs for this format
              const formatKey = opt.name === "MIDI File" ? "midi" : opt.name === "MusicXML" ? "musicxml" : null;
              const hasOutput = formatKey && outputs.some((o) => o.format === formatKey);

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
                      {opt.tier === "pro" && (
                        <span className="text-[10px] font-bold bg-gold-light text-gold px-1.5 py-0.5 rounded">
                          Pro
                        </span>
                      )}
                      {opt.tier === "studio" && (
                        <span className="text-[10px] font-bold bg-ink text-paper px-1.5 py-0.5 rounded">
                          Studio
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">{opt.desc}</p>
                  </div>
                  {opt.tier === "free" ? (
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all duration-200"
                      title="Download as PDF"
                    >
                      Download
                    </button>
                  ) : hasOutput ? (
                    <button
                      onClick={() => {
                        const matchingOutputs = outputs.filter((o) => o.format === formatKey);
                        matchingOutputs.forEach((o) => handleDownload(o));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all duration-200"
                    >
                      Download
                    </button>
                  ) : opt.tier === "pro" ? (
                    <button
                      className="px-3 py-1.5 rounded-lg bg-border text-ink-muted text-xs font-medium cursor-not-allowed flex items-center gap-1"
                      title="Upgrade to Pro to unlock"
                    >
                      <Lock size={12} />
                      Download
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1.5 rounded-lg bg-border text-ink-muted text-xs font-medium cursor-not-allowed flex items-center gap-1"
                      title="Upgrade to Studio to unlock"
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
