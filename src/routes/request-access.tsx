import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/request-access")({
  head: () => ({ meta: [{ title: "Request Access — THE ROOM" }] }),
  component: RequestAccessPage,
});

const Schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(100),
  last_name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(3, "Required").max(40),
  instagram: z.string().trim().max(100).optional().or(z.literal("")),
  how_heard: z.string().trim().max(500).optional().or(z.literal("")),
});

function RequestAccessPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = Schema.safeParse(Object.fromEntries(fd.entries()));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("access_requests").insert({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      instagram: parsed.data.instagram || null,
      how_heard: parsed.data.how_heard || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    navigate({ to: "/request-received" });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link to="/welcome" className="text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-foreground">
          ← Back
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <BrandLogo className="w-[200px]" />
          <h1 className="mt-10 brand-title text-sm">Request Access</h1>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Tell us a little about yourself. Each request is reviewed personally.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6">
          <Field name="first_name" label="First name" required />
          <Field name="last_name" label="Last name" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="phone" label="Phone" required />
          <Field name="instagram" label="Instagram (optional)" placeholder="@username" />
          <Field
            name="how_heard"
            label="How did you discover The Room?"
            as="textarea"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex h-12 items-center justify-center bg-[color:var(--gold)] px-8 text-[0.7rem] tracking-[0.4em] uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Request Access"}
          </button>
        </form>

        <div className="h-10" />
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  as,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  as?: "textarea";
}) {
  const base =
    "w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 pt-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors";
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.6rem] tracking-[0.35em] uppercase text-muted-foreground">{label}</span>
      {as === "textarea" ? (
        <textarea name={name} rows={3} placeholder={placeholder} className={base} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} className={base} />
      )}
    </label>
  );
}