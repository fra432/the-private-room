import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RESET_REDIRECT = "https://www.inside-theroom.it/set-password";
const FROM = "THE ROOM <info@inside-theroom.it>";

function shell(title: string, intro: string, body: string, cta?: { label: string; url: string }) {
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

async function resend(to: string, subject: string, html: string) {
	const key = process.env.RESEND_API_KEY;
	if (!key) return { ok: false as const, error: "missing_key" };
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
		body: JSON.stringify({ from: FROM, to: [to], subject, html }),
	});
	if (!res.ok) {
		const body = await res.text();
		console.error(`[auth-email] resend ${res.status}: ${body}`);
		return { ok: false as const, error: body };
	}
	return { ok: true as const };
}

// Genera un link di invito/recovery e lo invia con il template brand.
// Usato quando l'admin approva una richiesta di accesso.
export const sendClientInvite = createServerFn({ method: "POST" })
	.inputValidator((d) =>
		z
			.object({ email: z.string().email(), first_name: z.string().optional() })
			.parse(d),
	)
	.handler(async ({ data }) => {
		const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
		const email = data.email.toLowerCase().trim();
		const first = data.first_name?.trim() || "";

		// Cerca utente esistente
		const { data: list } = await supabaseAdmin.auth.admin.listUsers({
			page: 1,
			perPage: 200,
		});
		const existing = list?.users?.find(
			(u) => (u.email ?? "").toLowerCase() === email,
		);

		let link: string | null = null;
		if (existing) {
			// Utente già registrato: mandiamo un link di recupero password
			const { data: gen, error } = await supabaseAdmin.auth.admin.generateLink({
				type: "recovery",
				email,
				options: { redirectTo: RESET_REDIRECT },
			});
			if (error) return { ok: false, error: error.message };
			link = gen.properties?.action_link ?? null;
		} else {
			// Nuovo utente: link di invito che porta a /set-password
			const { data: gen, error } = await supabaseAdmin.auth.admin.generateLink({
				type: "invite",
				email,
				options: { redirectTo: RESET_REDIRECT },
			});
			if (error) return { ok: false, error: error.message };
			link = gen.properties?.action_link ?? null;
		}
		if (!link) return { ok: false, error: "no_link" };

		await resend(
			email,
			"Il tuo accesso a THE ROOM è confermato",
			shell(
				`Benvenuta${first ? ` ${first}` : ""}`,
				"La tua richiesta è stata approvata. Ti aspettiamo — completa l'accesso scegliendo la tua password.",
				"<p>Il link è valido per un tempo limitato. Se scade, puoi richiederne uno nuovo dalla pagina di login.</p>",
				{ label: "Scegli la tua password", url: link },
			),
		);
		return { ok: true };
	});

// Password dimenticata: link di recovery inviato con template brand.
// Non rivela mai se l'email esiste o no.
export const sendPasswordReset = createServerFn({ method: "POST" })
	.inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
	.handler(async ({ data }) => {
		const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
		const email = data.email.toLowerCase().trim();

		const { data: list } = await supabaseAdmin.auth.admin.listUsers({
			page: 1,
			perPage: 200,
		});
		const existing = list?.users?.find(
			(u) => (u.email ?? "").toLowerCase() === email,
		);
		if (!existing) return { ok: true }; // silenzio per non rivelare

		const { data: gen, error } = await supabaseAdmin.auth.admin.generateLink({
			type: "recovery",
			email,
			options: { redirectTo: RESET_REDIRECT },
		});
		if (error) return { ok: false, error: error.message };
		const link = gen.properties?.action_link;
		if (!link) return { ok: false, error: "no_link" };

		await resend(
			email,
			"Reimposta la tua password — THE ROOM",
			shell(
				"Reimposta la tua password",
				"Hai richiesto di reimpostare la password del tuo account THE ROOM.",
				"<p>Se non sei stata tu, ignora questa email.</p>",
				{ label: "Scegli una nuova password", url: link },
			),
		);
		return { ok: true };
	});