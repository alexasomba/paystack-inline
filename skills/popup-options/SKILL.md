---
name: popup-options
description: Use when configuring @alexasomba/paystack-inline typed popup options, amount, currency, metadata, channels, splits, subscriptions, preloading, and callbacks.
---

# Paystack Inline Popup Options

The Inline SDK exports TypeScript interfaces for Paystack Popup options and callback responses.

## Core options

```ts
popup.newTransaction({
  key: "pk_test_...",
  email: "customer@example.com",
  amount: 500000,
  currency: "NGN",
  reference: "order_123",
  metadata: {
    orderId: "order_123",
  },
  channels: ["card", "bank", "ussd"],
  onSuccess: (response) => verifyOnServer(response.reference),
  onCancel: () => setCheckoutOpen(false),
});
```

Amounts are in the lowest currency denomination, such as kobo for NGN.

## Preloading

Use `preloadTransaction` to warm the checkout iframe before a user clicks the pay button.

```ts
const open = popup.preloadTransaction({
  key: "pk_test_...",
  email: "customer@example.com",
  amount: 500000,
  onSuccess: ({ reference }) => verifyOnServer(reference),
});

button.addEventListener("click", open);
```

## Splits and subscriptions

Use the exported option types when configuring split, subaccount, or subscription fields. Keep privileged split and plan setup on the backend; only pass frontend-safe identifiers into popup options.

## Best practices

- Always use a public key in popup options.
- Keep references unique.
- Keep callback code short and resilient to duplicate calls.
- Verify final payment status on the backend before fulfillment.
