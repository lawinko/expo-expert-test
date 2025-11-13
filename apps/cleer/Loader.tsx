import React from "react";
import { StyleSheet, View, Image } from "react-native";
import Constants from "expo-constants";

const styles = StyleSheet.create({
  loadingImage: {
    height: "100%",
    width: "100%",
  },

  loadingImageBg: {
    backgroundColor: Constants.expoConfig?.splash?.backgroundColor || "",
  },
});

export default () => (
  <View style={styles.loadingImageBg}>
    <Image
      resizeMode="contain"
      style={styles.loadingImage}
      source={require("./assets/splash.png")}
    />
  </View>
);
