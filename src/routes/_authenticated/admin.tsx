import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BackArrow } from "@/components/back-arrow";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { notifyAccessRequestDecision, notifyBookingDecision } from "@/lib/email.functions";

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

type Booking = {
	id: string;
	user_id: string;
	date: string;
	status: "pending" | "confirmed" | "cancelled" | "rejected";
	notes: string | null;
	created_at: string;
};

type Profile = {
	id: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	phone?: string | null;
	instagram?: string | null;
	created_at?: string;
};

type Questionnaire = {
	id: string;
	user_id: string;
	hair_type: string;
	hair_length: string;
	hair_color: string;
	treatments: string | null;
	allergies: string | null;
	goals: string;
	inspiration: string | null;
	additional: string | null;
	drink_preference: string | null;
	music_taste: string | null;
};

const STATUS_LABEL: Record<string, string> = {
	pending: "In attesa",
	approved: "Approvate",
	rejected: "Rifiutate",
	confirmed: "Confermate",
	cancelled: "Annullate",
};

const DAYS = [
	"Domenica",
	"Lunedì",
	"Martedì",
	"Mercoledì",
	"Giovedì",
	"Venerdì",
	"Sabato",
];

function AdminPage() {
	const { isAdmin, loading: authLoading } = useAuth();
	const [section, setSection] = useState<
		"requests" | "bookings" | "availability" | "clients"
	>("requests");
	const [selectedClient, setSelectedClient] = useState<string | null>(null);

	if (!authLoading && !isAdmin) return <Navigate to="/dashboard" />;

	return (
		<main className="theme-interior min-h-screen bg-background font-display text-[16px] text-foreground antialiased md:text-[17px]">
			<div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:px-8">
				<header className="flex items-center justify-end">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2.5 text-lg font-medium tracking-[0.08em] uppercase text-foreground/70 transition-colors hover:text-[color:var(--gold)]"
					>
						<BackArrow />
						Dashboard
					</Link>
				</header>

				<h1 className="mt-12 font-serif text-4xl text-[color:var(--gold)]">
					Area Admin
				</h1>

				<nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-b border-[color:var(--gold)]/20 pb-4">
					{(
						[
							["requests", "Richieste accesso"],
							["bookings", "Prenotazioni"],
							["availability", "Disponibilità"],
							["clients", "Clienti"],
						] as const
					).map(([key, label]) => (
						<button
							key={key}
							onClick={() => {
								setSection(key);
								setSelectedClient(null);
							}}
							className={`text-lg tracking-[0.08em] uppercase font-medium transition-colors ${
								section === key
									? "text-[color:var(--gold)]"
									: "text-foreground/70 hover:text-foreground"
							}`}
						>
							{label}
						</button>
					))}
				</nav>

				{section === "requests" && <RequestsSection />}
				{section === "bookings" && (
					<BookingsSection
						onOpenClient={(id) => {
							setSection("clients");
							setSelectedClient(id);
						}}
					/>
				)}
				{section === "availability" && <AvailabilitySection />}
				{section === "clients" &&
					(selectedClient ? (
						<ClientDetail
							userId={selectedClient}
							onBack={() => setSelectedClient(null)}
						/>
					) : (
						<ClientsList onOpen={setSelectedClient} />
					))}
				<div className="h-16" />
			</div>
		</main>
	);
}

function RequestsSection() {
	const [tab, setTab] = useState<"pending" | "approved" | "rejected">(
		"pending",
	);
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
		if (error) return toast.error(error.message);
		setRows((data ?? []) as Req[]);
	}, [tab]);

	useEffect(() => {
		void load();
	}, [load]);

	async function review(id: string, status: "approved" | "rejected") {
		const { error } = await supabase
			.from("access_requests")
			.update({ status, reviewed_at: new Date().toISOString() })
			.eq("id", id);
		if (error) return toast.error(error.message);
		notifyAccessRequestDecision({ data: { id, status } }).catch(() => {});
		toast.success(status === "approved" ? "Approvata" : "Rifiutata");
		void load();
	}

	return (
		<>
			<div className="mt-6 flex gap-6">
				{(["pending", "approved", "rejected"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`text-lg tracking-[0.08em] uppercase font-medium ${tab === t ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`}
					>
						{STATUS_LABEL[t]}
					</button>
				))}
			</div>
			<section className="mt-6 flex flex-col divide-y divide-[color:var(--gold)]/15">
				{loading && (
					<p className="py-12 text-center text-lg text-foreground/70">
						Caricamento…
					</p>
				)}
				{!loading && rows.length === 0 && (
					<p className="py-12 text-center text-lg text-foreground/70">
						Nessuna richiesta {STATUS_LABEL[tab].toLowerCase()}.
					</p>
				)}
				{!loading &&
					rows.map((r) => (
						<article key={r.id} className="py-6">
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<h2 className="font-serif text-xl text-foreground">
									{r.first_name} {r.last_name}
								</h2>
								<time className="text-lg tracking-[0.08em] uppercase text-foreground/70">
									{new Date(r.created_at).toLocaleDateString("it-IT")}
								</time>
							</div>
							<dl className="mt-4 grid gap-2 text-lg text-foreground/70 sm:grid-cols-2">
								<Info label="Email" value={r.email} />
								<Info label="Telefono" value={r.phone} />
								{r.instagram && <Info label="Instagram" value={r.instagram} />}
								{r.how_heard && (
									<Info label="Come ci ha conosciuto" value={r.how_heard} />
								)}
							</dl>
							{tab === "pending" && (
								<div className="mt-5 flex gap-3">
									<button
										onClick={() => review(r.id, "approved")}
										className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-lg tracking-[0.08em] uppercase font-semibold text-background hover:opacity-90"
									>
										Approva
									</button>
									<button
										onClick={() => review(r.id, "rejected")}
										className="inline-flex h-10 items-center justify-center brand-frame px-6 text-lg tracking-[0.08em] uppercase font-semibold text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
									>
										Rifiuta
									</button>
								</div>
							)}
						</article>
					))}
			</section>
		</>
	);
}

function BookingsSection({
	onOpenClient,
}: {
	onOpenClient: (userId: string) => void;
}) {
	const [tab, setTab] = useState<
		"pending" | "confirmed" | "cancelled" | "rejected"
	>("pending");
	const [rows, setRows] = useState<Booking[]>([]);
	const [profiles, setProfiles] = useState<Record<string, Profile>>({});
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("bookings")
			.select("*")
			.eq("status", tab)
			.order("date", { ascending: true });
		if (error) {
			setLoading(false);
			return toast.error(error.message);
		}
		const list = (data ?? []) as Booking[];
		setRows(list);
		if (list.length) {
			const ids = Array.from(new Set(list.map((b) => b.user_id)));
			const { data: ps } = await supabase
				.from("profiles")
				.select("id,email,first_name,last_name")
				.in("id", ids);
			const map: Record<string, Profile> = {};
			(ps ?? []).forEach((p) => {
				map[p.id] = p as Profile;
			});
			setProfiles(map);
		}
		setLoading(false);
	}, [tab]);

	useEffect(() => {
		void load();
	}, [load]);

	async function setStatus(
		id: string,
		status: "confirmed" | "rejected" | "cancelled",
	) {
		const { error } = await supabase
			.from("bookings")
			.update({ status })
			.eq("id", id);
		if (error) return toast.error(error.message);
		notifyBookingDecision({ data: { id, status } }).catch(() => {});
		toast.success("Aggiornato");
		void load();
	}

	return (
		<>
			<div className="mt-6 flex flex-wrap gap-6">
				{(["pending", "confirmed", "cancelled", "rejected"] as const).map(
					(t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							className={`text-lg tracking-[0.08em] uppercase ${tab === t ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`}
						>
							{STATUS_LABEL[t]}
						</button>
					),
				)}
			</div>
			<section className="mt-6 flex flex-col divide-y divide-[color:var(--gold)]/15">
				{loading && (
					<p className="py-12 text-center text-lg text-foreground/70">
						Caricamento…
					</p>
				)}
				{!loading && rows.length === 0 && (
					<p className="py-12 text-center text-lg text-foreground/70">
						Nessuna prenotazione {STATUS_LABEL[tab].toLowerCase()}.
					</p>
				)}
				{!loading &&
					rows.map((b) => {
						const p = profiles[b.user_id];
						const name = p
							? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email
							: b.user_id.slice(0, 8);
						return (
							<article key={b.id} className="py-6">
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<h2 className="font-serif text-xl">
										{new Date(b.date).toLocaleDateString("it-IT", {
											weekday: "long",
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</h2>
									<button
										onClick={() => onOpenClient(b.user_id)}
										className="text-lg tracking-[0.08em] uppercase text-[color:var(--gold)] hover:underline underline-offset-4"
									>
										{name} ↗
									</button>
								</div>
								{p?.email && (
									<p className="mt-1 text-lg text-foreground/70">{p.email}</p>
								)}
								{b.notes && (
									<p className="mt-3 text-lg text-foreground/70 italic">
										"{b.notes}"
									</p>
								)}
								{tab === "pending" && (
									<div className="mt-5 flex gap-3">
										<button
											onClick={() => setStatus(b.id, "confirmed")}
											className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-lg tracking-[0.08em] uppercase text-background hover:opacity-90"
										>
											Conferma
										</button>
										<button
											onClick={() => setStatus(b.id, "rejected")}
											className="inline-flex h-10 items-center justify-center brand-frame px-6 text-lg tracking-[0.08em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
										>
											Rifiuta
										</button>
									</div>
								)}
								{tab === "confirmed" && (
									<button
										onClick={() => setStatus(b.id, "cancelled")}
										className="mt-5 text-lg tracking-[0.08em] uppercase text-foreground/70 hover:text-[color:var(--gold)]"
									>
										Annulla
									</button>
								)}
							</article>
						);
					})}
			</section>
		</>
	);
}

function AvailabilitySection() {
	return (
		<section className="mt-2">
			<WeeklyHoursEditor />
			<div className="mt-12 h-px bg-[color:var(--gold)]/15" />
			<ClosedDaysEditor />
		</section>
	);
}

type WeeklyRow = {
	day_of_week: number;
	is_closed: boolean;
	open_time: string | null;
	close_time: string | null;
};

function WeeklyHoursEditor() {
	const [rows, setRows] = useState<WeeklyRow[]>([]);
	const [saving, setSaving] = useState<number | null>(null);

	const load = useCallback(async () => {
		const { data, error } = await supabase
			.from("weekly_hours")
			.select("day_of_week,is_closed,open_time,close_time")
			.order("day_of_week");
		if (error) return toast.error(error.message);
		setRows((data ?? []) as WeeklyRow[]);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function save(row: WeeklyRow) {
		setSaving(row.day_of_week);
		const { error } = await supabase
			.from("weekly_hours")
			.update({
				is_closed: row.is_closed,
				open_time: row.is_closed ? null : row.open_time,
				close_time: row.is_closed ? null : row.close_time,
			})
			.eq("day_of_week", row.day_of_week);
		setSaving(null);
		if (error) return toast.error(error.message);
		toast.success("Salvato");
	}

	function update(day: number, patch: Partial<WeeklyRow>) {
		setRows((rs) =>
			rs.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)),
		);
	}

	return (
		<div>
			<h2 className="font-serif text-xl text-[color:var(--gold)]">
				Orari settimanali
			</h2>
			<p className="mt-2 text-lg text-foreground/70">
				Imposta gli orari di apertura standard. I giorni segnati come chiusi non
				saranno prenotabili.
			</p>
			<ul className="mt-6 divide-y divide-[color:var(--gold)]/15">
				{rows.map((r) => (
					<li
						key={r.day_of_week}
						className="flex flex-wrap items-center gap-4 py-4"
					>
						<span className="w-28 font-serif text-lg">
							{DAYS[r.day_of_week]}
						</span>
						<label className="flex items-center gap-2 text-lg tracking-[0.08em] uppercase text-foreground/70">
							<input
								type="checkbox"
								checked={r.is_closed}
								onChange={(e) =>
									update(r.day_of_week, { is_closed: e.target.checked })
								}
								className="accent-[color:var(--gold)]"
							/>
							Chiuso
						</label>
						{!r.is_closed && (
							<>
								<input
									type="time"
									value={r.open_time?.slice(0, 5) ?? ""}
									onChange={(e) =>
										update(r.day_of_week, { open_time: e.target.value })
									}
									className="bg-transparent border-b border-[color:var(--gold)]/40 pb-1 text-lg focus:border-[color:var(--gold)] focus:outline-none"
								/>
								<span className="text-foreground/70">—</span>
								<input
									type="time"
									value={r.close_time?.slice(0, 5) ?? ""}
									onChange={(e) =>
										update(r.day_of_week, { close_time: e.target.value })
									}
									className="bg-transparent border-b border-[color:var(--gold)]/40 pb-1 text-lg focus:border-[color:var(--gold)] focus:outline-none"
								/>
							</>
						)}
						<button
							onClick={() => save(r)}
							disabled={saving === r.day_of_week}
							className="ml-auto text-lg tracking-[0.08em] uppercase text-[color:var(--gold)] hover:underline disabled:opacity-50"
						>
							{saving === r.day_of_week ? "…" : "Salva"}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

function ClosedDaysEditor() {
	const [rows, setRows] = useState<{ date: string; reason: string | null }[]>(
		[],
	);
	const [date, setDate] = useState("");
	const [reason, setReason] = useState("");

	const load = useCallback(async () => {
		const { data } = await supabase
			.from("closed_days")
			.select("date,reason")
			.gte("date", new Date().toISOString().slice(0, 10))
			.order("date", { ascending: true });
		setRows(data ?? []);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function add() {
		if (!date) return;
		const { error } = await supabase
			.from("closed_days")
			.insert({ date, reason: reason || null });
		if (error) return toast.error(error.message);
		setDate("");
		setReason("");
		void load();
	}

	async function remove(d: string) {
		const { error } = await supabase.from("closed_days").delete().eq("date", d);
		if (error) return toast.error(error.message);
		void load();
	}

	return (
		<section className="mt-10">
			<h2 className="font-serif text-xl text-[color:var(--gold)]">
				Giorni di chiusura straordinaria
			</h2>
			<p className="mt-2 text-lg text-foreground/70">
				Vacanze, festività o giorni di pausa al di fuori della settimana
				standard.
			</p>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<label className="flex flex-1 flex-col gap-2">
					<span className="text-lg tracking-[0.08em] uppercase text-foreground/70">
						Data
					</span>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 text-lg focus:border-[color:var(--gold)] focus:outline-none"
					/>
				</label>
				<label className="flex flex-1 flex-col gap-2">
					<span className="text-lg tracking-[0.08em] uppercase text-foreground/70">
						Motivo (facoltativo)
					</span>
					<input
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 text-lg focus:border-[color:var(--gold)] focus:outline-none"
					/>
				</label>
				<button
					onClick={add}
					className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-lg tracking-[0.08em] uppercase text-background hover:opacity-90"
				>
					Chiudi giorno
				</button>
			</div>

			<ul className="mt-8 divide-y divide-[color:var(--gold)]/15">
				{rows.length === 0 && (
					<li className="py-8 text-center text-lg text-foreground/70">
						Nessun giorno chiuso in programma.
					</li>
				)}
				{rows.map((r) => (
					<li key={r.date} className="flex items-center justify-between py-4">
						<div>
							<p className="font-serif text-xl">
								{new Date(r.date).toLocaleDateString("it-IT", {
									weekday: "long",
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</p>
							{r.reason && (
								<p className="text-lg text-foreground/70">{r.reason}</p>
							)}
						</div>
						<button
							onClick={() => remove(r.date)}
							className="text-lg tracking-[0.08em] uppercase text-foreground/70 hover:text-[color:var(--gold)]"
						>
							Rimuovi
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}

function ClientsList({ onOpen }: { onOpen: (userId: string) => void }) {
	const [rows, setRows] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState("");

	useEffect(() => {
		(async () => {
			const { data, error } = await supabase
				.from("profiles")
				.select("id,email,first_name,last_name,phone,instagram,created_at")
				.order("created_at", { ascending: false });
			setLoading(false);
			if (error) return toast.error(error.message);
			setRows((data ?? []) as Profile[]);
		})();
	}, []);

	const filtered = rows.filter((p) => {
		if (!q.trim()) return true;
		const s =
			`${p.first_name ?? ""} ${p.last_name ?? ""} ${p.email ?? ""}`.toLowerCase();
		return s.includes(q.toLowerCase());
	});

	return (
		<section className="mt-6">
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Cerca per nome o email…"
				className="w-full bg-transparent border-b border-[color:var(--gold)]/40 pb-2 text-lg placeholder:text-foreground/70 focus:border-[color:var(--gold)] focus:outline-none"
			/>
			<ul className="mt-8 divide-y divide-[color:var(--gold)]/15">
				{loading && (
					<li className="py-12 text-center text-lg text-foreground/70">
						Caricamento…
					</li>
				)}
				{!loading && filtered.length === 0 && (
					<li className="py-12 text-center text-lg text-foreground/70">
						Nessuna cliente.
					</li>
				)}
				{filtered.map((p) => {
					const name =
						`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
						p.email ||
						"—";
					return (
						<li key={p.id}>
							<button
								onClick={() => onOpen(p.id)}
								className="flex w-full items-center justify-between py-5 text-left hover:text-[color:var(--gold)] transition-colors"
							>
								<div>
									<p className="font-serif text-xl">{name}</p>
									<p className="text-lg text-foreground/70">{p.email}</p>
								</div>
								<span className="inline-flex items-center gap-2 text-lg tracking-[0.08em] uppercase text-foreground/70">
									Apri <ArrowRight className="h-3 w-3" strokeWidth={1.25} />
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function ClientDetail({
	userId,
	onBack,
}: {
	userId: string;
	onBack: () => void;
}) {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [quest, setQuest] = useState<Questionnaire | null>(null);
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [notes, setNotes] = useState<
		Array<{
			id: string;
			content: string;
			created_at: string;
			updated_at: string;
		}>
	>([]);
	const [loading, setLoading] = useState(true);
	const [newNote, setNewNote] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingContent, setEditingContent] = useState("");

	const loadData = useCallback(async () => {
		setLoading(true);
		const [{ data: p }, { data: q }, { data: b }, { data: n }] =
			await Promise.all([
				supabase
					.from("profiles")
					.select("id,email,first_name,last_name,phone,instagram,created_at")
					.eq("id", userId)
					.maybeSingle(),
				supabase
					.from("questionnaires")
					.select("*")
					.eq("user_id", userId)
					.maybeSingle(),
				supabase
					.from("bookings")
					.select("*")
					.eq("user_id", userId)
					.order("date", { ascending: false }),
				supabase
					.from("client_notes")
					.select("*")
					.eq("client_id", userId)
					.order("created_at", { ascending: false }),
			]);
		setProfile((p ?? null) as Profile | null);
		setQuest((q ?? null) as Questionnaire | null);
		setBookings((b ?? []) as Booking[]);
		setNotes((n ?? []) as any[]);
		setLoading(false);
	}, [userId]);

	useEffect(() => {
		void loadData();
	}, [loadData]);

	async function addNote() {
		if (!newNote.trim()) return;
		const { error } = await supabase
			.from("client_notes")
			.insert({ client_id: userId, content: newNote });
		if (error) return toast.error(error.message);
		setNewNote("");
		toast.success("Nota aggiunta");
		void loadData();
	}

	async function updateNote(id: string) {
		if (!editingContent.trim()) return;
		const { error } = await supabase
			.from("client_notes")
			.update({ content: editingContent, updated_at: new Date().toISOString() })
			.eq("id", id);
		if (error) return toast.error(error.message);
		setEditingId(null);
		setEditingContent("");
		toast.success("Nota aggiornata");
		void loadData();
	}

	async function deleteNote(id: string) {
		const { error } = await supabase.from("client_notes").delete().eq("id", id);
		if (error) return toast.error(error.message);
		toast.success("Nota eliminata");
		void loadData();
	}

	if (loading)
		return (
			<p className="py-12 text-center text-lg text-foreground/70">
				Caricamento…
			</p>
		);
	if (!profile)
		return (
			<p className="py-12 text-center text-lg text-foreground/70">
				Cliente non trovata.
			</p>
		);

	const name =
		`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
		profile.email ||
		"—";

	return (
		<section className="mt-6">
			<button
				onClick={onBack}
				className="inline-flex items-center gap-2.5 text-lg tracking-[0.08em] uppercase text-foreground/70 transition-colors hover:text-[color:var(--gold)]"
			>
				<BackArrow />
				Tutte le clienti
			</button>

			<header className="mt-6">
				<h2 className="font-serif text-3xl text-[color:var(--gold)]">{name}</h2>
				<dl className="mt-4 grid gap-3 text-lg sm:grid-cols-2">
					<Info label="Email" value={profile.email ?? "—"} />
					{profile.phone && <Info label="Telefono" value={profile.phone} />}
					{profile.instagram && (
						<Info label="Instagram" value={profile.instagram} />
					)}
					{profile.created_at && (
						<Info
							label="Cliente dal"
							value={new Date(profile.created_at).toLocaleDateString("it-IT")}
						/>
					)}
				</dl>
			</header>

			<div className="mt-10">
				<h3 className="font-serif text-xl text-[color:var(--gold)]">
					Questionario
				</h3>
				{!quest ? (
					<p className="mt-3 text-lg italic text-foreground/70">
						Non ancora compilato.
					</p>
				) : (
					<dl className="mt-4 grid gap-3 text-lg sm:grid-cols-2">
						<Info label="Tipo di capello" value={quest.hair_type} />
						<Info label="Lunghezza" value={quest.hair_length} />
						<Info label="Colore" value={quest.hair_color} />
						{quest.treatments && (
							<Info label="Trattamenti precedenti" value={quest.treatments} />
						)}
						{quest.allergies && (
							<Info label="Allergie" value={quest.allergies} />
						)}
						<div className="sm:col-span-2">
							<Info label="Obiettivi" value={quest.goals} />
						</div>
						{quest.inspiration && (
							<div className="sm:col-span-2">
								<Info label="Ispirazione" value={quest.inspiration} />
							</div>
						)}
						{quest.additional && (
							<div className="sm:col-span-2">
								<Info label="Note aggiuntive" value={quest.additional} />
							</div>
						)}
						{quest.drink_preference && (
							<Info label="Bevanda preferita" value={quest.drink_preference} />
						)}
						{quest.music_taste && (
							<div className="sm:col-span-2">
								<Info label="Gusti musicali" value={quest.music_taste} />
							</div>
						)}
					</dl>
				)}
			</div>

			<div className="mt-10">
				<h3 className="font-serif text-xl text-[color:var(--gold)]">Note</h3>
				<div className="mt-4 flex flex-col gap-3">
					<textarea
						value={newNote}
						onChange={(e) => setNewNote(e.target.value)}
						placeholder="Aggiungi una nota…"
						className="min-h-20 rounded border border-[color:var(--gold)]/30 bg-background px-3 py-2 text-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
					/>
					<button
						onClick={() => void addNote()}
						className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-lg tracking-[0.08em] uppercase font-semibold text-background hover:opacity-90"
					>
						Aggiungi
					</button>
				</div>

				<div className="mt-6 divide-y divide-[color:var(--gold)]/15">
					{notes.length === 0 ? (
						<p className="text-lg italic text-foreground/70">Nessuna nota.</p>
					) : (
						notes.map((note) => (
							<div key={note.id} className="py-4">
								{editingId === note.id ? (
									<div className="flex flex-col gap-2">
										<textarea
											value={editingContent}
											onChange={(e) => setEditingContent(e.target.value)}
											className="min-h-16 rounded border border-[color:var(--gold)]/30 bg-background px-3 py-2 text-lg text-foreground"
										/>
										<div className="flex gap-2">
											<button
												onClick={() => void updateNote(note.id)}
												className="inline-flex h-8 items-center justify-center bg-[color:var(--gold)] px-4 text-lg tracking-[0.08em] uppercase font-medium text-background hover:opacity-90"
											>
												Salva
											</button>
											<button
												onClick={() => setEditingId(null)}
												className="inline-flex h-8 items-center justify-center border border-[color:var(--gold)]/40 px-4 text-lg tracking-[0.08em] uppercase font-medium text-foreground hover:bg-[color:var(--gold)]/10"
											>
												Annulla
											</button>
										</div>
									</div>
								) : (
									<>
										<p className="text-lg text-foreground">{note.content}</p>
										<div className="mt-2 flex items-center justify-between">
											<time className="text-lg text-foreground/70">
												{new Date(note.created_at).toLocaleDateString("it-IT")}{" "}
												{new Date(note.created_at).toLocaleTimeString("it-IT", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</time>
											<div className="flex gap-2">
												<button
													onClick={() => {
														setEditingId(note.id);
														setEditingContent(note.content);
													}}
													className="text-lg tracking-[0.08em] uppercase text-foreground/70 hover:text-[color:var(--gold)]"
												>
													Modifica
												</button>
												<button
													onClick={() => void deleteNote(note.id)}
													className="text-lg tracking-[0.08em] uppercase text-foreground/70 hover:text-destructive"
												>
													Elimina
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						))
					)}
				</div>
			</div>

			<div className="mt-10">
				<h3 className="font-serif text-xl text-[color:var(--gold)]">
					Storico prenotazioni
				</h3>
				{bookings.length === 0 ? (
					<p className="mt-3 text-lg italic text-foreground/70">
						Nessuna prenotazione.
					</p>
				) : (
					<ul className="mt-4 divide-y divide-[color:var(--gold)]/15">
						{bookings.map((b) => (
							<li
								key={b.id}
								className="flex items-center justify-between py-3 text-lg"
							>
								<span className="font-serif">
									{new Date(b.date).toLocaleDateString("it-IT", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
								<span className="text-lg tracking-[0.08em] uppercase text-foreground/70">
									{STATUS_LABEL[b.status] ?? b.status}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

function Info({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-lg tracking-[0.08em] uppercase text-foreground/70/80">
				{label}
			</dt>
			<dd className="mt-1.5 text-lg leading-relaxed text-foreground">
				{value}
			</dd>
		</div>
	);
}
