//#region src/index.ts
/**
 * Dynamically loads the Paystack Popup script (inline.js) and returns the constructor class.
 */
function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined")
      return reject(
        /* @__PURE__ */ new Error(
          "Paystack Inline JS can only be loaded in a browser environment.",
        ),
      );
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop) resolve(window.PaystackPop);
      else
        reject(
          /* @__PURE__ */ new Error("PaystackPop script loaded but global object was not found."),
        );
    };
    script.onerror = () =>
      reject(/* @__PURE__ */ new Error("Failed to load Paystack Inline JS script."));
    document.head.appendChild(script);
  });
}
//#endregion
export { loadPaystack };
