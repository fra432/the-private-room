import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/set-password")({
	head: () => ({ meta: [{ title: "Scegli la tua password — THE ROOM" }] }),
	component: SetPasswordPage,
});

function SetPasswordPage() {
	const navigate = useNavigate();
	const [ready, setReady] = useState(false);
	const [hasSession, setHasSession] = useState(false);
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Supabase auto-processes hash/code in URL on mount.
		// Poll briefly for session so we know the recovery/invite link worked.
		let cancelled = false;
		(async () => {
			for (let i = 0; i < 20; i++) {
				const { data } = await supabase.auth.getSession();
				if (cancelled) return;
				if (data.session) {
					setHasSession(true);
					break;
				}
				await new Promise((r) => setTimeout(r, 150));
			}
			if (!cancelled) setReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (password.length < 8) {
			toast.error("La password deve avere almeno 8 caratteri.");
			return;
		}
		if (password !== confirm) {
			toast.error("Le password non coincidono.");
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.updateUser({ password });
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Password impostata. Benvenuta.");
		navigate({ to: "/dashboard" });
	}

	return (
		<main className="relative min-h-screen bg-background text-foreground">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
			<div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-8 py-16">
				<BrandLogo className="mx-auto w-[180px] text-[color:var(--gold)]" />
				<div className="mt-12 flex items-center gap-3 text-[color:var(--gold)]/60">
					<span className="h-px w-10 bg-[color:var(--gold)]/40" />
					<span className="text-[0.65rem] tracking-[0.6em] uppercase text-foreground/80">
						Scegli la password
					</span>
					<span className="h-px flex-1 bg-[color:var(--gold)]/40" />
				</div>
				<h1 className="font-italiana mt-6 text-4xl">Ci siamo</h1>
				<p className="font-serif italic mt-3 text-lg text-foreground/70">
					Imposta una password per completare il tuo accesso a THE ROOM.
				</p>

				{!ready && (
					<p className="mt-10 text-sm text-foreground/60">Verifica del link…</p>
				)}

				{ready && !hasSession && (
					<div className="mt-10 border border-[color:var(--gold)]/30 p-6 text-sm text-foreground/80">
						<p>
							Il link non è più valido o è scaduto. Torna alla pagina di login e
							clicca "Password dimenticata" per riceverne uno nuovo.
						</p>
						<button
							onClick={() => navigate({ to: "/login" })}
							className="mt-6 text-[0.65rem] tracking-[0.5em] uppercase text-[color:var(--gold)] hover:underline"
						>
							Vai al login
						</button>
					</div>
				)}

				{ready && hasSession && (
					<form onSubmit={onSubmit} className="mt-10 flex flex-col gap-7">
						<Field
							label="Nuova password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={setPassword}
						/>
						<Field
							label="Conferma password"
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={setConfirm}
						/>
						<button
							type="submit"
							disabled={loading}
							className="mt-4 inline-flex h-14 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-10 text-[0.65rem] tracking-[0.55em] uppercase text-background transition-all hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
						>
							{loading ? "…" : "Conferma"}
						</button>
					</form>
				)}
			</div>
		</main>
	);
}

function Field({
	label,
	type,
	autoComplete,
	value,
	onChange,
}: {
	label: string;
	type: string;
	autoComplete?: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
				{label}
			</span>
			<input
				type={type}
				autoComplete={autoComplete}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required
				className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-4 pt-3 font-serif text-xl tracking-wide text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
		</label>
	);
}