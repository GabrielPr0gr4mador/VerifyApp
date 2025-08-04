import { useCameraPermission } from "react-native-vision-camera";
import {Text, View,} from "react-native"
import React from "react"

import { MyButton } from "../Button"



export function PermissionsPage(){

    const permission = useCameraPermission();

    return (
    <View>
    <MyButton title="Autorizar uso" onPress={() => permission.requestPermission()}/>
    </View>
    )
}