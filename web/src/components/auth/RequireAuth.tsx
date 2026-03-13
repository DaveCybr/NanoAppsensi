import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const user          = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const location      = useLocation();

  // ── Initial boot ───────────────────────────────────────────────────────────
  // Call initialize() once via getState() — not as a reactive selector,
  // which would cause an infinite re-render loop.
  useEffect(() => {
    if (!isInitialized) {
      useAuthStore.getState().initialize();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // NOTE: No manual visibility handler needed.
  // Supabase v2 already listens to visibilitychange internally and refreshes
  // the token automatically. onAuthStateChange handles TOKEN_REFRESHED,
  // SIGNED_OUT, and TOKEN_REFRESH_FAILED — all cases are covered.

  // Still booting — show full-screen spinner
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">N</span>
          </div>
          <Loader2 size={20} className="animate-spin text-blue-500" />
          <p className="text-xs text-gray-400">Memvalidasi sesi...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
