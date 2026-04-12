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
      pending: "bg-gold-light text-gold-dark",
      separating: "bg-gold-light text-gold-dark",
      transcribing: "bg-gold-light text-gold-dark",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-surface text-ink-muted"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-2xl font-bold text-ink">My Transcriptions</h1>
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
              <Music size={48} className="text-ink-muted mb-4" />
              <h2 className="font-heading text-lg font-semibold text-ink mb-2">No transcriptions yet</h2>
              <p className="text-sm text-ink-muted mb-6">Upload your first audio file to get started.</p>
              <Link
                to="/app"
                className="px-5 py-2.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all inline-flex items-center gap-2"
              >
                Upload Audio <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">File</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft hidden md:table-cell">Instruments</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {transcriptions.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 text-ink font-medium truncate max-w-[200px]">{t.song_title || t.file_name}</td>
                      <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-ink-muted hidden md:table-cell">
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
