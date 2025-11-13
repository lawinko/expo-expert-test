#!/bin/bash

slug="$1"
business_name="$2"
apple_team_id="$3"
apple_app_id="$4"

set -e

name=$(ruby ./scripts/get_app_name.rb $slug)

if [ -z "$name" ]; then
  echo "Error: Could not find name for $slug.mvt.so"
  exit
  exit 1
fi

echo "--------"
echo "--"
echo "-- Setting Up Expo App"
echo "-- Name: $name"
echo "-- URL: https://$slug.mvt.so"
echo "--"

echo "--> Creating Expo App"
cd apps;
npx create-expo-app $slug -t expo-template-blank-typescript

echo "--> Removing Git from Expo app"
cd ./$slug;
rm -rf .git/

echo "--> Creating app.json"
cd ../../;
./scripts/write-app-tsx.sh $slug $name

cd ./apps/$slug;
echo "--> Installing Dependencies"
npm install

echo "--> Setting up EAS"
eas build:configure --platform all

cd ../../;
ruby ./scripts/setup_expo_auto_build.rb $slug $business_name $apple_team_id $apple_app_id
ruby ./scripts/add_eas_attributes.rb $slug $business_name

echo "--> Setting up app imagery"
ruby ./scripts/process_icons.rb $slug

echo "--> Adding to Git"
git add "apps/$slug/"
git commit -m "[Auto] Created App $slug.mvt.so"

echo "--> Starting EAS Build & Submission"
cd ./apps/$slug;
eas build -p all --profile production --auto-submit
