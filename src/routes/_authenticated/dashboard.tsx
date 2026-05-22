import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/brand-logo";
import door from "@/assets/door.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "The Room" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [bookings, setBookings] = useState<{ id: string; date: string; status: string }[]>([]);

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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,date,status")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .then(({ data }) => setBookings(data ?? []));
  }, [user]);

  return (
    <main className="theme-interior min-h-screen bg-background text-foreground">
      {!skipIntro && !introDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
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
            className="absolute bottom-8 right-8 text-[0.55rem] tracking-[0.5em] uppercase text-white/60 hover:text-white"
          >
            Salta
          </button>
        </div>
      )}

      {/* Navbar nera */}
      <header className="bg-black text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <BrandLogo className="w-[90px]" />
          <nav className="flex items-center gap-6">
            <Link to="/book" className="text-[0.55rem] tracking-[0.4em] uppercase text-white/70 hover:text-white">
              Prenota
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-[0.55rem] tracking-[0.4em] uppercase text-white/70 hover:text-white">
                Admin
              </Link>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[0.55rem] tracking-[0.4em] uppercase text-white/70 hover:text-white"
            >
              Esci
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="flex flex-col items-center text-center">
          <img
            src={door}
            alt="The Room"
            className="w-full max-w-md mb-10"
            draggable={false}
          />
          <p className="text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground">Benvenuto</p>
          <h1 className="mt-4 font-serif text-4xl text-[color:var(--gold)]">
            {user?.email}
          </h1>
          <p className="mt-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Sei dentro. Lo spazio è tuo, solo su appuntamento.
          </p>

          <Link
            to="/book"
            className="mt-10 inline-flex h-12 items-center justify-center bg-black px-10 text-[0.65rem] tracking-[0.5em] uppercase text-white hover:opacity-90"
          >
            Prenota un appuntamento
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground">
            I tuoi appuntamenti
          </h2>
          <ul className="mt-4 divide-y divide-[color:var(--border)]">
            {bookings.length === 0 && (
              <li className="py-6 text-xs text-muted-foreground">Nessun appuntamento in programma.</li>
            )}
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-4">
                <span className="font-serif text-lg">
                  {new Date(b.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground">
                  {b.status === "pending" ? "In attesa" : b.status === "confirmed" ? "Confermato" : b.status === "cancelled" ? "Annullato" : "Rifiutato"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}