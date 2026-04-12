import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Music, FileText, FileCode, Guitar, Lock,
  ChevronDown, ArrowLeft, Loader2, Minus, Plus, RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SheetMusicRenderer from "@/components/SheetMusicRenderer";
import { supabase } from "@/integrations/supabase/client";

interface Output {
  instrument: string;
  format: string;
  file_path: string;
}

const allKeys = [
  "C Major", "C# Major", "D Major", "Eb Major", "E Major",
  "F Major", "F# Major", "G Major", "Ab Major", "A Major",
  "Bb Major", "B Major",
];

const TranscriptionResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeInstrument, setActiveInstrument] = useState(0);
  const [selectedKey, setSelectedKey] = useState("C Major");
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [bpm, setBpm] = useState(120);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: txn, error: txnErr } = await supabase
        .from("transcriptions")
        .select("file_name, selected_instruments, status, detected_key, detected_bpm, song_title")
        .eq("id", id)
        .single();

      if (txnErr || !txn) {
        setError("Transcription not found.");
        setLoading(false);
        return;
      }

      const inProgressStatuses = ["pending", "separating", "transcribing"];
      if (txn.status !== "completed" && !inProgressStatuses.includes(txn.status)) {
        setError(`This transcription has status: ${txn.status}. Only completed transcriptions can be viewed.`);
        setLoading(false);
        return;
      }

      if (txn.status !== "completed" && inProgressStatuses.includes(txn.status)) {
        setError("__processing__");
        setLoading(false);
        return;
      }

      setFileName(txn.song_title || txn.file_name || "");
      setSelected(txn.selected_instruments || []);
      if (txn.detected_key) setSelectedKey(txn.detected_key);
      if (txn.detected_bpm) setBpm(txn.detected_bpm);

      const { data: outs, error: outsErr } = await supabase
        .from("transcription_outputs")
        .select("instrument, format, file_path")
        .eq("transcription_id", id);

      if (!outsErr && outs) setOutputs(outs);
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const displayName = fileName.replace(/\.[^/.]+$/, "");
  const activeInstrumentName = selected[activeInstrument] || "";
  const activeXmlOutput = outputs.find(
    (o) => o.instrument === activeInstrumentName && o.format === "musicxml"
  );
  const activeMusicXml = activeXmlOutput?.file_path ?? null;

  const handleDownload = (
    output: { instrument: string; format: string; file_path: string }
  ) => {
    const base64Data = output.file_path;
    const safeName = displayName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const instName = output.instrument.toLowerCase().replace(/\s+/g, "_");

    try {
      if (output.format === "musicxml") {
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
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
      if (output.format === "midi") {
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
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            {/* Back link */}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={16} />
              Back to My Transcriptions
            </Link>

            {/* Start Over - New Transcription */}
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all"
            >
              <RefreshCw size={16} />
              Start Over
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gold" />
            </div>
          ) : error === "__processing__" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 size={48} className="animate-spin text-gold mb-4" />
              <p className="text-ink font-medium mb-2">Your transcription is still processing — check back soon.</p>
              <Link
                to="/dashboard"
                className="text-gold hover:text-gold-dark text-sm font-medium mt-4"
              >
                ← Back to My Transcriptions
              </Link>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music size={48} className="text-ink-muted mb-4" />
              <p className="text-ink mb-2">{error}</p>
              <Link
                to="/dashboard"
                className="text-gold hover:text-gold-dark text-sm font-medium mt-4"
              >
                ← Back to dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
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
                      onClick={() => {
                        const container = document.getElementById("osmd-render-container");
                        if (!container) return;
                        const printWindow = window.open("", "_blank");
                        if (!printWindow) { alert("Please allow pop-ups for printing."); return; }
                        printWindow.document.write(`<html><head><title>${displayName} - ${activeInstrumentName}</title><style>@page{margin:0.5in;size:A4 portrait;}*{margin:0;padding:0;box-sizing:border-box;}html,body{margin:0;padding:0;background:#fff;width:100%;}svg{max-width:100%;height:auto;display:block;}</style></head><body>${container.innerHTML}</body></html>`);
                        printWindow.document.close();
                        printWindow.onload = () => { printWindow.print(); setTimeout(() => printWindow.close(), 1000); };
                      }}
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

                  {/* All Transcriptions link */}
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-ink text-xs font-medium hover:bg-surface transition-all ml-1"
                  >
                    <RefreshCw size={12} />
                    All Transcriptions
                  </Link>
                </div>
              </div>

              {/* Sheet music */}
              <div id="osmd-render-container" className="bg-paper rounded-2xl overflow-hidden">
                {activeMusicXml ? (
                  <SheetMusicRenderer musicXmlBase64={activeMusicXml} instrument={activeInstrumentName} />
                ) : (
                  <div className="flex items-center justify-center py-20 text-ink-muted">
                    <Music size={48} className="opacity-50" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TranscriptionResult;
