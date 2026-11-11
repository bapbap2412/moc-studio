# MySQL integration checks

Run `pnpm run build` first, then `pnpm run test:integration`.

The runner reads local `.env.local` MySQL settings or `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, and `TEST_DB_PASSWORD` overrides. It only permits a loopback MySQL host. Each run creates a uniquely named disposable database, applies migrations 001–008 and 011, 013–015, seeds fixtures, starts the built app, and drops the database in cleanup. It omits the data-dependent integrity check/enforcement migrations 009–010 and the MySQL 5.7 fallback migration 012.

Coverage includes authentication, admin authorization, coupon totals, concurrent inventory, wishlist and review behavior, bank transfer details, VNPay URL signatures and return validation, invalid/failed/successful IPNs, duplicate IPNs, and production hiding of `/api/db-test`. Migration 015 is applied against the fresh base-schema UUID collations. The VNPay endpoint is a local fake URL; these tests do not contact VNPay.

Do not set `TEST_KEEP_DB=1` against a shared or production database.
