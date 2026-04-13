import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music, Mic, Upload, X, Check, Mic2, Music2, Guitar, Keyboard, Piano, Wind,
  FileText, FileCode, Lock, ChevronDown, RefreshCw,
  Loader2, Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SheetMusicRenderer from "@/components/SheetMusicRenderer";
import PdfButtonGroup from "@/components/PdfButtonGroup";
import { supabase } from "@/integrations/supabase/client";
import { getTransposeSemitones } from "@/lib/musicKeys";

// Beta banner component
const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("betaBannerDismissed") === "true";
  });

  const handleDismiss = () => {
    sessionStorage.setItem("betaBannerDismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-[#0f0f1a] text-gold text-sm py-2 px-4 flex items-center justify-center relative">
      <span className="text-center">
        🎵 ScribeNoter is in Beta — transcription quality is actively improving. We'd love your{" "}
        <a href="mailto:devops@scribenoter.com" className="underline hover:text-gold-light transition-colors">
          feedback
        </a>.
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-4 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss beta banner"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const stepLabels = ["Upload", "Select Instrument", "Get Results"];

const allInstruments = [
  { icon: Mic2, name: "Lead Vocals" },
  { icon: Mic, name: "Backing Vocals" },
  { icon: Music, name: "Bass" },
  { icon: Piano, name: "Piano" },
  { icon: Keyboard, name: "Organ" },
  { icon: Music2, name: "Strings" },
  { icon: Guitar, name: "Electric Guitar" },
  { icon: Guitar, name: "Acoustic Guitar" },
  { icon: Music2, name: "Drums" },
  { icon: Music2, name: "Trumpet" },
  { icon: Music2, name: "French Horn" },
  { icon: Music2, name: "Trombone" },
  { icon: Music2, name: "Tuba" },
  { icon: Music2, name: "Flugelhorn" },
  { icon: Music2, name: "Baritone/Euphonium" },
  { icon: Wind, name: "Flute" },
  { icon: Wind, name: "Oboe" },
  { icon: Wind, name: "Clarinet" },
  { icon: Wind, name: "Alto Saxophone" },
  { icon: Wind, name: "Tenor Saxophone" },
  { icon: Wind, name: "Soprano Saxophone" },
  { icon: Wind, name: "Bassoon" },
];

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
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxRecordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stage 1
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

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

      switch (data.status) {
        case "pending":
          setProcStep(0);
          break;
        case "separating":
          setProcStep(0);
          if (data.music_ai_job_id) {
            supabase.functions.invoke("poll-music-ai", {
              body: { transcription_id: transcriptionId },
            }).catch(() => {});
          }
          break;
        case "transcribing":
          setProcStep(1);
          if (data.basic_pitch_job_ids) {
            supabase.functions.invoke("poll-basic-pitch", {
              body: { transcription_id: transcriptionId },
            }).catch(() => {});
          }
          break;
        case "completed":
          setProcStep(3);
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
      prev.includes(name) ? [] : [name]
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
          song_title: songTitle.trim() || audioFile.name.replace(/\.[^/.]+$/, ""),
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
      }).catch(() => {});

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg",
      });

      recordingChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const extension = mimeType.includes("ogg") ? "ogg" : "webm";
        const fileName = `recording_${Date.now()}.${extension}`;
        const file = new File([blob], fileName, { type: mimeType });

        setRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current);

        handleFile(file);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      // Auto-stop after 10 minutes
      maxRecordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      }, 10 * 60 * 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to record audio. Please allow microphone access in your browser and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) mediaRecorderRef.current.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current);
  };

  const resetAll = () => {
    setStage(0);
    setFileName("");
    setAudioFile(null);
    setSelected([]);
    setEstimatedTime(null);
    setSongTitle("");
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
    setRecording(false);
    setRecordingTime(0);
    if (mediaRecorderRef.current && recording) mediaRecorderRef.current.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeStep = stage === 0 ? 0 : stage === 1 ? 1 : 2;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05050F' }}>
      <BetaBanner />
      <Navbar />

      <main className="flex-1 pt-32 pb-16 px-6">
        <div className={`mx-auto ${stage === 2 && !processing ? "max-w-[1400px]" : "max-w-[800px]"}`}>
          {/* Step indicator — hidden on results screen */}
          {stage < 2 && (
          <div className="flex items-center justify-center gap-0 mb-12">
            {stepLabels.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-colors duration-300 ${
                      i <= activeStep
                        ? "bg-gold text-white"
                        : stage === 0
                        ? "border border-white/30 text-white/70"
                        : "border border-white/15 text-white/50"
                    }`}
                  >
                    {i < activeStep ? <Check size={18} /> : i + 1}
                  </div>
                  <span
                    className={`text-sm mt-1.5 font-semibold transition-colors duration-300 ${
                      i <= activeStep 
                        ? "text-gold" 
                        : stage === 0
                        ? "text-white/70"
                        : "text-white/50"
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
                      i < activeStep 
                        ? "bg-gold" 
                        : stage === 0
                        ? "bg-white/15"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          )}

{/* ═══════════ STAGE 0: Upload ═══════════ */}
          <div
            className={`transition-all duration-400 ${
              stage === 0
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 hidden"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.wav,.flac,.m4a"
              className="hidden"
              onChange={onFileInput}
            />

            {/* ── MAIN DROP ZONE ── */}
            <div
              className={`relative rounded-2xl overflow-hidden bg-[#080810] border-[3px] border-gold animate-border-glow animate-fade-up cursor-pointer transition-all duration-300 ${
                dragOver ? "scale-[1.01]" : "hover:border-gold-light"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              
              {/* Animated waveform — bright and visible */}
              <div className="absolute inset-0 flex items-center justify-center gap-[4px] opacity-[0.15] pointer-events-none">
                {[...Array(60)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[4px] rounded-full bg-gold"
                    style={{
                      animation: `wave${(i % 5) + 1} ${1.2 + (i % 6) * 0.25}s ease-in-out infinite`,
                      animationDelay: `${i * 0.04}s`,
                    }}
                  />
                ))}
              </div>

              {/* Upload content — sits above waveform */}
              <div
                className="relative z-10 flex flex-col items-center justify-center min-h-[360px] p-10"
              >
                
                {/* Upload icon */}
                <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-8 animate-glow-pulse">
                  <Upload size={36} className="text-gold" />
                </div>

                {/* Main heading — BIG and white */}
                <h2 className="font-heading text-5xl md:text-6xl font-bold mb-4 text-center text-white animate-fade-up-delay-1">
                  Drop your audio file here
                </h2>

                {/* Subtitle */}
                <p className="text-lg text-white/80 mb-10 text-center animate-fade-up-delay-2">
                  MP3, WAV, FLAC, M4A — up to 500MB
                </p>

                {/* Browse button */}
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    fileInputRef.current?.click(); 
                  }}
                  style={{
                    background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
                    color: "#080810",
                    fontSize: "1.1rem",
                    fontWeight: "800",
                    padding: "16px 48px",
                    borderRadius: "14px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "none",
                    letterSpacing: "0.03em",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLButtonElement).style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                  className="animate-fade-up-delay-3"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="flex items-center gap-4 my-8 animate-fade-up-delay-2">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-base text-white/60 font-medium">or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* ── RECORD BUTTON ── */}
            {!recording ? (
              <button
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-4 px-6 py-5 rounded-2xl text-base font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-fade-up-delay-3"
                style={{ 
                  background: "#c8a96e",
                  color: "#080810",
                  boxShadow: "none",
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.background = "#e8c98e";
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.background = "#c8a96e";
                }}
              >
                <div className="w-10 h-10 rounded-full border-2 border-[#080810]/20 flex items-center justify-center bg-[#080810]/10">
                  <Mic size={20} className="text-[#080810]" />
                </div>
                Record live audio
              </button>
            ) : (
              <div className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 border-red-500 bg-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-semibold text-red-400 text-base">
                    Recording
                  </span>
                  <span className="text-red-400/70 font-mono text-sm">
                    {Math.floor(recordingTime / 60).toString()
                      .padStart(2, "0")}:
                    {(recordingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-6 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all"
                >
                  Stop & Transcribe
                </button>
              </div>
            )}

            {/* ── FORMAT BADGES ── */}
            <div className="flex flex-col items-center mt-8 animate-fade-up-delay-3">
              <p className="text-sm text-white/70 font-medium mb-3 tracking-wide uppercase">
                Supported formats:
              </p>
              <div className="flex items-center justify-center gap-3">
                {["MP3", "WAV", "FLAC", "M4A"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-5 py-2 rounded-full text-sm font-bold tracking-wider text-gold border border-gold/40 bg-gold/5"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* ── FOOTER NOTE ── */}
            <p className="text-center text-base text-white/65 mt-8 font-medium">
              Free account required — sign up takes 30 seconds
            </p>
          </div>

          {/* ═══════════ STAGE 1: Select Instrument ═══════════ */}
          <div
            className={`transition-all duration-400 ${
              stage === 1
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 hidden"
            }`}
          >
            {/* File pill */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F0E8' }}>
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
                <p className="text-sm font-medium mb-4" style={{ color: '#F5F0E8' }}>Analyzing your audio...</p>
                <div className="max-w-xs mx-auto h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full bg-teal rounded-full animate-scan-bar" />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-semibold text-center mb-2" style={{ color: '#F5F0E8' }}>
                  What do you want to transcribe?
                </h2>
                <p className="text-sm text-center mb-8" style={{ color: 'rgba(245,240,232,0.6)' }}>
                  Select an instrument to transcribe.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allInstruments.map((inst) => {
                    const Icon = inst.icon;
                    const isSelected = selected.includes(inst.name);
                    return (
                      <button
                        key={inst.name}
                        onClick={() => toggleInstrument(inst.name)}
                        className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl min-h-[100px] transition-all duration-200 ${
                          isSelected
                            ? "border-2 border-gold"
                            : "hover:border-gold/30"
                        }`}
                        style={{ background: isSelected ? 'rgba(184,148,42,0.15)' : 'rgba(13,13,26,0.7)', border: isSelected ? undefined : '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-gold flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          </div>
                        )}
                        <Icon size={32} className="text-gold" />
                        <span className="text-base font-semibold" style={{ color: '#F5F0E8' }}>{inst.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    {selected.length === 0 ? "No instrument selected" : `${selected[0]} selected`}
                  </p>
                {estimatedTime && (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 
                  bg-teal/10 border border-teal/30 rounded-full">
                    <Clock size={12} className="text-teal" />
                    <span className="text-xs text-teal">
                      Estimated processing time: 
                      <span className="font-semibold text-teal">
                        {estimatedTime}
                      </span>
                    </span>
                  </div>
                )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#F5F0E8' }}>
                    Song Title
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Stairway to Heaven"
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    style={{ background: 'rgba(5,5,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }}
                    maxLength={100}
                  />
                  <p className="text-sm font-medium mt-1" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    This will appear as the title on your sheet music
                  </p>
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="rights-confirm"
                    checked={rightsConfirmed}
                    onChange={(e) => setRightsConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-gold focus:ring-gold/50 focus:ring-2"
                  />
                  <label htmlFor="rights-confirm" className="text-sm leading-relaxed cursor-pointer" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    I confirm that I own or have the rights to transcribe this audio recording.
                  </label>
                </div>

                {transcriptionError && (
                  <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                    {transcriptionError}
                  </div>
                )}

                <button
                  onClick={handleTranscribe}
                  disabled={selected.length === 0 || songTitle.trim() === '' || !rightsConfirmed || uploading}
                  className={`w-full mt-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    uploading
                      ? "bg-gold-dark text-white cursor-wait"
                      : selected.length > 0 && songTitle.trim() !== '' && rightsConfirmed
                      ? "bg-gold text-white hover:bg-gold-dark"
                      : "bg-border text-ink-muted cursor-not-allowed"
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Transcribe Selected Instrument →"
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
                songTitle={songTitle}
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
  const [stepElapsed, setStepElapsed] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
      setStepElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStepElapsed(0);
    setStepProgress(0);
  }, [procStep]);

  useEffect(() => {
    const currentStep = processingSteps[procStep];
    if (!currentStep || currentStep.duration <= 0) return;
    const pct = Math.min(95, Math.round((stepElapsed / currentStep.duration) * 95));
    setStepProgress(pct);
  }, [stepElapsed]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const stepMessages: Record<number, string> = {
    0: "Separating stems — this takes 1–3 minutes for longer songs",
    1: "Transcribing notation — analyzing pitch and rhythm",
    2: "Generating your sheet music...",
    3: "Finalizing your sheet music...",
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
        {estimatedTime && procStep < 3 && (
          <div className="inline-flex items-center gap-1.5 
          mt-2 px-3 py-1.5 bg-teal/10 border border-teal/30 
          rounded-full">
            <Clock size={12} className="text-teal" />
            <span className="text-xs text-teal">
              Estimated total time: 
              <span className="font-semibold"> {estimatedTime}</span>
            </span>
          </div>
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
  songTitle: string;
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
  songTitle,
}: ResultsViewProps) => {
  const navigate = useNavigate();
  const displayName = songTitle || fileName.replace(/\.[^/.]+$/, "");
  const [activeInstrument, setActiveInstrument] = useState(0);
  const [appliedKey, setAppliedKey] = useState(selectedKey);

  const activeInstrumentName = selected[activeInstrument];
  const activeXmlOutput = outputs.find(
    (o) => o.instrument === activeInstrumentName && o.format === "musicxml"
  );
  const activeMusicXml = activeXmlOutput?.file_path ?? null;

const handleDownload = (
  output: { instrument: string; format: string; file_path: string }
) => {
  const base64Data = output.file_path;
  const safeName = displayName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const instName = output.instrument
    .toLowerCase()
    .replace(/\s+/g, "_");
  try {
    if (output.format === "musicxml") {
      // MusicXML is text — decode base64 to string then
      // save as UTF-8 text blob
      const xmlString = atob(base64Data);
      const blob = new Blob([xmlString], {
        type: "application/vnd.recordare.musicxml+xml",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_${instName}.musicxml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoke so browser can start the download
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return;
    }
    if (output.format === "midi") {
      // MIDI is binary — decode base64 to byte array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_${instName}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoke so browser can start the download
      // and so repeated clicks still work
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return;
    }
  } catch (err) {
    console.error("Download failed:", err);
    alert("Download failed — please try again.");
  }
};

  return (
    <div className="animate-fade-in space-y-4">
      {/* ── HEADING ── */}
      <div className="mb-4">
        <h2 className="font-heading text-[2rem] font-bold text-ink">{displayName}</h2>
        <p className="text-[14px] text-ink-muted mt-1">
          {activeInstrumentName}  •  {selectedKey}  •  {bpm} BPM
        </p>
      </div>

      {/* ── Free Plan badge ── */}
      <div className="flex justify-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase" style={{ color: '#c8a96e', border: '1px solid rgba(200,169,110,0.5)', background: 'transparent' }}>
          Free Plan
        </span>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="rounded-2xl mb-4 shadow-lg" style={{ background: '#0f0f1a', border: '1px solid rgba(200,169,110,0.3)', overflow: 'visible' }}>
        {/* TOP ROW — centered instrument tabs + right-aligned New Transcription */}
        <div className="relative flex items-center justify-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {selected.map((name, i) => (
              <button
                key={name}
                onClick={() => setActiveInstrument(i)}
                className="px-5 py-2 text-[14px] font-semibold whitespace-nowrap transition-all rounded-full"
                style={i === activeInstrument
                  ? { background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#0f0f1a', border: '1px solid #c8a96e', minHeight: '40px' }
                  : { background: '#ffffff', color: '#0f0f1a', border: '1px solid rgba(200,169,110,0.8)', minHeight: '40px' }
                }
              >
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={resetAll}
            className="absolute right-5 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', height: '40px' }}
          >
            <RefreshCw size={14} />
            New Transcription
          </button>
        </div>

        {/* BOTTOM ROW — Key left, downloads right */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 flex-wrap" style={{ background: 'rgba(255,255,255,0.03)', overflow: 'visible' }}>
          {/* Left: Key transpose */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold" style={{ color: '#c8a96e' }}>Key</span>
            <div className="relative">
              <button
                onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,169,110,0.3)', color: '#e8e8f0', height: '40px' }}
              >
                {selectedKey}
                <ChevronDown size={14} className={`transition-transform ${keyDropdownOpen ? "rotate-180" : ""}`} style={{ color: '#c8a96e' }} />
              </button>
              {keyDropdownOpen && (
                <div className="absolute z-50 mt-1 left-0 w-44 rounded-xl shadow-lg p-1 max-h-60 overflow-y-auto" style={{ background: '#1a1a2e', border: '1px solid rgba(200,169,110,0.3)' }}>
                  {allKeys.map((k) => (
                    <button
                      key={k}
                      onClick={() => { setSelectedKey(k); setKeyDropdownOpen(false); }}
                      className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors"
                      style={k === selectedKey
                        ? { background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', fontWeight: 600 }
                        : { color: '#e8e8f0' }
                      }
                      onMouseEnter={e => { if (k !== selectedKey) (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (k !== selectedKey) (e.target as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedKey !== appliedKey && (
              <button
                onClick={() => setAppliedKey(selectedKey)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-[13px] font-bold transition-all hover:brightness-125"
                style={{ border: '1px solid #c8a96e', color: '#c8a96e', background: 'transparent', height: '40px' }}
              >
                Apply
              </button>
            )}
          </div>
          {/* Right: Download buttons — gold gradient */}
          <div className="flex items-center gap-2">
            <PdfButtonGroup displayName={displayName} activeInstrumentName={activeInstrumentName} selectedKey={appliedKey} bpm={bpm} />

            {/* MIDI */}
            {outputs.some(o => o.format === "midi") ? (
              <button
                onClick={() => outputs.filter(o => o.format === "midi").forEach(o => handleDownload(o))}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', height: '40px' }}
              >
                <Music size={14} />
                MIDI File
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                title="Available on Pro plan"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', height: '40px' }}
              >
                <Lock size={13} />
                MIDI
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(200,169,110,0.2)', color: '#c8a96e' }}>PRO</span>
              </button>
            )}

            {/* MusicXML */}
            {outputs.some(o => o.format === "musicxml") ? (
              <button
                onClick={() => outputs.filter(o => o.format === "musicxml").forEach(o => handleDownload(o))}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', height: '40px' }}
              >
                <FileCode size={14} />
                MusicXML
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                title="Available on Pro plan"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', height: '40px' }}
              >
                <Lock size={13} />
                MusicXML
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(200,169,110,0.2)', color: '#c8a96e' }}>PRO</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SHEET MUSIC — FULL WIDTH ── */}
      <div className="w-full">
        {/* Hidden print area */}
        <div id="print-sheet" className="hidden">
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", marginBottom: "4px" }}>
            {displayName}
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
            {activeInstrumentName}
          </p>
          <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} transposeSemitones={getTransposeSemitones("C Major", appliedKey)} />
        </div>

        <div id="osmd-render-container">
          <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} transposeSemitones={getTransposeSemitones("C Major", appliedKey)} />
        </div>

      </div>
    </div>
  );
};

export default AppPage;
