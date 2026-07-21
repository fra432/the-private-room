import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BackArrow } from "@/components/back-arrow";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
	notifyAccessRequestDecision,
	notifyBookingDecision,
	notifyBookingChangeRequestDecision,
} from "@/lib/email.functions";
import { sendClientInvite } from "@/lib/auth.functions";

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
	arrival_time: string | null;
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

type ChangeReq = {
	id: string;
	booking_id: string;
	user_id: string;
	requested_date: string | null;
	requested_arrival_time: string | null;
	message: string | null;
	status: "pending" | "approved" | "rejected";
	admin_reply: string | null;
	created_at: string;
};

function ChangeRequestsSection() {
	const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
	const [rows, setRows] = useState<ChangeReq[]>([]);
	const [bookings, setBookings] = useState<Record<string, Booking>>({});
	const [profiles, setProfiles] = useState<Record<string, Profile>>({});
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("booking_change_requests")
			.select("*")
			.eq("status", tab)
			.order("created_at", { ascending: false });
		if (error) {
			setLoading(false);
			return toast.error(error.message);
		}
		const list = (data ?? []) as ChangeReq[];
		setRows(list);
		if (list.length) {
			const bookingIds = Array.from(new Set(list.map((r) => r.booking_id)));
			const userIds = Array.from(new Set(list.map((r) => r.user_id)));
			const [{ data: bs }, { data: ps }] = await Promise.all([
				supabase.from("bookings").select("*").in("id", bookingIds),
				supabase
					.from("profiles")
					.select("id,email,first_name,last_name,phone")
					.in("id", userIds),
			]);
			const bm: Record<string, Booking> = {};
			(bs ?? []).forEach((b: any) => {
				bm[b.id] = b as Booking;
			});
			setBookings(bm);
			const pm: Record<string, Profile> = {};
			(ps ?? []).forEach((p: any) => {
				pm[p.id] = p as Profile;
			});
			setProfiles(pm);
		}
		setLoading(false);
	}, [tab]);

	useEffect(() => {
		void load();
	}, [load]);

	async function decide(
		cr: ChangeReq,
		status: "approved" | "rejected",
	) {
		if (status === "approved") {
			const patch: {
				date?: string;
				arrival_time?: string | null;
			} = {};
			if (cr.requested_date) patch.date = cr.requested_date;
			if (cr.requested_arrival_time) patch.arrival_time = cr.requested_arrival_time;
			if (Object.keys(patch).length) {
				const { error: bErr } = await supabase
					.from("bookings")
					.update(patch)
					.eq("id", cr.booking_id);
				if (bErr) return toast.error(bErr.message);
			}
		}
		const { error } = await supabase
			.from("booking_change_requests")
			.update({ status })
			.eq("id", cr.id);
		if (error) return toast.error(error.message);
		notifyBookingChangeRequestDecision({ data: { id: cr.id, status } }).catch(
			() => {},
		);
		toast.success(status === "approved" ? "Modifica applicata" : "Rifiutata");
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
						{STATUS_LABEL[t] ?? t}
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
						Nessuna richiesta di modifica.
					</p>
				)}
				{!loading &&
					rows.map((cr) => {
						const b = bookings[cr.booking_id];
						const p = profiles[cr.user_id];
						const name = p
							? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
								p.email ||
								"—"
							: cr.user_id.slice(0, 8);
						return (
							<article key={cr.id} className="py-6">
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<h2 className="font-serif text-xl">{name}</h2>
									<time className="text-lg tracking-[0.08em] uppercase text-foreground/70">
										{new Date(cr.created_at).toLocaleDateString("it-IT")}
									</time>
								</div>
								<dl className="mt-4 grid gap-2 text-lg text-foreground/70 sm:grid-cols-2">
									<Info
										label="Appuntamento attuale"
										value={
											b
												? `${new Date(b.date).toLocaleDateString("it-IT")}${b.arrival_time ? " · " + String(b.arrival_time).slice(0, 5) : ""}`
												: "—"
										}
									/>
									<Info
										label="Nuova richiesta"
										value={`${cr.requested_date ? new Date(cr.requested_date).toLocaleDateString("it-IT") : b ? new Date(b.date).toLocaleDateString("it-IT") : "—"}${cr.requested_arrival_time ? " · " + String(cr.requested_arrival_time).slice(0, 5) : ""}`}
									/>
									{p?.email && <Info label="Email" value={p.email} />}
									{p?.phone && <Info label="Telefono" value={p.phone} />}
								</dl>
								{cr.message && (
									<p className="mt-3 text-lg italic text-foreground/70">
										"{cr.message}"
									</p>
								)}
								{tab === "pending" && (
									<div className="mt-5 flex gap-3">
										<button
											onClick={() => decide(cr, "approved")}
											className="inline-flex h-10 items-center justify-center bg-[color:var(--gold)] px-6 text-lg tracking-[0.08em] uppercase font-semibold text-background hover:opacity-90"
										>
											Approva e sposta
										</button>
										<button
											onClick={() => decide(cr, "rejected")}
											className="inline-flex h-10 items-center justify-center brand-frame px-6 text-lg tracking-[0.08em] uppercase font-semibold text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
										>
											Rifiuta
										</button>
									</div>
								)}
							</article>
						);
					})}
			</section>
		</>
	);
}

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
		"requests" | "bookings" | "changes" | "availability" | "clients"
	>("bookings");
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
							["bookings", "Prenotazioni"],
							["changes", "Cambi orario"],
							["requests", "Richieste accesso"],
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
				{section === "changes" && <ChangeRequestsSection />}
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
		const row = rows.find((r) => r.id === id);
		const { error } = await supabase
			.from("access_requests")
			.update({ status, reviewed_at: new Date().toISOString() })
			.eq("id", id);
		if (error) return toast.error(error.message);
		if (status === "approved" && row) {
			sendClientInvite({
				data: { email: row.email, first_name: row.first_name },
			}).catch((e) => console.error("[invite]", e));
		} else {
			notifyAccessRequestDecision({ data: { id, status } }).catch(() => {});
		}
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
	const [view, setView] = useState<"calendar" | "list">("calendar");
	const [tab, setTab] = useState<
		"pending" | "confirmed" | "cancelled" | "rejected"
	>("pending");
	const [rows, setRows] = useState<Booking[]>([]);
	const [profiles, setProfiles] = useState<Record<string, Profile>>({});
	const [loading, setLoading] = useState(true);
	const [month, setMonth] = useState(() => {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), 1);
	});
	const [openBookingId, setOpenBookingId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		let q = supabase.from("bookings").select("*");
		if (view === "list") {
			q = q.eq("status", tab);
		} else {
			const start = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
			const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
			const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
			q = q
				.gte("date", start)
				.lte("date", end)
				.in("status", ["pending", "confirmed"]);
		}
		const { data, error } = await q.order("date", { ascending: true });
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
				.select("id,email,first_name,last_name,phone,instagram")
				.in("id", ids);
			const map: Record<string, Profile> = {};
			(ps ?? []).forEach((p) => {
				map[p.id] = p as Profile;
			});
			setProfiles(map);
		} else {
			setProfiles({});
		}
		setLoading(false);
	}, [tab, view, month]);

	useEffect(() => {
		void load();
	}, [load]);

	async function setStatus(
		id: string,
		status: "confirmed" | "rejected" | "cancelled",
		reason?: string,
	) {
		const { error } = await supabase
			.from("bookings")
			.update({
				status,
				...(status === "cancelled" && reason
					? { cancellation_reason: reason }
					: {}),
			})
			.eq("id", id);
		if (error) return toast.error(error.message);
		notifyBookingDecision({ data: { id, status, reason } }).catch(() => {});
		toast.success("Aggiornato");
		void load();
	}

	function nameOf(b: Booking) {
		const p = profiles[b.user_id];
		return p
			? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "—"
			: b.user_id.slice(0, 8);
	}

	return (
		<>
			<div className="mt-6 flex flex-wrap items-center gap-3">
				<div className="inline-flex border border-[color:var(--gold)]/40">
					{(["calendar", "list"] as const).map((v) => (
						<button
							key={v}
							onClick={() => setView(v)}
							className={`px-4 py-2 text-sm tracking-[0.08em] uppercase ${
								view === v
									? "bg-[color:var(--gold)] text-background"
									: "text-foreground/70 hover:text-foreground"
							}`}
						>
							{v === "calendar" ? "Calendario" : "Lista"}
						</button>
					))}
				</div>
			</div>

			{view === "list" && (
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
			)}

			{view === "calendar" ? (
				<CalendarView
					month={month}
					setMonth={setMonth}
					rows={rows}
					loading={loading}
					nameOf={nameOf}
					onOpen={setOpenBookingId}
				/>
			) : (
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
							const name = nameOf(b);
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
											{b.arrival_time && (
												<span className="ml-3 text-lg text-[color:var(--gold)]">
													{String(b.arrival_time).slice(0, 5)}
												</span>
											)}
										</h2>
										<div className="flex gap-4">
											<button
												onClick={() => setOpenBookingId(b.id)}
												className="text-lg tracking-[0.08em] uppercase text-[color:var(--gold)] hover:underline underline-offset-4"
											>
												Dettagli
											</button>
											<button
												onClick={() => onOpenClient(b.user_id)}
												className="text-lg tracking-[0.08em] uppercase text-foreground/70 hover:text-[color:var(--gold)]"
											>
												{name} ↗
											</button>
										</div>
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
			)}

			{openBookingId && (
				<BookingDetailModal
					bookingId={openBookingId}
					onClose={() => setOpenBookingId(null)}
					onOpenClient={(uid) => {
						setOpenBookingId(null);
						onOpenClient(uid);
					}}
					onChanged={() => void load()}
				/>
			)}
		</>
	);
}

function CalendarView({
	month,
	setMonth,
	rows,
	loading,
	nameOf,
	onOpen,
}: {
	month: Date;
	setMonth: (d: Date) => void;
	rows: Booking[];
	loading: boolean;
	nameOf: (b: Booking) => string;
	onOpen: (id: string) => void;
}) {
	const byDate = new Map<string, Booking[]>();
	for (const b of rows) {
		const arr = byDate.get(b.date) ?? [];
		arr.push(b);
		byDate.set(b.date, arr);
	}
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const startWeekday = (first.getDay() + 6) % 7;
	const daysInMonth = new Date(
		month.getFullYear(),
		month.getMonth() + 1,
		0,
	).getDate();
	const cells: (Date | null)[] = [];
	for (let i = 0; i < startWeekday; i++) cells.push(null);
	for (let d = 1; d <= daysInMonth; d++)
		cells.push(new Date(month.getFullYear(), month.getMonth(), d));
	const today = new Date().toISOString().slice(0, 10);
	function iso(d: Date) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	}
	return (
		<section className="mt-6 border border-[color:var(--gold)]/20 bg-card/40 p-4 md:p-6">
			<div className="flex items-center justify-between">
				<button
					onClick={() =>
						setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
					}
					aria-label="Mese precedente"
					className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--gold)]/40 text-foreground/70 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
				>
					<ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
				</button>
				<p className="font-serif text-xl italic capitalize md:text-2xl">
					{month.toLocaleDateString("it-IT", {
						month: "long",
						year: "numeric",
					})}
				</p>
				<button
					onClick={() =>
						setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
					}
					aria-label="Mese successivo"
					className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--gold)]/40 text-foreground/70 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
				>
					<ChevronRight className="h-5 w-5" strokeWidth={1.25} />
				</button>
			</div>
			<div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.6rem] tracking-[0.35em] uppercase text-foreground/60">
				{["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
					<div key={d} className="pb-2">
						{d}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-1">
				{cells.map((d, i) => {
					if (!d) return <div key={i} className="min-h-24" />;
					const day = iso(d);
					const list = byDate.get(day) ?? [];
					const isToday = day === today;
					return (
						<div
							key={i}
							className={`min-h-24 border p-1.5 text-left ${
								isToday
									? "border-[color:var(--gold)] bg-[color:var(--gold)]/5"
									: "border-[color:var(--gold)]/15"
							}`}
						>
							<div className="mb-1 font-serif text-sm text-foreground/80">
								{d.getDate()}
							</div>
							<div className="flex flex-col gap-1">
								{list.map((b) => (
									<button
										key={b.id}
										onClick={() => onOpen(b.id)}
										className={`truncate px-1.5 py-1 text-left text-[11px] leading-tight transition-colors ${
											b.status === "confirmed"
												? "bg-[color:var(--gold)] text-background hover:opacity-90"
												: "border border-[color:var(--gold)]/50 text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
										}`}
										title={`${b.arrival_time ? String(b.arrival_time).slice(0, 5) + " · " : ""}${nameOf(b)}`}
									>
										{b.arrival_time && (
											<span className="font-medium">
												{String(b.arrival_time).slice(0, 5)}{" "}
											</span>
										)}
										{nameOf(b)}
									</button>
								))}
							</div>
						</div>
					);
				})}
			</div>
			{loading && (
				<p className="mt-4 text-center text-sm text-foreground/60">
					Caricamento…
				</p>
			)}
			<div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-[color:var(--gold)]/15 pt-3 text-[0.6rem] tracking-[0.3em] uppercase text-foreground/60">
				<span className="inline-flex items-center gap-2">
					<span className="h-2 w-4 bg-[color:var(--gold)]" /> Confermato
				</span>
				<span className="inline-flex items-center gap-2">
					<span className="h-2 w-4 border border-[color:var(--gold)]/50" /> In
					attesa
				</span>
			</div>
		</section>
	);
}

function BookingDetailModal({
	bookingId,
	onClose,
	onOpenClient,
	onChanged,
}: {
	bookingId: string;
	onClose: () => void;
	onOpenClient: (userId: string) => void;
	onChanged: () => void;
}) {
	const [booking, setBooking] = useState<Booking | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [quest, setQuest] = useState<Questionnaire | null>(null);
	const [loading, setLoading] = useState(true);
	const [acting, setActing] = useState(false);
	const [cancellationReason, setCancellationReason] = useState("");
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const { data: b } = await supabase
				.from("bookings")
				.select("*")
				.eq("id", bookingId)
				.maybeSingle();
			setBooking((b ?? null) as Booking | null);
			if (b) {
				const [{ data: p }, { data: q }] = await Promise.all([
					supabase
						.from("profiles")
						.select("id,email,first_name,last_name,phone,instagram,created_at")
						.eq("id", b.user_id)
						.maybeSingle(),
					supabase
						.from("questionnaires")
						.select("*")
						.eq("user_id", b.user_id)
						.maybeSingle(),
				]);
				setProfile((p ?? null) as Profile | null);
				setQuest((q ?? null) as Questionnaire | null);
			}
			setLoading(false);
		})();
	}, [bookingId]);

	async function act(status: "confirmed" | "rejected" | "cancelled") {
		if (!booking) return;
		setActing(true);
		const { error } = await supabase
			.from("bookings")
			.update({
				status,
				...(status === "cancelled" && cancellationReason
					? { cancellation_reason: cancellationReason }
					: {}),
			})
			.eq("id", booking.id);
		setActing(false);
		if (error) return toast.error(error.message);
		console.log("[admin] Sending email:", {
			status,
			reason: cancellationReason,
		});
		notifyBookingDecision({
			data: { id: booking.id, status, reason: cancellationReason },
		}).catch(() => {});
		toast.success("Aggiornato");
		onChanged();
		onClose();
	}

	const name = profile
		? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
			profile.email ||
			"—"
		: "—";

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:p-8"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-2xl bg-background text-foreground shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					aria-label="Chiudi"
					className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center text-foreground/60 hover:text-[color:var(--gold)]"
				>
					<X className="h-5 w-5" />
				</button>
				{loading || !booking ? (
					<p className="p-12 text-center text-foreground/70">Caricamento…</p>
				) : (
					<div className="p-6 md:p-8">
						<p className="text-[0.6rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">
							Appuntamento · {STATUS_LABEL[booking.status] ?? booking.status}
						</p>
						<h2 className="mt-2 font-serif text-2xl md:text-3xl">
							{new Date(booking.date).toLocaleDateString("it-IT", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
							{booking.arrival_time && (
								<span className="ml-3 text-[color:var(--gold)]">
									{String(booking.arrival_time).slice(0, 5)}
								</span>
							)}
						</h2>
						{booking.notes && (
							<p className="mt-3 italic text-foreground/70">
								"{booking.notes}"
							</p>
						)}

						<div className="mt-6 border-t border-[color:var(--gold)]/20 pt-5">
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<h3 className="font-serif text-xl">{name}</h3>
								<button
									onClick={() => onOpenClient(booking.user_id)}
									className="text-sm tracking-[0.08em] uppercase text-[color:var(--gold)] hover:underline"
								>
									Scheda cliente ↗
								</button>
							</div>
							<dl className="mt-3 grid gap-2 text-base sm:grid-cols-2">
								{profile?.email && <Info label="Email" value={profile.email} />}
								{profile?.phone && (
									<Info label="Telefono" value={profile.phone} />
								)}
								{profile?.instagram && (
									<Info label="Instagram" value={profile.instagram} />
								)}
							</dl>
						</div>

						<div className="mt-6 border-t border-[color:var(--gold)]/20 pt-5">
							<h3 className="font-serif text-xl text-[color:var(--gold)]">
								Questionario
							</h3>
							{!quest ? (
								<p className="mt-2 italic text-foreground/70">
									Non ancora compilato.
								</p>
							) : (
								<dl className="mt-3 grid gap-2 text-base sm:grid-cols-2">
									<Info label="Tipo di capello" value={quest.hair_type} />
									<Info label="Lunghezza" value={quest.hair_length} />
									<Info label="Colore" value={quest.hair_color} />
									{quest.treatments && (
										<Info label="Trattamenti" value={quest.treatments} />
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
										<Info
											label="Bevanda preferita"
											value={quest.drink_preference}
										/>
									)}
									{quest.music_taste && (
										<div className="sm:col-span-2">
											<Info label="Musica" value={quest.music_taste} />
										</div>
									)}
								</dl>
							)}
						</div>

						<div className="mt-8 flex flex-wrap gap-3 border-t border-[color:var(--gold)]/20 pt-5">
							{booking.status === "pending" && (
								<>
									<button
										onClick={() => act("confirmed")}
										disabled={acting}
										className="inline-flex h-11 items-center justify-center bg-[color:var(--gold)] px-6 text-sm tracking-[0.15em] uppercase text-background hover:opacity-90 disabled:opacity-50"
									>
										Conferma
									</button>
									<button
										onClick={() => act("rejected")}
										disabled={acting}
										className="inline-flex h-11 items-center justify-center brand-frame px-6 text-sm tracking-[0.15em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 disabled:opacity-50"
									>
										Rifiuta
									</button>
								</>
							)}
							{booking.status === "confirmed" && (
								<div className="mt-4 space-y-3">
									<label className="flex flex-col gap-2">
										<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
											Motivo annullamento (opzionale)
										</span>
										<textarea
											value={cancellationReason}
											onChange={(e) =>
												setCancellationReason(e.currentTarget.value)
											}
											placeholder="Scrivi il motivo dell'annullamento..."
											rows={3}
											className="w-full bg-transparent border border-[color:var(--gold)]/40 p-3 font-serif text-base text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors resize-none"
										/>
									</label>
									<button
										onClick={() => setShowCancelConfirm(true)}
										disabled={acting}
										className="inline-flex h-11 items-center justify-center border border-[color:var(--gold)]/40 px-6 text-sm tracking-[0.15em] uppercase text-foreground/80 hover:text-[color:var(--gold)] disabled:opacity-50"
									>
										Annulla appuntamento
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Cancellation Confirmation Dialog */}
			{showCancelConfirm && booking && (
				<div
					className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
					onClick={() => setShowCancelConfirm(false)}
				>
					<div
						className="relative w-full max-w-md bg-background text-foreground shadow-2xl p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="font-serif text-xl md:text-2xl">
							Conferma annullamento
						</h3>
						<p className="mt-3 text-base text-foreground/70">
							{new Date(booking.date).toLocaleDateString("it-IT", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
							{booking.arrival_time && (
								<span className="ml-2 text-[color:var(--gold)]">
									{String(booking.arrival_time).slice(0, 5)}
								</span>
							)}
						</p>

						<div className="mt-4">
							<label className="flex flex-col gap-2">
								<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
									Motivo annullamento
								</span>
								<textarea
									onClick={(e) => e.stopPropagation()}
									value={cancellationReason}
									onChange={(e) => setCancellationReason(e.currentTarget.value)}
									placeholder="Scrivi il motivo (facoltativo)..."
									rows={3}
									className="w-full bg-transparent border border-[color:var(--gold)]/40 p-3 font-serif text-base text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors resize-none"
								/>
							</label>
						</div>

						<div className="mt-6 flex flex-wrap gap-3">
							<button
								onClick={() => {
									setShowCancelConfirm(false);
									act("cancelled");
								}}
								disabled={acting}
								className="inline-flex h-11 items-center justify-center bg-[color:var(--gold)]/20 px-6 text-sm tracking-[0.15em] uppercase text-[color:var(--gold)] hover:bg-[color:var(--gold)]/30 disabled:opacity-50"
							>
								{acting ? "Annullamento…" : "Conferma annullamento"}
							</button>
							<button
								onClick={() => setShowCancelConfirm(false)}
								disabled={acting}
								className="inline-flex h-11 items-center justify-center border border-[color:var(--gold)]/40 px-6 text-sm tracking-[0.15em] uppercase text-foreground/80 hover:text-[color:var(--gold)] disabled:opacity-50"
							>
								Annulla
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
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
