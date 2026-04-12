import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Music, FileText, FileCode, Lock,
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
      alert("Download failed — please try again.");
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

              {/* ── Guitar Pro locked badge ── */}
              <div className="flex justify-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase" style={{ background: 'rgba(200,169,110,0.1)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.25)' }}>
                  <Lock size={10} />
                  Guitar Pro — Coming Soon
                </span>
              </div>

              {/* ── TOOLBAR ── */}
              <div className="rounded-2xl overflow-hidden mb-4 shadow-lg" style={{ background: '#0f0f1a', border: '1px solid rgba(200,169,110,0.3)' }}>
                {/* TOP ROW — centered instrument tabs only */}
                <div className="flex items-center justify-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.map((name, i) => (
                      <button
                        key={name}
                        onClick={() => setActiveInstrument(i)}
                        className="px-5 py-2 text-sm font-semibold whitespace-nowrap transition-all rounded-full"
                        style={i === activeInstrument
                          ? { background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#0f0f1a', border: '1px solid #c8a96e' }
                          : { background: '#ffffff', color: '#0f0f1a', border: '1px solid rgba(200,169,110,0.8)' }
                        }
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BOTTOM ROW — controls + all transcriptions + downloads */}
                <div className="flex items-center gap-4 px-6 py-4 flex-wrap" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
                        <div className="absolute z-20 mt-1 left-0 w-44 rounded-xl shadow-lg p-1 max-h-60 overflow-y-auto" style={{ background: '#1a1a2e', border: '1px solid rgba(200,169,110,0.3)' }}>
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
                  </div>

                  {/* Left: BPM */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold" style={{ color: '#c8a96e' }}>Tempo</span>
                    <div className="inline-flex items-center rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,169,110,0.3)', height: '40px' }}>
                      <button
                        onClick={() => setBpm(Math.max(40, bpm - 5))}
                        className="px-3 py-2 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold min-w-[36px] text-center" style={{ color: '#e8e8f0' }}>{bpm}</span>
                      <button
                        onClick={() => setBpm(Math.min(240, bpm + 5))}
                        className="px-3 py-2 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>BPM</span>
                  </div>

                  {/* Center: All Transcriptions — ghost button */}
                  <div className="flex-1 flex justify-center">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: 'transparent', border: '1px solid rgba(200,169,110,0.5)', color: '#ffffff', height: '40px' }}
                    >
                      <RefreshCw size={14} />
                      All Transcriptions
                    </Link>
                  </div>

                  {/* Right: Download buttons — gold gradient */}
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
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', height: '40px' }}
                    >
                      <FileText size={14} />
                      PDF Sheet Music
                    </button>

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
