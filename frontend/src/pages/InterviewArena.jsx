import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function InterviewArena() {
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const navigate = useNavigate();
  const query = useQuery();
  const topic = query.get("topic") || "react";
  const difficulty = query.get("difficulty") || "medium";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const startInterview = async () => {
      try {
        setLoading(true);
        const response = await api.post("/interview/start", { topic, difficulty });
        setQuestions(response.questions);
        setSessionId(response.sessionId);
      } catch (err) {
        setError(err.message || "Unable to start interview session.");
      } finally {
        setLoading(false);
      }
    };

    startInterview();
  }, [user, navigate, topic, difficulty]);

  const handleAnswerChange = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setError("");

    if (!sessionId || questions.length === 0) {
      setError("Session is not ready yet.");
      return;
    }

    const payload = questions.map((question) => ({
      questionId: question._id,
      question: question.text,
      userAnswer: responses[question._id] || ""
    }));

    try {
      setLoading(true);
      const response = await api.post("/interview/submit", {
        sessionId,
        answers: payload
      });
      setScore(response.score);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit answers.");
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.values(responses).filter(Boolean).length;

  return (
    <div className="min-h-screen text-white bg-darkbg">
      <header className="flex items-center justify-between max-w-6xl px-6 py-6 mx-auto">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Interview Arena</p>
          <h1 className="mt-2 text-3xl font-bold">{topic.toUpperCase()} practice</h1>
          <p className="text-sm text-zinc-400">Difficulty: {difficulty}</p>
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
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/60">
            {loading ? (
              <div className="space-y-3">
                <div className="w-48 h-6 rounded-md animate-pulse bg-zinc-800" />
                <div className="w-32 h-5 rounded-md animate-pulse bg-zinc-800" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-red-200 border rounded-2xl bg-red-950/70 border-red-500/30">
                {error}
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div key={question._id} className="p-6 border rounded-3xl border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="text-sm uppercase tracking-[0.28em] text-zinc-500">Question {index + 1}</span>
                      <span className="rounded-full bg-zinc-800/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-400">{question.category}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{question.text}</p>
                    <textarea
                      value={responses[question._id] || ""}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      rows={6}
                      className="w-full px-4 py-4 mt-5 text-sm text-white transition border outline-none resize-none rounded-3xl border-zinc-800 bg-zinc-950/70 focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-zinc-400">
                    Answered {answeredCount}/{totalQuestions} questions
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitted || loading}
                    className="px-6 py-4 text-sm font-semibold text-white transition rounded-2xl bg-gradient-to-r from-accent-violet to-accent-emerald hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitted ? 'Submitted' : 'Submit answers'}
                  </button>
                </div>

                {submitted && score !== null && (
                  <div className="p-6 text-white border rounded-3xl border-accent-emerald/20 bg-accent-emerald/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-accent-emerald">Result</p>
                    <p className="mt-3 text-3xl font-semibold">Score: {score}%</p>
                    <p className="mt-2 text-sm text-zinc-300">Your answers were evaluated and stored in your session history.</p>
                    <button
                      type="button"
                      onClick={() => navigate("/report")}
                      className="px-5 py-3 mt-5 text-sm font-semibold text-white transition border rounded-2xl border-accent-violet/50 hover:border-accent-violet"
                    >
                      Go to report
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/70">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">How it works</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-400">
              <p>AI generates interview questions based on the selected topic and difficulty.</p>
              <p>Type your answer into the box and submit when ready.</p>
              <p>You can review your progress and past sessions on the report page.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
