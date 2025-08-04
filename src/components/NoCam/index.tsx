import React from "react"
import { View, Text} from "react-native";
import { MyButton } from "../Button";

export function NoCamDevice(){
    return (
       <View>
        <Text>Camera not find</Text>
       </View>
    )
}