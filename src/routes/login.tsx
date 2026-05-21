import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — THE ROOM" }] }),
  component: LoginPage,
});

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  if (!authLoading && session) return <Navigate to="/dashboard" />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = LoginSchema.safeParse(Object.fromEntries(fd.entries()));
    if (!parsed.success) {
      toast.error("Please enter a valid email and password (min 6 chars).");
      return;
    }
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created.");
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-10">
        <Link to="/welcome" className="text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-foreground">
          ← Back
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <BrandLogo className="w-[200px]" />
          <h1 className="mt-10 brand-title text-sm">
            {mode === "login" ? "Welcome back" : "Create access"}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6">
          <Field name="email" label="Email" type="email" required />
          <Field name="password" label="Password" type="password" required />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex h-12 items-center justify-center bg-[color:var(--gold)] px-8 text-[0.7rem] tracking-[0.4em] uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : mode === "login" ? "Enter" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-8 text-center text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground hover:text-[color:var(--gold)]"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have access? Login"}
        </button>
      </div>
    </main>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.6rem] tracking-[0.35em] uppercase text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 pt-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors"
      />
    </label>
  );
}