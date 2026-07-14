import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-darkbg text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl space-y-8">
          <p className="text-sm uppercase tracking-[0.5em] text-accent-violet">AI interview training</p>
          <h1 className="text-5xl font-bold leading-tight sm:text-6xl">Prepare confidently for your next technical interview.</h1>
          <p className="max-w-2xl text-lg text-zinc-200">PrepAI blends smart interview generation, instant feedback, and progress tracking into one polished platform for developers and students.</p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/register" className="inline-flex items-center justify-center rounded-3xl bg-accent-violet px-8 py-4 text-sm font-semibold text-white transition hover:bg-violet-600">
              Get started
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-3xl border border-white/20 bg-zinc-950/70 px-8 py-4 text-sm font-semibold text-white transition hover:bg-zinc-900/80">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Real practice</p>
            <p className="mt-3 text-lg font-semibold text-white">AI-generated interview sessions for any topic.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Instant feedback</p>
            <p className="mt-3 text-lg font-semibold text-white">Receive scores and guidance after every attempt.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Track growth</p>
            <p className="mt-3 text-lg font-semibold text-white">Monitor session history and improve over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
