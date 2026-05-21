import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-[color:var(--gold)] text-[0.6rem] tracking-[0.5em] uppercase">
        …
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return <Outlet />;
}