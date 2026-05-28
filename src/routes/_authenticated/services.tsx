import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/services")({
	head: () => ({
		meta: [
			{ title: "Servizi — The Room" },
			{
				name: "description",
				content:
					"Taglio, colore, infoltimento, extension e trattamenti su misura. Un solo appuntamento al giorno.",
			},
		],
	}),
	component: ServicesPage,
});

type Service = {
	num: string;
	name: string;
	tagline: string;
	description: string;
	details: string[];
	price: string;
	duration: string;
};

const SERVICES: Service[] = [
	{
		num: "01",
		name: "Taglio & Colore",
		tagline: "La firma del salone",
		description:
			"Una consulenza approfondita, un'analisi di cute e capelli, e un taglio costruito sui tuoi lineamenti. Il colore nasce dopo: studiato sulla luce della tua pelle.",
		details: [
			"Analisi cute & capelli",
			"Consulenza visagistica",
			"Colore su misura",
			"Piega finale",
		],
		price: "€ 180",
		duration: "3 h",
	},
	{
		num: "02",
		name: "Infoltimento",
		tagline: "Densità e vitalità",
		description:
			"Tecniche professionali per restituire volume e corpo ai capelli. Un protocollo discreto, naturale, costruito sulla tua chioma.",
		details: [
			"Diagnosi del bulbo",
			"Protocollo personalizzato",
			"Trattamento d'urto",
			"Piano di mantenimento",
		],
		price: "€ 240",
		duration: "2 h 30",
	},
	{
		num: "03",
		name: "Extension",
		tagline: "Lunghezza & volume",
		description:
			"Extension di altissima qualità per creare lunghezza, volume o effetti di colore. Selezione e applicazione su misura, invisibili al tatto.",
		details: [
			"Ciocche cucite o cheratina",
			"Colore matchato a mano",
			"Applicazione invisibile",
			"Manutenzione inclusa",
		],
		price: "€ 350",
		duration: "4 h",
	},
	{
		num: "04",
		name: "Trattamenti Botanici",
		tagline: "Cura profonda",
		description:
			"Rituali ristrutturanti con principi attivi botanici. Per capelli stressati, secchi, dopo decolorazione o semplicemente da coccolare.",
		details: [
			"Diagnosi sensoriale",
			"Maschera ristrutturante",
			"Massaggio cuoio capelluto",
			"Piega leggera",
		],
		price: "€ 90",
		duration: "1 h 30",
	},
	{
		num: "05",
		name: "Consulenza Privata",
		tagline: "Solo conversazione",
		description:
			"Un'ora dedicata a capire cosa desideri davvero, senza forbici. Ideale prima di un grande cambio o di un evento importante.",
		details: [
			"Analisi del look attuale",
			"Studio dei riferimenti",
			"Proposta scritta",
			"Costo scalato sul primo servizio",
		],
		price: "€ 60",
		duration: "1 h",
	},
];

function ServicesPage() {
	const { isAdmin } = useAuth();

	return (
		<main className="theme-interior min-h-screen bg-background text-foreground font-display">
			{/* Nav */}
			<header className="absolute inset-x-0 top-0 z-20">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10 md:py-8">
					<Link
						to="/dashboard"
						className="text-foreground transition hover:opacity-80"
					>
						<BrandLogo variant="horizontal" className="h-12 w-auto md:h-14" />
					</Link>
					<nav className="flex items-center gap-8">
						<Link
							to="/services"
							className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]"
						>
							Servizi
						</Link>
						<Link
							to="/book"
							className="text-[0.55rem] tracking-[0.5em] uppercase text-foreground/80 hover:text-foreground"
						>
							Prenota
						</Link>
						{isAdmin && (
							<Link
								to="/admin"
								className="text-[0.55rem] tracking-[0.5em] uppercase text-foreground/80 hover:text-foreground"
							>
								Admin
							</Link>
						)}
						<button
							onClick={() => supabase.auth.signOut()}
							className="text-[0.55rem] tracking-[0.5em] uppercase text-foreground/80 hover:text-foreground"
						>
							Esci
						</button>
					</nav>
				</div>
			</header>

			{/* Hero editoriale */}
			<section className="relative overflow-hidden border-b border-[color:var(--border)]">
				<div className="mx-auto grid min-h-[80vh] max-w-6xl grid-cols-12 items-end px-6 pt-40 pb-20 md:px-10 md:pt-48 md:pb-28">
					<div className="col-span-12 md:col-span-8">
						<p className="text-[0.55rem] tracking-[0.6em] uppercase text-muted-foreground">
							Listino · Edizione corrente
						</p>
						<h1 className="mt-10 font-serif text-[3.5rem] leading-[0.95] text-foreground md:text-[8rem]">
							I nostri
							<br />
							<span className="italic text-[color:var(--gold)]">servizi</span>.
						</h1>
					</div>
					<div className="col-span-12 mt-12 md:col-span-4 md:mt-0">
						<p className="text-base leading-relaxed text-muted-foreground">
							Ogni servizio è disegnato attorno a una sola cliente al giorno.
							Nessuna fretta, nessuna sovrapposizione — solo tempo dedicato.
						</p>
						<div className="mt-8 h-px w-16 bg-[color:var(--gold)]" />
						<p className="mt-6 text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground">
							05 servizi · su appuntamento
						</p>
					</div>
				</div>

				{/* numeretto decorativo */}
				<div className="pointer-events-none absolute -right-10 -bottom-20 select-none font-serif text-[20rem] leading-none italic text-foreground/[0.04] md:text-[32rem]">
					Room
				</div>
			</section>

			{/* Lista servizi — zigzag editoriale */}
			<section>
				{SERVICES.map((s, i) => {
					const reverse = i % 2 === 1;
					return (
						<article
							key={s.num}
							className="group border-b border-[color:var(--border)] transition-colors hover:bg-[color:var(--card)]/40"
						>
							<div
								className={`mx-auto grid max-w-6xl grid-cols-12 gap-8 px-6 py-20 md:px-10 md:py-28 ${
									reverse ? "md:[direction:rtl]" : ""
								}`}
							>
								<div
									className={`col-span-12 md:col-span-2 ${
										reverse ? "md:[direction:ltr]" : ""
									}`}
								>
									<p className="font-serif text-5xl italic text-[color:var(--gold)]">
										{s.num}
									</p>
								</div>

								<div
									className={`col-span-12 md:col-span-6 ${
										reverse ? "md:[direction:ltr]" : ""
									}`}
								>
									<p className="text-[0.55rem] tracking-[0.5em] uppercase text-muted-foreground">
										{s.tagline}
									</p>
									<h2 className="mt-4 font-serif text-4xl text-foreground transition-transform duration-500 group-hover:translate-x-1 md:text-6xl">
										{s.name}
									</h2>
									<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
										{s.description}
									</p>

									<ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2">
										{s.details.map((d) => (
											<li
												key={d}
												className="flex items-baseline gap-3 text-xs text-foreground/80"
											>
												<span className="text-[color:var(--gold)]">—</span>
												<span>{d}</span>
											</li>
										))}
									</ul>
								</div>

								<div
									className={`col-span-12 md:col-span-4 ${
										reverse ? "md:[direction:ltr]" : ""
									}`}
								>
									<div className="flex flex-col items-start gap-6 border-l border-[color:var(--border)] pl-6 md:items-end md:border-l-0 md:border-r md:pl-0 md:pr-6 md:text-right">
										<div>
											<p className="text-[0.5rem] tracking-[0.5em] uppercase text-muted-foreground">
												Da
											</p>
											<p className="mt-2 font-serif text-5xl italic text-foreground">
												{s.price}
											</p>
										</div>
										<div>
											<p className="text-[0.5rem] tracking-[0.5em] uppercase text-muted-foreground">
												Durata
											</p>
											<p className="mt-2 font-serif text-2xl text-foreground/80">
												{s.duration}
											</p>
										</div>
									</div>
								</div>
							</div>
						</article>
					);
				})}
			</section>

			{/* Nota prezzi */}
			<section className="border-b border-[color:var(--border)] bg-[color:var(--card)]/50">
				<div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
					<p className="text-[0.55rem] tracking-[0.5em] uppercase text-[color:var(--gold)]">
						Nota
					</p>
					<p className="mt-4 max-w-3xl font-serif text-2xl leading-snug text-foreground md:text-3xl">
						I prezzi indicati sono di partenza. Il preventivo definitivo viene
						concordato in consulenza, in base a lunghezza, densità e tecnica
						scelta — senza sorprese.
					</p>
				</div>
			</section>

			{/* CTA finale */}
			<section className="border-b border-[color:var(--border)]">
				<div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-6 py-24 md:flex-row md:items-end md:px-10">
					<div className="max-w-xl">
						<p className="text-[0.55rem] tracking-[0.6em] uppercase text-muted-foreground">
							Pronta?
						</p>
						<h2 className="mt-6 font-serif text-5xl leading-[1.05] text-foreground md:text-7xl">
							Prenotiamo
							<br />
							<span className="italic text-[color:var(--gold)]">
								il tuo momento
							</span>
							.
						</h2>
					</div>
					<Link
						to="/book"
						className="inline-flex h-14 items-center justify-center border border-[color:var(--gold)] bg-[color:var(--gold)] px-12 text-[0.6rem] tracking-[0.6em] uppercase text-background transition hover:bg-transparent hover:text-[color:var(--gold)]"
					>
						Prenota appuntamento
					</Link>
				</div>
			</section>

			<footer className="border-t border-[color:var(--border)]">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 md:px-10">
					<BrandLogo
						variant="horizontal"
						className="h-8 w-auto text-foreground/60"
					/>
					<p className="text-[0.5rem] tracking-[0.5em] uppercase text-muted-foreground">
						Access by appointment only
					</p>
				</div>
			</footer>
		</main>
	);
}