/**
 * @vitest-environment jsdom
 *
 * Type-level tests for @alexasomba/paystack-inline
 *
 * These tests confirm that:
 * - Our TypeScript interfaces compile correctly against real usage patterns
 * - Both camelCase (documented) and snake_case (legacy alias) variants are accepted
 * - The union types for bearer, interval, etc. are correctly constrained
 *
 * These are compile-time tests: if this file has no TypeScript errors, the
 * types are correct. Runtime assertions are minimal — their purpose is only
 * to keep Vitest from treating this file as empty.
 */
import { describe, expect, it, vi } from "vite-plus/test";
import type {
  PaystackPopCallbacks,
  PaystackPopCheckoutOptions,
  PaystackPopGeneralOptions,
  PaystackPopInstance,
  PaystackPopNewTransactionOptions,
  PaystackPopPaymentRequestOptions,
  PaystackPopSplitOptions,
  PaystackPopSubscriptionOptions,
  PopupTransaction,
  PopupTransactionStatus,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Fixtures (typed — intentionally force full type inference)
// ---------------------------------------------------------------------------

const generalOpts: PaystackPopGeneralOptions = {
  key: "pk_test_123",
  email: "user@example.com",
  amount: 500000,
  currency: "NGN",
  reference: "ref-001",
  ref: "ref-001", // legacy alias
  firstName: "Ada",
  firstname: "Ada", // legacy alias
  lastName: "Lovelace",
  lastname: "Lovelace", // legacy alias
  phone: "+2348000000000",
  customerCode: "CUS_abc",
  customer_code: "CUS_abc", // legacy alias
  channels: ["card", "bank"],
  card: true,
  bank: true,
  paymentRequest: "PRQ_123",
  payment_request: "PRQ_123", // legacy alias
  paymentPage: "PPG_123",
  payment_page: "PPG_123", // legacy alias
  metadata: { order_id: "42" },
  label: "Ada Lovelace",
  language: "en",
  connect_account: "ACCT_xyz",
};

const callbacks: PaystackPopCallbacks = {
  onSuccess: (res) => {
    const _ref: string = res.reference;
    const _id: number = res.id;
    const _msg: string = res.message;
    void _ref;
    void _id;
    void _msg;
  },
  onError: (err) => {
    const _msg: string = err.message;
    void _msg;
  },
  onCancel: vi.fn(),
  onClose: vi.fn(),
  onLoad: (res) => {
    const _id: number = res.id;
    const _ac: string = res.accessCode;
    void _id;
    void _ac;
  },
  onBankTransferConfirmationPending: vi.fn(),
  callback: vi.fn(),
};

const splitOpts: PaystackPopSplitOptions = {
  subaccountCode: "ACCT_sub",
  subaccount: "ACCT_sub", // legacy alias
  split_code: "SPL_xyz",
  split: { type: "percentage", bearer_type: "account", subaccounts: [] },
  connect_split: ["ACCT_a", "ACCT_b"],
  bearer: "account",
  transactionCharge: 1000,
  transaction_charge: 1000, // legacy alias
};

const subscriptionOpts: PaystackPopSubscriptionOptions = {
  planCode: "PLN_abc",
  plan: "PLN_abc", // legacy alias
  subscriptionCount: 1,
  quantity: 1, // legacy alias
  planInterval: "monthly",
  interval: "monthly", // legacy alias
  subscriptionLimit: 12,
  invoice_limit: 12, // legacy alias
  subscriptionStartDate: "2025-01-01T00:00:00Z",
  start_date: "2025-01-01T00:00:00Z", // legacy alias
};

const newTxOpts: PaystackPopNewTransactionOptions = {
  ...generalOpts,
  ...callbacks,
  ...splitOpts,
  ...subscriptionOpts,
};

const checkoutOpts: PaystackPopCheckoutOptions = { ...newTxOpts };

const paymentRequestOpts: PaystackPopPaymentRequestOptions = {
  ...newTxOpts,
  container: "#apple-pay-container",
  loadPaystackCheckoutButton: "#open-full-checkout",
  onElementsMount: vi.fn(),
  styles: {
    theme: "dark",
    applePay: {
      width: "100%",
      height: "48px",
      borderRadius: "8px",
      type: "buy",
      locale: "en-US",
    },
  },
};

const txStatus: PopupTransactionStatus = {
  status: "success",
  id: "tx_001",
  errors: [],
  response: {},
  checkoutUrl: "https://checkout.paystack.com/xyz",
};

const mockTx: PopupTransaction = {
  id: "tx-1",
  backgroundDiv: document.createElement("div"),
  checkoutIframe: document.createElement("iframe"),
  preCheckoutModal: null,
  paymentRequestContainer: null,
  getStatus: () => txStatus,
};

// Mock instance shape — verifies the interface compiles against an object literal
const mockInstance: PaystackPopInstance = {
  newTransaction: (_opts) => mockTx,
  resumeTransaction: (_code, _cb) => mockTx,
  cancelTransaction: vi.fn(),
  preloadTransaction: vi.fn(() => vi.fn()),
  checkout: (_opts) => Promise.resolve(mockTx),
  paymentRequest: (_opts) => Promise.resolve(mockTx),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PaystackPopGeneralOptions", () => {
  it("accepts all documented and legacy alias fields", () => {
    expect(generalOpts.key).toBe("pk_test_123");
    expect(generalOpts.amount).toBe(500000);
    expect(generalOpts.email).toBe("user@example.com");
  });

  it("channels is typed as string array", () => {
    const channels: string[] = generalOpts.channels!;
    expect(Array.isArray(channels)).toBe(true);
  });
});

describe("PaystackPopCallbacks", () => {
  it("onSuccess callback shape includes id, reference, message", () => {
    let captured: { id: number; reference: string; message: string } | null = null;
    const handleSuccess = (res: { id: number; reference: string; message: string }) => {
      captured = res;
    };
    const cb: PaystackPopCallbacks = { onSuccess: handleSuccess };
    cb.onSuccess!({ id: 1, reference: "ref-abc", message: "Success" });
    expect(captured!.reference).toBe("ref-abc");
    expect(captured!.id).toBe(1);
  });

  it("onError callback shape includes message", () => {
    let captured: { message: string } | null = null;
    const handleError = (err: { message: string }) => {
      captured = err;
    };
    const cb: PaystackPopCallbacks = { onError: handleError };
    cb.onError!({ message: "Declined" });
    expect(captured!.message).toBe("Declined");
  });

  it("onLoad callback shape includes id, customer, accessCode", () => {
    let captured: { id: number; customer: any; accessCode: string } | null = null;
    const handleLoad = (res: { id: number; customer: any; accessCode: string }) => {
      captured = res;
    };
    const cb: PaystackPopCallbacks = { onLoad: handleLoad };
    cb.onLoad!({ id: 42, customer: { email: "a@b.com" }, accessCode: "ac_xyz" });
    expect(captured!.accessCode).toBe("ac_xyz");
  });
});

describe("PaystackPopSplitOptions", () => {
  it("bearer is constrained to account | subaccount", () => {
    const bearerAccount: "account" | "subaccount" = splitOpts.bearer!;
    expect(["account", "subaccount"]).toContain(bearerAccount);
  });

  it("connect_split is typed as string array", () => {
    expect(Array.isArray(splitOpts.connect_split)).toBe(true);
  });
});

describe("PaystackPopSubscriptionOptions", () => {
  it("planInterval is constrained to known string literals", () => {
    const valid: PaystackPopSubscriptionOptions["planInterval"][] = [
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "annually",
    ];
    expect(valid).toContain(subscriptionOpts.planInterval);
  });

  it("interval legacy alias works", () => {
    expect(subscriptionOpts.interval).toBe("monthly");
  });
});

describe("PaystackPopNewTransactionOptions", () => {
  it("composes all sub-interfaces correctly", () => {
    expect(newTxOpts.key).toBeDefined();
    expect(newTxOpts.plan).toBeDefined();
    expect(newTxOpts.subaccount).toBeDefined();
    // Invoke via the stored arrow function — no unbound-method concern
    const fn = newTxOpts.onSuccess;
    expect(typeof fn).toBe("function");
  });
});

describe("PaystackPopPaymentRequestOptions", () => {
  it("requires container field", () => {
    expect(paymentRequestOpts.container).toBe("#apple-pay-container");
  });

  it("styles.theme is constrained to dark | light", () => {
    const theme = paymentRequestOpts.styles!.theme!;
    expect(["dark", "light"]).toContain(theme);
  });

  it("styles.applePay.type is constrained to plain | buy | donate", () => {
    const type = paymentRequestOpts.styles!.applePay!.type!;
    expect(["plain", "buy", "donate"]).toContain(type);
  });
});

describe("PopupTransactionStatus", () => {
  it("status is constrained to known enum values", () => {
    const valid: PopupTransactionStatus["status"][] = [
      "null",
      "error",
      "abandoned",
      "auth",
      "failed",
      "success",
      "pending",
    ];
    expect(valid).toContain(txStatus.status);
  });
});

describe("PopupTransaction", () => {
  it("getStatus() returns a PopupTransactionStatus", () => {
    const status = mockTx.getStatus();
    expect(status.status).toBe("success");
    expect(status.id).toBe("tx_001");
  });

  it("DOM element fields are HTMLElement instances", () => {
    expect(mockTx.backgroundDiv).toBeInstanceOf(HTMLElement);
  });

  it("nullable DOM fields default to null", () => {
    expect(mockTx.preCheckoutModal).toBeNull();
    expect(mockTx.paymentRequestContainer).toBeNull();
  });
});

describe("PaystackPopInstance", () => {
  // The mock instance uses plain object arrow functions — safe to call directly
  it("newTransaction returns a PopupTransaction", () => {
    const tx = mockInstance.newTransaction(newTxOpts);
    expect(tx.id).toBeDefined();
    // getStatus is an arrow on the plain object literal — safe direct reference
    expect(typeof tx.getStatus).toBe("function");
  });

  it("resumeTransaction returns a PopupTransaction", () => {
    const tx = mockInstance.resumeTransaction("access_code_abc", callbacks);
    expect(tx.id).toBeDefined();
  });

  it("preloadTransaction returns a function", () => {
    const open = mockInstance.preloadTransaction(newTxOpts);
    expect(typeof open).toBe("function");
  });

  it("checkout returns a Promise<PopupTransaction>", async () => {
    const tx = await mockInstance.checkout(checkoutOpts);
    expect(tx.id).toBeDefined();
  });

  it("paymentRequest returns a Promise<PopupTransaction>", async () => {
    const tx = await mockInstance.paymentRequest(paymentRequestOpts);
    expect(tx.id).toBeDefined();
  });

  it("cancelTransaction accepts a string id", () => {
    expect(() => mockInstance.cancelTransaction("tx-1")).not.toThrow();
  });

  it("cancelTransaction accepts a PopupTransaction object", () => {
    expect(() => mockInstance.cancelTransaction(mockTx)).not.toThrow();
  });
});
