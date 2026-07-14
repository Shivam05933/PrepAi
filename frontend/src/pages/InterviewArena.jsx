import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function InterviewArena() {
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(Array(5).fill(""));
  const [results, setResults] = useState([]);
  const [totalScore, setTotalScore] = useState(null);
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
        setQuestions(response.questions || []);
        setAnswers(Array(response.questions?.length || 5).fill(""));
        setSessionId(response.sessionId);
      } catch (err) {
        setError(err.message || "Unable to start interview session.");
      } finally {
        setLoading(false);
      }
    };

    startInterview();
  }, [user, navigate, topic, difficulty]);

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => prev.map((answer, idx) => (idx === index ? value : answer)));
  };

  const handleSubmit = async () => {
    setError("");

    if (!sessionId || questions.length === 0) {
      setError("Session is not ready yet.");
      return;
    }

    const payload = questions.map((question, index) => ({
      questionId: question._id,
      question: question.text,
      userAnswer: answers[index] || ""
    }));

    try {
      setLoading(true);
      const response = await api.post("/interview/submit", {
        sessionId,
        answers: payload
      });
      setResults(response.results || []);
      setTotalScore(response.totalScore);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit answers.");
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = answers.filter((answer) => answer.trim() !== '').length;
  const canSubmit = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="min-h-screen text-white bg-darkbg">
      <header className="flex flex-col max-w-6xl gap-4 px-6 py-6 mx-auto sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-violet">Interview Arena</p>
          <h1 className="mt-2 text-3xl font-bold">{topic.toUpperCase()} practice</h1>
          <p className="text-sm text-zinc-400">Difficulty: {difficulty}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 text-sm text-white transition border rounded-full border-zinc-700 bg-zinc-950/70 hover:border-zinc-500"
          >
            Dashboard
          </button>
          <button
            onClick={logout}
            className="px-5 py-3 text-sm text-white transition border rounded-full border-zinc-700 bg-zinc-950/70 hover:border-zinc-500"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl px-6 pb-16 mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/60">
            {loading ? (
              <div className="space-y-4">
                <div className="w-48 h-6 rounded-md animate-pulse bg-zinc-800" />
                <div className="h-4 rounded-md w-72 animate-pulse bg-zinc-800" />
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
                      value={answers[index] || ""}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      rows={5}
                      className="w-full px-4 py-4 mt-5 text-sm text-white transition border outline-none resize-none rounded-3xl border-zinc-800 bg-zinc-950/70 focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-zinc-400">
                    Answered {answeredCount}/{questions.length} questions
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitted}
                    className="px-6 py-4 text-sm font-semibold text-white transition rounded-2xl bg-accent-violet hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitted ? 'Submitted' : 'Submit all answers'}
                  </button>
                </div>

                {submitted && results.length > 0 && (
                  <div className="p-6 border rounded-3xl border-accent-violet/20 bg-zinc-950/80">
                    <p className="text-sm uppercase tracking-[0.3em] text-accent-violet">Results</p>
                    <p className="mt-3 text-3xl font-semibold text-white">Total score: {totalScore}</p>
                    <div className="mt-6 space-y-4">
                      {results.map((result, index) => (
                        <div key={index} className="p-5 border rounded-3xl border-zinc-800 bg-zinc-900/70">
                          <p className="text-sm text-zinc-400">Question {index + 1}</p>
                          <p className="mt-2 text-lg font-semibold text-white">Score: {result.score}</p>
                          <p className="mt-3 text-sm text-zinc-300">Feedback: {result.feedback}</p>
                          <p className="mt-3 text-sm text-zinc-300">Correct answer: {result.correctAnswer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="p-8 border shadow-2xl rounded-3xl border-zinc-800 bg-zinc-950/70">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">How it works</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-400">
              <p>All five questions are shown together so you can answer in one session.</p>
              <p>Submit all responses once and review score feedback immediately.</p>
              <p>Use the dashboard to compare past sessions and track improvement.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
