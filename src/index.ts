export interface PaystackPopGeneralOptions {
  key: string;
  amount: number;
  email: string;
  currency?: string;
  ref?: string;
  reference?: string;
  firstName?: string;
  firstname?: string;
  lastName?: string;
  lastname?: string;
  phone?: string;
  customerCode?: string;
  customer_code?: string;
  channels?: string[];
  card?: boolean | string;
  bank?: boolean | string;
  paymentRequest?: string | number;
  payment_request?: string | number;
  paymentPage?: string | number;
  payment_page?: string | number;
  metadata?: Record<string, unknown>;
  label?: string;
  hash?: string;
  order_id?: string | number;
  transaction_type?: string;
  language?: string;
  connect_account?: string;
}

export interface PaystackPopCallbacks {
  onError?: (error: { message: string }) => void;
  onCancel?: () => void;
  onLoad?: (response: { id: number; customer: unknown; accessCode: string }) => void;
  onSuccess?: (response: { id: number; reference: string; message: string }) => void;
  onClose?: () => void;
  callback?: (response: unknown) => void;
  onBankTransferConfirmationPending?: () => void;
}

export interface PaystackPopSplitOptions {
  subaccountCode?: string;
  subaccount?: string;
  split_code?: string;
  split?: Record<string, unknown>;
  connect_split?: string[];
  bearer?: "account" | "subaccount";
  transactionCharge?: string | number;
  transaction_charge?: string | number;
}

export interface PaystackPopSubscriptionOptions {
  planCode?: string;
  plan?: string;
  subscriptionCount?: number;
  quantity?: number;
  planInterval?: "hourly" | "daily" | "weekly" | "monthly" | "annually";
  interval?: "hourly" | "daily" | "weekly" | "monthly" | "annually";
  subscriptionLimit?: number | string;
  invoice_limit?: number | string;
  subscriptionStartDate?: string;
  start_date?: string;
  subscription?: string | number;
}

export interface PaystackPopNewTransactionOptions
  extends
    PaystackPopGeneralOptions,
    PaystackPopCallbacks,
    PaystackPopSplitOptions,
    PaystackPopSubscriptionOptions {}

export interface PaystackPopCheckoutOptions extends PaystackPopNewTransactionOptions {}

export interface PaystackPopPaymentRequestOptions extends PaystackPopNewTransactionOptions {
  container: string;
  loadPaystackCheckoutButton?: string;
  styles?: {
    theme?: "dark" | "light";
    applePay?: {
      width?: string;
      height?: string;
      borderRadius?: string;
      type?: "plain" | "buy" | "donate";
      locale?: string;
    };
  };
  onElementsMount?: (elements: unknown) => void;
}

export interface PopupTransactionStatus {
  status: "null" | "error" | "abandoned" | "auth" | "failed" | "success" | "pending";
  id?: string;
  errors?: unknown[];
  response?: unknown;
  checkoutUrl?: string;
}

export interface PopupTransaction {
  id: string;
  backgroundDiv: HTMLElement;
  checkoutIframe: HTMLElement;
  preCheckoutModal: HTMLElement | null;
  paymentRequestContainer: HTMLElement | null;
  getStatus(): PopupTransactionStatus;
}

export interface PaystackPopInstance {
  newTransaction(options: PaystackPopNewTransactionOptions): PopupTransaction;
  resumeTransaction(accessCode: string, callbacks?: PaystackPopCallbacks): PopupTransaction;
  cancelTransaction(idOrTransaction: string | PopupTransaction): void;
  preloadTransaction(options: PaystackPopNewTransactionOptions): () => void;
  checkout(options: PaystackPopCheckoutOptions): Promise<PopupTransaction>;
  paymentRequest(options: PaystackPopPaymentRequestOptions): Promise<PopupTransaction>;
}

declare global {
  interface Window {
    PaystackPop?: {
      new (): PaystackPopInstance;
      isLoaded(): boolean;
    };
  }
}

/**
 * Dynamically loads the Paystack Popup script (inline.js) and returns the constructor class.
 */
export function loadPaystack(): Promise<NonNullable<Window["PaystackPop"]>> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Paystack Inline JS can only be loaded in a browser environment."));
    }

    if (window.PaystackPop) {
      return resolve(window.PaystackPop);
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;

    script.onload = () => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
      } else {
        reject(new Error("PaystackPop script loaded but global object was not found."));
      }
    };

    script.onerror = () => reject(new Error("Failed to load Paystack Inline JS script."));

    document.head.appendChild(script);
  });
}
