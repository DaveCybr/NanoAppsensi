import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../lib/supabase";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const location = useLocation();
  const initCalledRef = useRef(false);

  // Initial boot
  useEffect(() => {
    if (!initCalledRef.current && !isInitialized) {
      initCalledRef.current = true;
      console.log("[RequireAuth] Mounting, calling initialize");
      initialize();
    }
  }, [isInitialized, initialize]);

  // Re-check session when tab becomes visible after idle
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = useAuthStore.getState().user;

      if (!session || !currentUser) {
        // Session expired or state lost — clear stuck spinners then re-hydrate
        useAuthStore.getState().resetLoadingState();
        initialize();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [initialize]);

  console.log("[RequireAuth] Render:", {
    isInitialized,
    isLoading,
    hasUser: !!user,
  });

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
