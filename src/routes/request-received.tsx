import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { BackArrow } from "@/components/back-arrow";

export const Route = createFileRoute("/request-received")({
  head: () => ({ meta: [{ title: "Request received — THE ROOM" }] }),
  component: ReceivedPage,
});

function ReceivedPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <BrandLogo className="w-[180px]" />
        <h1 className="mt-12 font-serif text-3xl leading-tight text-[color:var(--gold)]">
          Richiesta ricevuta.
        </h1>
        <p className="mt-6 max-w-xs text-xs leading-relaxed tracking-wider text-muted-foreground">
          Le richieste vengono valutate personalmente entro 24–48 ore.
        </p>
        <Link
          to="/welcome"
          className="mt-12 inline-flex items-center gap-3 text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
        >
          <BackArrow />
          Torna all'ingresso
        </Link>
      </div>
    </main>
  );
}