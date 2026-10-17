[English](README.md) · [Español](README.es-ES.md) · [Français](README.fr-FR.md)

# @alexasomba/paystack-inline

Un ** wrapper TypeScript fortement typé, basé sur Promise ** pour le popup Paystack (`inline.js`). Vous offre une sécurité complète de saisie semi-automatique et de type IDE, tout en reportant en toute sécurité toutes les tâches lourdes (rendu iframe, WebSockets, sessions Apple Pay, conformité PCI) au CDN officiel de Paystack.

> **Pourquoi ne pas regrouper directement inline.js ?**
> Paystack expédie silencieusement les correctifs de sécurité et de détection de fraude via son CDN. En chargeant dynamiquement le script au moment de l'exécution, vos utilisateurs obtiennent toujours la version la plus récente et la plus sécurisée, sans que vous ayez à supprimer une nouvelle version.

## Fonctionnalités

- ✅ **Zéro dépendance** — pas de ballonnement npm, 0,91 Ko gzippé
- ✅ **Types TypeScript complets** pour chaque option, rappel et réponse
- ✅ Tous les alias documentés **et** non documentés de `inline.js` inclus
- ✅ La promesse `loadPaystack()` évite les conditions de course et le double chargement
- ✅ Prise en charge : **Cartes, banque, USSD, Mobile Money, virement bancaire, QR, Apple Pay, abonnements, fractionnements**
- ✅ Fonctionne avec **React, Vue, Svelte, Next.js, SvelteKit, HTML brut** — n'importe quelle interface

## Installation

```bash
npm install @alexasomba/paystack-inline
# or
pnpm add @alexasomba/paystack-inline
# or
yarn add @alexasomba/paystack-inline
```

## Compétences des agents

Ce package contient des compétences TanStack Intent pour l'intégration Paystack Inline assistée par un agent :

```bash
npx @tanstack/intent@latest list
npx @tanstack/intent@latest install --map
npx @tanstack/intent@latest load @alexasomba/paystack-inline#paystack-inline-checkout
```

Les compétences utiles incluent `paystack-inline-checkout`, `paystack-inline-server-verify`, `paystack-inline-popup-options` et `paystack-inline-popup-lifecycle`.

## Démarrage rapide

### 1. Initialisez depuis votre serveur (obligatoire)

N'appelez jamais l'API de Paystack depuis le navigateur : votre clé secrète serait exposée. Initialisez sur votre backend et transmettez le `access_code` au frontend :

```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "customer@email.com", "amount": "500000" }' \
  -X POST
```

La réponse contient `data.access_code`. Envoyez ceci à votre frontend.

### 2. Reprendre la transaction dans le navigateur

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

> **Toujours vérifier côté serveur** après `onSuccess`. Ne fournissez jamais de valeur basée uniquement sur un rappel client : confirmez avec le point de terminaison [Verify Transaction](https://paystack.com/docs/api/transaction/#verify).

## Référence API

### `loadPaystack()`

Injecte dynamiquement `https://js.paystack.co/v2/inline.js` dans la page et résout avec le constructeur `PaystackPop`. Appelez plusieurs fois en toute sécurité : une seule balise de script est créée.

```typescript
import { loadPaystack } from "@alexasomba/paystack-inline";

const PaystackPop = await loadPaystack();
const popup = new PaystackPop();
```

**Lance** si appelé en dehors d'un navigateur (par exemple, rendu côté serveur). Enveloppez une vérification du navigateur si nécessaire :

```typescript
if (typeof window !== "undefined") {
  const PaystackPop = await loadPaystack();
}
```

### `popup.resumeTransaction(accessCode, callbacks?)`

Le flux de paiement **recommandé**. Initialisez sur votre serveur, puis reprenez sur le client.

```typescript
popup.resumeTransaction("br6cgmvflhn3qtd", {
  onSuccess: (res) => console.log(res.reference),
  onCancel: () => console.log("cancelled"),
  onError: (err) => console.error(err.message),
});
```

### `popup.newTransaction(options)`

Démarrez une transaction directement depuis le frontend en utilisant votre clé publique.

> [!AVERTISSEMENT]
> Le `amount` doit être dans la **dénomination monétaire la plus basse** (par exemple, kobo pour NGN, pesewas pour GHS). `500000` = 5 000 ₦.

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

#### Options de base

| Options     | Tapez      | Obligatoire | Descriptif                                                                                |
| ----------- | ---------- | ----------- | ----------------------------------------------------------------------------------------- |
| `key`       | `string`   | ✅          | Votre clé **publique** Paystack (`pk_...`)                                                |
| `email`     | `string`   | ✅          | Adresse e-mail du client                                                                  |
| `amount`    | `number`   | ✅          | Montant dans l'unité monétaire la plus basse (par exemple kobo)                           |
| `currency`  | `string`   | —           | Code devise : `NGN`, `GHS`, `ZAR`, `KES`, `USD`                                           |
| `reference` | `string`   | —           | Référence unique de la transaction. Généré automatiquement si non défini                  |
| `label`     | `string`   | —           | Nom du client affiché à la caisse                                                         |
| `channels`  | `string[]` | —           | Canaux limites : `["card", "bank", "ussd", "mobile_money", "bank_transfer", "qr", "eft"]` |
| `metadata`  | `object`   | —           | Données clé-valeur arbitraires attachées à la transaction                                 |
| `language`  | `string`   | —           | Langage de vérification forcée (`en`, `fr`, `pt`, etc.)                                   |

#### Options client

| Options        | Tapez    | Descriptif                              |
| -------------- | -------- | --------------------------------------- |
| `firstName`    | `string` | Pré-remplir le prénom du client         |
| `lastName`     | `string` | Pré-remplir le nom de famille du client |
| `phone`        | `string` | Numéro de téléphone du client           |
| `customerCode` | `string` | Code client Paystack existant           |

### `popup.preloadTransaction(options)` → `() => void`

Pré-récupère l'iframe de paiement en arrière-plan pour une UX vive. Renvoie une fonction pour ouvrir la fenêtre contextuelle préchargée.

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

### `popup.checkout(options)` → `Promise<PopupTransaction>`

Paiement basé sur une promesse. Résout avec l'objet `PopupTransaction` lorsque la fenêtre contextuelle s'ouvre.

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

### `popup.cancelTransaction(idOrTransaction)`

Fermez par programmation une transaction ouverte.

```typescript
const tx = popup.newTransaction({ ... });
// ... later
popup.cancelTransaction(tx); // or popup.cancelTransaction(tx.id)
```

### `popup.paymentRequest(options)` → `Promise<PopupTransaction>`

Renvoie un **élément de paiement intégré** (bouton Apple Pay, bouton de portefeuille) dans un conteneur DOM. Parfait pour les interfaces utilisateur de paiement personnalisées.

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

#### Options `paymentRequest`

| Options                      | Tapez               | Descriptif                                                                       |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `container`                  | `string`            | ✅ Sélecteur CSS ou ID d'élément de la cible de montage                          |
| `loadPaystackCheckoutButton` | `string`            | Sélecteur pour un bouton personnalisé qui ouvre la fenêtre contextuelle complète |
| `styles.theme`               | `"dark" \| "light"` | Thème du bouton Apple Pay                                                        |
| `styles.applePay.type`       | `string`            | Étiquette du bouton Apple Pay : `"plain"`, `"buy"`, `"donate"`                   |
| `styles.applePay.locale`     | `string`            | Paramètres régionaux du bouton Apple Pay                                         |
| `onElementsMount`            | `function`          | Se déclenche lorsque les éléments incorporés apparaissent dans le DOM            |

## Rappels

Toutes les méthodes de transaction acceptent la même interface de rappel :

| Rappel                              | Signature                                     | Descriptif                                                                        |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `onSuccess`                         | `(res: { id, reference, message }) => void`   | Paiement effectué avec succès                                                     |
| `onError`                           | `(err: { message: string }) => void`          | Le paiement a échoué avec une erreur                                              |
| `onCancel`                          | `() => void`                                  | L'utilisateur a fermé la fenêtre contextuelle avant de terminer                   |
| `onClose`                           | `() => void`                                  | La fenêtre contextuelle a été fermée (inclut à la fois l'annulation et le succès) |
| `onLoad`                            | `(res: { id, customer, accessCode }) => void` | Popup entièrement chargé et prêt                                                  |
| `onBankTransferConfirmationPending` | `() => void`                                  | Virement bancaire initié, en attente de confirmation                              |
| `callback`                          | `(res: any) => void`                          | Rappel hérité v1 (utilisez plutôt `onSuccess`)                                    |

## Abonnements

Facturez les clients avec un forfait récurrent :

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

#### Options d'abonnement

| Options                 | Tapez    | Alias ​​          | Descriptif                                            |
| ----------------------- | -------- | --------------- | ----------------------------------------------------- |
| `planCode`              | `string` | `plan`          | Code du plan de paie (`PLN_...`)                      |
| `subscriptionCount`     | `number` | `quantity`      | Nombre d'abonnements / places                         |
| `planInterval`          | `string` | `interval`      | `hourly`, `daily`, `weekly`, `monthly`, `annually`    |
| `subscriptionLimit`     | `number` | `invoice_limit` | Nombre maximum de cycles de facturation avant l'arrêt |
| `subscriptionStartDate` | `string` | `start_date`    | Date ISO 8601 pour la première charge                 |

## Paiements fractionnés

Acheminer des parties d'un paiement vers des sous-comptes :

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

#### Options de partage

| Options             | Tapez                       | Alias ​​               | Descriptif                                               |
| ------------------- | --------------------------- | -------------------- | -------------------------------------------------------- |
| `subaccountCode`    | `string`                    | `subaccount`         | Code de sous-compte avec lequel partager                 |
| `split_code`        | `string`                    |                      | Référencer un groupe fractionné préconfiguré             |
| `split`             | `object`                    |                      | Objet de configuration fractionné en ligne               |
| `connect_split`     | `string[]`                  |                      | Tableau de codes de compte connectés pour le multi-split |
| `bearer`            | `"account" \| "subaccount"` |                      | Qui absorbe les frais de transaction                     |
| `transactionCharge` | `string \| number`          | `transaction_charge` | Forfait (en kobo) retenu par le compte principal         |

## Exemples de framework

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

### Next.js (routeur d'application)

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

## Référence TypeScript

Tous les types exportés sont disponibles pour l'importation directe :

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

## Terminer le flux de paiement

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

## Notes de sécurité

- **N'utilisez jamais votre clé secrète sur le frontend.** Utilisez uniquement votre clé publique (`pk_...`).
- **Toujours vérifier les transactions côté serveur** avant de fournir de la valeur : le rappel `onSuccess` peut être usurpé.
- Le script sur `https://js.paystack.co/v2/inline.js` est chargé via HTTPS et servi avec des en-têtes sécurisés par l'intégrité par le CDN de Paystack.

## Ressources connexes

- [Paystack Docs — Accepter les paiements](https://paystack.com/docs/payments/accept-payment/)
- [Paystack Docs — Vérifier les transactions](https://paystack.com/docs/api/transaction/#verify)
- [Documents Paystack — Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Docs — Canaux de paiement](https://paystack.com/docs/payments/payment-channels/)
- [Paystack Docs — Abonnements](https://paystack.com/docs/payments/subscriptions/)

## Source

- Source Monorepo : [alexasomba/paystack-openapi](https://github.com/alexasomba/paystack-openapi)
- Dépôt SDK autonome : [https://github.com/alexasomba/paystack-inline](https://github.com/alexasomba/paystack-inline)

## Licence

MIT © [alexasomba](https://github.com/alexasomba)
