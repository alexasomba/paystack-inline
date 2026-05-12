---
name: server-initialize-verify
description: Use when pairing @alexasomba/paystack-inline with backend transaction initialization and server-side verification.
---

# Paystack Inline Server Initialize and Verify

## License and compatibility

- License: MIT, same as `@alexasomba/paystack-inline`.
- Runtime compatibility: modern browsers that can load Paystack Popup; package tooling and SSR builds require Node.js >=22.0.0.
- Supported import path: `@alexasomba/paystack-inline`; the package is ESM with `type: "module"`.
- Intended environment: client-side checkout only. Guard SSR paths and verify transactions on a backend before fulfillment.

The safest Inline flow initializes the transaction on your backend, sends `access_code` to the browser, and verifies the transaction on the backend after checkout succeeds.

## Backend initialization

Use a server SDK or direct Paystack API call with your secret key.

```ts
const result = await paystack.transaction_initialize({
  body: {
    email: customer.email,
    amount: 500000,
    reference: payment.reference,
  },
});

const initialized = result.unwrap();
return { accessCode: initialized.access_code };
```

## Frontend resume

```ts
const PaystackPop = await loadPaystack();
const popup = new PaystackPop();

popup.resumeTransaction(accessCode, {
  onSuccess: ({ reference }) => verifyOnServer(reference),
});
```

## Backend verification

After success, call transaction verify on the backend before fulfilling value.

```ts
const verified = await paystack.transaction_verify({
  params: { path: { reference } },
});

const data = verified.unwrap();
```

## Best practices

- Never deliver value based only on `onSuccess`.
- Store your own payment attempt before initializing Paystack.
- Compare amount, currency, reference, and customer before fulfillment.
- Make verification and fulfillment idempotent.
