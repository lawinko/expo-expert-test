---
to: ./apps/<%= slug %>/eas.json
---
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "../../secrets/pc-api.json"
      },
      "ios": {
        "appleId": "accounts@fitterapp.co"
      }
    }
  }
}
