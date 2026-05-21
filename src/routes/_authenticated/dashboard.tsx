import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "The Room" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  // Show intro video only on first session-load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("room:intro");
    if (seen) {
      setIntroDone(true);
      setSkipIntro(true);
    } else {
      sessionStorage.setItem("room:intro", "1");
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {!skipIntro && !introDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <video
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setIntroDone(true)}
            className="h-full w-full object-cover opacity-90"
          />
          <button
            onClick={() => setIntroDone(true)}
            className="absolute bottom-8 right-8 text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground hover:text-[color:var(--gold)]"
          >
            Skip
          </button>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <BrandLogo className="w-[110px]" />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]"
          >
            Sign out
          </button>
        </header>

        <section className="mt-24 text-center">
          <p className="text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground">Welcome</p>
          <h1 className="mt-4 font-serif text-4xl text-[color:var(--gold)]">
            {user?.email}
          </h1>
          <p className="mt-8 max-w-sm mx-auto text-xs leading-relaxed text-muted-foreground">
            Your space is being prepared. Onboarding and booking will arrive in the next update.
          </p>

          {isAdmin && (
            <Link
              to="/admin"
              className="mt-12 inline-flex h-11 items-center justify-center brand-frame px-8 text-[0.6rem] tracking-[0.5em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-background transition-colors"
            >
              Admin Area
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}