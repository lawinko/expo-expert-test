## Unified Expo App (Multi-Brand)

This directory contains a **single Expo project** that powers multiple white-label apps (Boundless Movement, Sorella, SleepTime, Cleer, 2.0Lifestyle) via configuration.

### Per-App Configuration

- `app-configs/types.ts` – shared typings for per-app config
- `app-configs/*.ts` – one file per app (slug, bundle IDs, icons, splash, webview URL, EAS project ID)
- `app.config.ts` – dynamic Expo config that selects the app based on `APP_ID`/`APP_VARIANT`
- Each app can optionally set `androidGoogleServicesFile` to point to its own `google-services.json` under `google-services/` (see example files).
- `eas.json` – EAS Build/Submit profiles per app, each setting `env.APP_ID`

### Development

From this directory:

```bash
# Run SleepTime (debug)
npm run dev:sleeptime

# Run Boundless Movement (debug)
npm run dev:boundless-movement
```

### Builds (EAS)

```bash
# iOS build for SleepTime
npm run build:sleeptime:ios

# Android build for Boundless Movement
npm run build:boundless-movement:android
```

Each profile in `eas.json` maps to an app id and uses the same shared code but different config (bundle ID, package name, icons, splash, etc).

### Adding a New App

1. Run `scripts/new-app.sh <slug> [business_name]` from the repo root to scaffold:
   - `unified-app/app-configs/<slug>.ts`
   - `unified-app/assets/<slug>/icon.png` and `splash.png` (if discoverable from `<slug>.mvt.so`)
2. Import the new config into `app-configs/index.ts` and add it to the `apps` map.
3. Extend `WhiteLabelAppId` in `app-configs/types.ts` with the new slug.
4. Add corresponding build/submit profiles in `eas.json` with `env.APP_ID="<slug>"`.

All apps then share dependencies and code, while remaining independently buildable and deployable via EAS.
