slug="$1"
name="$2"

HYGEN_OVERWRITE=1 hygen app new --name "$name" --slug "$slug" --iap "true"
HYGEN_OVERWRITE=1 hygen app app-file new --slug "$slug" --iap "true"
