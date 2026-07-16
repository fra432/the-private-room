import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Tone = "light" | "dark";

type Props = {
	/** "light" for dark backgrounds (welcome/dashboard hero), "dark" for light backgrounds (services/interior). */
	tone?: Tone;
	active?: "dashboard" | "services" | "book" | "admin";
};

export function SiteNav({ tone = "dark", active }: Props) {
	const { isAdmin } = useAuth();
	const [open, setOpen] = useState(false);

	const isLight = tone === "light";
	const linkBase =
		"text-[0.7rem] tracking-[0.4em] uppercase transition md:text-[0.72rem]";
	const linkIdle = isLight
		? "text-white/85 hover:text-white"
		: "text-foreground/70 hover:text-foreground";
	const linkActive = "text-[color:var(--gold)]";
	const logoTone = isLight
		? "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
		: "text-foreground";
	const iconBtn = isLight
		? "text-white/90 hover:text-white"
		: "text-foreground/80 hover:text-foreground";

	const items: { key: NonNullable<Props["active"]>; to: string; label: string }[] =
		[
			{ key: "services", to: "/services", label: "Servizi" },
			{ key: "book", to: "/book", label: "Prenota" },
			...(isAdmin
				? ([{ key: "admin", to: "/admin", label: "Admin" }] as const)
				: []),
		];

	return (
		<header className="absolute inset-x-0 top-0 z-30">
			<div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-6 md:px-10 md:py-8">
				<Link to="/dashboard" className={`min-w-0 ${logoTone} transition hover:opacity-80`}>
					<BrandLogo variant="horizontal" className="h-10 w-auto md:h-14" />
				</Link>

				{/* Desktop nav */}
				<nav className="hidden items-center gap-8 md:flex">
					{items.map((it) => (
						<Link
							key={it.key}
							to={it.to}
							className={`${linkBase} ${active === it.key ? linkActive : linkIdle}`}
						>
							{it.label}
						</Link>
					))}
					<button
						onClick={() => supabase.auth.signOut()}
						className={`${linkBase} ${linkIdle}`}
					>
						Esci
					</button>
				</nav>

				{/* Mobile trigger */}
				<button
					aria-label={open ? "Chiudi menu" : "Apri menu"}
					aria-expanded={open}
					onClick={() => setOpen((v) => !v)}
					className={`shrink-0 p-2 md:hidden ${iconBtn}`}
				>
					{open ? (
						<X className="h-6 w-6" strokeWidth={1.25} />
					) : (
						<Menu className="h-6 w-6" strokeWidth={1.25} />
					)}
				</button>
			</div>

			{/* Mobile drawer */}
			{open && (
				<div className="md:hidden">
					<div className="mx-4 border border-[color:var(--gold)]/30 bg-black/95 px-6 py-6 backdrop-blur">
						<nav className="flex flex-col gap-4">
							{items.map((it) => (
								<Link
									key={it.key}
									to={it.to}
									onClick={() => setOpen(false)}
									className={`text-[0.85rem] tracking-[0.35em] uppercase ${
										active === it.key
											? "text-[color:var(--gold)]"
											: "text-white/85 hover:text-white"
									}`}
								>
									{it.label}
								</Link>
							))}
							<div className="my-2 h-px bg-white/10" />
							<button
								onClick={() => {
									setOpen(false);
									supabase.auth.signOut();
								}}
								className="text-left text-[0.85rem] tracking-[0.35em] uppercase text-white/85 hover:text-white"
							>
								Esci
							</button>
						</nav>
					</div>
				</div>
			)}
		</header>
	);
}