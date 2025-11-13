---
to: ./apps/<%= slug %>/src/shared.ts
---

// NOTE: Must match app/src/lib/app-store-utils.js in fitter-pwa repo
export const MESSAGE_TYPES = {
  INITIALIZED: "initialized",
  IAP_PURCHASE_PROMPT: "iap-purchase-prompt",
  IAP_INVALID_PRODUCT: "iap-invalid-product",
  IAP_PURCHASE_CANCELED: "iap-purchase-canceled",
  IAP_PURCHASE_SUCCESS: "iap-purchase-success",
  IAP_PURCHASE_FINALISE: "iap-purchase-finalise",
  PUSH_REQUEST_PERMISSION: "push-request-permission",
  PUSH_STATUS_REQUEST: "push-status-request",
  PUSH_STATUS_SET: "push-status-set",
  NAVIGATE_TO_URL: "navigate-to-url",
  OPEN_SETTINGS: "open-settings",
  GO_BACK: "go-back",

  // Audio
  NATIVE_PLAYER_HAS_UPDATED: "native-player-has-updated",
  UPDATE_NATIVE_PLAYER: "update-native-player",

  // Auth
  AUTHENTICATED: "authenticated",
  CLOSE: "close",
} as const;
