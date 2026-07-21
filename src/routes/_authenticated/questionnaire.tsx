import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BackArrow } from "@/components/back-arrow";
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

type GoalImage = { path: string; url: string };
const BUCKET = "questionnaire-images";
const MAX_IMAGES = 6;
const MAX_SIZE = 5 * 1024 * 1024;

function QuestionnairePage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState<Form>(EMPTY);
	const [existingId, setExistingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [images, setImages] = useState<GoalImage[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!user) return;
		supabase
			.from("questionnaires")
			.select("*")
			.eq("user_id", user.id)
			.maybeSingle()
			.then(async ({ data }) => {
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
					const paths: string[] =
						(data as { goal_images?: string[] }).goal_images ?? [];
					if (paths.length) {
						const signed = await Promise.all(
							paths.map(async (p) => {
								const { data: s } = await supabase.storage
									.from(BUCKET)
									.createSignedUrl(p, 3600);
								return { path: p, url: s?.signedUrl ?? "" };
							}),
						);
						setImages(signed.filter((i) => i.url));
					}
				}
				setLoading(false);
			});
	}, [user]);

	function set<K extends keyof Form>(k: K, v: string) {
		setForm((f) => ({ ...f, [k]: v }));
	}

	async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
		if (!user) return;
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (!files.length) return;
		if (images.length + files.length > MAX_IMAGES) {
			toast.error(`Massimo ${MAX_IMAGES} immagini.`);
			return;
		}
		setUploading(true);
		const added: GoalImage[] = [];
		for (const file of files) {
			if (!file.type.startsWith("image/")) {
				toast.error(`${file.name}: non è un'immagine.`);
				continue;
			}
			if (file.size > MAX_SIZE) {
				toast.error(`${file.name}: massimo 5MB.`);
				continue;
			}
			const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
			const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
			const { error } = await supabase.storage
				.from(BUCKET)
				.upload(path, file, { contentType: file.type });
			if (error) {
				toast.error(`Errore caricamento ${file.name}.`);
				continue;
			}
			const { data: s } = await supabase.storage
				.from(BUCKET)
				.createSignedUrl(path, 3600);
			added.push({ path, url: s?.signedUrl ?? "" });
		}
		setImages((prev) => [...prev, ...added]);
		setUploading(false);
	}

	async function removeImage(path: string) {
		await supabase.storage.from(BUCKET).remove([path]);
		setImages((prev) => prev.filter((i) => i.path !== path));
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
			goal_images: images.map((i) => i.path),
		};
		const { error } = existingId
			? await supabase
					.from("questionnaires")
					.update(payload)
					.eq("id", existingId)
			: await supabase.from("questionnaires").insert(payload);

		if (error) {
			setSaving(false);
			toast.error("Impossibile salvare il questionario.");
			return;
		}

		// Se è il primo completamento (non existingId), crea il profilo
		if (!existingId) {
			const profileData = {
				id: user.id,
				email: user.email || "",
				first_name: "",
				last_name: "",
			};
			const { error: profileError } = await supabase
				.from("profiles")
				.insert(profileData);

			if (profileError) {
				console.error("Errore creazione profilo:", profileError);
				toast.error("Profilo creato parzialmente, aggiorna la pagina.");
			}
		}

		setSaving(false);
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
						className="inline-flex items-center gap-2.5 text-[0.55rem] tracking-[0.4em] uppercase text-white/70 transition-colors hover:text-white"
					>
						<BackArrow className="h-7 w-7" />
						Dashboard
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
					<p className="mt-16 text-sm tracking-[0.4em] uppercase text-muted-foreground">
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
							hint="Raccontaci il tuo obiettivo per questo appuntamento e, se vuoi, aggiungi immagini di riferimento qui sotto."
							value={form.goals}
							onChange={(v) => set("goals", v)}
							required
						/>
						<div className="flex flex-col gap-3 -mt-4">
							<span className="text-[0.6rem] tracking-[0.4em] uppercase text-foreground/60">
								Immagini di riferimento
							</span>
							{images.length > 0 && (
								<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
									{images.map((img) => (
										<div
											key={img.path}
											className="relative aspect-square overflow-hidden border border-foreground/15 bg-foreground/5"
										>
											<img
												src={img.url}
												alt="Riferimento"
												className="h-full w-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removeImage(img.path)}
												className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
												aria-label="Rimuovi immagine"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										</div>
									))}
								</div>
							)}
							{images.length < MAX_IMAGES && (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={uploading}
									className="inline-flex items-center justify-center gap-2 self-start border border-dashed border-foreground/30 px-5 py-3 text-[0.6rem] tracking-[0.4em] uppercase text-foreground/70 hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
								>
									<ImagePlus className="h-4 w-4" />
									{uploading ? "Caricamento…" : "Aggiungi immagini"}
								</button>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								multiple
								onChange={onFiles}
								className="hidden"
							/>
							<span className="text-sm text-foreground/55">
								Fino a {MAX_IMAGES} immagini, max 5MB ciascuna.
							</span>
						</div>
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
			<span className="text-sm font-medium tracking-[0.3em] uppercase text-foreground">
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
				<span className="text-sm text-foreground/55">{props.hint}</span>
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
			<span className="text-sm font-medium tracking-[0.3em] uppercase text-foreground">
				{props.label}
			</span>
			<textarea
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
				rows={2}
				maxLength={2000}
				required={props.required}
				className="w-full resize-none bg-transparent border-b border-foreground/30 pb-2 text-base text-foreground focus:border-[color:var(--gold)] focus:outline-none transition-colors"
			/>
			{props.hint && (
				<span className="text-sm text-foreground/55">{props.hint}</span>
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
			<span className="text-sm font-medium tracking-[0.3em] uppercase text-foreground">
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
				<span className="text-sm text-foreground/55">{props.hint}</span>
			)}
		</label>
	);
}
