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
	const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(
		null,
	);

	useEffect(() => {
		if (!session?.user?.id) {
			setHasQuestionnaire(null);
			return;
		}

		supabase
			.from("questionnaires")
			.select("id")
			.eq("user_id", session.user.id)
			.maybeSingle()
			.then(({ data }) => {
				setHasQuestionnaire(!!data);
			});
	}, [session?.user?.id, location.pathname]);

	if (loading || hasQuestionnaire === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-[color:var(--gold)] text-[0.6rem] tracking-[0.5em] uppercase">
				…
			</div>
		);
	}
	if (!session) return <Navigate to="/login" />;

	// Se non ha compilato il questionario e non è già nel questionario, reindirizza
	if (!hasQuestionnaire && !location.pathname.includes("questionnaire")) {
		return <Navigate to="/_authenticated/questionnaire" />;
	}

	return <Outlet />;
}
