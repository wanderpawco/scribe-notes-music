import { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Mic, Upload, X, Check, Mic2, Music2, Guitar, Keyboard,
  FileText, FileCode, Lock, ChevronDown, RefreshCw, ArrowUpDown, Minus, Plus,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  { label: "Separating stems", duration: 120 },
  { label: "Analyzing pitch and rhythm", duration: 90 },
  { label: "Generating notation", duration: 30 },
];

function estimateProcessingTime(
  fileSizeBytes: number,
  fileType: string,
  stemCount: number
): { minutes: number; label: string } {
  // Estimate audio duration from file size and format
  let bytesPerSecond: number;
  const ext = fileType.toLowerCase();

  if (ext.includes("wav")) {
    bytesPerSecond = 176400; // 44.1kHz, 16-bit stereo
  } else if (ext.includes("flac")) {
    bytesPerSecond = 128000; // ~1MB per 8s average
  } else {
    bytesPerSecond = 24000; // MP3/M4A at ~192kbps average
  }

  const estimatedDurationSecs = fileSizeBytes / bytesPerSecond;
  const estimatedDurationMins = estimatedDurationSecs / 60;

  // Pipeline timing estimates (seconds)
  const separationTime = estimatedDurationMins * 45; // Music.AI
  const transcriptionTime = estimatedDurationMins * 20 * stemCount; // Basic Pitch
  const conversionTime = stemCount * 5; // music21

  const totalSeconds = separationTime + transcriptionTime + conversionTime;
  const totalMinutes = Math.ceil(totalSeconds / 60);

  let label: string;
  if (totalMinutes <= 2) {
    label = "~1–2 minutes";
  } else if (totalMinutes <= 4) {
    label = "~2–4 minutes";
  } else if (totalMinutes <= 7) {
    label = "~4–7 minutes";
  } else if (totalMinutes <= 12) {
    label = "~7–12 minutes";
  } else {
    label = `~${totalMinutes} minutes`;
  }

  return { minutes: totalMinutes, label };
}

const AppPage = () => {
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 1
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  // Stage 2
  const [processing, setProcessing] = useState(true);
  const [procStep, setProcStep] = useState(0);
  const [selectedKey, setSelectedKey] = useState("C Major");
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  /* ── Calculate estimated time when file or instruments change ── */
  useEffect(() => {
    if (!audioFile || selected.length === 0) {
      setEstimatedTime(null);
      return;
    }

    const estimate = estimateProcessingTime(
      audioFile.size,
      audioFile.name,
      selected.length
    );
    setEstimatedTime(estimate.label);
  }, [audioFile, selected]);

  /* ── Stage 2: poll transcription status ── */
  useEffect(() => {
    if (stage !== 2 || !processing || !transcriptionId) return;

    const pollTranscription = async () => {
      const { data, error } = await supabase
        .from("transcriptions")
        .select("status, error_message, music_ai_job_id, basic_pitch_job_ids")
        .eq("id", transcriptionId)
        .single();

      if (error || !data) return;

      console.log("DB Status:", data?.status, "| music_ai_job_id:", data?.music_ai_job_id, "| basic_pitch_job_ids:", JSON.stringify(data?.basic_pitch_job_ids));

      switch (data.status) {
        case "pending":
          setProcStep(0);
          break;
        case "separating":
          setProcStep(1);
          if (data.music_ai_job_id) {
            console.log("Invoked poll-music-ai for:", transcriptionId);
            supabase.functions.invoke("poll-music-ai", {
              body: { transcription_id: transcriptionId },
            }).then(({ data, error }) => {
              if (error) console.error("poll-music-ai error:", error);
              else console.log("poll-music-ai response:", JSON.stringify(data));
            }).catch(console.error);
          }
          break;
        case "transcribing":
          setProcStep(3);
          if (data.basic_pitch_job_ids) {
            console.log("Invoked poll-basic-pitch for:", transcriptionId);
            supabase.functions.invoke("poll-basic-pitch", {
              body: { transcription_id: transcriptionId },
            }).then(({ data, error }) => {
              if (error) console.error("poll-basic-pitch error:", error);
              else console.log("poll-basic-pitch response:", JSON.stringify(data));
            }).catch(console.error);
          }
          break;
        case "completed":
          setProcStep(4);
          setTimeout(() => setProcessing(false), 600);
          return;
        case "failed":
          setTranscriptionError(
            data.error_message || "An unknown error occurred"
          );
          return;
      }
    };

    const interval = setInterval(pollTranscription, 5000);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTranscriptionError(
        "Please sign in to transcribe audio. Click Sign In above."
      );
      setUploading(false);
      return;
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (audioFile.size > MAX_FILE_SIZE) {
      setTranscriptionError("File too large. Maximum file size is 500MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setTranscriptionError(null);

    try {
      // A) Upload audio to Supabase Storage using TUS resumable upload
      const storagePath = `${user.id}/${crypto.randomUUID()}/${audioFile.name}`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get the user's session token for authenticated upload
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session — please sign in again.");
      }

      const tus = await import("tus-js-client");

      await new Promise<void>((resolve, reject) => {
        const tusUpload = new tus.Upload(audioFile, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            "x-upsert": "true",
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "audio-uploads",
            objectName: storagePath,
            contentType: audioFile.type || "audio/mpeg",
            cacheControl: "3600",
          },
          chunkSize: 6 * 1024 * 1024, // 6MB chunks
          onError: (error) => {
            reject(new Error(`Upload failed: ${error.message}`));
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percent = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(percent);
          },
          onSuccess: () => {
            resolve();
          },
        });

        tusUpload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            tusUpload.resumeFromPreviousUpload(previousUploads[0]);
          }
          tusUpload.start();
        });
      });

      // Get signed URL (bucket is private)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("audio-uploads")
        .createSignedUrl(storagePath, 3600);

      if (signedError || !signedData) {
        throw new Error("Failed to create signed URL for audio file");
      }

      const audioUrl = signedData.signedUrl;

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
          user_id: user?.id ?? null,
        })
        .select("id")
        .single();

      if (insertError || !insertData) throw new Error(`Insert failed: ${insertError?.message}`);

      const newId = insertData.id;
      setTranscriptionId(newId);

      // C) Call edge function (fire and forget — it runs async)
      supabase.functions.invoke("start-transcription", {
        body: {
          transcription_id: newId,
          audio_url: audioUrl,
          selected_instruments: selected,
        },
      }).catch((err) => console.error("Start transcription error:", err));

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
    setEstimatedTime(null);
    setScanning(true);
    setProcessing(true);
    setProcStep(0);
    setSelectedKey("C Major");
    setBpm(120);
    setUploading(false);
    setUploadProgress(0);
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
                MP3, WAV, FLAC, M4A — up to 500MB
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
              Free account required — sign up takes 30 seconds
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

                <div className="text-center mt-6">
                  <p className="text-sm text-ink-soft">
                    {selected.length} instrument{selected.length !== 1 ? "s" : ""} selected
                  </p>
                  {estimatedTime && (
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 
                    bg-surface border border-border rounded-full">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="#9a9ab0" strokeWidth="1.2"/>
                        <path d="M6 3.5V6L7.5 7.5" stroke="#9a9ab0" strokeWidth="1.2" 
                        strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs text-ink-muted">
                        Estimated processing time: <span className="text-ink font-medium">
                        {estimatedTime}</span>
                      </span>
                    </div>
                  )}
                </div>

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
                    <div className="flex flex-col items-center w-full gap-1">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>
                          {uploadProgress < 100
                            ? `Uploading... ${uploadProgress}%`
                            : "Processing..."}
                        </span>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
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
                <ProcessingView procStep={procStep} estimatedTime={estimatedTime} />
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
interface ProcessingViewProps {
  procStep: number;
  estimatedTime: string | null;
}

const ProcessingView = ({ procStep, estimatedTime }: ProcessingViewProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const stepStartRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    stepStartRef.current = 0;
    setStepProgress(0);
  }, [procStep]);

  useEffect(() => {
    const currentStep = processingSteps[procStep];
    if (!currentStep || currentStep.duration === 0) return;

    stepStartRef.current = (stepStartRef.current || 0) + 1;
    const pct = Math.min(
      95,
      Math.round((stepStartRef.current / currentStep.duration) * 95)
    );
    setStepProgress(pct);
  }, [elapsed, procStep]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const stepMessages: Record<number, string> = {
    0: "Preparing your file...",
    1: "Separating stems — this takes 1–3 minutes for longer songs",
    2: "Stem separation complete — starting transcription",
    3: "Transcribing notation — analyzing pitch and rhythm",
    4: "Finalizing your sheet music...",
  };

  return (
    <div className="text-center py-12 animate-fade-in">
      <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
        Transcribing your music...
      </h2>

      <div className="mb-10">
        <p className="text-sm text-ink-muted">
          {stepMessages[procStep] || "Processing..."}
        </p>
        {estimatedTime && procStep <= 1 && (
          <p className="text-xs text-ink-muted mt-1">
            Expected total time: <span className="font-medium">{estimatedTime}</span>
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-0">
        {processingSteps.map((step, i) => {
          const completed = procStep > i;
          const active = procStep === i;
          return (
            <div key={step.label}>
              <div className="flex items-center gap-3 py-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center 
                  shrink-0 transition-colors duration-500 ${
                    completed
                      ? "bg-teal text-white"
                      : active
                      ? "bg-teal/20 text-teal"
                      : "bg-surface border border-border text-ink-muted"
                  }`}
                >
                  {completed
                    ? <Check size={14} />
                    : active
                    ? <Loader2 size={14} className="animate-spin" />
                    : <span className="text-xs">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        completed
                          ? "text-teal"
                          : active
                          ? "text-ink"
                          : "text-ink-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                    {active && (
                      <span className="text-xs text-ink-muted font-mono">
                        {formatTime(elapsed)}
                      </span>
                    )}
                  </div>
                  {active && step.duration > 0 && (
                    <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-1000"
                        style={{ width: `${stepProgress}%` }}
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

      <p className="text-xs text-ink-muted mt-8">
        Total elapsed: {formatTime(elapsed)}
      </p>
    </div>
  );
};

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
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{activeInstrumentName}</p>
        <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} />
      </div>

      {/* Success banner */}
      <div className="flex items-center justify-center gap-2 bg-teal text-white rounded-xl py-3 px-4 mb-8">
        <Check size={18} />
        <span className="text-sm font-medium">Your sheet music is ready</span>
      </div>

      {(outputs.length === 0 || !activeMusicXml) && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 font-mono text-xs space-y-1">
          <p>Outputs count: {outputs.length}</p>
          {outputs.map((o, i) => (
            <p key={i}>{o.instrument} | {o.format} | file_path length: {o.file_path.length} chars</p>
          ))}
          <p>Active instrument: {activeInstrumentName}</p>
          <p>Active MusicXML found: {activeMusicXml ? "YES" : "NO"}</p>
        </div>
      )}

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
