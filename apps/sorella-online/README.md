## new App Store App

### Development:

```
$ npm start
```

NOTE: You must download and install the development client or else IAP will not work


### Build
```
$ eas build -p ios|android
```

### Submit
```
$ eas submit -p ios|android
```

### Testing Locally w/ IAP
You first need to build and download a dev client to test IAP Locally
Once you downloaded the dev client you may need to update package.json to run `expo start` with the `--dev-client` flag
```
$ npm install expo-dev-client

$ eas build --profile development --platform ios

$ expo start --dev-client
```
