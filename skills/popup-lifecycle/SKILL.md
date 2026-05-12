---
name: popup-lifecycle
description: Use when managing @alexasomba/paystack-inline popup lifecycle methods including preloadTransaction, cancelTransaction, checkout, paymentRequest, getStatus, and callback sequencing.
license: MIT
compatibility: "Modern browsers with Paystack Popup; package tooling/SSR builds require Node.js >=22.0.0; ESM package; client-side checkout with server verification."
---

# Paystack Inline Popup Lifecycle

Use this skill when the task goes beyond opening a basic checkout and needs lifecycle control.

## Preload then open

`preloadTransaction` warms the checkout iframe and returns a function that opens it later.

```ts
const openCheckout = popup.preloadTransaction({
  key: "pk_test_...",
  email,
  amount,
  onSuccess: ({ reference }) => verifyOnServer(reference),
});

button.addEventListener("click", openCheckout);
```

## Cancel a popup

Use `cancelTransaction` with either the transaction id or the returned transaction object.

```ts
const transaction = popup.newTransaction(options);

cancelButton.addEventListener("click", () => {
  popup.cancelTransaction(transaction);
});
```

## Inspect status

The transaction object exposes `getStatus()`.

```ts
const status = transaction.getStatus();

if (status.status === "success" && status.response) {
  // Still verify on the server before fulfillment.
}
```

Known status values are `null`, `error`, `abandoned`, `auth`, `failed`, `success`, and `pending`.

## Promise APIs

Use `checkout(options)` or `paymentRequest(options)` when the UI flow expects a promise-returning method.

```ts
const transaction = await popup.checkout({
  key: "pk_test_...",
  email,
  amount,
  onSuccess: ({ reference }) => verifyOnServer(reference),
});
```

## Best practices

- Keep frontend status as UI state, not fulfillment truth.
- Always verify successful references on the server.
- Handle duplicate callbacks defensively.
- Clean up event listeners when components unmount.
