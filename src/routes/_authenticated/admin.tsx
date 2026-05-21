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

function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
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
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Req[]);
  }, [tab]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!authLoading && !isAdmin) return <Navigate to="/dashboard" />;

  async function review(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("access_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Approved" : "Rejected");
    void load();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <BrandLogo className="w-[90px]" />
          <Link to="/dashboard" className="text-[0.55rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]">
            ← Dashboard
          </Link>
        </header>

        <h1 className="mt-12 font-serif text-3xl text-[color:var(--gold)]">Access Requests</h1>

        <nav className="mt-8 flex gap-8 border-b border-[color:var(--gold)]/20 pb-4">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[0.6rem] tracking-[0.4em] uppercase transition-colors ${
                tab === t ? "text-[color:var(--gold)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <section className="mt-8 flex flex-col divide-y divide-[color:var(--gold)]/15">
          {loading && <p className="py-12 text-center text-xs text-muted-foreground">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="py-12 text-center text-xs text-muted-foreground">No {tab} requests.</p>
          )}
          {!loading &&
            rows.map((r) => (
              <article key={r.id} className="py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl text-foreground">
                    {r.first_name} {r.last_name}
                  </h2>
                  <time className="text-[0.55rem] tracking-[0.3em] uppercase text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </time>
                </div>
                <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <Info label="Email" value={r.email} />
                  <Info label="Phone" value={r.phone} />
                  {r.instagram && <Info label="Instagram" value={r.instagram} />}
                  {r.how_heard && <Info label="How heard" value={r.how_heard} />}
                </dl>
                {tab === "pending" && (
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => review(r.id, "approved")}
                      className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-[0.6rem] tracking-[0.4em] uppercase text-background hover:opacity-90"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => review(r.id, "rejected")}
                      className="inline-flex h-10 items-center justify-center brand-frame px-6 text-[0.6rem] tracking-[0.4em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
        </section>
        <div className="h-16" />
      </div>
    </main>
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