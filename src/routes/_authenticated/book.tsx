import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({ meta: [{ title: "Prenota — THE ROOM" }] }),
  component: BookPage,
});

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function BookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(null);
  const [questionnaireConfirmed, setQuestionnaireConfirmed] = useState(false);
  const [questionnaireUpdatedAt, setQuestionnaireUpdatedAt] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("questionnaires")
      .select("id,updated_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasQuestionnaire(!!data);
        setQuestionnaireUpdatedAt(data?.updated_at ?? null);
      });
  }, [user]);

  useEffect(() => {
    const start = toISO(month);
    const end = toISO(new Date(month.getFullYear(), month.getMonth() + 2, 0));
    (async () => {
      const [{ data: bks }, { data: cls }] = await Promise.all([
        supabase.from("bookings").select("date,status").gte("date", start).lte("date", end).in("status", ["pending", "confirmed"]),
        supabase.from("closed_days").select("date").gte("date", start).lte("date", end),
      ]);
      setTaken(new Set((bks ?? []).map((b: { date: string }) => b.date)));
      setClosed(new Set((cls ?? []).map((c: { date: string }) => c.date)));
    })();
  }, [month]);

  const days = useMemo(() => {
    const first = new Date(month);
    const startWeekday = (first.getDay() + 6) % 7; // Lunedì=0
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    return cells;
  }, [month]);

  const today = toISO(new Date());

  async function submit() {
    if (!selected || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      date: selected,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Impossibile inviare la richiesta.");
      return;
    }
    toast.success("Richiesta inviata.");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="theme-interior min-h-screen bg-background text-foreground">
      <header className="bg-black text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="text-white">
            <BrandLogo variant="horizontal" className="h-9 w-auto" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[0.55rem] tracking-[0.4em] uppercase text-white/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
            Dashboard
          </Link>
        </div>
      </header>

      {hasQuestionnaire === false && (
        <div className="mx-auto max-w-2xl px-6 pt-12">
          <p className="text-[0.55rem] tracking-[0.6em] uppercase text-[color:var(--gold)]">
            Un passaggio prima
          </p>
          <h1 className="mt-4 font-serif text-3xl md:text-4xl">
            Conosciamoci, poi prenotiamo
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Per riservarti il giusto tempo e i prodotti più adatti, ti chiediamo
            di compilare un breve questionario di presentazione prima del primo
            appuntamento.
          </p>
          <Link
            to="/questionnaire"
            className="mt-8 inline-flex h-12 items-center justify-center bg-[color:var(--gold)] px-10 text-[0.6rem] tracking-[0.5em] uppercase text-background hover:opacity-90"
          >
            Compila il questionario
          </Link>
        </div>
      )}

      {hasQuestionnaire !== false && (
      <div className="mx-auto max-w-2xl px-6 py-12">
        {hasQuestionnaire === true && !questionnaireConfirmed && (
          <div className="mb-12 border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-6 md:p-8">
            <p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">
              Prima di prenotare
            </p>
            <h2 className="mt-3 font-serif text-2xl md:text-3xl">
              Conferma il tuo questionario
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Le informazioni che ci hai dato
              {questionnaireUpdatedAt
                ? ` il ${new Date(questionnaireUpdatedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}`
                : ""}{" "}
              sono ancora attuali? Confermale o aggiornale prima di scegliere la data.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setQuestionnaireConfirmed(true)}
                className="inline-flex h-11 items-center justify-center bg-[color:var(--gold)] px-8 text-[0.6rem] tracking-[0.5em] uppercase text-background hover:opacity-90"
              >
                Confermo, sono attuali
              </button>
              <Link
                to="/questionnaire"
                className="inline-flex h-11 items-center justify-center border border-[color:var(--gold)] px-8 text-[0.6rem] tracking-[0.5em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
              >
                Aggiorna il questionario
              </Link>
            </div>
          </div>
        )}

        {(hasQuestionnaire !== true || questionnaireConfirmed) && (
        <>
        <h1 className="font-serif text-3xl text-[color:var(--gold)]">Scegli un giorno</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Uno slot disponibile per giorno. La richiesta sarà confermata personalmente.
        </p>

        <div className="mt-12 border border-[color:var(--border)] bg-card/40 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Mese precedente"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-muted-foreground transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <p className="font-serif text-xl italic capitalize text-foreground md:text-2xl">
              {month.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Mese successivo"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-muted-foreground transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-y-1 text-center text-[0.55rem] tracking-[0.35em] uppercase text-muted-foreground/70">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
              <div key={d} className="pb-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISO(d);
              const isPast = iso < today;
              const isTaken = taken.has(iso);
              const isClosed = closed.has(iso);
              const disabled = isPast || isTaken || isClosed;
              const isSel = selected === iso;
              const isToday = iso === today;
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => setSelected(iso)}
                  className={`group relative aspect-square font-serif text-base transition-all duration-200 ${
                    disabled
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : isSel
                      ? "bg-[color:var(--gold)] text-background shadow-lg"
                      : "text-foreground hover:bg-[color:var(--gold)]/10 hover:text-[color:var(--gold)]"
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    {d.getDate()}
                  </span>
                  {isToday && !isSel && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[color:var(--gold)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[color:var(--border)] pt-5 text-[0.55rem] tracking-[0.35em] uppercase text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--gold)]" /> Selezionato
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full border border-[color:var(--gold)]" /> Oggi
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> Non disponibile
            </span>
          </div>
        </div>

        {selected && (
          <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--border)] pt-8">
            <p className="text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground">Data scelta</p>
            <p className="font-serif text-2xl">
              {new Date(selected).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <label className="mt-4 flex flex-col gap-2">
              <span className="text-[0.6rem] tracking-[0.35em] uppercase text-muted-foreground">Note (facoltativo)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full bg-transparent border-b border-[color:var(--border)] pb-2 pt-1 text-sm focus:border-[color:var(--gold)] focus:outline-none"
              />
            </label>
            <button
              onClick={submit}
              disabled={submitting}
              className="mt-4 inline-flex h-12 items-center justify-center bg-black px-8 text-[0.65rem] tracking-[0.5em] uppercase text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Invio…" : "Invia richiesta"}
            </button>
          </div>
        )}
        </>
        )}
      </div>
      )}
    </main>
  );
}