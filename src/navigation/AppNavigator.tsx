import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GetStartedRoute } from "./stack/getStarted";
import { StatusBar } from "react-native";

export function AppNavigator() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <GetStartedRoute />
      </NavigationContainer>
    </>
  );
}