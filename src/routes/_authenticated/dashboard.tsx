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
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(null);

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
    supabase
      .from("questionnaires")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setHasQuestionnaire(!!data));
  }, [user]);

  return (
    <main className="theme-interior min-h-screen bg-background text-foreground font-display">
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

      {/* Hero: la foto del salone come "porta aperta" — fonde con il background */}
      <section className="relative">
        {/* Navbar flottante sopra l'immagine */}
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10 md:py-8">
            <Link to="/dashboard" className="text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition hover:opacity-80">
              <BrandLogo variant="horizontal" className="h-12 w-auto md:h-14" />
            </Link>
            <nav className="flex items-center gap-8">
              <Link to="/book" className="text-[0.55rem] tracking-[0.5em] uppercase text-white/90 hover:text-white">
                Prenota
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-[0.55rem] tracking-[0.5em] uppercase text-white/90 hover:text-white">
                  Admin
                </Link>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-[0.55rem] tracking-[0.5em] uppercase text-white/90 hover:text-white"
              >
                Esci
              </button>
            </nav>
          </div>
        </header>

        <div className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
          <img
            src={door}
            alt="The Room — interno del salone"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          {/* gradient overlays: scurisce in alto per la nav, sfuma in basso nel background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[color:var(--background)]" />

          {/* Testo hero in basso */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-28 md:px-10 md:pb-36">
            <div className="mx-auto max-w-6xl">
              <p className="text-[0.55rem] tracking-[0.6em] uppercase text-white/80">
                Benvenuta · {user?.email}
              </p>
              <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-white md:text-7xl">
                Sei dentro.
                <br />
                <span className="italic text-white/85">Lo spazio è tuo.</span>
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + appuntamenti */}
      <section className="mx-auto max-w-6xl px-6 pt-4 md:px-10">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-[color:var(--border)] pb-12 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground">
              The Room — Private Hair Studio
            </p>
            <p className="mt-4 font-serif text-2xl leading-snug text-foreground">
              Un solo appuntamento al giorno. Tutto il tempo, solo per te.
            </p>
          </div>
          {hasQuestionnaire === false ? (
            <Link
              to="/questionnaire"
              className="inline-flex h-14 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-10 text-[0.6rem] tracking-[0.6em] uppercase text-background transition hover:bg-transparent hover:text-[color:var(--gold)]"
            >
              Compila il questionario
            </Link>
          ) : (
            <Link
              to="/book"
              className="inline-flex h-14 items-center justify-center border border-foreground/80 bg-foreground px-12 text-[0.6rem] tracking-[0.6em] uppercase text-background transition hover:bg-transparent hover:text-foreground"
            >
              Prenota appuntamento
            </Link>
          )}
        </div>

        {hasQuestionnaire === false && (
          <p className="-mt-6 mb-2 text-[11px] italic text-[color:var(--gold)]">
            Per prenotare il primo appuntamento ti chiediamo di compilare un breve questionario di presentazione.
          </p>
        )}

        {hasQuestionnaire === true && (
          <p className="-mt-6 mb-2 text-[11px] text-muted-foreground">
            <Link to="/questionnaire" className="underline-offset-4 hover:underline">
              Aggiorna il tuo questionario →
            </Link>
          </p>
        )}

        <div className="grid gap-12 py-16 md:grid-cols-[1fr_2fr]">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">
            I tuoi
            <br />
            <span className="italic text-[color:var(--gold)]">appuntamenti</span>
          </h2>
          <ul className="divide-y divide-[color:var(--border)]">
            {bookings.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">
                Nessun appuntamento in programma. Quando sei pronta, prenota il tuo momento.
              </li>
            )}
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-6">
                <span className="font-serif text-2xl capitalize text-foreground">
                  {new Date(b.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span className="text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground">
                  {b.status === "pending"
                    ? "In attesa"
                    : b.status === "confirmed"
                    ? "Confermato"
                    : b.status === "cancelled"
                    ? "Annullato"
                    : "Rifiutato"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Informazioni — il "manifesto" dello studio */}
      <section className="border-t border-[color:var(--border)] bg-[color:var(--card)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <p className="text-[0.55rem] tracking-[0.6em] uppercase text-muted-foreground">
            Manifesto
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-foreground md:text-6xl">
            Uno spazio riservato per la
            <span className="italic text-[color:var(--gold)]"> bellezza personalizzata</span>.
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Questa piattaforma è accessibile solo tramite iscrizione e login, per
            garantire un'esperienza unica e su misura per ogni cliente.
          </p>

          <div className="mt-20 grid gap-16 md:grid-cols-2">
            <article>
              <p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">01 — Appuntamenti</p>
              <h3 className="mt-3 font-serif text-2xl text-foreground">
                Un cliente al giorno
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Fino a febbraio è disponibile un solo appuntamento al giorno, dalle
                9:00 alle 12:30. Da marzo la disponibilità si estende fino alle 15:00,
                mantenendo la stessa qualità del servizio. Ogni appuntamento include
                un'analisi dettagliata della cute e dei capelli, e una consulenza
                personalizzata su taglio e colore.
              </p>
            </article>

            <article>
              <p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">02 — Prenotazione</p>
              <h3 className="mt-3 font-serif text-2xl text-foreground">
                Agenda autonoma
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Visualizza la disponibilità delle giornate e prenota il tuo
                appuntamento in autonomia. Scegli il momento più conveniente, con
                flessibilità e comodità.
              </p>
            </article>

            <article>
              <p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">03 — Questionario</p>
              <h3 className="mt-3 font-serif text-2xl text-foreground">
                Conoscersi prima
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Ti invitiamo a compilare un breve questionario di presentazione: ci
                aiuta a comprendere le caratteristiche dei tuoi capelli e le tue
                preferenze, per prepararci al meglio per il tuo appuntamento.
              </p>
            </article>

            <article>
              <p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">04 — L'esperienza</p>
              <h3 className="mt-3 font-serif text-2xl text-foreground">
                Senza fretta
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Discuteremo insieme il look desiderato, per raggiungere il risultato
                che meglio esprime il tuo stile unico. Un'esperienza esclusiva,
                progettata per valorizzare la tua bellezza.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 md:px-10">
          <BrandLogo variant="horizontal" className="h-8 w-auto text-foreground/60" />
          <p className="text-[0.5rem] tracking-[0.5em] uppercase text-muted-foreground">
            Access by appointment only
          </p>
        </div>
      </footer>
    </main>
  );
}