#!/bin/bash

slug="$1"
business_name="$2"
apple_team_id="$3"   # unused in unified setup – kept for API compatibility
apple_app_id="$4"    # unused in unified setup – kept for API compatibility

set -e

if [ -z "$slug" ]; then
  echo "Usage: scripts/new-app.sh <slug> [business_name] [apple_team_id] [apple_app_id]"
  exit 1
fi

name=$(ruby ./scripts/get_app_name.rb "$slug" 2>/dev/null || true)

if [ -z "$name" ]; then
  if [ -n "$business_name" ]; then
    name="$business_name"
  else
    name="$slug"
  fi
fi

echo "--------"
echo "--"
echo "-- Creating unified app configuration"
echo "-- Slug: $slug"
echo "-- Name: $name"
echo "-- URL: https://$slug.mvt.so"
echo "--"

config_dir="unified-app/app-configs"
assets_dir="unified-app/assets/$slug"
config_file="$config_dir/$slug.ts"

if [ -f "$config_file" ]; then
  echo "Error: Config already exists at $config_file"
  exit 1
fi

mkdir -p "$config_dir" "$assets_dir"

cat > "$config_file" <<EOF
import type { WhiteLabelAppConfig } from "./types";

export const ${slug//-/_}Config: WhiteLabelAppConfig = {
  id: "$slug",
  name: "$name",
  slug: "$slug",
  webviewUrl: "https://$slug.mvt.so/",

  iosBundleIdentifier: "so.movement.$slug",
  androidPackage: "app.fitterapp.$slug",

  icon: "./assets/$slug/icon.png",
  splashImage: "./assets/$slug/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:$slug.fitterapp.app",
    "applinks:$slug.mvt.so",
  ],

  easProjectId: "REPLACE_WITH_EAS_PROJECT_ID",
  fitterApp: "$slug",

  plugins: ["react-native-iap"],
};
EOF

echo "--> Fetching icons and splash into $assets_dir (if available)"
ruby ./scripts/process_icons.rb "$slug" unified || true

echo
echo "✅ Created unified app config:"
echo "   - Config:  $config_file"
echo "   - Assets:  $assets_dir"
echo
echo "Next steps:"
echo "  1) Import ${slug//-/_}Config in unified-app/app-configs/index.ts and add it to the apps map."
echo "  2) Extend the WhiteLabelAppId union in unified-app/app-configs/types.ts with \"$slug\"."
echo "  3) Add build/submit profiles for \"$slug\" in unified-app/eas.json with env.APP_ID=\"$slug\"."
echo "  4) Replace easProjectId with the actual EAS project ID once created."
