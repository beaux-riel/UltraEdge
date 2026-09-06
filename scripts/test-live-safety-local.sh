#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(pg_config --bindir)}"
TEST_DIR="$(mktemp -d /tmp/ultraedge-safety.XXXXXX)"
"$PG_BIN/initdb" -D "$TEST_DIR/data" -A trust --no-locale -E UTF8 > "$TEST_DIR/init.log"
trap '"$PG_BIN/pg_ctl" -D "$TEST_DIR/data" -m fast -w stop > /dev/null; printf "Local test artifacts: %s\n" "$TEST_DIR"' EXIT
"$PG_BIN/pg_ctl" -D "$TEST_DIR/data" -l "$TEST_DIR/server.log" -o "-k $TEST_DIR -p 55439 -h ''" -w start > /dev/null
PSQL=("$PG_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$TEST_DIR" -p 55439 -d postgres)
"${PSQL[@]}" <<'SQL'
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.actor',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql as $$ select jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('test.guest',true),''),'true')::boolean) $$;
grant usage on schema auth to authenticated;
SQL
"${PSQL[@]}" -f "$ROOT/supabase/collaboration/001_live_rooms.sql"
"${PSQL[@]}" -f "$ROOT/supabase/collaboration/002_safety.sql"
"${PSQL[@]}" -f "$ROOT/supabase/collaboration/tests/safety.sql"
"${PSQL[@]}" -f "$ROOT/supabase/collaboration/tests/oversized_evidence.sql"
printf 'PASS isolated PostgreSQL collaboration safeguards\n'
