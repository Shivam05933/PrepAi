import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export default function ReportCard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get("/interview/history");
        setHistory(response.sessions || []);
      } catch (err) {
        setError(err.message || "Unable to load session history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const scoreTrend = history.length > 0 ? history.map((item) => item.score) : [];
  const averageScore = scoreTrend.length
    ? Math.round(scoreTrend.reduce((sum, value) => sum + value, 0) / scoreTrend.length)
    : 0;

  return (
    <div className="min-h-screen text-white bg-darkbg">
      <header className="flex items-center justify-between max-w-6xl px-6 py-6 mx-auto">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Progress report</p>
          <h1 className="mt-2 text-3xl font-bold">Your performance</h1>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 text-sm text-white transition border rounded-full border-zinc-700 bg-zinc-950/70 hover:border-white/40"
          >
            Dashboard
          </button>
          <button
            onClick={logout}
            className="px-5 py-3 text-sm text-white transition border rounded-full border-zinc-700 bg-zinc-950/70 hover:border-white/40"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl px-6 pb-16 mx-auto">
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-accent-violet">Summary</p>
                <h2 className="mt-3 text-4xl font-bold">Keep improving.</h2>
                <p className="mt-2 text-sm text-zinc-400">Track your latest interview sessions, scores, and progress metrics.</p>
              </div>
              <div className="p-6 text-center rounded-3xl bg-zinc-900/80">
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Average score</p>
                <p className="mt-3 text-5xl font-bold text-white">{averageScore}%</p>
                <p className="mt-2 text-sm text-zinc-400">over {history.length} session(s)</p>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 space-y-3">
                <div className="w-full h-16 animate-pulse rounded-3xl bg-zinc-800" />
                <div className="w-full h-16 animate-pulse rounded-3xl bg-zinc-800" />
              </div>
            ) : error ? (
              <div className="p-6 mt-8 text-sm text-red-200 border rounded-2xl bg-red-950/70 border-red-500/30">
                {error}
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {history.length === 0 ? (
                  <div className="p-6 text-sm border rounded-3xl border-zinc-800 bg-zinc-900/60 text-zinc-400">
                    No sessions yet. Start an interview to generate your first score.
                  </div>
                ) : (
                  history.map((session) => (
                    <div key={session._id} className="p-6 border rounded-3xl border-zinc-800 bg-zinc-900/60">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">{session.topic}</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{session.currentDifficulty} difficulty</h3>
                        </div>
                        <div className="px-4 py-3 text-sm text-white rounded-2xl bg-zinc-950/80">
                          Score: {session.score}%
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 text-sm text-zinc-400">
                        <span>{session.attemptsCount} attempt(s)</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <aside className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/70">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">How to use this report</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-400">
              <p>Review the session breakdown to identify strengths and areas for improvement.</p>
              <p>Use the dashboard to try different topics and build variety.</p>
              <p>Consistent practice leads to stronger interview performance.</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
