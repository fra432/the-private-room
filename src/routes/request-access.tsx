import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BackArrow } from "@/components/back-arrow";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { notifyAccessRequestCreated } from "@/lib/email.functions";

export const Route = createFileRoute("/request-access")({
	head: () => ({ meta: [{ title: "Request Access — THE ROOM" }] }),
	component: RequestAccessPage,
});

const Schema = z.object({
	first_name: z.string().trim().min(1, "Obbligatorio").max(100),
	last_name: z.string().trim().min(1, "Obbligatorio").max(100),
	email: z.string().trim().email("Email non valida").max(255),
	phone: z.string().trim().min(3, "Obbligatorio").max(40),
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
		const { data: inserted, error } = await supabase.from("access_requests").insert({
			first_name: parsed.data.first_name,
			last_name: parsed.data.last_name,
			email: parsed.data.email,
			phone: parsed.data.phone,
			instagram: parsed.data.instagram || null,
			how_heard: parsed.data.how_heard || null,
		}).select("id").maybeSingle();
		setLoading(false);
		if (error) {
			toast.error("Invio non riuscito. Riprova.");
			return;
		}
		if (inserted?.id) {
			notifyAccessRequestCreated({ data: { id: inserted.id } }).catch(() => {});
		}
		navigate({ to: "/request-received" });
	}

	return (
		<main className="relative h-screen overflow-hidden bg-background text-foreground">
			{/* warm gold vignette */}
			<div className="vignette pointer-events-none absolute inset-0" />
			{/* subtle ornamental gold lines top/bottom */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/30 to-transparent" />

			<div className="relative mx-auto grid h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
				{/* LEFT — brand panel */}
				<aside className="relative flex flex-col justify-between px-8 py-10 lg:border-r lg:border-[color:var(--gold)]/15 lg:px-14 lg:py-16 h-screen overflow-hidden">
					<Link
						to="/welcome"
						className="group inline-flex items-center gap-3 self-start text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
					>
						<BackArrow />
						Indietro
					</Link>

					<div className="flex flex-col items-center text-center lg:items-start lg:text-left">
						<BrandLogo className="w-[200px] text-[color:var(--gold)] lg:w-[280px]" />
						<p className="font-serif italic mt-8 max-w-xs text-lg text-foreground/70 lg:text-xl">
							Raccontaci qualcosa di te. Ogni richiesta è valutata
							personalmente.
						</p>
					</div>
				</aside>

				{/* RIGHT — form panel */}
				<section className="flex flex-col justify-start px-8 py-10 lg:px-14 lg:py-16 overflow-y-auto hide-scrollbar">
					<div className="mx-auto w-full max-w-sm">
						{/* ornamental divider */}
						<div className="flex items-center gap-3 text-[color:var(--gold)]/60">
							<span className="h-px w-10 bg-[color:var(--gold)]/40" />
							<span className="text-[0.65rem] tracking-[0.6em] uppercase text-foreground/80 font-medium">
								Nuova richiesta
							</span>
							<span className="h-px flex-1 bg-[color:var(--gold)]/40" />
						</div>

						<h1 className="font-italiana mt-4 text-4xl text-foreground md:text-5xl">
							Richiedi accesso
						</h1>
						<p className="font-serif italic mt-2 text-base text-foreground/70">
							Il nostro team valuterà la tua richiesta.
						</p>

						<form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
							<Field name="first_name" label="Nome" required />
							<Field name="last_name" label="Cognome" required />
							<Field name="email" label="Email" type="email" required />
							<Field name="phone" label="Telefono" required />
							<Field
								name="instagram"
								label="Instagram (facoltativo)"
								placeholder="@username"
							/>
							<Field
								name="how_heard"
								label="Come hai scoperto The Room?"
								as="textarea"
							/>

							<button
								type="submit"
								disabled={loading}
								className="group relative mt-4 inline-flex h-14 items-center justify-center overflow-hidden border border-[color:var(--gold)] bg-[color:var(--gold)] px-10 text-[0.65rem] tracking-[0.55em] uppercase text-background transition-all hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
							>
								{loading ? "Invio…" : "Invia richiesta"}
							</button>
						</form>
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
		"w-full bg-transparent border-b border-[color:var(--gold)]/50 pb-4 pt-3 font-serif text-xl tracking-wide text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors";
	return (
		<label className="flex flex-col gap-2">
			<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
				{label}
			</span>
			{as === "textarea" ? (
				<textarea
					name={name}
					rows={3}
					placeholder={placeholder}
					className={base}
				/>
			) : (
				<input
					name={name}
					type={type}
					required={required}
					placeholder={placeholder}
					className={base}
				/>
			)}
		</label>
	);
}
