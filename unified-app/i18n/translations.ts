import Constants from "expo-constants";
import type { WhiteLabelAppId } from "../app-configs/types";

export type Locale = "en";

export type TranslationKey = "close";

type Translations = Record<TranslationKey, string>;

type AppTranslations = {
  [locale in Locale]?: Translations;
};

const defaultTranslations: AppTranslations = {
  en: {
    close: "Close",
  },
};

const perAppTranslations: Partial<Record<WhiteLabelAppId, AppTranslations>> = {};

const SUPPORTED_LOCALES: Locale[] = ["en"];

export function getCurrentAppId(): WhiteLabelAppId {
  const appId =
    (Constants.expoConfig?.extra as any)?.appId ??
    (process.env.APP_ID as string | undefined);

  return (appId ?? "sleeptime") as WhiteLabelAppId;
}

export function getLocale(): Locale {
  try {
    const resolved =
      (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().language ??
      (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale;

    if (typeof resolved === "string" && resolved.length > 0) {
      const base = resolved.split("-")[0];
      if (SUPPORTED_LOCALES.includes(base as Locale)) {
        return base as Locale;
      }
    }
  } catch {
    // ignore – fall back to default
  }

  return "en";
}

export function t(
  key: TranslationKey,
  localeOverride?: Locale,
  appIdOverride?: WhiteLabelAppId
): string {
  const locale = localeOverride ?? getLocale();
  const appId = appIdOverride ?? getCurrentAppId();

  const appTable = perAppTranslations[appId] ?? {};
  const value =
    appTable[locale]?.[key] ??
    defaultTranslations[locale]?.[key] ??
    defaultTranslations.en?.[key];

  return value ?? key;
}

