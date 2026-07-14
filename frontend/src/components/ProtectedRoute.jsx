import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkbg text-white">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-8 py-6 text-center">
          <p className="text-lg font-semibold">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
