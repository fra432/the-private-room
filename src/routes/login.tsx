import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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
				toast.error("Credenziali non valide.");
				return;
			}
			if (typeof window !== "undefined")
				sessionStorage.removeItem("room:intro");
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
			toast.success("Account creato.");
			if (typeof window !== "undefined")
				sessionStorage.removeItem("room:intro");
			navigate({ to: "/dashboard" });
		}
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-background text-foreground">
			{/* warm gold vignette */}
			<div className="vignette pointer-events-none absolute inset-0" />
			{/* subtle ornamental gold lines top/bottom */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/30 to-transparent" />

			<div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-8 py-10">
				<Link
					to="/welcome"
					className="group inline-flex items-center gap-2 self-start text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
				>
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] transition-colors group-hover:border-[color:var(--gold)]">
						<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
					</span>
					Indietro
				</Link>

				<div className="mt-14 flex flex-col items-center text-center">
					<BrandLogo className="w-[180px] text-[color:var(--gold)]" />

					{/* ornamental divider */}
					<div className="mt-12 flex items-center gap-3 text-[color:var(--gold)]/60">
						<span className="h-px w-12 bg-[color:var(--gold)]/40" />
						<span className="text-[0.55rem] tracking-[0.6em] uppercase">
							{mode === "login" ? "Accesso riservato" : "Nuovo accesso"}
						</span>
						<span className="h-px w-12 bg-[color:var(--gold)]/40" />
					</div>

					<h1 className="font-italiana mt-8 text-4xl text-foreground md:text-5xl">
						{mode === "login" ? "Bentornata" : "Crea il tuo accesso"}
					</h1>
					<p className="font-serif italic mt-3 text-base text-muted-foreground">
						{mode === "login"
							? "Lo spazio ti aspetta."
							: "Iscriviti per essere accolta nello studio."}
					</p>
				</div>

				<form onSubmit={onSubmit} className="mt-12 flex flex-col gap-7">
					<Field
						name="email"
						label="Email"
						type="email"
						required
						autoComplete="email"
					/>
					<Field
						name="password"
						label="Password"
						type="password"
						required
						autoComplete={
							mode === "login" ? "current-password" : "new-password"
						}
					/>

					<button
						type="submit"
						disabled={loading}
						className="group relative mt-6 inline-flex h-14 items-center justify-center overflow-hidden border border-[color:var(--gold)] bg-[color:var(--gold)] px-10 text-[0.65rem] tracking-[0.55em] uppercase text-background transition-all hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
					>
						{loading ? "…" : mode === "login" ? "Entra" : "Crea account"}
					</button>
				</form>

				<div className="mt-10 flex flex-col items-center gap-4 text-center">
					<button
						type="button"
						onClick={() => setMode(mode === "login" ? "signup" : "login")}
						className="text-[0.6rem] tracking-[0.45em] uppercase text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
					>
						{mode === "login"
							? "Non hai un account? Registrati"
							: "Hai già accesso? Entra"}
					</button>
					{mode === "login" && (
						<Link
							to="/request-access"
							className="font-serif italic text-sm text-[color:var(--gold-soft)] underline-offset-4 hover:underline"
						>
							Richiedi accesso allo studio
						</Link>
					)}
				</div>

				<p className="mt-auto pt-10 text-center text-[0.5rem] tracking-[0.5em] uppercase text-muted-foreground/60">
					The Room · Private Hair Studio
				</p>
			</div>
		</main>
	);
}

function Field({
	name,
	label,
	type = "text",
	required,
	autoComplete,
}: {
	name: string;
	label: string;
	type?: string;
	required?: boolean;
	autoComplete?: string;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground">
				{label}
			</span>
			<input
				name={name}
				type={type}
				required={required}
				autoComplete={autoComplete}
				className="w-full !bg-transparent border-b border-[color:var(--gold)]/40 pb-3 pt-2 font-serif text-lg tracking-wide text-foreground placeholder:text-muted-foreground/50 focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
		</label>
	);
}
