import {
	createFileRoute,
	Navigate,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
	component: AuthGate,
});

function AuthGate() {
	const { session, loading } = useAuth();
	const location = useLocation();
	const [hasProfile, setHasProfile] = useState<boolean | null>(null);

	useEffect(() => {
		if (!session?.user?.id) {
			setHasProfile(null);
			return;
		}

		supabase
			.from("profiles")
			.select("id")
			.eq("id", session.user.id)
			.maybeSingle()
			.then(({ data }) => {
				setHasProfile(!!data);
			});
	}, [session?.user?.id]);

	if (loading || hasProfile === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-[color:var(--gold)] text-[0.6rem] tracking-[0.5em] uppercase">
				…
			</div>
		);
	}
	if (!session) return <Navigate to="/login" />;

	// Se non ha profilo e non è già nel questionario, reindirizza
	if (!hasProfile && !location.pathname.includes("questionnaire")) {
		return <Navigate to="/_authenticated/questionnaire" />;
	}

	return <Outlet />;
}
