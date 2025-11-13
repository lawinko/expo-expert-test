import React, { useState, useRef } from "react";
import {
  Platform,
  StyleSheet,
  View,
  BackHandler,
  Modal,
  Button,
  EmitterSubscription,
} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";

import { MESSAGE_TYPES } from "./src/shared";
import AudioPlayer from "./src/audio-player";

import {
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  finishTransaction,
  type ProductPurchase,
  type PurchaseError,
  type SubscriptionPurchase,
  getProducts,
  setup,
  requestPurchase,
} from "react-native-iap";

import Loader from "./Loader";

let webview: any = null; // Set on load

const APP_URI = "https://cleer.mvt.so/";
const GLOBAL_APP_STORE_PROP = "FIT_isAppStore";

const NOTIFICATIONS_EXPERIENCE_ID = `@samfitter/${Constants.expoConfig?.slug}`;
const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

// NOTE: Must match app/src/lib/app-store-utils.js in fitter-pwa repo
const IAP_PURCHASE_PROPERTIES = {
  PRODUCT_ID: "productId",
  TRANSACTION_ID: "transactionId",
  ORIGINAL_TRANSACTION_ID: "originalTransactionId",
};

const DEBUGGING_INJECTED_JS = `
  const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'type': 'Console', 'data': log}));
  console = {
    log: (log) => consoleLog('log', log),
    debug: (log) => consoleLog('debug', log),
    info: (log) => consoleLog('info', log),
    warn: (log) => consoleLog('warn', log),
    error: (log) => consoleLog('error', log),
  };
`;

const INJECTED_JAVASCRIPT = `
  window.${GLOBAL_APP_STORE_PROP} = true;
  true;
`;

// Copy paste from packages/components/src/FitterApp/styles.ts in fitter-apps repo
const styles = StyleSheet.create({
  webview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  // https://stackoverflow.com/a/55017347
  AndroidSafeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 0,
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const postMessageToWebview = (messageType: string, data = {}, retry = 0) => {
  console.log(`Posting To Webview: ${messageType}`);

  if (webview) {
    webview.injectJavaScript(`
      window.dispatchEvent(
        new CustomEvent(
          'native-app-message',
          {detail: {type: "${messageType}", data: ${JSON.stringify(data)}}}
        )
      );
      true;
    `);
  } else if (retry <= 3) {
    setTimeout(() => postMessageToWebview(messageType, data, retry + 1));
  }
};

const handleContentProcessDidTerminate = () => {
  // Webview process can be killed in the background on iOS
  // https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#oncontentprocessdidterminate
  // https://github.com/react-native-webview/react-native-webview/issues/2199
  if (webview) {
    webview.reload();
  }
};

const requestPushNotificationPermissions = async () => {
  try {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    await Notifications.requestPermissionsAsync();

    return fetchPushStatus();
  } catch (e) {
    console.error(e);
  }
};

const fetchPushStatus = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();

    if (settings.status !== "granted") {
      return postPushStatus(settings.canAskAgain, settings.granted, null);
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        experienceId: NOTIFICATIONS_EXPERIENCE_ID,
        projectId: PROJECT_ID,
      })
    ).data;

    return postPushStatus(settings.canAskAgain, settings.granted, token);
  } catch (e) {
    console.error(e);
  }
};

const postPushStatus = (
  canAsk: boolean,
  granted: boolean,
  token: string | null
) =>
  postMessageToWebview(MESSAGE_TYPES.PUSH_STATUS_SET, {
    canAsk,
    granted,
    token,
  });

export default function App() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalUrl, setModalUrl] = useState("");

  const isInitializedRef = useRef(false);
  const hasRequestedPurchaseRef = useRef(false);

  const purchasesStoreRef = useRef<
    Record<string, SubscriptionPurchase | ProductPurchase>
  >({});

  setup({ storekitMode: "STOREKIT2_MODE" });

  let purchaseUpdateSubscription: EmitterSubscription;
  let purchaseErrorSubscription: EmitterSubscription;

  initConnection().then(() => {
    purchaseUpdateSubscription = purchaseUpdatedListener(
      (purchase: SubscriptionPurchase | ProductPurchase) => {
        if (!purchase.transactionId) return;

        // Build internal state of known purchases
        purchasesStoreRef.current = {
          ...purchasesStoreRef.current,
          [String(purchase.transactionId)]: purchase,
        };

        if (hasRequestedPurchaseRef.current) {
          console.log("[IAP] Purchase Requested");

          messageWebview(MESSAGE_TYPES.IAP_PURCHASE_SUCCESS, {
            [IAP_PURCHASE_PROPERTIES.PRODUCT_ID]: purchase.productId,
            [IAP_PURCHASE_PROPERTIES.TRANSACTION_ID]: purchase.transactionId,
            [IAP_PURCHASE_PROPERTIES.ORIGINAL_TRANSACTION_ID]:
              purchase.originalTransactionIdentifierIOS,
          });

          hasRequestedPurchaseRef.current = false;

          return;
        }
      }
    );

    purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.warn("[IAP] Purchase Error", error);
      }
    );
  });

  const purchaseProduct = async (productId: string | number) => {
    console.log("[IAP] Fetching Product", productId);
    getProducts({ skus: [String(productId)] }).then((res) => {
      if (res && res.length) {
        console.log("[IAP] Purchasing", productId);
        hasRequestedPurchaseRef.current = true;

        requestPurchase({ sku: String(productId) }).catch((err) => {
          console.error(`[IAP] Error Requesting ${err}`);
        });
      } else {
        console.log("[IAP] Invalid Product");
        messageWebview(MESSAGE_TYPES.IAP_INVALID_PRODUCT);
      }
    });
  };

  const player = new AudioPlayer({ postMessageToWebview });
  player.initialize();

  const messageWebview = (messageType: string, data = {}) => {
    postMessageToWebview(messageType, data);
  };

  const onMessage = async (message: any) => {
    let payload;
    try {
      payload = JSON.parse(message.nativeEvent.data);
    } catch (e) {}

    if (payload) {
      const { data } = payload;

      switch (payload.type) {
        case "Console":
          console.info(`[Console] ${JSON.stringify(data)}`);
          break;
        case MESSAGE_TYPES.INITIALIZED:
          handleInitialize();

          break;
        case MESSAGE_TYPES.IAP_PURCHASE_PROMPT:
          console.log(`[IAP] Triggering - ${data["productId"]}`);

          purchaseProduct(data["productId"]);
          break;
        case MESSAGE_TYPES.IAP_PURCHASE_FINALISE:
          console.log(`[IAP] Finalising - ${data["transactionId"]}`);

          const purchaseToFinalise =
            purchasesStoreRef.current[data["transactionId"]];

          if (!purchaseToFinalise) {
            console.warn(`[IAP] Purchase ${data["transactionId"]} not found`);
            break;
          }

          await finishTransaction({
            purchase: purchaseToFinalise,
            isConsumable: true,
          });

          // Free up key to handle re-subscription
          delete purchasesStoreRef.current[data["transactionId"]];

          console.log(`[IAP] Finished transaction - ${data["transactionId"]}`);

          break;
        case MESSAGE_TYPES.PUSH_REQUEST_PERMISSION:
          requestPushNotificationPermissions();
          break;
        case MESSAGE_TYPES.PUSH_STATUS_REQUEST:
          fetchPushStatus();
          break;
        case MESSAGE_TYPES.OPEN_SETTINGS:
          Linking.openSettings();
          break;
        case MESSAGE_TYPES.UPDATE_NATIVE_PLAYER:
          player?.handleMessage(data);

          break;
        case MESSAGE_TYPES.AUTHENTICATED:
          setIsModalVisible(false);
          setModalUrl("");

          messageWebview(payload.type, payload.data);

          break;
        case MESSAGE_TYPES.CLOSE:
          setIsModalVisible(false);
          setModalUrl("");

          break;
        default:
          // console.log(payload);
          break;
      }
    }
  };

  const handleInitialize = async () => {
    try {
      postMessageToWebview(MESSAGE_TYPES.INITIALIZED, {
        useNativePlayer: !!player,
      });

      isInitializedRef.current = true;

      // Handle URL from when app is opened from a notification
      const response = await Notifications.getLastNotificationResponseAsync();
      const url =
        response?.notification.request.content.data.url ||
        (await Linking.getInitialURL());

      Linking.addEventListener("url", ({ url }) => {
        return postMessageToWebview(MESSAGE_TYPES.NAVIGATE_TO_URL, {
          url: url,
        });
      });

      if (url) {
        return postMessageToWebview(MESSAGE_TYPES.NAVIGATE_TO_URL, {
          url: url,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkRequest = (state: any) => {
    if (
      state.url.includes("addevent") ||
      state.url.includes("apps.apple.com")
    ) {
      Linking.openURL(state.url);
      return false;
    }

    if (state.navigationType && state.navigationType !== "click") return true;

    const handleInternally = !![
      "fitterapp.app",
      APP_URI,
      "stripe",
      "youtube",
      "vimeo",
    ].find((permittedUrl) => state.url.includes(permittedUrl));

    if (handleInternally) {
      return true;
    } else {
      Linking.openURL(state.url);
      return false;
    }
  };

  const handleAndroidBackPress: () => boolean = () => {
    postMessageToWebview(MESSAGE_TYPES.GO_BACK);
    return true;
  };

  // Handle Notifications While App Is Running
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response?.notification.request.content.data.url;
        postMessageToWebview(MESSAGE_TYPES.NAVIGATE_TO_URL, { url: url });
      }
    );
    return () => subscription.remove();
  }, []);

  // Handle back button on Android device
  if (Platform.OS === "android") {
    React.useEffect(() => {
      BackHandler.addEventListener("hardwareBackPress", handleAndroidBackPress);
      return () =>
        BackHandler.removeEventListener(
          "hardwareBackPress",
          handleAndroidBackPress
        );
    }, []);
  }

  return (
    <View style={styles.AndroidSafeArea}>
      <WebView
        webviewDebuggingEnabled
        ref={(r) => (webview = r)}
        style={styles.webview}
        source={{ uri: APP_URI }}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        onShouldStartLoadWithRequest={handleLinkRequest}
        onOpenWindow={async (syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const { targetUrl } = nativeEvent;

          setModalUrl(targetUrl);
          setIsModalVisible(true);

          return true;
        }}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        onMessage={onMessage}
        startInLoadingState={true}
        renderLoading={() => <Loader />}
      />

      <Modal
        presentationStyle="pageSheet"
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        style={styles.webview}
      >
        <View style={{ alignItems: "flex-end", marginRight: 6, paddingTop: 6 }}>
          <Button title="Close" onPress={() => setIsModalVisible(false)} />
        </View>

        <WebView
          source={{ uri: modalUrl }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
          onMessage={onMessage}
          userAgent={
            Platform.OS == "android"
              ? "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.54 Mobile Safari/537.36"
              : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
          }
        />
      </Modal>
    </View>
  );
}
