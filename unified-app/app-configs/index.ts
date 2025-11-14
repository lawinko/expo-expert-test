import type { WhiteLabelAppConfig, WhiteLabelAppId } from "./types";
import { boundlessMovementConfig } from "./boundless-movement";
import { sorellaOnlineConfig } from "./sorella-online";
import { sleeptimeConfig } from "./sleeptime";
import { cleerConfig } from "./cleer";
import { lifestyle20Config } from "./20lifestyle";

const apps: Record<WhiteLabelAppId, WhiteLabelAppConfig> = {
  "boundless-movement": boundlessMovementConfig,
  "sorella-online": sorellaOnlineConfig,
  sleeptime: sleeptimeConfig,
  cleer: cleerConfig,
  "20lifestyle": lifestyle20Config,
};

export function getAppConfig(appId: string): WhiteLabelAppConfig {
  const config = apps[appId as WhiteLabelAppId];

  if (!config) {
    throw new Error(
      `Unknown APP_ID=${appId}. Known IDs: ${Object.keys(apps).join(", ")}`
    );
  }

  return config;
}

