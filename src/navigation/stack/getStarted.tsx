import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GetStarted } from "../../screens/Beginning";
import { Home } from "../../screens/Home";
import { Verify } from "../../screens/VerifyApp"
import { CameraApp } from "../../screens/Camera";

const Stack = createNativeStackNavigator();

export function GetStartedRoute(){
    return (
        <Stack.Navigator initialRouteName="GetStarted" >
        <Stack.Screen name="GetStarted" component={GetStarted}/>
        <Stack.Screen name="Home" component={Home}/>
        <Stack.Screen name="Camera" component={CameraApp} />
        <Stack.Screen name="Verify" component={Verify} />
        </Stack.Navigator>
    )
}
