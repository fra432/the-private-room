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
	price: string;
};

const SERVICES: Service[] = [
	{
		num: "01",
		name: "Taglio",
		tagline: "La firma del salone",
		description:
			"Un taglio costruito sui tuoi lineamenti, dopo una consulenza attenta a viso, portamento e stile di vita.",
		price: "€ 20",
	},
	{
		num: "02",
		name: "Taglio bambino",
		tagline: "Piccoli ospiti",
		description:
			"Un taglio dedicato ai più piccoli, in un ambiente tranquillo e senza fretta.",
		price: "€ 15",
	},
	{
		num: "03",
		name: "Taglio uomo",
		tagline: "Su misura",
		description:
			"Taglio maschile studiato sul volto e sulla texture del capello, con rifinitura di precisione.",
		price: "€ 20",
	},
	{
		num: "04",
		name: "Colore base",
		tagline: "Il tuo colore",
		description:
			"Colorazione uniforme e naturale, studiata sulla luce della tua pelle e sulla base di partenza.",
		price: "da € 40",
	},
	{
		num: "05",
		name: "Tonalizzazione",
		tagline: "Riflessi & nuance",
		description:
			"Un velo di colore per ravvivare i riflessi, ammorbidire il contrasto o rinfrescare la tonalità.",
		price: "da € 15",
	},
	{
		num: "06",
		name: "Schiariture / Balayage",
		tagline: "Luce su misura",
		description:
			"Schiariture dipinte a mano libera per un effetto naturale, luminoso e cucito sulla tua chioma.",
		price: "da € 30",
	},
	{
		num: "07",
		name: "Piega",
		tagline: "Il tocco finale",
		description:
			"Piega finale con styling personalizzato — liscia, mossa o con movimento, sempre naturale.",
		price: "da € 15",
	},
	{
		num: "08",
		name: "Ristrutturazione",
		tagline: "Cura profonda",
		description:
			"Trattamento ristrutturante per capelli stressati, secchi o dopo decolorazione. Nutre e ripristina la fibra.",
		price: "da € 5",
	},
	{
		num: "09",
		name: "Extension",
		tagline: "Lunghezza & volume",
		description:
			"Extension di alta qualità per lunghezza, volume o effetti di colore. Selezione e applicazione su misura.",
		price: "Da definire in salone",
	},
	{
		num: "10",
		name: "Stiratura",
		tagline: "Liscio duraturo",
		description:
			"Trattamento liscio personalizzato in base al tipo di capello. Preventivo definito in consulenza.",
		price: "Da definire in salone",
	},
	{
		num: "11",
		name: "Sposa",
		tagline: "Il tuo giorno",
		description:
			"Un percorso dedicato: consulenza, prova, trucco e acconciatura per il giorno più importante. Contattaci per costruire insieme il servizio su misura.",
		price: "Da definire",
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