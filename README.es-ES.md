[English](README.md) · [Español](README.es-ES.md) · [Français](README.fr-FR.md)

# @alexasomba/paystack-inline

Un **wrapper (envoltorio) en TypeScript, fuertemente tipado y basado en Promises**, para el Paystack Popup (`inline.js`). Ofrece autocompletado completo en el IDE y seguridad de tipos, delegando de forma segura toda la carga de trabajo —renderizado de iframes, WebSockets, sesiones de Apple Pay, cumplimiento de la normativa PCI— a la CDN oficial de Paystack.

> **¿Por qué no incluir `inline.js` directamente en el paquete?**
> Paystack distribuye parches de seguridad y detección de fraudes de forma silenciosa a través de su CDN. Al cargar el script dinámicamente en tiempo de ejecución, tus usuarios siempre obtienen la versión más reciente y segura, sin necesidad de que tú tengas que realizar una nueva publicación (release) de tu aplicación.



## Características

- ✅ **Sin dependencias** — sin sobrecarga en npm, 0,91 kB (comprimido con Gzip)
- ✅ **Tipos completos en TypeScript** para todas las opciones, callbacks y respuestas
- ✅ Incluye todos los alias, tanto documentados **como** no documentados, de `inline.js`
- ✅ El uso de Promises (`loadPaystack()`) evita condiciones de carrera (*race conditions*) y cargas duplicadas
- ✅ Compatible con: **Tarjetas, bancos, USSD, dinero móvil (Mobile Money), transferencias bancarias, códigos QR, Apple Pay, suscripciones y pagos divididos (*splits*)**
- ✅ Funciona con **React, Vue, Svelte, Next.js, SvelteKit, HTML puro** — cualquier framework o tecnología frontend



## Instalación

```bash
npm install @alexasomba/paystack-inline
# or
pnpm add @alexasomba/paystack-inline
# or
yarn add @alexasomba/paystack-inline
```


## Capacidades para agentes (Agent Skills)

Este paquete incluye capacidades (*skills*) de TanStack Intent para facilitar la integración de Paystack Inline con asistencia de agentes:

```bash
npx @tanstack/intent@latest list
npx @tanstack/intent@latest install --map
npx @tanstack/intent@latest load @alexasomba/paystack-inline#paystack-inline-checkout
```

Entre las capacidades útiles se incluyen `paystack-inline-checkout`, `paystack-inline-server-verify`, `paystack-inline-popup-options` y `paystack-inline-popup-lifecycle`.


## Inicio rápido


### 1. Inicializa desde tu servidor (obligatorio)

Nunca llames a la API de Paystack desde el navegador, ya que tu clave secreta quedaría expuesta. Realiza la inicialización en tu backend y pasa el valor `access_code` al frontend:

```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "customer@email.com", "amount": "500000" }' \
  -X POST
```

La respuesta contiene `data.access_code`. Envía este valor a tu frontend.


### 2. Reanuda la transacción en el navegador

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

> **Realiza siempre una verificación en el lado del servidor** tras el evento `onSuccess`. Nunca entregues un producto o servicio basándote únicamente en una devolución de llamada (callback) del cliente; confirma siempre la transacción mediante el endpoint [Verificar Transacción](https://paystack.com/docs/api/transaction/#verify).



## Referencia de la API


### `loadPaystack()`

Inserta dinámicamente `https://js.paystack.co/v2/inline.js` en la página y devuelve el constructor `PaystackPop`. Es seguro realizar la llamada varias veces, ya que solo se crea una única etiqueta `<script>`.

```typescript
import { loadPaystack } from "@alexasomba/paystack-inline";

const PaystackPop = await loadPaystack();
const popup = new PaystackPop();
```

**Lanza un error** si se invoca fuera de un navegador (por ejemplo, durante el renderizado en el servidor). Si es necesario, envuélvelo en una comprobación de entorno de navegador:

```typescript
if (typeof window !== "undefined") {
  const PaystackPop = await loadPaystack();
}
```



### `popup.resumeTransaction(accessCode, callbacks?)`

El flujo de pago **recomendado**. Inicializa en tu servidor y, posteriormente, reanuda el proceso en el cliente.

```typescript
popup.resumeTransaction("br6cgmvflhn3qtd", {
  onSuccess: (res) => console.log(res.reference),
  onCancel: () => console.log("cancelled"),
  onError: (err) => console.error(err.message),
});
```



### `popup.newTransaction(options)`

Inicia una transacción directamente desde el frontend utilizando tu clave pública. > [!ADVERTENCIA]
> El valor de `amount` debe expresarse en la **unidad monetaria de menor denominación** (por ejemplo, kobo para NGN, pesewas para GHS). `500000` = ₦5.000.

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


#### Opciones principales

| Opción      | Tipo       | Obligatorio | Descripción                                                                              |
| ----------- | ---------- | ----------- | ---------------------------------------------------------------------------------------- |
| `key`       | `string`   | ✅       | Tu clave **pública** de Paystack (`pk_...`)                                                  |
| `email`     | `string`   | ✅       | Dirección de correo electrónico del cliente                                                                 |
| `amount`    | `number`   | ✅       | Importe en la unidad monetaria de menor denominación (por ejemplo, kobo)                                           |
| `currency`  | `string`   | —        | Código de moneda: `NGN`, `GHS`, `ZAR`, `KES`, `USD`                                         |
| `reference` | `string`   | —        | Referencia única de la transacción. Se genera automáticamente si no se especifica. |
| `label`     | `string`   | —        | Nombre del cliente que se muestra en el proceso de pago. |
| `channels`  | `string[]` | —        | Limitar canales: `["card", "bank", "ussd", "mobile_money", "bank_transfer", "qr", "eft"]` |
| `metadata`  | `object`   | —        | Datos arbitrarios en formato clave-valor asociados a la transacción. |
| `language`  | `string`   | —        | Forzar el idioma del proceso de pago (`en`, `fr`, `pt`, etc.). |


#### Opciones del cliente

| Opción         | Tipo     | Descripción                     |
| -------------- | -------- | ------------------------------- |
| `firstName`    | `string` | Rellenar previamente el nombre del cliente. |
| `lastName`     | `string` | Rellenar previamente el apellido del cliente. |
| `phone`        | `string` | Número de teléfono del cliente           |
| `customerCode` | `string` | Código de cliente existente en Paystack |



### `popup.preloadTransaction(options)` → `() => void`

Precarga el iframe de pago en segundo plano para ofrecer una experiencia de usuario (UX) más ágil. Devuelve una función para abrir la ventana emergente precargada.

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

Proceso de pago basado en promesas (*promises*). Se resuelve con el objeto `PopupTransaction` cuando se abre la ventana emergente.

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

Cierra una transacción abierta mediante programación.

```typescript
const tx = popup.newTransaction({ ... });
// ... later
popup.cancelTransaction(tx); // or popup.cancelTransaction(tx.id)
```



### `popup.paymentRequest(options)` → `Promise<PopupTransaction>`

Renderiza un **elemento de pago integrado** (botón de Apple Pay, botón de billetera digital) dentro de un contenedor del DOM. Ideal para interfaces de pago personalizadas.

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


#### Opciones de `paymentRequest`

| Opción                       | Tipo                | Descripción                                            |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| `container`                  | `string`            | ✅ Selector CSS o ID del elemento donde se realizará el montaje |
| `loadPaystackCheckoutButton` | `string`            | Selector para un botón personalizado que abre la ventana emergente (popup) completa |
| `styles.theme`               | `"dark" \| "light"` | Tema del botón de Apple Pay                                 |
| `styles.applePay.type`       | `string`            | Etiqueta del botón de Apple Pay: `"plain"`, `"buy"`, `"donate"` |
| `styles.applePay.locale`     | `string`            | Configuración regional (locale) del botón de Apple Pay                                |
| `onElementsMount`            | `function`          | Se activa cuando los elementos integrados aparecen en el DOM     |



## Callbacks (funciones de retorno)

Todos los métodos de transacción aceptan la misma interfaz de callback:

| Callback                            | Firma                                     | Descripción                                         |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `onSuccess`                         | `(res: { id, reference, message }) => void`   | Pago completado con éxito                      |
| `onError`                           | `(err: { message: string }) => void`          | El pago falló debido a un error                        |
| `onCancel`                          | `() => void`                                  | El usuario cerró la ventana emergente antes de completar la operación |
| `onClose`                           | `() => void`                                  | Ventana emergente cerrada (incluye tanto la cancelación como la finalización exitosa) |
| `onLoad`                            | `(res: { id, customer, accessCode }) => void` | Ventana emergente totalmente cargada y lista                        |
| `onBankTransferConfirmationPending` | `() => void`                                  | Transferencia bancaria iniciada, a la espera de confirmación      |
| `callback`                          | `(res: any) => void`                          | *Callback* de versión anterior (v1) (utilice `onSuccess` en su lugar)        |



## Suscripciones

Realice cargos a los clientes mediante un plan recurrente:

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


#### Opciones de suscripción

| Opción                  | Tipo     | Alias ​​        | Descripción                                        |
| ----------------------- | -------- | --------------- | -------------------------------------------------- |
| `planCode`              | `string` | `plan`          | Código de plan de Paystack (`PLN_...`)                     |
| `subscriptionCount`     | `number` | `quantity`      | Número de suscripciones / licencias                    |
| `planInterval`          | `string` | `interval`      | `hourly`, `daily`, `weekly`, `monthly`, `annually` |
| `subscriptionLimit`     | `number` | `invoice_limit` | Número máximo de ciclos de facturación antes de detenerse |
| `subscriptionStartDate` | `string` | `start_date`    | Fecha (formato ISO 8601) del primer cargo |



## Pagos divididos

Dirige partes de un pago a subcuentas:

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


#### Opciones de división

| Opción              | Tipo                        | Alias ​​             | Descripción                                      |
| ------------------- | --------------------------- | -------------------- | ------------------------------------------------ |
| `subaccountCode`    | `string`                    | `subaccount`         | Código de subcuenta para realizar la división |
| `split_code`        | `string`                    |                      | Referencia a un grupo de división preconfigurado |
| `split`             | `object`                    |                      | Objeto de configuración de división integrado (inline) |
| `connect_split`     | `string[]`                  |                      | Matriz de códigos de cuenta vinculados para *multi-split* |
| `bearer`            | `"account" \| "subaccount"` |                      | Quién asume la comisión por transacción                  |
| `transactionCharge` | `string \| number`          | `transaction_charge` | Comisión fija (en *kobo*) retenida por la cuenta principal  |



## Ejemplos por *framework*


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



## Referencia para TypeScript

Todos los tipos exportados están disponibles para su importación directa:

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



## Flujo de pago completo

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



## Notas sobre seguridad

- **Nunca utilices tu clave secreta (*Secret Key*) en el *frontend*.** Usa únicamente tu clave pública (*Public Key*) (`pk_...`).
- **Verifica siempre las transacciones en el lado del servidor** antes de entregar el producto o servicio; la *callback* `onSuccess` podría ser falsificada.
- El *script* en `https://js.paystack.co/v2/inline.js` se carga a través de HTTPS y es servido con encabezados de seguridad de integridad mediante la CDN de Paystack.


## Recursos relacionados

- [Documentación de Paystack — Aceptar pagos](https://paystack.com/docs/payments/accept-payment/)
- [Documentación de Paystack — Verificar transacciones](https://paystack.com/docs/api/transaction/#verify)
- [Documentación de Paystack — Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Documentación de Paystack — Canales de pago](https://paystack.com/docs/payments/payment-channels/)
- [Documentación de Paystack — Suscripciones](https://paystack.com/docs/payments/subscriptions/)



## Fuente

- Fuente del monorepositorio: [alexasomba/paystack-openapi](https://github.com/alexasomba/paystack-openapi)
- Repositorio del SDK independiente: [https://github.com/alexasomba/paystack-inline](https://github.com/alexasomba/paystack-inline)



## Licencia

MIT © [alexasomba](https://github.com/alexasomba)
