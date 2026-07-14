import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

const topics = [
  { key: "react", label: "React" },
  { key: "node", label: "Node.js" },
  { key: "python", label: "Python" },
  { key: "docker", label: "Docker" },
  { key: "algorithms", label: "Algorithms" },
  { key: "system-design", label: "System Design" }
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [topic, setTopic] = useState(topics[0].key);
  const [difficulty, setDifficulty] = useState("medium");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await api.get("/interview/history");
        setHistory(response.sessions || []);
      } catch (err) {
        setHistoryError(err.message || "Unable to load previous sessions.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const averageScore = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
    : 0;

  return (
    <div className="min-h-screen text-white bg-darkbg">
      <header className="flex flex-col max-w-6xl gap-4 px-6 py-6 mx-auto sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-violet">PrepAI Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">{greeting}, {user?.name || 'Candidate'}</h1>
        </div>

        <button
          onClick={logout}
          className="px-5 py-3 text-sm font-semibold text-white transition border rounded-full border-zinc-700 bg-zinc-950/70 hover:border-zinc-500"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl px-6 pb-16 mx-auto">
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/60">
            <p className="text-sm uppercase tracking-[0.4em] text-accent-violet">Interview practice</p>
            <h2 className="mt-4 text-4xl font-bold">Choose your topic and start a session.</h2>
            <p className="max-w-2xl mt-4 text-sm text-zinc-400">
              Each call will generate fresh AI-powered questions, log your session, and give you feedback with scoring.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 mt-3 text-sm text-white border outline-none rounded-2xl border-zinc-800 bg-zinc-950/70"
                >
                  {topics.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 mt-3 text-sm text-white border outline-none rounded-2xl border-zinc-800 bg-zinc-950/70"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate(`/interview?topic=${topic}&difficulty=${difficulty}`)}
                  className="inline-flex items-center justify-center px-6 py-4 text-sm font-semibold text-white transition rounded-2xl bg-accent-violet hover:bg-violet-600"
                >
                  Start interview
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/report")}
                  className="px-6 py-4 text-sm font-semibold text-white transition border rounded-2xl border-zinc-800 bg-zinc-950/70 hover:border-zinc-500"
                >
                  View progress
                </button>
              </div>
            </div>
          </div>

          <aside className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/70">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">Session tips</p>
            <ul className="mt-6 space-y-4 text-sm text-zinc-400">
              <li>• Answer all questions in one pass, then review the score and feedback.</li>
              <li>• Each session is stored so you can compare your progress over time.</li>
              <li>• Build a stronger routine by practicing different topics regularly.</li>
            </ul>
          </aside>
        </section>

        <section className="p-8 mt-10 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent-violet">Previous attempts</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Your latest interview sessions</h3>
            </div>
            <div className="px-4 py-3 text-sm text-white rounded-3xl bg-zinc-900/80">
              Average score: {averageScore}%
            </div>
          </div>

          {historyLoading ? (
            <div className="mt-8 space-y-4">
              <div className="w-full h-24 animate-pulse rounded-3xl bg-zinc-800" />
              <div className="w-full h-24 animate-pulse rounded-3xl bg-zinc-800" />
            </div>
          ) : historyError ? (
            <div className="p-6 mt-8 text-sm text-red-200 border rounded-3xl border-red-500/20 bg-red-950/70">
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 mt-8 text-sm border rounded-3xl border-zinc-800 bg-zinc-900/60 text-zinc-400">
              No completed sessions yet. Start your first interview to build a score history.
            </div>
          ) : (
            <div className="grid gap-4 mt-8">
              {history.map((session) => (
                <div key={session._id} className="p-6 border rounded-3xl border-zinc-800 bg-zinc-900/60 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">{session.topic}</p>
                    <h4 className="mt-2 text-xl font-semibold text-white">{session.currentDifficulty} difficulty</h4>
                    <p className="mt-2 text-sm text-zinc-400">{session.attemptsCount} answers • {new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="px-4 py-3 mt-4 text-sm font-semibold text-white rounded-2xl bg-zinc-950/80 sm:mt-0">
                    Score: {session.score}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
