# VNPay payment setup

The store uses the VNPay payment gateway API v2.1.0. The server creates a signed payment URL with HMAC-SHA512, validates the browser return signature for display, and updates an order as paid only after a valid server-to-server IPN with matching merchant code, order reference, and amount. A browser return alone never marks an order paid.

## Merchant registration

Register for a merchant integration account through the [official VNPay sandbox registration](https://sandbox.vnpayment.vn/devreg/) and request sandbox credentials. VNPay supplies a Terminal Code (`vnp_TmnCode`) and Hash Secret (`vnp_HashSecret`). Production credentials and activation require VNPay's merchant approval. Store credentials only in the hosting provider's encrypted environment settings. Do not commit them, put them in `.env.example`, send them in chat, or expose them in `NEXT_PUBLIC_` variables.

## Environment variables

For a public HTTPS staging deployment with sandbox credentials, set:

```text
SITE_URL=https://staging.example.vn
VNPAY_ENVIRONMENT=sandbox
VNPAY_TMN_CODE=<sandbox terminal code>
VNPAY_HASH_SECRET=<sandbox hash secret>
```

For production, use the credentials issued for production and set `VNPAY_ENVIRONMENT=production`. The payment endpoint is selected by the server based on this setting. `SITE_URL` must be the public HTTPS site URL. Register `https://<site>/api/payments/vnpay/ipn` as the merchant IPN URL with VNPay. The browser return endpoint is `https://<site>/api/payments/vnpay/return`.

## Payment and callback handling

The checkout sends the amount in VND multiplied by 100, as required by VNPay. The app sorts and URL-encodes `vnp_` parameters before generating the HMAC-SHA512 secure hash. The IPN route validates the signature before checking order reference, amount, merchant code, and current order status. Duplicate success notifications are acknowledged without repeating the payment update. Failed payments remain unpaid. The return endpoint only displays the result; IPN is authoritative for payment status.

Run `pnpm run test:integration` locally to exercise signed request URLs, return verification, invalid and failed notifications, successful confirmation, and duplicate IPN handling through a local fake gateway. Before production, complete a real sandbox transaction and confirm VNPay can reach the public HTTPS IPN endpoint. The local test does not contact VNPay.

## Current setup status

The code and local fake-gateway test are included. The store still needs a VNPay merchant account, sandbox and production credentials, a public HTTPS staging domain, and a real sandbox transaction before go-live.

Official references: [VNPay payment integration](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [HMAC-SHA512 migration guidance](https://sandbox.vnpayment.vn/apis/docs/chuyen-doi-thuat-toan/changeTypeHash.html), and [VNPay introduction and sandbox test credentials](https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/).
