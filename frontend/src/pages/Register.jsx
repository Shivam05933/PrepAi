import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, register, authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to register.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-darkbg px-6 text-white">
      <div className="w-full max-w-md p-8 glass border border-zinc-800 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">PrepAI Sign Up</p>
          <h1 className="mt-4 text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-zinc-400">Start practicing with AI-powered interview sessions.</p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-200 rounded-2xl bg-red-950/70 border border-red-500/30">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-300">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20"
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20"
              placeholder="name@domain.com"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-2xl bg-accent-violet px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {authLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-accent-violet">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
