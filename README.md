# Proposal: Single Expo App with Multi-Config Architecture for 50+ White‑Label Apps

This proposal describes why we chose to consolidate 50+ white‑label Expo apps into **one unified Expo project** (`unified-app/`) with **per‑app configuration files**, instead of moving to a traditional multi‑package monorepo. It also explains how this design supports deep per‑app customization (icons, themes, app IDs, Google Play JSONs, translations, etc.) while keeping **95%+ of the code shared**, and how the implementation is automated using scripts.

Example implementation (this repo):  
https://github.com/lawinko/expo-expert-test/tree/main/unified-app

---

## 1. Why a Single Expo App (with Multiple Configs) Instead of a Monorepo

### 1.1. Problems with the Previous “Many Apps” Layout

The original architecture had one Expo project per app under `apps/*`, each with:
- Its own `package.json`, `eas.json`, `app.json`
- Its own `node_modules` (200–350 MB per app)
- Almost identical source code (95%+ duplication)

This led to:
- **Version drift**: different apps on different Expo/RN/IAP versions.
- **Expensive upgrades**: SDK updates required touching 50+ projects.
- **Storage/CI bloat**: 10–15 GB of duplicated dependencies.
- **High maintenance overhead**: every bug fix or feature had to be applied many times.

### 1.2. Why Not a Monorepo?

A monorepo (Nx, Turborepo, pnpm/Yarn workspaces) would centralize dependencies but would still keep **dozens of separate app packages**, each with its own Expo config and EAS wiring. That still means:
- Many app entry points and Expo project roots to keep in sync.
- Multiple build pipelines and EAS configs to maintain.
- Additional complexity in tooling (workspace config, task orchestration, dependency graph tooling) for marginal benefit, because **all apps share almost identical runtime logic**.

In other words, a monorepo solves package management better than the “50 separate apps” setup, but it does **not** fully address:
- The duplication of app glue code.
- The need to keep a single canonical Expo configuration and SDK version.
- The complexity of managing many build entrypoints.

### 1.3. Why a Single Project with Dynamic Configuration

The current unified architecture instead treats the system as:
- **One managed Expo project** (`unified-app/`)
- **One dependency tree** (`unified-app/package.json`)
- **One app entry point** (`unified-app/App.tsx`)
- **Many configuration variants** (`unified-app/app-configs/*.ts`)

Expo’s **dynamic config** (`unified-app/app.config.ts`) reads an environment variable (`APP_ID`/`APP_VARIANT`) and selects the appropriate config at build time:
- Keeps **all app logic and dependencies centralized**.
- Keeps **all per‑app differences as data**, not code forks.
- Allows EAS to build each app independently while still using a single project root.

This gives us most of the benefits people seek from a monorepo—shared dependencies, a single upgrade path, and reusable code—without the operational complexity of managing 50+ sub‑packages.

---

## 2. How One Codebase Builds 50+ Expo Apps

### 2.1. Shared Base Config + Per‑App Overrides

Core Expo settings are defined in `unified-app/app.config.base.ts`:
- Orientation, UI style, update behavior
- Shared iOS/Android defaults (e.g., permissions, background modes)

Per‑app differences live in `unified-app/app-configs/*.ts` and are typed by `WhiteLabelAppConfig` in `unified-app/app-configs/types.ts`. Each app config describes:
- Identity (id, name, slug)
- URLs (`webviewUrl`)
- Platform identifiers (`iosBundleIdentifier`, `androidPackage`)
- Branding and assets (icons, splash screens, splash background color)
- EAS project metadata, plugins, and optional version overrides

`unified-app/app.config.ts` merges these:
- Reads `APP_ID` from the environment / EAS profile.
- Loads the matching config via `getAppConfig(appId)` (`unified-app/app-configs/index.ts`).
- Returns a final Expo config that combines `baseConfig` with per‑app values (names, icons, bundle IDs, Google Services files, `extra` metadata).

At build or dev time, selecting a different `APP_ID` yields a different fully‑formed app, while the underlying code (React Native components, WebView integration, IAP, notifications, etc.) remains exactly the same.

### 2.2. EAS Profiles per App

`unified-app/eas.json` defines build and submit profiles for each app:
- Each **build profile** extends a common `base` and sets `env.APP_ID` to the app’s slug (e.g., `sleeptime`, `boundless-movement`, `cleer`).
- Each **submit profile** contains the necessary store‑specific metadata (service account JSON, Apple account info, ASC app IDs, company names, etc.).

This allows:
- `eas build --profile sleeptime --platform ios`
- `eas build --profile boundless-movement --platform android`

From the outside, each app is still an independently buildable and deployable entity, but they all share a single codebase and dependency graph.

---

## 3. How One App Supports Per‑Brand Customization

### 3.1. Icons, Splash Screens, and Themes

Icons and splash screens are per‑app assets under `unified-app/assets/<app-id>/`, and the path is stored in each `WhiteLabelAppConfig`:
- `icon: "./assets/sleeptime/icon.png"`
- `splashImage: "./assets/sleeptime/splash.png"`
- `splashBackgroundColor: "#000"` (can be used for light/dark/brand theming)

`app.config.ts` injects these assets into the final Expo config’s `icon` and `splash` fields so each app ships with its own branding:
- No branching in React components for branding.
- Asset selection is purely configuration‑driven.

### 3.2. App IDs, Bundle IDs, Packages, and EAS Project IDs

Each app config defines its own:
- `iosBundleIdentifier` and `androidPackage` (e.g., `so.movement.sleeptime`, `app.fitterapp.sleeptime`).
- `easProjectId` to match the app’s EAS project.

`app.config.ts` wires these into `ios.bundleIdentifier`, `android.package`, and `extra.eas.projectId` so:
- Every app maintains a unique identity in the Apple App Store and Google Play.
- EAS can correctly associate builds with the right project.

### 3.3. Google Play / Firebase JSON Configuration

Per‑app Google Play/Firebase configs live under `unified-app/google-services/` (e.g., `google-services.sleeptime.json`).

Each `WhiteLabelAppConfig` can optionally specify:
- `androidGoogleServicesFile: "./google-services/google-services.sleeptime.json"`

`app.config.ts` sets `android.googleServicesFile` to either this per‑app path or a shared default. This allows:
- Separate Firebase projects / analytics / push configurations per app.
- No need to keep multiple Android project folders or Gradle files in sync.

### 3.4. Translations and App‑Specific Strings

`unified-app/i18n/translations.ts` uses:
- The current app ID (from Expo `extra.appId` or `APP_ID` env variable).
- A translations table keyed by `WhiteLabelAppId` and locale.

This pattern allows us to:
- Define **base translations** that apply to all apps.
- Optionally override strings per app (e.g., slightly different marketing copy, CTAs, or legal text) by extending `perAppTranslations`.

As with branding, translation differences are handled with configuration and data tables, not branching logic spread throughout the code.

---

## 4. Implementation and Automation

### 4.1. High‑Level Approach (to Be Executed at Scale)

1. **Adopt the newest version of the main app as the unified base application.**  
   - Choose the most up‑to‑date app (e.g., `sorella-online` or another candidate) as the starting point.  
   - Upgrade it to the latest supported Expo SDK and modern third‑party dependencies.  
   - Move its source code and configuration into `unified-app/` as the canonical implementation.

2. **Identify and document all differences across the existing apps, then generate per‑app config files reflecting those variations (using Ruby scripts to automate config creation).**  
   - Programmatically inspect the existing apps under `apps/*` for differences in:  
     - App names, slugs, WebView URLs  
     - Bundle IDs and Android package names  
     - Icons, splash screens, and theme colors  
     - Google Play / Firebase `google-services.json` files  
     - EAS project IDs and submit configuration  
   - Encode these differences into `WhiteLabelAppConfig` objects in `unified-app/app-configs/*.ts`.  
   - Use scripts to avoid manual error and to keep app metadata in sync.

### 4.2. Concrete Implementation in This Codebase

The repository already includes the unified implementation and supporting scripts:

- **Dynamic Expo config**  
  - `unified-app/app.config.base.ts` – shared Expo config defaults.  
  - `unified-app/app-configs/types.ts` – defines `WhiteLabelAppConfig` and `WhiteLabelAppId`.  
  - `unified-app/app-configs/*.ts` – per‑app config files (e.g., `sleeptime.ts`, `boundless-movement.ts`).  
  - `unified-app/app-configs/index.ts` – `getAppConfig(appId)` lookup with validation.  
  - `unified-app/app.config.ts` – merges base config and per‑app config based on `APP_ID`/`APP_VARIANT`.

- **EAS integration**  
  - `unified-app/eas.json` – one build/submit profile per app, each setting `env.APP_ID` and store metadata.  
  - Fully compatible with EAS Build, EAS Submit, and GitHub UI triggers.

- **Automation for new apps**  
  - `scripts/new-app.sh` – scaffolds a new unified app configuration:  
    - Creates `unified-app/app-configs/<slug>.ts` with sensible defaults.  
    - Creates `unified-app/assets/<slug>/` for per‑app icons and splash screens.  
    - Fetches or processes icons via `scripts/process_icons.rb`.  
    - Prints the follow‑up steps to wire the app into `app-configs/index.ts`, `types.ts`, and `eas.json`.  
  - Existing Ruby scripts and Hygen templates can be extended to:  
    - Read metadata from the legacy `apps/*` projects.  
    - Generate or update unified configs so that migration remains scripted and repeatable.

Once this pattern is in place, adding a **51st** or **100th** app becomes:
- Run `scripts/new-app.sh <slug> [business_name]`.
- Add minimal configuration wiring (imports and EAS profiles).
- Optionally tweak translations or brand colors.

No new Expo project, no new `node_modules`, no new build pipeline.

---

## 5. Summary of Benefits

- **95%+ code reuse**: All business logic, WebView integration, IAP, notifications, and shared components live in one codebase.
- **Centralized upgrades**: Expo SDK and library updates happen once in `unified-app/package.json`, then benefit all apps.
- **Preserved app individuality**: Each app retains unique IDs, icons, assets, translations, and store config via per‑app config files.
- **Simplified EAS integration**: One project with many profiles, fully compatible with EAS Build, Submit, and GitHub UI.
- **Scalability to 50+ apps**: Adding or updating apps is primarily a data/configuration problem, not a new-project problem.

This unified, multi‑config single‑app architecture gives us the maintainability and performance of a centralized codebase while fully preserving the flexibility needed to operate a large fleet of white‑label apps.
