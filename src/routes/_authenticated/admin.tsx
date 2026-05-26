import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — THE ROOM" }] }),
  component: AdminPage,
});

type Req = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  instagram: string | null;
  how_heard: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Booking = {
  id: string;
  user_id: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  notes: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  instagram?: string | null;
  created_at?: string;
};

type Questionnaire = {
  id: string;
  user_id: string;
  hair_type: string;
  hair_length: string;
  hair_color: string;
  treatments: string | null;
  allergies: string | null;
  goals: string;
  inspiration: string | null;
  additional: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  approved: "Approvate",
  rejected: "Rifiutate",
  confirmed: "Confermate",
  cancelled: "Annullate",
};

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [section, setSection] = useState<"requests" | "bookings" | "availability" | "clients">("requests");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  if (!authLoading && !isAdmin) return <Navigate to="/dashboard" />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <BrandLogo className="w-[90px]" />
          <Link to="/dashboard" className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]">
            ← Dashboard
          </Link>
        </header>

        <h1 className="mt-12 font-serif text-3xl text-[color:var(--gold)]">Area Admin</h1>

        <nav className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-b border-[color:var(--gold)]/20 pb-4">
          {(
            [
              ["requests", "Richieste accesso"],
              ["bookings", "Prenotazioni"],
              ["availability", "Disponibilità"],
              ["clients", "Clienti"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setSection(key); setSelectedClient(null); }}
              className={`text-[0.6rem] tracking-[0.4em] uppercase transition-colors ${
                section === key ? "text-[color:var(--gold)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {section === "requests" && <RequestsSection />}
        {section === "bookings" && <BookingsSection onOpenClient={(id) => { setSection("clients"); setSelectedClient(id); }} />}
        {section === "availability" && <AvailabilitySection />}
        {section === "clients" && (
          selectedClient
            ? <ClientDetail userId={selectedClient} onBack={() => setSelectedClient(null)} />
            : <ClientsList onOpen={setSelectedClient} />
        )}
        <div className="h-16" />
      </div>
    </main>
  );
}

function RequestsSection() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Req[]);
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("access_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approvata" : "Rifiutata");
    void load();
  }

  return (
    <>
      <div className="mt-6 flex gap-6">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[0.55rem] tracking-[0.4em] uppercase ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {STATUS_LABEL[t]}
          </button>
        ))}
      </div>
      <section className="mt-6 flex flex-col divide-y divide-[color:var(--gold)]/15">
        {loading && <p className="py-12 text-center text-xs text-muted-foreground">Caricamento…</p>}
        {!loading && rows.length === 0 && (
          <p className="py-12 text-center text-xs text-muted-foreground">Nessuna richiesta {STATUS_LABEL[tab].toLowerCase()}.</p>
        )}
        {!loading && rows.map((r) => (
          <article key={r.id} className="py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl text-foreground">{r.first_name} {r.last_name}</h2>
              <time className="text-[0.55rem] tracking-[0.3em] uppercase text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("it-IT")}
              </time>
            </div>
            <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <Info label="Email" value={r.email} />
              <Info label="Telefono" value={r.phone} />
              {r.instagram && <Info label="Instagram" value={r.instagram} />}
              {r.how_heard && <Info label="Come ci ha conosciuto" value={r.how_heard} />}
            </dl>
            {tab === "pending" && (
              <div className="mt-5 flex gap-3">
                <button onClick={() => review(r.id, "approved")} className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-[0.6rem] tracking-[0.4em] uppercase text-background hover:opacity-90">Approva</button>
                <button onClick={() => review(r.id, "rejected")} className="inline-flex h-10 items-center justify-center brand-frame px-6 text-[0.6rem] tracking-[0.4em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10">Rifiuta</button>
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  );
}

function BookingsSection() {
  const [tab, setTab] = useState<"pending" | "confirmed" | "cancelled" | "rejected">("pending");
  const [rows, setRows] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", tab)
      .order("date", { ascending: true });
    if (error) { setLoading(false); return toast.error(error.message); }
    const list = (data ?? []) as Booking[];
    setRows(list);
    if (list.length) {
      const ids = Array.from(new Set(list.map((b) => b.user_id)));
      const { data: ps } = await supabase.from("profiles").select("id,email,first_name,last_name").in("id", ids);
      const map: Record<string, Profile> = {};
      (ps ?? []).forEach((p) => { map[p.id] = p as Profile; });
      setProfiles(map);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: "confirmed" | "rejected" | "cancelled") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aggiornato");
    void load();
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-6">
        {(["pending", "confirmed", "cancelled", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[0.55rem] tracking-[0.4em] uppercase ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {STATUS_LABEL[t]}
          </button>
        ))}
      </div>
      <section className="mt-6 flex flex-col divide-y divide-[color:var(--gold)]/15">
        {loading && <p className="py-12 text-center text-xs text-muted-foreground">Caricamento…</p>}
        {!loading && rows.length === 0 && (
          <p className="py-12 text-center text-xs text-muted-foreground">Nessuna prenotazione {STATUS_LABEL[tab].toLowerCase()}.</p>
        )}
        {!loading && rows.map((b) => {
          const p = profiles[b.user_id];
          const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : b.user_id.slice(0, 8);
          return (
            <article key={b.id} className="py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl">
                  {new Date(b.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h2>
                <span className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground">{name}</span>
              </div>
              {p?.email && <p className="mt-1 text-xs text-muted-foreground">{p.email}</p>}
              {b.notes && <p className="mt-3 text-xs text-muted-foreground italic">"{b.notes}"</p>}
              {tab === "pending" && (
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setStatus(b.id, "confirmed")} className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-[0.6rem] tracking-[0.4em] uppercase text-background hover:opacity-90">Conferma</button>
                  <button onClick={() => setStatus(b.id, "rejected")} className="inline-flex h-10 items-center justify-center brand-frame px-6 text-[0.6rem] tracking-[0.4em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10">Rifiuta</button>
                </div>
              )}
              {tab === "confirmed" && (
                <button onClick={() => setStatus(b.id, "cancelled")} className="mt-5 text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]">Annulla</button>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}

function ClosedDaysSection() {
  const [rows, setRows] = useState<{ date: string; reason: string | null }[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("closed_days")
      .select("date,reason")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true });
    setRows(data ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    if (!date) return;
    const { error } = await supabase.from("closed_days").insert({ date, reason: reason || null });
    if (error) return toast.error(error.message);
    setDate(""); setReason("");
    void load();
  }

  async function remove(d: string) {
    const { error } = await supabase.from("closed_days").delete().eq("date", d);
    if (error) return toast.error(error.message);
    void load();
  }

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground">Motivo (facoltativo)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
        </label>
        <button onClick={add} className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-[0.6rem] tracking-[0.4em] uppercase text-background hover:opacity-90">Chiudi giorno</button>
      </div>

      <ul className="mt-8 divide-y divide-[color:var(--gold)]/15">
        {rows.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">Nessun giorno chiuso in programma.</li>}
        {rows.map((r) => (
          <li key={r.date} className="flex items-center justify-between py-4">
            <div>
              <p className="font-serif text-lg">{new Date(r.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
            </div>
            <button onClick={() => remove(r.date)} className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]">Rimuovi</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground/70">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}