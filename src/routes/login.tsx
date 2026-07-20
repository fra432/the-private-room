import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BackArrow } from "@/components/back-arrow";
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
			// Signup is gated: email must have an approved access request
			const { data: statusData } = await supabase.rpc(
				"check_access_email_status",
				{
					_email: parsed.data.email,
				},
			);
			const status = (statusData as string | null) ?? "none";
			if (status === "account_exists") {
				setLoading(false);
				toast.error("Esiste già un account con questa email. Accedi.");
				setMode("login");
				return;
			}
			if (status === "pending") {
				setLoading(false);
				toast.error(
					"La tua richiesta è in valutazione. Ti scriveremo appena approvata.",
				);
				return;
			}
			if (status === "rejected" || status === "none") {
				setLoading(false);
				toast.error(
					status === "none"
						? "Per creare un account devi prima richiedere l'accesso."
						: "La tua richiesta d'accesso non è stata approvata.",
				);
				if (status === "none") navigate({ to: "/request-access" });
				return;
			}
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
		<main className="relative min-h-screen overflow-visible lg:overflow-hidden bg-background text-foreground">
			{/* warm gold vignette */}
			<div className="vignette pointer-events-none absolute inset-0 hidden md:block" />
			{/* subtle ornamental gold lines top/bottom */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/30 to-transparent" />

			<div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
				{/* LEFT — brand panel */}
				<aside className="relative flex flex-col justify-between px-8 py-10 lg:border-r lg:border-[color:var(--gold)]/15 lg:px-14 lg:py-16">
					<Link
						to="/welcome"
						className="group inline-flex items-center gap-3 self-start text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
					>
						<BackArrow />
						<span className="hidden md:inline">Indietro</span>
					</Link>

					<div className="flex flex-col items-center text-center lg:items-start lg:text-left">
						<BrandLogo className="w-[200px] text-[color:var(--gold)] lg:w-[280px]" />
						<p className="font-serif italic mt-8 max-w-xs text-lg text-foreground/70 lg:text-xl">
							Uno studio privato. Un'ospite alla volta. Lo spazio ti aspetta.
						</p>
					</div>
				</aside>

				{/* RIGHT — form panel */}
				<section className="flex flex-col justify-center overflow-y-auto hide-scrollbar px-8 py-10 lg:overflow-visible lg:px-14 lg:py-16">
					<div className="mx-auto w-full max-w-sm">
						{/* ornamental divider */}
						<div className="flex items-center gap-3 text-[color:var(--gold)]/60">
							<span className="h-px w-10 bg-[color:var(--gold)]/40" />
							<span className="text-[0.65rem] tracking-[0.6em] uppercase text-foreground/80">
								{mode === "login" ? "Accesso riservato" : "Nuovo accesso"}
							</span>
							<span className="h-px flex-1 bg-[color:var(--gold)]/40" />
						</div>

						<h1 className="font-italiana mt-6 text-5xl text-foreground md:text-6xl">
							{mode === "login" ? "Bentornata" : "Crea il tuo accesso"}
						</h1>
						<p className="font-serif italic mt-3 text-lg text-foreground/70">
							{mode === "login"
								? "Inserisci le tue credenziali per entrare."
								: "Iscriviti per essere accolta nello studio."}
						</p>

						<form onSubmit={onSubmit} className="mt-10 flex flex-col gap-7">
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
								className="group relative mt-4 inline-flex h-14 items-center justify-center overflow-hidden border border-[color:var(--gold)] bg-[color:var(--gold)] px-10 text-[0.65rem] tracking-[0.55em] uppercase text-background transition-all hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
							>
								{loading ? "…" : mode === "login" ? "Entra" : "Crea account"}
							</button>
						</form>

						<div className="mt-10 flex flex-col items-center gap-4 text-center">
							<button
								type="button"
								onClick={() => setMode(mode === "login" ? "signup" : "login")}
								className="text-[0.7rem] tracking-[0.45em] uppercase text-foreground/60 transition-colors hover:text-[color:var(--gold)]"
							>
								{mode === "login"
									? "Non hai un account? Registrati"
									: "Hai già accesso? Entra"}
							</button>
							{mode === "login" && (
								<Link
									to="/request-access"
									className="font-serif italic text-base text-[color:var(--gold-soft)] underline-offset-4 hover:underline"
								>
									Richiedi accesso allo studio
								</Link>
							)}
						</div>
					</div>
				</section>
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
			<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
				{label}
			</span>
			<input
				name={name}
				type={type}
				required={required}
				autoComplete={autoComplete}
				className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-4 pt-3 font-serif text-xl tracking-wide text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
		</label>
	);
}
