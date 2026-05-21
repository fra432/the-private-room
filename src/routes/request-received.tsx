import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

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
          Your request has been received.
        </h1>
        <p className="mt-6 max-w-xs text-xs leading-relaxed tracking-wider text-muted-foreground">
          Access approvals are reviewed personally within 24–48 hours.
        </p>
        <Link
          to="/welcome"
          className="mt-12 text-[0.6rem] tracking-[0.5em] uppercase text-muted-foreground hover:text-[color:var(--gold)]"
        >
          ← Back to entrance
        </Link>
      </div>
    </main>
  );
}