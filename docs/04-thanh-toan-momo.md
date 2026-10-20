# MoMo merchant setup

The application uses MoMo's one-time `captureWallet` flow. The server creates the payment request, signs it with HMAC-SHA256, validates MoMo's signed response before redirecting the customer, and only marks an order paid after a matching signed IPN notification. The browser redirect alone never marks an order paid.

## Merchant onboarding

Register the business in [MoMo for Business](https://business.momo.vn/) and request the MoMo e-wallet one-time payment solution. MoMo provides different credentials for sandbox and production: Partner Code, Access Key, and Secret Key. Keep these values in the hosting provider's encrypted secret store; do not put them in source control, `.env.example`, chat, or a client-side `NEXT_PUBLIC_` variable.

## Environment configuration

Set these secrets in the environment where the Next.js server runs:

```text
SITE_URL=https://shop.example.vn
MOMO_ENVIRONMENT=sandbox
MOMO_PARTNER_CODE=<merchant partner code>
MOMO_ACCESS_KEY=<merchant access key>
MOMO_SECRET_KEY=<merchant secret key>
```

Use `MOMO_ENVIRONMENT=production` only after MoMo approves the merchant and production credentials. The production API host is selected in server code; the test endpoint cannot be selected by production configuration. `SITE_URL` must be the public HTTPS origin that MoMo can reach. The server registers `/api/payments/momo/ipn` as the notification URL and returns customers to `/tai-khoan`.

MoMo's IPN is server-to-server and must be publicly reachable over HTTPS. Configure the production domain and HTTPS certificate before enabling MoMo. After setting credentials, run the integration suite against sandbox credentials and verify a successful payment, a failed payment, a duplicate IPN, and amount mismatch before release.

## Current setup status

The repository contains the server integration and uses a local fake gateway in automated tests. Merchant registration, live credentials, a public staging URL, and a real sandbox transaction still require the store owner's MoMo Business account and hosting environment.

Official references: [MoMo onboarding and credentials](https://developers.momo.vn/v3/docs/payment/onboarding/integration-process/), [one-time MoMo wallet payments](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/), and [IPN notification handling](https://developers.momo.vn/v3/docs/payment/api/result-handling/notification/).
