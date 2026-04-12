import { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Mic, Upload, X, Check, Mic2, Music2, Guitar, Keyboard,
  FileText, FileCode, Lock, ChevronDown, RefreshCw, ArrowUpDown, Minus, Plus,
  Loader2, Clock,
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

      switch (data.status) {
        case "pending":
          setProcStep(0);
          break;
        case "separating":
          setProcStep(1);
          if (data.music_ai_job_id) {
            supabase.functions.invoke("poll-music-ai", {
              body: { transcription_id: transcriptionId },
            }).catch(() => {});
          }
          break;
        case "transcribing":
          setProcStep(3);
          if (data.basic_pitch_job_ids) {
            supabase.functions.invoke("poll-basic-pitch", {
              body: { transcription_id: transcriptionId },
            }).catch(() => {});
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
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className={`mx-auto ${stage === 2 && !processing ? "max-w-[1400px]" : "max-w-[800px]"}`}>
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

            {!recording ? (
              <button
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-ink text-sm font-medium hover:bg-surface transition-all duration-200"
              >
                <Mic size={16} />
                Record live audio
              </button>
            ) : (
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-red-400 bg-red-50 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-medium text-red-700">Recording...</span>
                  <span className="text-red-500 font-mono text-xs">
                    {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:
                    {(recordingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all"
                >
                  Stop & Transcribe
                </button>
              </div>
            )}

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
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Song Title
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Stairway to Heaven"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    maxLength={100}
                  />
                  <p className="text-xs text-ink-muted mt-1">
                    This will appear as the title on your sheet music
                  </p>
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
                    uploading
                      ? "bg-gold-dark text-white cursor-wait"
                      : selected.length > 0
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
                        <div className="w-full h-2 bg-ink/20 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-teal rounded-full transition-all duration-300"
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
        {estimatedTime && procStep < 4 && (
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
  const displayName = songTitle || fileName.replace(/\.[^/.]+$/, "");
  const [activeInstrument, setActiveInstrument] = useState(0);

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
      {/* ── TITLE ── */}
      <h2 className="font-heading text-xl font-semibold text-ink mb-3">{displayName}</h2>

      {/* ── TOOLBAR ── */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden mb-4 shadow-sm">
        {/* TOP ROW — file name + instrument tabs */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Music size={14} className="text-gold shrink-0" />
            <span className="font-heading text-sm font-semibold text-ink truncate">{displayName}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selected.map((name, i) => (
              <button
                key={name}
                onClick={() => setActiveInstrument(i)}
                className={`px-3 py-1 text-xs rounded-full border font-medium whitespace-nowrap transition-all ${
                  i === activeInstrument
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink-soft border-border hover:border-ink-muted hover:text-ink"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM ROW — controls + downloads */}
        <div className="flex items-center gap-2 px-5 py-3 flex-wrap bg-surface">
          {/* Key transpose */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted">Key</span>
            <div className="relative">
              <button
                onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs text-ink hover:border-ink-muted transition-all h-8 font-medium"
              >
                {selectedKey}
                <ChevronDown size={11} className={`transition-transform text-ink-muted ${keyDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {keyDropdownOpen && (
                <div className="absolute z-20 mt-1 left-0 w-44 bg-white border border-border rounded-xl shadow-lg p-1 max-h-60 overflow-y-auto">
                  {allKeys.map((k) => (
                    <button
                      key={k}
                      onClick={() => { setSelectedKey(k); setKeyDropdownOpen(false); }}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                        k === selectedKey
                          ? "bg-gold text-white font-medium"
                          : "text-ink hover:bg-surface"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BPM */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted">Tempo</span>
            <div className="inline-flex items-center bg-white border border-border rounded-lg h-8">
              <button
                onClick={() => setBpm(Math.max(40, bpm - 5))}
                className="px-2 text-ink-muted hover:text-ink transition-colors"
              >
                <Minus size={11} />
              </button>
              <span className="text-xs font-semibold text-ink min-w-[32px] text-center">{bpm}</span>
              <button
                onClick={() => setBpm(Math.min(240, bpm + 5))}
                className="px-2 text-ink-muted hover:text-ink transition-colors"
              >
                <Plus size={11} />
              </button>
            </div>
            <span className="text-[10px] text-ink-muted">BPM</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Download buttons — dark background so they stand out against parchment */}
          <div className="flex items-center gap-2">
            {/* PDF — always available */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-xs font-semibold hover:bg-ink/80 transition-all"
            >
              <FileText size={13} />
              PDF Sheet Music
            </button>

            {/* MIDI */}
            {outputs.some(o => o.format === "midi") ? (
              <button
                onClick={() => outputs.filter(o => o.format === "midi").forEach(o => handleDownload(o))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-xs font-semibold hover:bg-ink/80 transition-all"
              >
                <Music size={13} />
                MIDI File
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-ink-muted text-xs font-medium cursor-not-allowed"
                title="Available on Pro plan"
              >
                <Lock size={13} />
                MIDI
                <span className="text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">PRO</span>
              </button>
            )}

            {/* MusicXML */}
            {outputs.some(o => o.format === "musicxml") ? (
              <button
                onClick={() => outputs.filter(o => o.format === "musicxml").forEach(o => handleDownload(o))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-xs font-semibold hover:bg-ink/80 transition-all"
              >
                <FileCode size={13} />
                MusicXML
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-ink-muted text-xs font-medium cursor-not-allowed"
                title="Available on Pro plan"
              >
                <Lock size={13} />
                MusicXML
                <span className="text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">PRO</span>
              </button>
            )}

            {/* Guitar Pro — Studio only */}
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-ink-muted text-xs font-medium cursor-not-allowed"
              title="Available on Studio plan"
            >
              <Guitar size={13} />
              Guitar Pro
              <span className="text-[9px] bg-ink text-paper px-1.5 py-0.5 rounded font-bold">STUDIO</span>
            </button>
          </div>

          {/* New transcription */}
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-ink text-xs font-medium hover:bg-surface transition-all ml-1"
          >
            <RefreshCw size={12} />
            New
          </button>
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
          <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} />
        </div>

        <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} />

      </div>
    </div>
  );
};

export default AppPage;
