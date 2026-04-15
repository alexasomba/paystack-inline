// @vitest-environment jsdom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { loadPaystack } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock PaystackPop constructor that mimics the real global shape. */
function makeMockPaystackPop() {
  class MockPaystackPop {
    newTransaction = vi.fn();
    resumeTransaction = vi.fn();
    cancelTransaction = vi.fn();
    preloadTransaction = vi.fn();
    checkout = vi.fn();
    paymentRequest = vi.fn();
    static isLoaded = vi.fn().mockReturnValue(true);
  }
  return MockPaystackPop;
}

// ---------------------------------------------------------------------------
// Per-test setup: clean window state and script tags
// ---------------------------------------------------------------------------
beforeEach(() => {
  // Remove any previously injected paystack script tags
  document.querySelectorAll('script[src*="paystack"]').forEach((el) => el.remove());
  // Clear the global so each test starts fresh
  delete (window as any).PaystackPop;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("loadPaystack()", () => {
  describe("when PaystackPop is already on window", () => {
    it("resolves immediately without injecting a new script tag", async () => {
      (window as any).PaystackPop = makeMockPaystackPop();

      const appendSpy = vi.spyOn(document.head, "appendChild");
      const result = await loadPaystack();

      expect(result).toBe((window as any).PaystackPop);
      expect(appendSpy).not.toHaveBeenCalled();
    });

    it("resolves with the same reference on repeated calls", async () => {
      const mock = makeMockPaystackPop();
      (window as any).PaystackPop = mock;

      const [r1, r2] = await Promise.all([loadPaystack(), loadPaystack()]);
      expect(r1).toBe(mock);
      expect(r2).toBe(mock);
    });
  });

  describe("when the script loads successfully", () => {
    it("injects exactly one <script> tag with the correct src", async () => {
      // Capture spy return value so we can access .mock without recasting the DOM method
      const appendSpy: MockInstance = vi
        .spyOn(document.head, "appendChild")
        .mockImplementation((node) => {
          const script = node as HTMLScriptElement;
          (window as any).PaystackPop = makeMockPaystackPop();
          // Fire onload asynchronously (mimics real browser behaviour)
          setTimeout(() => script.onload?.(new Event("load")), 0);
          return node;
        });

      const result = await loadPaystack();

      const injected = appendSpy.mock.calls[0][0] as HTMLScriptElement;
      expect(injected.src).toBe("https://js.paystack.co/v2/inline.js");
      expect(injected.async).toBe(true);
      expect(result).toBe((window as any).PaystackPop);
    });

    it("returns the PaystackPop constructor that can be instantiated", async () => {
      const mock = makeMockPaystackPop();

      vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
        const script = node as HTMLScriptElement;
        (window as any).PaystackPop = mock;
        setTimeout(() => script.onload?.(new Event("load")), 0);
        return node;
      });

      const PaystackPop = await loadPaystack();
      const instance = new PaystackPop();
      expect("newTransaction" in instance).toBe(true);
      expect("resumeTransaction" in instance).toBe(true);
      expect("checkout" in instance).toBe(true);
      expect("paymentRequest" in instance).toBe(true);
      expect("cancelTransaction" in instance).toBe(true);
      expect("preloadTransaction" in instance).toBe(true);
    });
  });

  describe("error cases", () => {
    it("rejects when the script load fires onerror", async () => {
      vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
        const script = node as HTMLScriptElement;
        setTimeout(() => script.onerror?.(new Event("error")), 0);
        return node;
      });

      await expect(loadPaystack()).rejects.toThrow("Failed to load Paystack Inline JS script.");
    });

    it("rejects when the script loads but window.PaystackPop is not set", async () => {
      vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
        const script = node as HTMLScriptElement;
        // Do NOT set window.PaystackPop — simulates a broken CDN response
        setTimeout(() => script.onload?.(new Event("load")), 0);
        return node;
      });

      await expect(loadPaystack()).rejects.toThrow(
        "PaystackPop script loaded but global object was not found.",
      );
    });
  });

  describe("script tag attributes", () => {
    it("sets async=true on the injected script", async () => {
      let capturedScript: HTMLScriptElement | null = null;

      vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
        capturedScript = node as HTMLScriptElement;
        (window as any).PaystackPop = makeMockPaystackPop();
        setTimeout(() => capturedScript!.onload?.(new Event("load")), 0);
        return node;
      });

      await loadPaystack();
      expect(capturedScript!.async).toBe(true);
    });

    it("appends the script to document.head", async () => {
      const appendSpy = vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
        const script = node as HTMLScriptElement;
        (window as any).PaystackPop = makeMockPaystackPop();
        setTimeout(() => script.onload?.(new Event("load")), 0);
        return node;
      });

      await loadPaystack();
      expect(appendSpy).toHaveBeenCalledTimes(1);
      expect(appendSpy.mock.calls[0][0]).toBeInstanceOf(HTMLScriptElement);
    });
  });
});
