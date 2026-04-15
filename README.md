# @alexasomba/paystack-inline

A **strongly-typed, Promise-based TypeScript wrapper** for the Paystack Popup (`inline.js`). Gives you full IDE autocomplete and type safety, while securely deferring all the heavy lifting — iframe rendering, WebSockets, Apple Pay sessions, PCI compliance — to Paystack's official CDN.

> **Why not bundle inline.js directly?**  
> Paystack ships security and fraud-detection patches silently via their CDN. By dynamically loading the script at runtime, your users always get the latest, most secure version — without you having to cut a new release.

---

## Features

- ✅ **Zero dependencies** — no npm bloat, 0.91 kB gzipped
- ✅ **Full TypeScript types** for every option, callback, and response
- ✅ All documented **and** undocumented aliases from `inline.js` included
- ✅ `loadPaystack()` promise prevents race conditions and double-loading
- ✅ Supports: **Cards, Bank, USSD, Mobile Money, Bank Transfer, QR, Apple Pay, Subscriptions, Splits**
- ✅ Works with **React, Vue, Svelte, Next.js, SvelteKit, plain HTML** — any frontend

---

## Installation

```bash
npm install @alexasomba/paystack-inline
# or
pnpm add @alexasomba/paystack-inline
# or
yarn add @alexasomba/paystack-inline
```

---

## Quick Start

### 1. Initialize from your server (required)

Never call Paystack's API from the browser — your secret key would be exposed. Initialize on your backend and pass the `access_code` to the frontend:

```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "customer@email.com", "amount": "500000" }' \
  -X POST
```

The response contains `data.access_code`. Send this to your frontend.

### 2. Resume the transaction in the browser

```typescript
import { loadPaystack } from "@alexasomba/paystack-inline";

const PaystackPop = await loadPaystack();
const popup = new PaystackPop();

popup.resumeTransaction(accessCode, {
  onSuccess: (response) => {
    console.log("Payment successful!", response.reference);
    // Verify on your server before delivering value
  },
  onCancel: () => {
    console.log("User cancelled payment");
  },
});
```

> **Always verify server-side** after `onSuccess`. Never deliver value based solely on a client callback — confirm with the [Verify Transaction](https://paystack.com/docs/api/transaction/#verify) endpoint.

---

## API Reference

### `loadPaystack()`

Dynamically injects `https://js.paystack.co/v2/inline.js` into the page and resolves with the `PaystackPop` constructor. Safe to call multiple times — only one script tag is ever created.

```typescript
import { loadPaystack } from "@alexasomba/paystack-inline";

const PaystackPop = await loadPaystack();
const popup = new PaystackPop();
```

**Throws** if called outside a browser (e.g. server-side rendering). Wrap in a browser check if needed:

```typescript
if (typeof window !== "undefined") {
  const PaystackPop = await loadPaystack();
}
```

---

### `popup.resumeTransaction(accessCode, callbacks?)`

The **recommended** checkout flow. Initialize on your server, then resume on the client.

```typescript
popup.resumeTransaction("br6cgmvflhn3qtd", {
  onSuccess: (res) => console.log(res.reference),
  onCancel: () => console.log("cancelled"),
  onError: (err) => console.error(err.message),
});
```

---

### `popup.newTransaction(options)`

Start a transaction directly from the frontend using your public key.

> [!WARNING]
> The `amount` must be in the **lowest currency denomination** (e.g. kobo for NGN, pesewas for GHS). `500000` = ₦5,000.

```typescript
const transaction = popup.newTransaction({
  key: "pk_test_xxxxxxxxx",
  email: "customer@email.com",
  amount: 500000,
  currency: "NGN",
  reference: "unique-ref-" + Date.now(),
  onSuccess: (response) => {
    console.log("Transaction ref:", response.reference);
  },
  onCancel: () => {
    console.log("Checkout closed");
  },
});
```

#### Core Options

| Option      | Type       | Required | Description                                                                              |
| ----------- | ---------- | -------- | ---------------------------------------------------------------------------------------- |
| `key`       | `string`   | ✅       | Your Paystack **public** key (`pk_...`)                                                  |
| `email`     | `string`   | ✅       | Customer's email address                                                                 |
| `amount`    | `number`   | ✅       | Amount in the lowest currency unit (e.g. kobo)                                           |
| `currency`  | `string`   | —        | Currency code: `NGN`, `GHS`, `ZAR`, `KES`, `USD`                                         |
| `reference` | `string`   | —        | Unique transaction reference. Auto-generated if unset                                    |
| `label`     | `string`   | —        | Customer name shown on the checkout                                                      |
| `channels`  | `string[]` | —        | Limit channels: `["card", "bank", "ussd", "mobile_money", "bank_transfer", "qr", "eft"]` |
| `metadata`  | `object`   | —        | Arbitrary key-value data attached to the transaction                                     |
| `language`  | `string`   | —        | Force checkout language (`en`, `fr`, `pt`, etc.)                                         |

#### Customer Options

| Option         | Type     | Description                     |
| -------------- | -------- | ------------------------------- |
| `firstName`    | `string` | Pre-fill customer first name    |
| `lastName`     | `string` | Pre-fill customer last name     |
| `phone`        | `string` | Customer phone number           |
| `customerCode` | `string` | Existing Paystack customer code |

---

### `popup.preloadTransaction(options)` → `() => void`

Pre-fetches the checkout iframe in the background for a snappy UX. Returns a function to open the pre-loaded popup.

```typescript
const open = popup.preloadTransaction({
  key: "pk_test_xxxxxxx",
  email: "customer@email.com",
  amount: 100000,
  onSuccess: (res) => verifyOnServer(res.reference),
});

// Later, when user clicks "Pay":
document.getElementById("pay-btn").addEventListener("click", open);
```

---

### `popup.checkout(options)` → `Promise<PopupTransaction>`

Promise-based checkout. Resolves with the `PopupTransaction` object when the popup opens.

```typescript
const transaction = await popup.checkout({
  key: "pk_test_xxxxxxx",
  email: "customer@email.com",
  amount: 200000,
  onSuccess: (res) => console.log(res),
});

// Check status at any time:
console.log(transaction.getStatus());
```

---

### `popup.cancelTransaction(idOrTransaction)`

Programmatically close an open transaction.

```typescript
const tx = popup.newTransaction({ ... });
// ... later
popup.cancelTransaction(tx); // or popup.cancelTransaction(tx.id)
```

---

### `popup.paymentRequest(options)` → `Promise<PopupTransaction>`

Renders an **embedded payment element** (Apple Pay button, wallet button) into a DOM container. Perfect for custom checkout UIs.

```typescript
const payment = await popup.paymentRequest({
  key: "pk_test_xxxxxxx",
  email: "customer@email.com",
  amount: 500000,
  container: "#payment-request-container", // CSS selector or element ID
  onSuccess: (res) => console.log(res),
  onElementsMount: (elements) => {
    console.log("Payment elements mounted:", elements);
  },
  styles: {
    theme: "dark",
    applePay: {
      width: "100%",
      height: "48px",
      borderRadius: "8px",
      type: "buy", // "plain" | "buy" | "donate"
      locale: "en-US",
    },
  },
});
```

#### `paymentRequest` Options

| Option                       | Type                | Description                                            |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| `container`                  | `string`            | ✅ CSS selector or element ID of the mount target      |
| `loadPaystackCheckoutButton` | `string`            | Selector for a custom button that opens the full Popup |
| `styles.theme`               | `"dark" \| "light"` | Apple Pay button theme                                 |
| `styles.applePay.type`       | `string`            | Apple Pay button label: `"plain"`, `"buy"`, `"donate"` |
| `styles.applePay.locale`     | `string`            | Apple Pay button locale                                |
| `onElementsMount`            | `function`          | Fires when the embedded elements appear in the DOM     |

---

## Callbacks

All transaction methods accept the same callback interface:

| Callback                            | Signature                                     | Description                                         |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `onSuccess`                         | `(res: { id, reference, message }) => void`   | Payment completed successfully                      |
| `onError`                           | `(err: { message: string }) => void`          | Payment failed with an error                        |
| `onCancel`                          | `() => void`                                  | User closed the popup before completing             |
| `onClose`                           | `() => void`                                  | Popup was closed (includes both cancel and success) |
| `onLoad`                            | `(res: { id, customer, accessCode }) => void` | Popup fully loaded and ready                        |
| `onBankTransferConfirmationPending` | `() => void`                                  | Bank transfer initiated, awaiting confirmation      |
| `callback`                          | `(res: any) => void`                          | Legacy v1 callback (use `onSuccess` instead)        |

---

## Subscriptions

Charge customers on a recurring plan:

```typescript
popup.newTransaction({
  key: "pk_test_xxxxxxx",
  email: "customer@email.com",
  amount: 500000,
  plan: "PLN_xxxxxxxxx", // or planCode
  quantity: 1, // number of seats/plan units
  interval: "monthly", // or planInterval
  invoice_limit: 12, // stop after N billing cycles
  start_date: "2025-01-01T00:00:00Z",
  onSuccess: (res) => console.log(res),
});
```

#### Subscription Options

| Option                  | Type     | Aliases         | Description                                        |
| ----------------------- | -------- | --------------- | -------------------------------------------------- |
| `planCode`              | `string` | `plan`          | Paystack plan code (`PLN_...`)                     |
| `subscriptionCount`     | `number` | `quantity`      | Number of subscriptions / seats                    |
| `planInterval`          | `string` | `interval`      | `hourly`, `daily`, `weekly`, `monthly`, `annually` |
| `subscriptionLimit`     | `number` | `invoice_limit` | Max billing cycles before stopping                 |
| `subscriptionStartDate` | `string` | `start_date`    | ISO 8601 date for first charge                     |

---

## Split Payments

Route portions of a payment to subaccounts:

```typescript
popup.newTransaction({
  key: "pk_test_xxxxxxx",
  email: "customer@email.com",
  amount: 500000,
  subaccount: "ACCT_xxxxxxxxx", // or subaccountCode
  bearer: "account", // who bears transaction charges
  transaction_charge: 2000, // flat charge for the main account (kobo)
  onSuccess: (res) => console.log(res),
});
```

#### Split Options

| Option              | Type                        | Aliases              | Description                                      |
| ------------------- | --------------------------- | -------------------- | ------------------------------------------------ |
| `subaccountCode`    | `string`                    | `subaccount`         | Subaccount code to split with                    |
| `split_code`        | `string`                    |                      | Reference a pre-configured split group           |
| `split`             | `object`                    |                      | Inline split configuration object                |
| `connect_split`     | `string[]`                  |                      | Array of connected account codes for multi-split |
| `bearer`            | `"account" \| "subaccount"` |                      | Who absorbs the transaction fee                  |
| `transactionCharge` | `string \| number`          | `transaction_charge` | Flat fee (in kobo) retained by the main account  |

---

## Framework Examples

### React

```typescript
import { loadPaystack } from "@alexasomba/paystack-inline";

function CheckoutButton({ accessCode }: { accessCode: string }) {
  const handlePay = async () => {
    const PaystackPop = await loadPaystack();
    const popup = new PaystackPop();

    popup.resumeTransaction(accessCode, {
      onSuccess: (response) => {
        // Call your API to verify + fulfill the order
        fetch("/api/verify", {
          method: "POST",
          body: JSON.stringify({ reference: response.reference }),
        });
      },
      onCancel: () => console.log("Payment cancelled"),
    });
  };

  return <button onClick={handlePay}>Pay Now</button>;
}
```

### Next.js (App Router)

```typescript
"use client"; // Required — loadPaystack() is browser-only

import { loadPaystack } from "@alexasomba/paystack-inline";

export default function PayButton({ accessCode }: { accessCode: string }) {
  const handlePay = async () => {
    const PaystackPop = await loadPaystack();
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: (res) => console.log(res.reference),
    });
  };

  return <button onClick={handlePay}>Complete Payment</button>;
}
```

### Vue 3

```typescript
<script setup lang="ts">
import { loadPaystack } from "@alexasomba/paystack-inline";

const props = defineProps<{ accessCode: string }>();

const handlePay = async () => {
  const PaystackPop = await loadPaystack();
  const popup = new PaystackPop();
  popup.resumeTransaction(props.accessCode, {
    onSuccess: (res) => console.log(res.reference),
  });
};
</script>

<template>
  <button @click="handlePay">Pay Now</button>
</template>
```

### Svelte / SvelteKit

```typescript
<script lang="ts">
  import { loadPaystack } from "@alexasomba/paystack-inline";

  export let accessCode: string;

  async function handlePay() {
    const PaystackPop = await loadPaystack();
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: (res) => console.log(res.reference),
    });
  }
</script>

<button on:click={handlePay}>Pay Now</button>
```

---

## TypeScript Reference

All exported types are available for direct import:

```typescript
import type {
  PaystackPopGeneralOptions,
  PaystackPopCallbacks,
  PaystackPopNewTransactionOptions,
  PaystackPopCheckoutOptions,
  PaystackPopPaymentRequestOptions,
  PaystackPopSplitOptions,
  PaystackPopSubscriptionOptions,
  PaystackPopInstance,
  PopupTransaction,
  PopupTransactionStatus,
} from "@alexasomba/paystack-inline";
```

### `PopupTransactionStatus`

```typescript
interface PopupTransactionStatus {
  status: "null" | "error" | "abandoned" | "auth" | "failed" | "success" | "pending";
  id?: string;
  errors?: any[];
  response?: any;
  checkoutUrl?: string;
}
```

---

## Complete Payment Flow

```
┌─────────────────┐      POST /transaction/initialize      ┌─────────────────┐
│   Your Backend  │ ─────────────────────────────────────► │  Paystack API   │
│  (Secret Key)   │ ◄───────────────────────────────────── │                 │
└────────┬────────┘            { access_code }             └─────────────────┘
         │
         │  access_code
         ▼
┌─────────────────┐       loadPaystack() + resumeTransaction()
│   Your Frontend │ ─────────────────────────────────────► Paystack Popup UI
│  (Public Key)   │ ◄─────────────── onSuccess({ reference }) ──────────────
└────────┬────────┘
         │
         │  Verify reference on YOUR server (never trust client callbacks alone)
         ▼
┌─────────────────┐      GET /transaction/verify/:reference
│   Your Backend  │ ─────────────────────────────────────► Paystack API
│                 │ ◄─────────────── { status: "success" } ─────────────────
└─────────────────┘
         │
         │  Deliver value to customer ✅
```

---

## Security Notes

- **Never use your Secret Key on the frontend.** Use only your Public Key (`pk_...`).
- **Always verify transactions server-side** before delivering value — the `onSuccess` callback can be spoofed.
- The script at `https://js.paystack.co/v2/inline.js` is loaded over HTTPS and served with integrity-safe headers by Paystack's CDN.

---

## Related Resources

- [Paystack Docs — Accept Payments](https://paystack.com/docs/payments/accept-payment/)
- [Paystack Docs — Verify Transactions](https://paystack.com/docs/api/transaction/#verify)
- [Paystack Docs — Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Docs — Payment Channels](https://paystack.com/docs/payments/payment-channels/)
- [Paystack Docs — Subscriptions](https://paystack.com/docs/payments/subscriptions/)

---

## License

MIT © [alexasomba](https://github.com/alexasomba)
