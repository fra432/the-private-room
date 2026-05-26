import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/questionnaire")({
	head: () => ({ meta: [{ title: "Questionario — THE ROOM" }] }),
	component: QuestionnairePage,
});

type Form = {
	hair_type: string;
	hair_length: string;
	hair_color: string;
	treatments: string;
	allergies: string;
	goals: string;
	inspiration: string;
	additional: string;
	drink_preference: string;
	music_taste: string;
};

const EMPTY: Form = {
	hair_type: "",
	hair_length: "",
	hair_color: "",
	treatments: "",
	allergies: "",
	goals: "",
	inspiration: "",
	additional: "",
	drink_preference: "",
	music_taste: "",
};

function QuestionnairePage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState<Form>(EMPTY);
	const [existingId, setExistingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!user) return;
		supabase
			.from("questionnaires")
			.select("*")
			.eq("user_id", user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (data) {
					setExistingId(data.id);
					setForm({
						hair_type: data.hair_type ?? "",
						hair_length: data.hair_length ?? "",
						hair_color: data.hair_color ?? "",
						treatments: data.treatments ?? "",
						allergies: data.allergies ?? "",
						goals: data.goals ?? "",
						inspiration: data.inspiration ?? "",
						additional: data.additional ?? "",
						drink_preference: data.drink_preference ?? "",
						music_taste: data.music_taste ?? "",
					});
				}
				setLoading(false);
			});
	}, [user]);

	function set<K extends keyof Form>(k: K, v: string) {
		setForm((f) => ({ ...f, [k]: v }));
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!user) return;
		if (
			!form.hair_type.trim() ||
			!form.hair_length.trim() ||
			!form.hair_color.trim() ||
			!form.goals.trim()
		) {
			toast.error("Compila i campi obbligatori.");
			return;
		}
		setSaving(true);
		const payload = {
			user_id: user.id,
			hair_type: form.hair_type.trim(),
			hair_length: form.hair_length.trim(),
			hair_color: form.hair_color.trim(),
			treatments: form.treatments.trim() || null,
			allergies: form.allergies.trim() || null,
			goals: form.goals.trim(),
			drink_preference: form.drink_preference.trim() || null,
			music_taste: form.music_taste.trim() || null,
			inspiration: form.inspiration.trim() || null,
			additional: form.additional.trim() || null,
		};
		const { error } = existingId
			? await supabase
					.from("questionnaires")
					.update(payload)
					.eq("id", existingId)
			: await supabase.from("questionnaires").insert(payload);
		setSaving(false);
		if (error) {
			toast.error("Impossibile salvare il questionario.");
			return;
		}
		toast.success(
			existingId ? "Questionario aggiornato." : "Grazie, ora puoi prenotare.",
		);
		navigate({ to: "/book" });
	}

	return (
		<main className="theme-interior min-h-screen bg-background text-foreground">
			<header className="bg-black text-white">
				<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
					<Link to="/dashboard" className="text-white">
						<BrandLogo variant="horizontal" className="h-9 w-auto" />
					</Link>
					<Link
						to="/dashboard"
						className="text-[0.55rem] tracking-[0.4em] uppercase text-white/70 hover:text-white"
					>
						← Dashboard
					</Link>
				</div>
			</header>

			<div className="mx-auto max-w-2xl px-6 py-16">
				<p className="text-[0.6rem] tracking-[0.6em] uppercase text-foreground/60">
					Conosciamoci
				</p>
				<h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
					Questionario di
					<span className="italic text-[color:var(--gold)]">
						{" "}
						presentazione
					</span>
				</h1>
				<p className="mt-6 max-w-xl text-sm leading-relaxed text-foreground/70">
					Per offrirti un servizio davvero su misura, dedicaci un minuto: queste
					informazioni ci aiutano a preparare il tuo appuntamento nei dettagli.
					Potrai aggiornarle quando vorrai.
				</p>

				{loading ? (
					<p className="mt-16 text-xs tracking-[0.4em] uppercase text-muted-foreground">
						…
					</p>
				) : (
					<form onSubmit={submit} className="mt-12 space-y-10">
						<Field
							label="Tipo di capelli *"
							hint="Es. lisci, mossi, ricci, crespi"
							value={form.hair_type}
							onChange={(v) => set("hair_type", v)}
							maxLength={100}
						/>
						<Field
							label="Lunghezza *"
							hint="Es. corti, medi, lunghi, extra-lunghi"
							value={form.hair_length}
							onChange={(v) => set("hair_length", v)}
							maxLength={100}
						/>
						<Field
							label="Colore naturale e attuale *"
							hint="Es. castano scuro, biondo schiarito"
							value={form.hair_color}
							onChange={(v) => set("hair_color", v)}
							maxLength={100}
						/>
						<Area
							label="Trattamenti recenti"
							hint="Decolorazioni, tinte, permanenti, stirature, henné…"
							value={form.treatments}
							onChange={(v) => set("treatments", v)}
						/>
						<Area
							label="Allergie o sensibilità"
							hint="Indica qualsiasi reazione nota a prodotti per capelli."
							value={form.allergies}
							onChange={(v) => set("allergies", v)}
						/>
						<Area
							label="Cosa desideri ottenere *"
							hint="Raccontaci il tuo obiettivo per questo appuntamento."
							value={form.goals}
							onChange={(v) => set("goals", v)}
							required
						/>
						<Area
							label="Ispirazioni"
							hint="Riferimenti, look, stili che ami."
							value={form.inspiration}
							onChange={(v) => set("inspiration", v)}
						/>
						<Area
							label="Note aggiuntive"
							hint="Tutto ciò che pensi sia utile sapere."
							value={form.additional}
							onChange={(v) => set("additional", v)}
						/>
						<Select
							label="Preferenza bevanda"
							hint="Cosa preferisci bere durante l'appuntamento?"
							value={form.drink_preference}
							onChange={(v) => set("drink_preference", v)}
							options={[
								{ label: "Caffè", value: "caffè" },
								{ label: "Tè", value: "tè" },
							]}
						/>
						<Area
							label="Gusti musicali"
							hint="Raccontaci la musica che ami, quella che ti fa sentire bene."
							value={form.music_taste}
							onChange={(v) => set("music_taste", v)}
						/>
						<div className="flex items-center justify-between border-t border-[color:var(--border)] pt-8">
							<Link
								to="/dashboard"
								className="text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground hover:text-foreground"
							>
								Annulla
							</Link>
							<button
								type="submit"
								disabled={saving}
								className="inline-flex h-12 items-center justify-center border border-foreground/70 bg-transparent px-10 text-[0.6rem] tracking-[0.5em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
							>
								{saving
									? "Salvataggio…"
									: existingId
										? "Aggiorna"
										: "Salva e prenota"}
							</button>
						</div>
					</form>
				)}
			</div>
		</main>
	);
}

function Field(props: {
	label: string;
	hint?: string;
	value: string;
	onChange: (v: string) => void;
	maxLength?: number;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
				{props.label}
			</span>
			<input
				type="text"
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
				maxLength={props.maxLength}
				className="w-full bg-transparent border-b border-foreground/30 pb-2 pt-1 text-base text-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
			{props.hint && (
				<span className="text-xs text-foreground/55">{props.hint}</span>
			)}
		</label>
	);
}

function Area(props: {
	label: string;
	hint?: string;
	value: string;
	onChange: (v: string) => void;
	required?: boolean;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
				{props.label}
			</span>
			<textarea
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
				rows={3}
				maxLength={2000}
				required={props.required}
				className="w-full resize-none bg-transparent border-b border-foreground/30 pb-2 pt-1 text-base text-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
			{props.hint && (
				<span className="text-xs text-foreground/55">{props.hint}</span>
			)}
		</label>
	);
}

function Select(props: {
	label: string;
	hint?: string;
	value: string;
	onChange: (v: string) => void;
	options: Array<{ label: string; value: string }>;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
				{props.label}
			</span>
			<select
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
				className="w-full bg-transparent border-b border-foreground/30 pb-2 pt-1 text-base text-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			>
				<option value="">Scegli un'opzione</option>
				{props.options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{props.hint && (
				<span className="text-xs text-foreground/55">{props.hint}</span>
			)}
		</label>
	);
}
