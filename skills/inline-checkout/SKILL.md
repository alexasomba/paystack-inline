---
name: inline-checkout
description: Use when integrating @alexasomba/paystack-inline checkout, loadPaystack, resumeTransaction, newTransaction, callbacks, and SSR guards.
---

# Paystack Inline Checkout

## License and compatibility

- License: MIT, same as `@alexasomba/paystack-inline`.
- Runtime compatibility: modern browsers that can load Paystack Popup; package tooling and SSR builds require Node.js >=22.0.0.
- Supported import path: `@alexasomba/paystack-inline`; the package is ESM with `type: "module"`.
- Intended environment: client-side checkout only. Guard SSR paths and verify transactions on a backend before fulfillment.

Use `@alexasomba/paystack-inline` to load Paystack Popup from `https://js.paystack.co/v2/inline.js` and interact with it through typed helpers.

## Load the popup script

```ts
import { loadPaystack } from "@alexasomba/paystack-inline";

const PaystackPop = await loadPaystack();
const popup = new PaystackPop();
```

`loadPaystack()` only works in a browser. In SSR frameworks, call it inside a client-only handler or after checking `typeof window !== "undefined"`.

## Recommended flow: resume a server-initialized transaction

```ts
popup.resumeTransaction(accessCode, {
  onSuccess: (response) => {
    void verifyOnServer(response.reference);
  },
  onCancel: () => {
    setCheckoutOpen(false);
  },
  onError: (error) => {
    console.error(error.message);
  },
});
```

## Direct popup flow

```ts
popup.newTransaction({
  key: "pk_test_...",
  email: "customer@example.com",
  amount: 500000,
  currency: "NGN",
  onSuccess: (response) => {
    void verifyOnServer(response.reference);
  },
});
```

## Best practices

- Prefer `resumeTransaction(accessCode)` after server initialization.
- Verify on the server after `onSuccess`.
- Do not call secret-key Paystack APIs from frontend code.
- Keep callbacks small; move fulfillment to backend verification.
