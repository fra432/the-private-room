import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "THE ROOM — Private Hair Studio" },
      { name: "description", content: "Private Hair Studio. Accesso solo su appuntamento." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { session, loading } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!loading && session) return <Navigate to="/dashboard" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 vignette" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-12">
        <div className="h-2" />

        <section
          className={`flex flex-col items-center text-center transition-all duration-[1400ms] ${
            show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <BrandLogo className="w-[min(440px,82vw)] text-[color:var(--gold)]" />

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link
              to="/login"
              className="brand-frame inline-flex h-12 min-w-[180px] items-center justify-center px-8 text-[0.7rem] tracking-[0.4em] uppercase text-[color:var(--gold)] transition-colors hover:bg-[color:var(--gold)] hover:text-background"
            >
              Entra
            </Link>
            <Link
              to="/request-access"
              className="inline-flex h-12 min-w-[180px] items-center justify-center bg-[color:var(--gold)] px-8 text-[0.7rem] tracking-[0.4em] uppercase text-background transition-opacity hover:opacity-90"
            >
              Richiedi accesso
            </Link>
          </div>
        </section>

        <footer className="text-center text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground">
          <p>Private Hair Studio</p>
          <p className="mt-2">Solo su appuntamento</p>
        </footer>
      </div>
    </main>
  );
}