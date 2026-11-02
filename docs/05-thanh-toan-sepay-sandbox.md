# SePay Payment Gateway sandbox

SePay is implemented in its own module and API routes. It uses the installed `sepay-pg-node` SDK and is intentionally restricted to sandbox mode until production credentials and a separate production rollout are configured.

## Environment

Set these values in the hosting provider's secret environment settings:

```dotenv
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=<sandbox merchant id>
SEPAY_SECRET_KEY=<sandbox secret key>
SITE_URL=https://<public-staging-domain>
```

Never commit credentials or expose them in `NEXT_PUBLIC_` variables. `SITE_URL` must be a public HTTPS origin so SePay can reach the IPN endpoint.

## Creating a payment

Checkout creates a SePay `sepay` order and posts signed fields to SePay's sandbox checkout. `POST /api/payments/sepay/create` is also available for a signed-in customer to retry an eligible order; it checks ownership, then re-reads the amount from MySQL and returns signed checkout fields plus SePay's sandbox URL.

SePay uses its own `sepay` payment method and checkout option. The existing VNPay method, routes, and callbacks are unchanged.

## IPN and result page

Configure `https://<public-staging-domain>/api/payments/sepay/ipn` in SePay Payment Gateway → Configuration → IPN and select Secret Key authentication. The route validates `X-Secret-Key`, the `ORDER_PAID` event, captured/approved transaction state, VND currency, invoice number, and matching order/transaction/database amounts. It updates only an unpaid eligible order; duplicate notifications are acknowledged idempotently. Unsupported or invalid notifications do not result in a paid update.

The SePay `success_url`, `error_url`, and `cancel_url` return to `/thanh-toan/ket-qua` on the same origin the customer used to start checkout, so the browser keeps using its existing session cookie. That page only tells the customer that verification is in progress; it never marks an order paid based on browser navigation. Configure the IPN separately on the public HTTPS tunnel URL.

Complete a sandbox transaction and verify SePay can reach the public HTTPS IPN endpoint before considering any live rollout.

Official references: [SePay Payment Gateway IPN](https://developer.sepay.vn/en/cong-thanh-toan/IPN), [SePay Node.js SDK](https://developer.sepay.vn/en/cong-thanh-toan/sdk/nodejs).
