import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Music, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Transcription {
  id: string;
  file_name: string;
  song_title: string | null;
  created_at: string;
  status: string;
  selected_instruments: string[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("transcriptions")
        .select("id, file_name, song_title, created_at, status, selected_instruments")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTranscriptions(data);
      }
      setLoading(false);
    };

    checkAuthAndLoad();
  }, [navigate]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-teal/15 text-teal",
      failed: "bg-danger/15 text-danger",
      pending: "bg-gold/15 text-gold",
      separating: "bg-gold/15 text-gold",
      transcribing: "bg-gold/15 text-gold",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}
        style={!styles[status] ? { background: 'rgba(13,13,26,0.5)', color: 'rgba(245,240,232,0.4)' } : undefined}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05050F' }}>
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-2xl font-bold" style={{ color: '#F5F0E8' }}>My Transcriptions</h1>
            <Link
              to="/app"
              className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all"
            >
              New Transcription
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-gold" />
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music size={48} className="mb-4" style={{ color: 'rgba(245,240,232,0.3)' }} />
              <h2 className="font-heading text-lg font-semibold mb-2" style={{ color: '#F5F0E8' }}>No transcriptions yet</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.4)' }}>Upload your first audio file to get started.</p>
              <Link
                to="/app"
                className="px-5 py-2.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all inline-flex items-center gap-2"
              >
                Upload Audio <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(13,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(245,240,232,0.6)' }}>File</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'rgba(245,240,232,0.6)' }}>Date</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(245,240,232,0.6)' }}>Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'rgba(245,240,232,0.6)' }}>Instruments</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {transcriptions.map((t) => (
                    <tr
                      key={t.id}
                      className="transition-colors"
                      style={{ background: 'rgba(13,13,26,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,20,35,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(13,13,26,0.5)')}
                    >
                      <td className="px-4 py-3 font-medium truncate max-w-[200px]" style={{ color: '#F5F0E8' }}>{t.song_title || t.file_name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        {t.selected_instruments.slice(0, 3).join(", ")}
                        {t.selected_instruments.length > 3 && ` +${t.selected_instruments.length - 3}`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "completed" ? (
                          <Link
                            to={`/transcription/${t.id}`}
                            className="text-gold hover:text-gold-dark text-xs font-medium inline-flex items-center gap-1"
                          >
                            View Results →
                          </Link>
                        ) : ["pending", "separating", "transcribing"].includes(t.status) ? (
                          <Link
                            to={`/transcription/${t.id}`}
                            className="text-gold hover:text-gold-dark text-xs font-medium inline-flex items-center gap-1"
                          >
                            View Progress →
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
