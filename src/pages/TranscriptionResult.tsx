import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Check, Music, FileText, FileCode, Guitar, Lock,
  ChevronDown, ArrowUpDown, Minus, Plus, RefreshCw,
  ArrowLeft, Loader2
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
        .select("file_name, selected_instruments, status, detected_key, detected_bpm")
        .eq("id", id)
        .single();

      if (txnErr || !txn) {
        setError("Transcription not found.");
        setLoading(false);
        return;
      }

      if (txn.status !== "completed") {
        setError(`This transcription has status: ${txn.status}. Only completed transcriptions can be viewed.`);
        setLoading(false);
        return;
      }

      setFileName(txn.file_name);
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
          <div className="mb-6">
            {/* Back link */}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={16} />
              Back to My Transcriptions
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gold" />
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
              {/* Success banner */}
              <div className="flex items-center justify-center gap-2 bg-teal text-white rounded-xl py-2.5 px-4">
                <Check size={16} />
                <span className="text-sm font-medium">
                  Your sheet music is ready: {displayName}
                </span>
              </div>

              {/* Toolbar */}
              <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
                {/* Instrument tabs */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected.length > 1 ? (
                    <div className="flex gap-1 overflow-x-auto">
                      {selected.map((name, i) => (
                        <button
                          key={name}
                          onClick={() => setActiveInstrument(i)}
                          className={`px-2.5 py-1 text-xs rounded-full border whitespace-nowrap transition-all ${
                            i === activeInstrument
                              ? "bg-gold text-white border-gold font-medium"
                              : "bg-paper text-ink-soft border-border hover:border-ink-muted"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 text-xs rounded-full bg-gold text-white border border-gold font-medium">
                      {selected[0]}
                    </span>
                  )}
                </div>

                <div className="w-px h-6 bg-border hidden sm:block" />

                {/* Adjustments */}
                <div className="flex items-center gap-3">
                  {/* Transpose */}
                  <div className="relative">
                    <button
                      onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-paper transition-all h-8"
                    >
                      <ArrowUpDown size={12} className="text-ink-soft" />
                      {selectedKey}
                      <ChevronDown size={12} className="text-ink-soft" />
                    </button>
                    {keyDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-xl shadow-soft p-2 w-36 z-50">
                        {allKeys.map((k) => (
                          <button
                            key={k}
                            onClick={() => { setSelectedKey(k); setKeyDropdownOpen(false); }}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
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

                  {/* BPM */}
                  <div className="flex items-center gap-1 bg-paper rounded-lg border border-border h-8 px-2">
                    <button
                      onClick={() => setBpm(Math.max(40, bpm - 5))}
                      className="px-1.5 text-ink-soft hover:text-ink transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-ink w-8 text-center">
                      {bpm}
                    </span>
                    <button
                      onClick={() => setBpm(Math.min(240, bpm + 5))}
                      className="px-1.5 text-ink-soft hover:text-ink transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-ink-muted">BPM</span>
                </div>

                <div className="w-px h-6 bg-border hidden sm:block" />

                {/* Downloads */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all"
                  >
                    <FileText size={14} />
                    PDF
                  </button>
                  {outputs.some(o => o.format === "midi") ? (
                    <button
                      onClick={() => outputs.filter(o => o.format === "midi").forEach(o => handleDownload(o))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all"
                    >
                      <Music size={14} />
                      MIDI
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-ink-muted text-xs font-medium border border-border cursor-not-allowed"
                    >
                      <Music size={14} />
                      MIDI
                    </button>
                  )}
                  {outputs.some(o => o.format === "musicxml") ? (
                    <button
                      onClick={() => outputs.filter(o => o.format === "musicxml").forEach(o => handleDownload(o))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-medium hover:bg-gold-dark transition-all"
                    >
                      <FileCode size={14} />
                      MusicXML
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-ink-muted text-xs font-medium border border-border cursor-not-allowed"
                    >
                      <FileCode size={14} />
                      MusicXML
                    </button>
                  )}
                  <button
                    disabled
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface text-ink-muted text-xs font-medium border border-border cursor-not-allowed"
                  >
                    <Lock size={12} />
                    GP
                    <span className="ml-1 text-[10px] opacity-70">Studio</span>
                  </button>
                </div>

                <div className="flex-1" />

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper text-ink text-xs font-medium border border-border hover:bg-surface transition-all"
                >
                  <RefreshCw size={14} />
                  All Transcriptions
                </Link>
              </div>

              {/* Sheet music */}
              <div className="bg-paper rounded-2xl overflow-hidden">
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
