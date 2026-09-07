import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

export function PasswordField({
	label,
	name,
	value,
	onChange,
	autoComplete = "new-password",
	required,
	hint,
	className,
}: {
	label: string;
	name?: string;
	value?: string;
	onChange?: (v: string) => void;
	autoComplete?: string;
	required?: boolean;
	hint?: string;
	className?: string;
}) {
	const [visible, setVisible] = useState(false);
	const id = useId();
	return (
		<label className="flex flex-col gap-2" htmlFor={id}>
			<span className="text-[0.7rem] tracking-[0.5em] uppercase text-foreground/60 font-medium">
				{label}
			</span>
			<div className="relative">
				<input
					id={id}
					name={name}
					type={visible ? "text" : "password"}
					required={required}
					autoComplete={autoComplete}
					{...(onChange
						? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
						: {})}
					className={
						className ??
						"w-full !bg-transparent border-b border-[color:var(--gold)]/50 pb-4 pr-11 pt-3 font-serif text-xl tracking-wide text-foreground placeholder:text-foreground/40 focus:border-[color:var(--gold)] focus:outline-none transition-colors"
					}
				/>
				<button
					type="button"
					onClick={() => setVisible((v) => !v)}
					aria-label={visible ? "Nascondi password" : "Mostra password"}
					className="absolute right-0 bottom-3 inline-flex h-8 w-8 items-center justify-center text-foreground/50 transition-colors hover:text-[color:var(--gold)]"
				>
					{visible ? (
						<EyeOff className="h-4.5 w-4.5" />
					) : (
						<Eye className="h-4.5 w-4.5" />
					)}
				</button>
			</div>
			{hint && <span className="text-sm text-foreground/55">{hint}</span>}
		</label>
	);
}

/** Traduce in italiano gli errori di password restituiti dal backend. */
export function passwordErrorMessage(message: string): string {
	const m = message.toLowerCase();
	if (m.includes("weak") || m.includes("known") || m.includes("pwned"))
		return "Questa password è troppo comune e compare in elenchi di password violate. Scegline una diversa (prova ad aggiungere parole o simboli).";
	if (m.includes("at least") || m.includes("should be"))
		return "La password non rispetta i requisiti: almeno 8 caratteri.";
	if (m.includes("same as the old"))
		return "La nuova password deve essere diversa da quella attuale.";
	return message;
}

export const PASSWORD_HINT =
	"Almeno 8 caratteri. Evita password troppo comuni (es. password123): usa una frase o parole tue.";
