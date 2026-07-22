import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { deleteAvatar, getAvatarUrl, uploadAvatar } from "@/lib/avatar";
import { notifyBookingChangeRequestCreated } from "@/lib/email.functions";

export const Route = createFileRoute("/_authenticated/account")({
	head: () => ({ meta: [{ title: "Il mio account — THE ROOM" }] }),
	component: AccountPage,
});

type Booking = {
	id: string;
	date: string;
	arrival_time: string | null;
	status: string;
	notes: string | null;
};

type Profile = {
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	instagram: string | null;
	email: string | null;
	avatar_url: string | null;
};

type Questionnaire = {
	hair_type: string | null;
	hair_length: string | null;
	hair_color: string | null;
	treatments: string | null;
	allergies: string | null;
	goals: string | null;
	inspiration: string | null;
	additional: string | null;
	drink_preference: string | null;
	music_taste: string | null;
	updated_at: string | null;
};

function AccountPage() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [profileSaving, setProfileSaving] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarBusy, setAvatarBusy] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
		null,
	);
	const [upcoming, setUpcoming] = useState<Booking[]>([]);
	const [past, setPast] = useState<Booking[]>([]);
	const [changeFor, setChangeFor] = useState<Booking | null>(null);
	const [pwdOpen, setPwdOpen] = useState(false);

	const load = useCallback(async () => {
		if (!user) return;
		const today = new Date().toISOString().slice(0, 10);
		const [{ data: p }, { data: q }, { data: up }, { data: pa }] =
			await Promise.all([
				supabase
					.from("profiles")
					.select("first_name,last_name,phone,instagram,email,avatar_url")
					.eq("id", user.id)
					.maybeSingle(),
				supabase
					.from("questionnaires")
					.select(
						"hair_type,hair_length,hair_color,treatments,allergies,goals,inspiration,additional,drink_preference,music_taste,updated_at",
					)
					.eq("user_id", user.id)
					.maybeSingle(),
				supabase
					.from("bookings")
					.select("id,date,arrival_time,status,notes")
					.eq("user_id", user.id)
					.gte("date", today)
					.order("date", { ascending: true }),
				supabase
					.from("bookings")
					.select("id,date,arrival_time,status,notes")
					.eq("user_id", user.id)
					.lt("date", today)
					.order("date", { ascending: false })
					.limit(50),
			]);
		setProfile((p as Profile) ?? null);
		setAvatarPreview(await getAvatarUrl((p as Profile | null)?.avatar_url));
		setQuestionnaire((q as Questionnaire) ?? null);
		setUpcoming((up ?? []) as Booking[]);
		setPast((pa ?? []) as Booking[]);
	}, [user]);

	useEffect(() => {
		void load();
	}, [load]);

	async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!user || !profile) return;
		setProfileSaving(true);
		const { error } = await supabase
			.from("profiles")
			.update({
				first_name: profile.first_name,
				last_name: profile.last_name,
				phone: profile.phone,
				instagram: profile.instagram,
			})
			.eq("id", user.id);
		setProfileSaving(false);
		if (error) return toast.error(error.message);
		toast.success("Profilo aggiornato");
	}

	async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file || !user) return;
		if (file.size > 8 * 1024 * 1024) {
			toast.error("File troppo grande (max 8MB).");
			return;
		}
		setAvatarBusy(true);
		try {
			const path = await uploadAvatar(user.id, file);
			const { error } = await supabase
				.from("profiles")
				.update({ avatar_url: path })
				.eq("id", user.id);
			if (error) throw error;
			setProfile((prev) => (prev ? { ...prev, avatar_url: path } : prev));
			setAvatarPreview(await getAvatarUrl(path));
			toast.success("Foto profilo aggiornata");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Errore upload");
		} finally {
			setAvatarBusy(false);
		}
	}

	async function onRemoveAvatar() {
		if (!user) return;
		setAvatarBusy(true);
		try {
			await deleteAvatar(user.id);
			await supabase
				.from("profiles")
				.update({ avatar_url: null })
				.eq("id", user.id);
			setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
			setAvatarPreview(null);
			toast.success("Foto rimossa");
		} finally {
			setAvatarBusy(false);
		}
	}

	return (
		<main className="theme-interior min-h-screen bg-background text-foreground font-display">
			<section className="relative">
				<SiteNav tone="dark" />
				<div className="mx-auto max-w-4xl px-6 pt-32 pb-16 md:px-10">
					<p className="text-sm tracking-[0.6em] uppercase text-muted-foreground">
						Area personale
					</p>
					<h1 className="mt-4 font-serif text-5xl leading-tight text-foreground md:text-6xl">
						Il tuo{" "}
						<span className="italic text-[color:var(--gold)]">account</span>
					</h1>
				</div>
			</section>

			<section className="mx-auto max-w-4xl px-6 pb-24 md:px-10 space-y-20">
				{/* Prossimi appuntamenti */}
				<div>
					<h2 className="font-serif text-3xl text-foreground">
						Prossimi appuntamenti
					</h2>
					<ul className="mt-6 divide-y divide-[color:var(--border)]">
						{upcoming.length === 0 && (
							<li className="py-6 text-sm text-muted-foreground">
								Nessun appuntamento in programma.{" "}
								<Link
									to="/book"
									className="text-[color:var(--gold)] hover:underline"
								>
									Prenota
								</Link>
								.
							</li>
						)}
						{upcoming.map((b) => (
							<li
								key={b.id}
								className="flex flex-wrap items-center justify-between gap-3 py-5"
							>
								<div>
									<div className="font-serif text-xl capitalize">
										{new Date(b.date).toLocaleDateString("it-IT", {
											weekday: "long",
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
										{b.arrival_time && (
											<span className="ml-3 text-[color:var(--gold)]">
												{String(b.arrival_time).slice(0, 5)}
											</span>
										)}
									</div>
									<div className="mt-1 text-xs tracking-[0.4em] uppercase text-muted-foreground">
										{b.status === "pending"
											? "In attesa"
											: b.status === "confirmed"
												? "Confermato"
												: b.status === "cancelled"
													? "Annullato"
													: "Rifiutato"}
									</div>
								</div>
								{(b.status === "pending" || b.status === "confirmed") && (
									<button
										onClick={() => setChangeFor(b)}
										className="text-xs tracking-[0.4em] uppercase text-[color:var(--gold)] hover:underline"
									>
										Richiedi cambio orario
									</button>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* Storico */}
				<div>
					<h2 className="font-serif text-3xl text-foreground">Storico</h2>
					<ul className="mt-6 divide-y divide-[color:var(--border)]">
						{past.length === 0 && (
							<li className="py-6 text-sm text-muted-foreground">
								Nessun appuntamento passato.
							</li>
						)}
						{past.map((b) => (
							<li key={b.id} className="flex items-center justify-between py-4">
								<span className="font-serif text-lg capitalize text-foreground/80">
									{new Date(b.date).toLocaleDateString("it-IT", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
									{b.arrival_time && (
										<span className="ml-3 text-sm text-muted-foreground">
											{String(b.arrival_time).slice(0, 5)}
										</span>
									)}
								</span>
								<span className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
									{b.status === "confirmed" ? "Completato" : b.status}
								</span>
							</li>
						))}
					</ul>
				</div>

				{/* Profilo */}
				<div>
					<h2 className="font-serif text-3xl text-foreground">I tuoi dati</h2>
					{profile && (
						<div className="mt-6 flex items-center gap-6">
							<div className="relative h-24 w-24 overflow-hidden rounded-full border border-[color:var(--gold)]/40 bg-black/20">
								{avatarPreview ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={avatarPreview}
										alt="Foto profilo"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center font-serif text-2xl text-[color:var(--gold)]/70">
										{(profile.first_name?.[0] ?? profile.email?.[0] ?? "•").toUpperCase()}
									</div>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									onChange={onPickAvatar}
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={avatarBusy}
									className="text-xs tracking-[0.4em] uppercase text-[color:var(--gold)] hover:underline disabled:opacity-50"
								>
									{avatarBusy ? "…" : avatarPreview ? "Cambia foto" : "Carica foto"}
								</button>
								{avatarPreview && (
									<button
										type="button"
										onClick={onRemoveAvatar}
										disabled={avatarBusy}
										className="text-xs tracking-[0.4em] uppercase text-foreground/60 hover:text-foreground disabled:opacity-50"
									>
										Rimuovi
									</button>
								)}
								<p className="text-[11px] text-muted-foreground">
									JPG/PNG/WEBP · ridimensionata a 512px, max ~500KB.
								</p>
							</div>
						</div>
					)}
					{profile && (
						<form
							onSubmit={saveProfile}
							className="mt-8 grid gap-6 sm:grid-cols-2"
						>
							<AField
								label="Nome"
								value={profile.first_name ?? ""}
								onChange={(v) => setProfile({ ...profile, first_name: v })}
							/>
							<AField
								label="Cognome"
								value={profile.last_name ?? ""}
								onChange={(v) => setProfile({ ...profile, last_name: v })}
							/>
							<AField
								label="Telefono"
								value={profile.phone ?? ""}
								onChange={(v) => setProfile({ ...profile, phone: v })}
							/>
							<AField
								label="Instagram"
								value={profile.instagram ?? ""}
								onChange={(v) => setProfile({ ...profile, instagram: v })}
							/>
							<div className="sm:col-span-2 text-sm text-muted-foreground">
								Email: {profile.email}
							</div>
							<div className="sm:col-span-2">
								<button
									type="submit"
									disabled={profileSaving}
									className="inline-flex h-12 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-8 text-[0.65rem] tracking-[0.55em] uppercase text-background hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
								>
									{profileSaving ? "…" : "Salva"}
								</button>
							</div>
						</form>
					)}
				</div>

				{/* Questionario */}
				<div>
					<h2 className="font-serif text-3xl text-foreground">
						Il tuo questionario
					</h2>
					{questionnaire ? (
						<div className="mt-6 grid gap-6 sm:grid-cols-2">
							{questionnaire.hair_type && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Tipo capelli
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.hair_type}
									</p>
								</div>
							)}
							{questionnaire.hair_length && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Lunghezza
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.hair_length}
									</p>
								</div>
							)}
							{questionnaire.hair_color && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Colore
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.hair_color}
									</p>
								</div>
							)}
							{questionnaire.treatments && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Trattamenti
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.treatments}
									</p>
								</div>
							)}
							{questionnaire.allergies && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Allergie
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.allergies}
									</p>
								</div>
							)}
							{questionnaire.goals && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Obiettivi
									</p>
									<p className="mt-2 text-foreground">{questionnaire.goals}</p>
								</div>
							)}
							{questionnaire.inspiration && (
								<div className="sm:col-span-2">
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Ispirazione
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.inspiration}
									</p>
								</div>
							)}
							{questionnaire.additional && (
								<div className="sm:col-span-2">
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Altro
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.additional}
									</p>
								</div>
							)}
							{questionnaire.drink_preference && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Bevanda
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.drink_preference}
									</p>
								</div>
							)}
							{questionnaire.music_taste && (
								<div>
									<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
										Musica
									</p>
									<p className="mt-2 text-foreground">
										{questionnaire.music_taste}
									</p>
								</div>
							)}
							<div className="sm:col-span-2">
								<p className="text-xs text-muted-foreground">
									Compilato il{" "}
									{questionnaire.updated_at
										? new Date(questionnaire.updated_at).toLocaleDateString(
												"it-IT",
												{ day: "numeric", month: "long", year: "numeric" },
											)
										: ""}
								</p>
								<Link
									to="/questionnaire"
									className="mt-4 inline-flex text-sm tracking-[0.4em] uppercase text-[color:var(--gold)] hover:underline"
								>
									Modifica questionario
								</Link>
							</div>
						</div>
					) : (
						<p className="mt-6 text-sm text-muted-foreground">
							Non hai ancora compilato il questionario.{" "}
							<Link
								to="/questionnaire"
								className="text-[color:var(--gold)] hover:underline"
							>
								Compilalo ora
							</Link>
							.
						</p>
					)}
				</div>

				{/* Sicurezza */}
				<div>
					<h2 className="font-serif text-3xl text-foreground">Sicurezza</h2>
					<button
						onClick={() => setPwdOpen(true)}
						className="mt-4 text-sm tracking-[0.4em] uppercase text-[color:var(--gold)] hover:underline"
					>
						Cambia password
					</button>
				</div>
			</section>

			{changeFor && (
				<ChangeRequestModal
					booking={changeFor}
					userId={user!.id}
					onClose={() => setChangeFor(null)}
					onSent={() => {
						setChangeFor(null);
						toast.success("Richiesta inviata");
					}}
				/>
			)}
			{pwdOpen && <PasswordModal onClose={() => setPwdOpen(false)} />}
		</main>
	);
}

function AField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
				{label}
			</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-3 pt-2 font-serif text-lg text-foreground focus:border-[color:var(--gold)] focus:outline-none"
			/>
		</label>
	);
}

function ChangeRequestModal({
	booking,
	userId,
	onClose,
	onSent,
}: {
	booking: Booking;
	userId: string;
	onClose: () => void;
	onSent: () => void;
}) {
	const [date, setDate] = useState(booking.date);
	const [time, setTime] = useState(booking.arrival_time ?? "");
	const [message, setMessage] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSaving(true);
		const { data, error } = await supabase
			.from("booking_change_requests")
			.insert({
				booking_id: booking.id,
				user_id: userId,
				requested_date: date !== booking.date ? date : null,
				requested_arrival_time:
					time && time !== (booking.arrival_time ?? "") ? time : null,
				message: message || null,
			})
			.select("id")
			.maybeSingle();
		setSaving(false);
		if (error) return toast.error(error.message);
		if (data?.id) {
			notifyBookingChangeRequestCreated({ data: { id: data.id } }).catch(
				() => {},
			);
		}
		onSent();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-md border border-[color:var(--gold)]/40 bg-background p-8">
				<div className="flex items-center justify-between">
					<h3 className="font-italiana text-2xl">Richiedi cambio orario</h3>
					<button
						onClick={onClose}
						className="text-foreground/60 hover:text-foreground"
					>
						✕
					</button>
				</div>
				<p className="mt-2 text-sm text-foreground/70">
					Appuntamento attuale:{" "}
					{new Date(booking.date).toLocaleDateString("it-IT")}
					{booking.arrival_time &&
						` · ${String(booking.arrival_time).slice(0, 5)}`}
				</p>
				<form onSubmit={submit} className="mt-6 flex flex-col gap-5">
					<label className="flex flex-col gap-2">
						<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
							Nuova data
						</span>
						<input
							type="date"
							value={date}
							min={new Date().toISOString().slice(0, 10)}
							onChange={(e) => setDate(e.target.value)}
							className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-2 pt-2 font-serif text-lg focus:border-[color:var(--gold)] focus:outline-none"
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
							Nuovo orario (opzionale)
						</span>
						<input
							type="time"
							value={time}
							onChange={(e) => setTime(e.target.value)}
							className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-2 pt-2 font-serif text-lg focus:border-[color:var(--gold)] focus:outline-none"
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
							Messaggio (opzionale)
						</span>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={3}
							className="w-full !bg-transparent border border-[color:var(--gold)]/30 p-3 font-serif text-base focus:border-[color:var(--gold)] focus:outline-none"
						/>
					</label>
					<button
						type="submit"
						disabled={saving}
						className="inline-flex h-12 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-8 text-[0.65rem] tracking-[0.55em] uppercase text-background hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
					>
						{saving ? "…" : "Invia richiesta"}
					</button>
				</form>
			</div>
		</div>
	);
}

function PasswordModal({ onClose }: { onClose: () => void }) {
	const [pwd, setPwd] = useState("");
	const [confirm, setConfirm] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (pwd.length < 8) return toast.error("Almeno 8 caratteri.");
		if (pwd !== confirm) return toast.error("Le password non coincidono.");
		setSaving(true);
		const { error } = await supabase.auth.updateUser({ password: pwd });
		setSaving(false);
		if (error) return toast.error(error.message);
		toast.success("Password aggiornata");
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-md border border-[color:var(--gold)]/40 bg-background p-8">
				<div className="flex items-center justify-between">
					<h3 className="font-italiana text-2xl">Cambia password</h3>
					<button
						onClick={onClose}
						className="text-foreground/60 hover:text-foreground"
					>
						✕
					</button>
				</div>
				<form onSubmit={submit} className="mt-6 flex flex-col gap-5">
					<label className="flex flex-col gap-2">
						<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
							Nuova password
						</span>
						<input
							type="password"
							value={pwd}
							onChange={(e) => setPwd(e.target.value)}
							required
							className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-2 pt-2 font-serif text-lg focus:border-[color:var(--gold)] focus:outline-none"
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60">
							Conferma
						</span>
						<input
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							required
							className="w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-2 pt-2 font-serif text-lg focus:border-[color:var(--gold)] focus:outline-none"
						/>
					</label>
					<button
						type="submit"
						disabled={saving}
						className="inline-flex h-12 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-8 text-[0.65rem] tracking-[0.55em] uppercase text-background hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-50"
					>
						{saving ? "…" : "Aggiorna"}
					</button>
				</form>
			</div>
		</div>
	);
}
