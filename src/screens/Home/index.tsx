import { View, Text, StyleSheet, SafeAreaView} from "react-native"
import { NavigationContainerRefContext, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { TouchableOpacity } from "react-native"
import { MyButton } from "../../components/Button"

import {styles} from "./style";

type StackParamList = {
    Home: undefined,
    Verify: undefined,
    Camera: undefined
}

export function Home(){
    const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
    return (
        <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", width: "100%" }}>
        <View style={styles.textBand}>
        <Text style={styles.title}>Don't Trust, Verify!</Text>
        </View>
        <View style={styles.band} />
        <View style={styles.band} />
        <View style={styles.band} />
        <MyButton title="Verify" onPress={() => navigation.navigate("Verify")} />
        <MyButton title="Camera" onPress={() => navigation.navigate("Camera")} />
        </View>

        <View style={styles.bottom}>
        </View>
        </SafeAreaView>
    )
}