-- Restore EXECUTE on has_role for authenticated users.
-- Migration 20260522071646 revoked it, but RLS policies on user_roles (and
-- other tables) call has_role() in their USING clauses. Because PostgreSQL
-- evaluates ALL permissive SELECT policies and throws on any expression that
-- raises an error, revoking EXECUTE from authenticated causes every SELECT on
-- those tables to fail with 403 — even for the policy that does not call
-- has_role (e.g. "users view own role").
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
