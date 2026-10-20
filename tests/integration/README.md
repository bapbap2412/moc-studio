# MySQL integration checks

Run `pnpm run build` first, then `pnpm run test:integration`.

The runner reads the local `.env.local` connection settings (or `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, and `TEST_DB_PASSWORD` overrides). It only accepts a loopback MySQL host. The database account needs permission to create and drop databases. Each run creates a uniquely named `moc_it_*` database, applies migrations 001–006, seeds disposable fixtures, starts the built Next.js app against that database, and drops the database in a `finally` cleanup.

The suite covers login success/failure, customer/admin access, coupon calculations and usage limits, simultaneous checkouts against limited stock, wishlist toggling, review eligibility/update behavior, bank transfer details, MoMo request/response signatures and IPN payment confirmation using a local fake gateway, and production hiding of `/api/db-test`.

Do not use `TEST_KEEP_DB=1` against any shared or production server. That option is only for local debugging after a failed run.
