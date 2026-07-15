-- Hide user-scoped tables from GraphQL schema exposure (we use PostgREST/RPC only)
COMMENT ON TABLE public.favorites IS E'@graphql({"totalCount": {"enabled": false}})';

-- Revoke discovery of these tables from GraphQL introspection by moving the pg_graphql
-- inflection off; use per-table directive to disable the type:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
    EXECUTE 'COMMENT ON TABLE public.profiles IS ''@graphql({"totalCount": {"enabled": false}})''';
  END IF;
END $$;

-- Restrict SECURITY DEFINER function execution to service_role only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='handle_new_user' AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role';
  END IF;
END $$;