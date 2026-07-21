import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OWNER_EMAIL = "info@inside-theroom.it";
const FROM = "THE ROOM <info@inside-theroom.it>";

type Payload = {
	to: string;
	subject: string;
	html: string;
	reply_to?: string;
};

async function sendMail(p: Payload) {
	const key = process.env.RESEND_API_KEY;
	if (!key) {
		console.error("[email] RESEND_API_KEY not configured");
		return { ok: false as const, error: "missing_key" };
	}
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`,
		},
		body: JSON.stringify({
			from: FROM,
			to: [p.to],
			subject: p.subject,
			html: p.html,
			reply_to: p.reply_to,
		}),
	});
	if (!res.ok) {
		const body = await res.text();
		console.error(`[email] resend ${res.status}: ${body}`);
		return { ok: false as const, error: body };
	}
	return { ok: true as const };
}

function shell(
	title: string,
	intro: string,
	body: string,
	cta?: { label: string; url: string },
) {
	return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0b;font-family:Georgia,'Times New Roman',serif;color:#f5f2ea">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:40px 16px">
		<tr><td align="center">
			<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid #c9a24333;padding:40px 32px">
				<tr><td align="center" style="padding-bottom:24px">
					<div style="letter-spacing:.4em;font-size:11px;color:#c9a243;font-family:Helvetica,Arial,sans-serif">THE ROOM</div>
					<div style="letter-spacing:.35em;font-size:9px;color:#c9a24399;margin-top:6px;font-family:Helvetica,Arial,sans-serif">PRIVATE HAIR STUDIO</div>
				</td></tr>
				<tr><td style="border-top:1px solid #c9a24333;padding-top:24px">
					<h1 style="font-size:22px;margin:0 0 12px;color:#f5f2ea;font-weight:400">${title}</h1>
					<p style="font-size:14px;line-height:1.6;color:#f5f2eacc;margin:0 0 16px">${intro}</p>
					<div style="font-size:14px;line-height:1.7;color:#f5f2ea">${body}</div>
					${cta ? `<p style="margin:28px 0 0"><a href="${cta.url}" style="display:inline-block;background:#c9a243;color:#0b0b0b;padding:12px 22px;text-decoration:none;letter-spacing:.2em;font-size:11px;font-family:Helvetica,Arial,sans-serif;text-transform:uppercase">${cta.label}</a></p>` : ""}
				</td></tr>
				<tr><td style="padding-top:28px;font-size:10px;color:#f5f2ea66;font-family:Helvetica,Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase">
					THE ROOM · By appointment only
				</td></tr>
			</table>
		</td></tr>
	</table>
	</body></html>`;
}

async function loadAccessRequest(id: string) {
	const { supabaseAdmin } = await import(
		"@/integrations/supabase/client.server"
	);
	const { data } = await supabaseAdmin
		.from("access_requests")
		.select(
			"id, first_name, last_name, email, phone, instagram, how_heard, status",
		)
		.eq("id", id)
		.maybeSingle();
	return data;
}

async function loadBooking(id: string) {
	const { supabaseAdmin } = await import(
		"@/integrations/supabase/client.server"
	);
	const { data } = await supabaseAdmin
		.from("bookings")
		.select("id, user_id, date, arrival_time, status, notes")
		.eq("id", id)
		.maybeSingle();
	if (!data) return null;
	const { data: profile } = await supabaseAdmin
		.from("profiles")
		.select("first_name, last_name, email, phone")
		.eq("id", data.user_id)
		.maybeSingle();
	return { booking: data, profile };
}

function fmtDate(iso: string) {
	try {
		return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	} catch {
		return iso;
	}
}

// 1. Nuova richiesta d'accesso → notifica proprietaria
export const notifyAccessRequestCreated = createServerFn({ method: "POST" })
	.inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
	.handler(async ({ data }) => {
		const r = await loadAccessRequest(data.id);
		if (!r) return { ok: false };
		const body = `
			<p><strong>Nome:</strong> ${r.first_name} ${r.last_name}</p>
			<p><strong>Email:</strong> ${r.email}</p>
			<p><strong>Telefono:</strong> ${r.phone}</p>
			${r.instagram ? `<p><strong>Instagram:</strong> ${r.instagram}</p>` : ""}
			${r.how_heard ? `<p><strong>Come ci ha conosciuto:</strong> ${r.how_heard}</p>` : ""}
		`;
		return sendMail({
			to: OWNER_EMAIL,
			subject: `Nuova richiesta d'accesso — ${r.first_name} ${r.last_name}`,
			html: shell(
				"Nuova richiesta d'accesso",
				"Una nuova cliente ha richiesto di entrare in THE ROOM.",
				body,
				{
					label: "Rivedi in Admin",
					url: "https://www.inside-theroom.it/admin",
				},
			),
			reply_to: r.email,
		});
	});

// 2. Decisione richiesta d'accesso → notifica cliente
export const notifyAccessRequestDecision = createServerFn({ method: "POST" })
	.inputValidator((d) =>
		z
			.object({
				id: z.string().uuid(),
				status: z.enum(["approved", "rejected"]),
			})
			.parse(d),
	)
	.handler(async ({ data }) => {
		const r = await loadAccessRequest(data.id);
		if (!r) return { ok: false };
		if (data.status === "approved") {
			// Le approvazioni ora vengono inviate da sendClientInvite (link password).
			return { ok: true };
		}
		return sendMail({
			to: r.email,
			subject: "Aggiornamento sulla tua richiesta — THE ROOM",
			html: shell(
				`Ciao ${r.first_name}`,
				"Ti ringraziamo per l'interesse verso THE ROOM.",
				"<p>Purtroppo al momento non possiamo dare seguito alla tua richiesta d'accesso.</p>",
			),
		});
	});

// 3. Nuova richiesta appuntamento → notifica proprietaria
export const notifyBookingCreated = createServerFn({ method: "POST" })
	.inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
	.handler(async ({ data }) => {
		const res = await loadBooking(data.id);
		if (!res) return { ok: false };
		const { booking, profile } = res;
		const name = profile
			? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
			: "una cliente";
		const body = `
			<p><strong>Cliente:</strong> ${name || "—"}</p>
			${profile?.email ? `<p><strong>Email:</strong> ${profile.email}</p>` : ""}
			${profile?.phone ? `<p><strong>Telefono:</strong> ${profile.phone}</p>` : ""}
			<p><strong>Data richiesta:</strong> ${fmtDate(booking.date)}</p>
			${(booking as any).arrival_time ? `<p><strong>Orario di arrivo:</strong> ${String((booking as any).arrival_time).slice(0, 5)}</p>` : ""}
			${booking.notes ? `<p><strong>Note:</strong> ${booking.notes}</p>` : ""}
		`;
		return sendMail({
			to: OWNER_EMAIL,
			subject: `Nuova richiesta appuntamento — ${fmtDate(booking.date)}`,
			html: shell(
				"Nuova richiesta d'appuntamento",
				`${name || "Una cliente"} ha richiesto un appuntamento.`,
				body,
				{
					label: "Rivedi in Admin",
					url: "https://www.inside-theroom.it/admin",
				},
			),
			reply_to: profile?.email ?? undefined,
		});
	});

// 4. Decisione appuntamento → notifica cliente
export const notifyBookingDecision = createServerFn({ method: "POST" })
	.inputValidator((d) =>
		z
			.object({
				id: z.string().uuid(),
				status: z.enum(["confirmed", "rejected", "cancelled"]),
				reason: z.string().optional(),
			})
			.parse(d),
	)
	.handler(async ({ data }) => {
		const res = await loadBooking(data.id);
		if (!res || !res.profile?.email) return { ok: false };
		const { booking, profile } = res;
		const first = profile.first_name ?? "";
		const dateStr = fmtDate(booking.date);
		console.log("[email] notifyBookingDecision:", {
			status: data.status,
			reason: data.reason,
		});
		if (data.status === "confirmed") {
			return sendMail({
				to: profile.email!,
				subject: `Appuntamento confermato — ${dateStr}`,
				html: shell(
					`Ci vediamo ${first ? first + "," : ""} ${dateStr}`.trim(),
					"Il tuo appuntamento in THE ROOM è confermato.",
					`<p><strong>Data:</strong> ${dateStr}</p>${(booking as any).arrival_time ? `<p><strong>Orario:</strong> ${String((booking as any).arrival_time).slice(0, 5)}</p>` : ""}${booking.notes ? `<p><strong>Le tue note:</strong> ${booking.notes}</p>` : ""}<p style="margin-top:16px">Se hai bisogno di modificare, rispondi a questa email.</p>`,
				),
			});
		}
		if (data.status === "rejected") {
			return sendMail({
				to: profile.email!,
				subject: "Appuntamento non disponibile — THE ROOM",
				html: shell(
					`Ciao ${first}`.trim(),
					`Purtroppo non è possibile confermare l'appuntamento del ${dateStr}.`,
					"<p>Ti invitiamo a scegliere un'altra data dall'area riservata.</p>",
					{
						label: "Scegli un'altra data",
						url: "https://www.inside-theroom.it/book",
					},
				),
			});
		}
		return sendMail({
			to: profile.email!,
			subject: "Appuntamento annullato — THE ROOM",
			html: shell(
				`Ciao ${first}`.trim(),
				`Il tuo appuntamento del ${dateStr} è stato annullato.`,
				`<p>Puoi prenotare una nuova data dall'area riservata quando vuoi.</p>${data.reason ? `<p style="margin-top:12px"><strong>Motivo:</strong> ${data.reason}</p>` : ""}<p style="margin-top:16px"><a href="https://www.inside-theroom.it/book" style="color:#c9a243">Prenota un nuovo appuntamento</a></p>`,
				{ label: "Prenota", url: "https://www.inside-theroom.it/book" },
			),
		});
	});
