#!/bin/bash

slug="$1"

mkdir -p ./apps/$slug/patches

cp ./_resources/iap-patch/* ./apps/$slug/patches

cd ./apps/$slug

echo "--> Applying patches for $slug"
npm install -D patch-package postinstall-postinstall

echo "--> Adding postinstall script"
echo "Y" | npx npm-add-script \
  -k "postinstall" \
  -v "patch-package" \
  --force

echo "--> Installing dependencies"
npm install

