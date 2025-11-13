# Expo Multi-App Refactoring Challenge

## Context

This is a **simplified representation** of our production codebase that manages **50+ white-labeled Expo mobile apps** for our no-code app platform.

In this challenge repository, you'll find **5 sample apps** extracted from our real codebase that demonstrate the architectural problems we face at scale.

## Current Architecture

Each app is a standalone Expo application with:
- Its own `package.json` and dependencies
- Its own `node_modules` directory (~200-350 MB each)
- Its own Expo configuration (`app.json`)
- Its own EAS build configuration (`eas.json`)
- Nearly identical code (95%+ duplication)

### Directory Structure

```
expo-refactor-challenge/
├── apps/
│   ├── boundless-movement/    # Expo 52.0.15, RN 0.76.3
│   ├── sorella-online/        # Expo 52.0.47, RN 0.76.9 (newer patch)
│   ├── sleeptime/             # Expo 52.0.47, RN 0.76.9
│   ├── cleer/                 # Expo 52.0.15, RN 0.76.3
│   └── 20lifestyle/           # Expo 52.0.47, RN 0.76.9
├── scripts/                   # App generation and automation scripts
└── _templates/                # Hygen templates for new app generation
```

## The Problem

### 1. **Version Drift Across Apps**

Even with just these 5 apps, we see version fragmentation:

| App | Expo SDK | React Native | react-native-iap | expo-build-properties |
|-----|----------|--------------|------------------|----------------------|
| **boundless-movement** | 52.0.15 | 0.76.3 | ^12.15.7 | ❌ Not used |
| **sorella-online** | **52.0.47** | **0.76.9** | 12.16.2 (exact) | ✅ 0.13.3 |
| **sleeptime** | 52.0.47 | 0.76.9 | ^12.15.7 | ✅ 0.13.3 |
| **cleer** | 52.0.15 | 0.76.3 | ^12.15.7 | ❌ Not used |
| **20lifestyle** | 52.0.47 | 0.76.9 | 12.16.2 (exact) | ❌ Not used |

**Note**: In our full production system (50+ apps), we have apps ranging from Expo SDK 50.x to 52.x and React Native 0.69.x to 0.76.x.

**Problems this creates:**
- Apps created at different times lock to different versions
- No centralized "current version" baseline
- Dependency pinning inconsistencies (caret vs exact)
- Plugin usage varies (some use `expo-build-properties`, others don't)

### 2. **Massive Code Duplication**

Each app contains nearly identical code. Compare these files across apps:

**100% Identical Files:**
- `Loader.tsx` - Exact same splash screen component in all 5 apps
- `src/shared.ts` - Identical MESSAGE_TYPES constants
- `src/audio-player.ts` - Identical native audio player implementation
- `src/service.js` - Identical background service
- `babel.config.js` - Identical Babel configuration
- `tsconfig.json` - Identical TypeScript config

**95% Identical Files:**
- `App.tsx` - Only difference is the WebView URL on line ~36:
  - `boundless-movement`: `"https://boundless-movement.mvt.so/"`
  - `sorella-online`: `"https://sorella-online.mvt.so/"`
  - (Same pattern for other apps)

**Real Impact:**
- ~5000+ lines of duplicated logic across 50+ apps in production
- Bug fixes must be manually applied to every app
- Feature additions require touching dozens of files

### 3. **Unscalable Updates**

To update a single dependency across all apps:
- Must manually update 50+ `package.json` files
- Must run `npm install` 50+ times
- Must test 50+ separate builds
- Typical SDK upgrade takes **days/weeks**

In our production workflow:
1. Update template in `_templates/app/app-file/package.json.t`
2. Manually update existing apps (or they stay on old versions forever)
3. New apps get template version, but drift starts immediately
4. No mechanism to keep apps synchronized

### 4. **Storage Bloat**

Current state:
- Each app has its own `node_modules/` (~200-350 MB)
- 50+ apps = **10-15 GB of redundant dependencies**
- CI/CD builds reinstall everything for each app
- Local development requires massive disk space

### 5. **Configuration Fragmentation**

Even standardized configs have drifted:

**EAS CLI Version Requirements:**
```json
// cleer/eas.json
"cli": { "version": ">= 5.9.1" }

// sorella-online/eas.json
"cli": { "version": ">= 7.2.0" }
```

**Bundle ID Patterns** (must be unique to each app):
- `app.fitterapp.{slug}` (most apps)
- `art.boundless-movement.app` (some apps)
- `so.movement.{slug}` (other apps)

## What We Need

We need to **refactor to a shared architecture** that:

1. ✅ **Maintains individual app identity** - Each app keeps its own bundle ID, configuration, icons
2. ✅ **Centralizes dependency management** - Update once, apply everywhere
3. ✅ **Eliminates code duplication** - Shared components, shared business logic
4. ✅ **Makes updates scalable** - Expo SDK upgrades should take hours, not weeks
5. ✅ **Works seamlessly with EAS Build** and **EAS Submit** (non-negotiable)
6. ✅ **Leverages Expo's GitHub UI integration** for builds
7. ✅ **Reduces storage and CI build times** - Share dependencies where possible

## Your Task

Please review this codebase and prepare a **brief written proposal** (30-45 minutes) that explains:

### 1. Your Refactoring Approach
- What architecture would you recommend?
- How would you structure the repository?
- How would apps share code while maintaining separate configurations?
- How would you handle the ~5% of code that differs per app (URLs, etc.)?

### 2. Tooling & Infrastructure
- What tools/frameworks would you use (if any)?
  - Monorepo tools: Turborepo, Nx, Yarn Workspaces, pnpm workspaces, etc.
  - Build orchestration
  - Dependency management strategy
- Why did you choose this approach over alternatives?
- Trade-offs?

### 3. EAS Integration (Critical)
- How would your solution work with **EAS Build** and **EAS Submit**?
- How would it leverage **Expo's GitHub UI** for triggering builds?
- Can each app still be built/submitted independently?
- Any EAS-specific considerations or limitations?

### 4. Practical Example: SDK Upgrade

Walk through this concrete scenario step-by-step:

> **"We need to update from Expo SDK 52 to Expo SDK 53 across all 50 apps"**

In your proposed architecture:
- What files would need to be changed?
- What commands would be run?
- How long would this take (roughly)?
- How would you verify all apps still work?

### 5. Migration Plan (High-Level)

- What would be the general approach to migrate from current → new architecture?
- What order would you do things in?
- Any risks or gotchas we should be aware of?
- Estimated effort level (small/medium/large)?

### 6. Real-World Considerations

- How would this work with our automated app generation scripts (`scripts/new-app.sh`)?
- How would new apps be created in your proposed structure?
- Would existing automation (Ruby scripts, Hygen templates) still be usable?

## Constraints & Requirements

**Must-Haves:**
- ✅ Must work with **EAS Build** & **EAS Submit** (non-negotiable)
- ✅ Must support **Expo's GitHub UI** for builds
- ✅ Each app must remain independently deployable
- ✅ Must support different configurations per app (bundle IDs, icons, splash screens, etc.)

**Open to:**
- Any tooling/monorepo solution you think fits best
- Any architectural pattern (as long as it meets requirements)
- Creative solutions we might not have considered

## Deliverable Format

Your proposal can be:
- A markdown document
- A structured text file
- A well-organized document in any format

We're looking for **clear thinking and practical architecture**, not perfect documentation.

## Key Files to Review

To understand the current system, look at:

1. **Code Duplication:**
   - Compare `apps/boundless-movement/App.tsx` with `apps/sorella-online/App.tsx`
   - Compare `apps/*/Loader.tsx` files
   - Compare `apps/*/src/shared.ts` files

2. **Version Drift:**
   - Review all `apps/*/package.json` files
   - Note the different Expo/RN versions

3. **Configuration Patterns:**
   - Review `apps/*/app.json` files
   - Review `apps/*/eas.json` files

4. **Automation:**
   - `scripts/new-app.sh` - Main app creation script
   - `_templates/app/app-file/*` - Hygen templates

## Questions?

If you have questions about the challenge, please reach out to the hiring contact.

---

**Note**: This represents our real production system. We actually manage 50+ apps with this exact architecture, and the problems shown here are the real pain points we face daily.
