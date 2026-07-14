import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const topics = [
  { key: "react", label: "React" },
  { key: "node", label: "Node.js" },
  { key: "python", label: "Python" },
  { key: "docker", label: "Docker" },
  { key: "algorithms", label: "Algorithms" },
  { key: "system-design", label: "System Design" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [topic, setTopic] = useState(topics[0].key);
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-screen bg-darkbg text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">PrepAI Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">{greeting}, {user?.name || 'Candidate'}</h1>
        </div>

        <button
          onClick={logout}
          className="rounded-full border border-zinc-700 bg-zinc-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-zinc-900"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-8 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.4em] text-accent-emerald">Interview practice</p>
            <h2 className="mt-4 text-4xl font-bold">Choose your topic and start a session.</h2>
            <p className="mt-4 max-w-2xl text-sm text-zinc-400">
              Each call will generate fresh AI-powered questions, log your attempts, and give you feedback with scoring.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none"
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
                  className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-950/70 p-4 text-sm text-red-200 border border-red-500/30">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate(`/interview?topic=${topic}&difficulty=${difficulty}`)}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-violet to-accent-emerald px-6 py-4 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Start interview
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/report")}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/40"
                >
                  View progress
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">Session tips</p>
            <ul className="mt-6 space-y-4 text-sm text-zinc-400">
              <li>• Answer confidently, and let AI help you improve.</li>
              <li>• After each interview, review the score and attempt history.</li>
              <li>• Use different topics to strengthen breadth and depth.</li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}
